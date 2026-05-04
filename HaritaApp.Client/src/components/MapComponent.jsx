import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import { click } from 'ol/events/condition';
import Overlay from 'ol/Overlay';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { getLength, getArea } from 'ol/sphere';
import { transform } from 'ol/proj';
import { geometryService } from '../services/api';

const MapComponent = ({ drawType, setDrawType, geometries, refreshData, zoomTo, baseLayer, notify, isEditMode, setIsEditMode }) => {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const drawRef = useRef(null);
  const popupElement = useRef(null);
  const overlayRef = useRef(null);

  const osmLayerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const labelsLayerRef = useRef(null);
  const roadsLayerRef = useRef(null);
  const selectRef = useRef(null);
  const modifyRef = useRef(null);

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Feature'dan detay bilgisi hesapla
  const getFeatureInfo = (feature) => {
    if (!feature) return null;
    const geom = feature.getGeometry();
    const type = geom.getType();
    let info = { type, id: feature.getId(), name: feature.get('name') };

    if (type === 'Point') {
      const coords = transform(geom.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
      info.coords = `${coords[1].toFixed(5)}°K, ${coords[0].toFixed(5)}°D`;
    } else if (type === 'LineString') {
      const lengthM = getLength(geom);
      info.length = lengthM >= 1000
        ? `${(lengthM / 1000).toFixed(2)} km`
        : `${Math.round(lengthM)} m`;
      const coords = transform(geom.getFirstCoordinate(), 'EPSG:3857', 'EPSG:4326');
      info.coords = `Başlangıç: ${coords[1].toFixed(4)}°K, ${coords[0].toFixed(4)}°D`;
    } else if (type === 'Polygon') {
      const areaM2 = getArea(geom);
      info.area = areaM2 >= 1000000
        ? `${(areaM2 / 1000000).toFixed(3)} km²`
        : `${Math.round(areaM2)} m²`;
      const extent = geom.getExtent();
      const center = transform(
        [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2],
        'EPSG:3857', 'EPSG:4326'
      );
      info.coords = `Merkez: ${center[1].toFixed(4)}°K, ${center[0].toFixed(4)}°D`;
    }
    return info;
  };

  useEffect(() => {
    const savedCenter = localStorage.getItem('mapCenter');
    const savedZoom = localStorage.getItem('mapZoom');
    const initialCenter = savedCenter ? JSON.parse(savedCenter) : fromLonLat([35.2433, 38.9637]);
    const initialZoom = savedZoom ? parseFloat(savedZoom) : 6;

    const overlay = new Overlay({
      element: popupElement.current,
      autoPan: true,
      autoPanAnimation: { duration: 250 },
    });
    overlayRef.current = overlay;

    osmLayerRef.current = new TileLayer({ source: new OSM(), visible: baseLayer === 'osm' });
    satelliteLayerRef.current = new TileLayer({
      source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19 }),
      visible: baseLayer === 'satellite'
    });
    roadsLayerRef.current = new TileLayer({
      source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}' }),
      visible: baseLayer === 'satellite',
      opacity: 0.8
    });
    labelsLayerRef.current = new TileLayer({
      source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}' }),
      visible: baseLayer === 'satellite'
    });

    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: new Style({
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
        stroke: new Stroke({ color: '#3b82f6', width: 3 }),
        image: new Circle({ radius: 7, fill: new Fill({ color: '#3b82f6' }) }),
      }),
    });

    const initialMap = new Map({
      target: mapElement.current,
      layers: [osmLayerRef.current, satelliteLayerRef.current, roadsLayerRef.current, labelsLayerRef.current, vectorLayer],
      view: new View({ center: initialCenter, zoom: initialZoom }),
    });

    initialMap.on('moveend', () => {
      const view = initialMap.getView();
      localStorage.setItem('mapCenter', JSON.stringify(view.getCenter()));
      localStorage.setItem('mapZoom', view.getZoom().toString());
    });

    initialMap.addOverlay(overlay);
    mapRef.current = initialMap;

    initialMap.on('singleclick', (event) => {
      const feature = initialMap.forEachFeatureAtPixel(event.pixel, (f) => f);
      if (feature) {
        setSelectedFeature(feature);
        overlay.setPosition(event.coordinate);
      } else {
        overlay.setPosition(undefined);
        setSelectedFeature(null);
      }
    });

    const loadGeometries = async () => {
      try {
        const data = await geometryService.getAll();
        const format = new GeoJSON();
        const features = data.map(item => {
          const feature = format.readFeature(item.geoloc, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
          feature.setId(item.id);
          feature.set('name', item.name);
          return feature;
        });
        vectorSourceRef.current.clear();
        vectorSourceRef.current.addFeatures(features);
      } catch (error) {
        console.error("Yükleme hatası:", error);
      }
    };

    loadGeometries();
    return () => initialMap.setTarget(null);
  }, []);

  useEffect(() => {
    if (!osmLayerRef.current || !satelliteLayerRef.current || !labelsLayerRef.current || !roadsLayerRef.current) return;
    osmLayerRef.current.setVisible(baseLayer === 'osm');
    satelliteLayerRef.current.setVisible(baseLayer === 'satellite');
    roadsLayerRef.current.setVisible(baseLayer === 'satellite');
    labelsLayerRef.current.setVisible(baseLayer === 'satellite');
  }, [baseLayer]);

  useEffect(() => {
    if (!mapRef.current || !zoomTo) return;
    try {
      const format = new GeoJSON();
      const feature = format.readFeature(zoomTo.geoloc, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
      const view = mapRef.current.getView();
      if (zoomTo.geometryType === 'Point') {
        view.animate({ center: feature.getGeometry().getCoordinates(), zoom: 15, duration: 1000 });
      } else {
        view.fit(feature.getGeometry().getExtent(), { duration: 1000, padding: [100, 100, 100, 100] });
      }
    } catch (error) { }
  }, [zoomTo]);

  // Geometri Düzenleme Modu (Modify)
  useEffect(() => {
    if (!mapRef.current) return;

    // Önceki modify/select etkileşimlerini kaldır
    if (selectRef.current) mapRef.current.removeInteraction(selectRef.current);
    if (modifyRef.current) mapRef.current.removeInteraction(modifyRef.current);

    if (isEditMode) {
      // Select: Tıklanan feature'ı seç
      const select = new Select({ condition: click });
      selectRef.current = select;
      mapRef.current.addInteraction(select);

      // Select olayını dinle - klon yerine orijinal feature'ı kullan
      select.on('select', (event) => {
        if (event.selected.length > 0) {
          const clonedFeature = event.selected[0];
          const id = clonedFeature.getId();
          // vectorSource'dan orijinal feature'ı bul (name property'si burada)
          const originalFeature = vectorSourceRef.current.getFeatureById(id);
          if (originalFeature) {
            setSelectedFeature(originalFeature);
            // Popup pozisyonunu feature'ın üzerine ayarla
            const geometry = originalFeature.getGeometry();
            let coordinate;
            if (geometry.getType() === 'Point') {
              coordinate = geometry.getCoordinates();
            } else {
              const extent = geometry.getExtent();
              coordinate = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
            }
            overlayRef.current.setPosition(coordinate);
          }
        } else {
          setSelectedFeature(null);
          overlayRef.current.setPosition(undefined);
        }
      });

      // Modify: Tüm feature'ları doğrudan source üzerinden düzenle
      // (select.getFeatures() yerine source kullanmak daha güvenilir)
      const modify = new Modify({ source: vectorSourceRef.current });
      modifyRef.current = modify;
      mapRef.current.addInteraction(modify);

      // Vertex sürükleme bittikten sonra veritabanına kaydet
      modify.on('modifyend', async (event) => {
        const modifiedFeatures = event.features.getArray();
        if (modifiedFeatures.length === 0) return;

        for (const feature of modifiedFeatures) {
          const id = feature.getId();
          if (!id) continue;

          const format = new GeoJSON();
          const updatedGeometry = format.writeGeometryObject(feature.getGeometry(), {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
          });

          const payload = {
            id: id,
            name: feature.get('name') || 'İsimsiz',
            geometryType: feature.getGeometry().getType(),
            geoloc: updatedGeometry
          };

          console.log("Güncellenen payload:", payload); // Debug için

          try {
            await geometryService.update(id, payload);
          } catch (error) {
            console.error("Geometri güncelleme hatası:", error);
            notify("Hata", "Konum güncellenemedi.", "info");
          }
        }
      });

      // Cursor'u düzenleme modunda değiştir
      mapRef.current.getTargetElement().style.cursor = 'crosshair';
    } else {
      mapRef.current.getTargetElement().style.cursor = '';
    }
  }, [isEditMode]);

  // Çizim İşlemi ve Kayıt Mantığı - Önce Kaydet, Sonra İsim Sor
  useEffect(() => {
    if (!mapRef.current) return;
    if (drawRef.current) mapRef.current.removeInteraction(drawRef.current);
    if (drawType) {
      const draw = new Draw({ source: vectorSourceRef.current, type: drawType });
      draw.on('drawend', async (event) => {
        const feature = event.feature;
        const currentDrawType = drawType;
        const typeMap = { 'Point': 'Nokta', 'LineString': 'Çizgi', 'Polygon': 'Alan' };
        const typeName = typeMap[currentDrawType] || 'Şekil';

        // Önce isim sor, sonra kaydet
        notify(
          "Yeni Kayıt",
          `Çizilen ${typeName} için bir isim giriniz:`,
          "prompt",
          async (inputName) => {
            // Kullanıcı isim girdiyse onu kullan, boş bıraktıysa otomatik numara ver
            let finalName = inputName && inputName.trim() !== "" ? inputName.trim() : null;

            if (!finalName) {
              const existingUnnamed = (geometries || []).filter(g =>
                g.name && g.name.startsWith(`İsimsiz ${typeName} -`)
              ).length;
              finalName = `İsimsiz ${typeName} - ${existingUnnamed + 1}`;
            }

            const format = new GeoJSON();
            const geoJsonGeometry = format.writeGeometryObject(feature.getGeometry(), {
              featureProjection: 'EPSG:3857',
              dataProjection: 'EPSG:4326'
            });

            try {
              const createdItem = await geometryService.create({
                name: finalName,
                geometryType: currentDrawType,
                geoloc: geoJsonGeometry
              });
              feature.setId(createdItem.id);
              feature.set('name', finalName);
              await refreshData();
            } catch (error) {
              console.error("Kayıt hatası:", error);
              notify("Hata", "Kaydedilemedi.", "info");
              vectorSourceRef.current.removeFeature(feature);
            }
          },
          "", // Input başlangıçta boş
          () => {
            // İptal edilirse haritadan kaldır
            vectorSourceRef.current.removeFeature(feature);
          }
        );

        setDrawType(null);
      });
      mapRef.current.addInteraction(draw);
      drawRef.current = draw;
    }
  }, [drawType]);

  const handleEdit = async () => {
    if (!selectedFeature) return;
    const id = selectedFeature.getId();
    const oldName = selectedFeature.get('name');

    notify("İsim Düzenle", "Yeni ismi giriniz:", "prompt", async (newName) => {
      if (newName && newName !== oldName) {
        try {
          const format = new GeoJSON();
          const geoJsonGeometry = format.writeGeometryObject(selectedFeature.getGeometry(), {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
          });

          await geometryService.update(id, {
            id,
            name: newName,
            geometryType: selectedFeature.getGeometry().getType(),
            geoloc: geoJsonGeometry
          });

          selectedFeature.set('name', newName);
          await refreshData();
          notify("Başarılı", "İsim güncellendi.", "info");
        } catch (error) {
          notify("Hata", "Güncelleme başarısız oldu.", "info");
        }
      }
    }, oldName);
  };

  const handleDelete = async () => {
    if (!selectedFeature) return;
    const id = selectedFeature.getId();
    if (!id) return;

    notify("Silme Onayı", "Bu kaydı silmek istediğinize emin misiniz?", "confirm", async () => {
      try {
        await geometryService.delete(id);
        vectorSourceRef.current.removeFeature(selectedFeature);
        overlayRef.current.setPosition(undefined);
        setSelectedFeature(null);
        await refreshData();
        notify("Başarılı", "Kayıt haritadan silindi.", "info");
      } catch (error) {
        notify("Hata", "Silme işlemi sırasında bir sorun oluştu.", "info");
      }
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
      <div ref={popupElement} className="ol-popup-wrapper">
        {selectedFeature && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>

            {/* Ana Popup Kartı */}
            <div className="ol-popup">
              <button className="ol-popup-closer" onClick={() => {
                overlayRef.current.setPosition(undefined);
                setShowDetail(false);
              }}>✖</button>
              <div className="popup-details">
                <div className="popup-title">
                  <h3>{selectedFeature.get('name') || 'İsimsiz Şekil'}</h3>
                  <button className="edit-icon-btn" onClick={handleEdit}>✎</button>
                </div>
                <p>Tip: {selectedFeature.getGeometry().getType()}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`detail-btn ${showDetail ? 'active' : ''}`}
                    onClick={() => setShowDetail(!showDetail)}
                  >
                    {showDetail ? '◀ Kapat' : 'Detay ▶'}
                  </button>
                  <button className="delete-btn" onClick={handleDelete}>Sil</button>
                </div>
              </div>
            </div>

            {/* Yan Detay Paneli */}
            {showDetail && (() => {
              const info = getFeatureInfo(selectedFeature);
              return (
                <div className="detail-panel">
                  <h4>📋 Detay Bilgisi</h4>
                  <div className="detail-row"><span className="detail-label">ID</span><span className="detail-value">#{info.id}</span></div>
                  <div className="detail-row"><span className="detail-label">İsim</span><span className="detail-value">{info.name || 'İsimsiz'}</span></div>
                  <div className="detail-row"><span className="detail-label">Tip</span><span className="detail-value">{info.type}</span></div>
                  {info.coords && <div className="detail-row"><span className="detail-label">Konum</span><span className="detail-value">{info.coords}</span></div>}
                  {info.length && <div className="detail-row"><span className="detail-label">Uzunluk</span><span className="detail-value">{info.length}</span></div>}
                  {info.area && <div className="detail-row"><span className="detail-label">Alan</span><span className="detail-value">{info.area}</span></div>}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;