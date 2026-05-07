import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import Snap from 'ol/interaction/Snap';
import { click } from 'ol/events/condition';
import Overlay from 'ol/Overlay';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { getLength, getArea } from 'ol/sphere';
import { transform } from 'ol/proj';
import { unByKey } from 'ol/Observable';
import { geometryService, routeService } from '../services/api';
import axios from 'axios';

// OSRM için özel axios instance (CORS hatasını önlemek için Authorization header'ı temizlenir)
const osrmAxios = axios.create();
osrmAxios.interceptors.request.use(config => {
  if (config.headers.Authorization) delete config.headers.Authorization;
  return config;
});


const MapComponent = ({ drawType, setDrawType, geometries, routes, refreshData, refreshRoutes, zoomTo, baseLayer, notify, isEditMode, setIsEditMode, measureMode, setMeasureMode, routingMode, setRoutingMode }) => {

  const mapElement = useRef(null);
  const [map, setMap] = useState(null);
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
  const measureDrawRef = useRef(null);
  const snapRef = useRef(null);
  const measureSourceRef = useRef(new VectorSource());
  const measureTooltipRef = useRef(null);
  const measureTooltipOverlayRef = useRef(null);
  const staticTooltipsRef = useRef([]);
  const sketchRef = useRef(null);
  const listenerRef = useRef(null);
  const routingSourceRef = useRef(new VectorSource());
  const routingDrawRef = useRef(null);
  const [routingPoints, setRoutingPoints] = useState([]);
  const [routeProfile, setRouteProfile] = useState('driving');
  const [activeRouteCoords, setActiveRouteCoords] = useState(null);
  const vectorLayerRef = useRef(null);
  const isEditModeRef = useRef(isEditMode);
  const measureModeRef = useRef(measureMode);
  const routingModeRef = useRef(routingMode);

  useEffect(() => { isEditModeRef.current = isEditMode; }, [isEditMode]);
  useEffect(() => { measureModeRef.current = measureMode; }, [measureMode]);
  useEffect(() => { routingModeRef.current = routingMode; }, [routingMode]);
  const [currentRouteData, setCurrentRouteData] = useState(null);

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRouteProfile, setSelectedRouteProfile] = useState(null);
  const [selectedRouteData, setSelectedRouteData] = useState(null);
  const [originalRouteGeoJSON, setOriginalRouteGeoJSON] = useState(null);

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '';
    if (minutes < 60) return `${minutes} dk`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours} sa ${remainingMinutes} dk` : `${hours} sa`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    let result = `${days} gün`;
    if (remainingHours > 0) result += ` ${remainingHours} sa`;
    if (remainingMinutes > 0) result += ` ${remainingMinutes} dk`;
    return result;
  };

  const activeRouteFeatureRef = useRef(null);
  const activeRouteOriginalGeoJSONRef = useRef(null);

  const createMeasureTooltip = useCallback((map) => {
    if (!map) return;
    if (measureTooltipRef.current) measureTooltipRef.current.parentNode?.removeChild(measureTooltipRef.current);
    const el = document.createElement('div');
    el.className = 'measure-tooltip measure-tooltip-dynamic';
    measureTooltipRef.current = el;
    const overlay = new Overlay({ element: el, offset: [0, -15], positioning: 'bottom-center', stopEvent: false });
    measureTooltipOverlayRef.current = overlay;
    map.addOverlay(overlay);
  }, []);

  const createStaticTooltip = useCallback((map, text, position) => {
    if (!map) return;
    const el = document.createElement('div');
    el.className = 'measure-tooltip measure-tooltip-static';
    el.innerHTML = text;
    const overlay = new Overlay({ element: el, offset: [0, -10], positioning: 'bottom-center', stopEvent: false });
    map.addOverlay(overlay);
    overlay.setPosition(position);
    staticTooltipsRef.current.push(overlay);
  }, []);

  const clearMeasurements = useCallback(() => {
    if (!map) return;
    staticTooltipsRef.current.forEach(o => map.removeOverlay(o));
    staticTooltipsRef.current = [];
    measureSourceRef.current.clear();
    if (measureTooltipOverlayRef.current) {
      map.removeOverlay(measureTooltipOverlayRef.current);
      measureTooltipOverlayRef.current = null;
    }
  }, [map]);

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
      style: (feature) => {
        const name = (feature.get('name') || '').toLowerCase();
        const isMeasurement = name.includes('ölçüm') || name.includes('olcum');

        if (isMeasurement) {
          return new Style({
            fill: new Fill({ color: 'rgba(16, 185, 129, 0.15)' }),
            stroke: new Stroke({ color: '#10b981', width: 2, lineDash: [6, 4] }),
            image: new Circle({ radius: 5, fill: new Fill({ color: '#10b981' }) }),
          });
        }

        return new Style({
          fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
          stroke: new Stroke({ color: '#3b82f6', width: 3 }),
          image: new Circle({ radius: 7, fill: new Fill({ color: '#3b82f6' }) }),
        });
      },
    });

    const initialMap = new Map({
      target: mapElement.current,
      layers: [osmLayerRef.current, satelliteLayerRef.current, roadsLayerRef.current, labelsLayerRef.current, vectorLayer],
      view: new View({ center: initialCenter, zoom: initialZoom }),
    });

    vectorLayerRef.current = vectorLayer;

    initialMap.on('moveend', () => {
      const view = initialMap.getView();
      localStorage.setItem('mapCenter', JSON.stringify(view.getCenter()));
      localStorage.setItem('mapZoom', view.getZoom().toString());
    });

    initialMap.addOverlay(overlay);
    setMap(initialMap);

    const measureLayer = new VectorLayer({
      source: measureSourceRef.current,
      style: new Style({
        fill: new Fill({ color: 'rgba(16, 185, 129, 0.15)' }),
        stroke: new Stroke({ color: '#10b981', width: 2, lineDash: [6, 4] }),
        image: new Circle({ radius: 5, fill: new Fill({ color: '#10b981' }) }),
      }),
      zIndex: 999,
    });
    initialMap.addLayer(measureLayer);

    const routingLayer = new VectorLayer({
      source: routingSourceRef.current,
      style: new Style({
        stroke: new Stroke({ color: '#f59e0b', width: 5 }),
        image: new Circle({ radius: 6, fill: new Fill({ color: '#f59e0b' }), stroke: new Stroke({ color: '#fff', width: 2 }) })
      }),
      zIndex: 1000
    });
    initialMap.addLayer(routingLayer);


    initialMap.on('singleclick', (event) => {
      const feature = initialMap.forEachFeatureAtPixel(event.pixel, (f) => f, {
        layerFilter: (layer) => layer === vectorLayerRef.current,
        hitTolerance: 10
      });

      if (!feature && !measureModeRef.current && !routingModeRef.current && !isEditModeRef.current) {
        overlay.setPosition(undefined);
        if (activeRouteFeatureRef.current && activeRouteOriginalGeoJSONRef.current) {
          const format = new GeoJSON();
          activeRouteFeatureRef.current.setGeometry(format.readGeometry(activeRouteOriginalGeoJSONRef.current, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }));
        }
        
        activeRouteFeatureRef.current = null;
        activeRouteOriginalGeoJSONRef.current = null;
        
        setSelectedFeature(null);
        setSelectedRouteProfile(null);
        setSelectedRouteData(null);
        setOriginalRouteGeoJSON(null);
        setShowDetail(false);
        return;
      }

      if (feature && !measureModeRef.current && !routingModeRef.current && !isEditModeRef.current) {
        if (activeRouteFeatureRef.current && activeRouteOriginalGeoJSONRef.current && activeRouteFeatureRef.current.getId() !== feature.getId()) {
          const format = new GeoJSON();
          activeRouteFeatureRef.current.setGeometry(format.readGeometry(activeRouteOriginalGeoJSONRef.current, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }));
        }

        setSelectedFeature(feature);
        
        if (feature.get('itemType') === 'route') {
           const format = new GeoJSON();
           const originalGeoJSON = format.writeGeometryObject(feature.getGeometry(), { featureProjection: 'EPSG:3857', dataProjection: 'EPSG:4326' });
           
           activeRouteFeatureRef.current = feature;
           activeRouteOriginalGeoJSONRef.current = originalGeoJSON;
           
           setSelectedRouteProfile('driving');
           setSelectedRouteData(null);
           setOriginalRouteGeoJSON(originalGeoJSON);
           setShowDetail(false);
        } else {
           activeRouteFeatureRef.current = null;
           activeRouteOriginalGeoJSONRef.current = null;
           
           setSelectedRouteProfile(null);
           setSelectedRouteData(null);
           setOriginalRouteGeoJSON(null);
           setShowDetail(false);
        }

        overlay.setPosition(event.coordinate);
      }
    });

    return () => {
      initialMap.setTarget(null);
      setMap(null);
    };
  }, []); // Sadece bir kez mount edildiğinde çalışsın

  useEffect(() => {
    if (!vectorSourceRef.current) return;

    const format = new GeoJSON();
    const geoFeatures = (geometries || []).map(item => {
      const feature = format.readFeature(item.geoloc, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
      feature.setId(`geo-${item.id}`);
      feature.set('name', item.name);
      feature.set('itemType', 'geometry');
      feature.set('realId', item.id);
      return feature;
    });

    const routeFeatures = (routes || []).map(item => {
      const feature = format.readFeature(item.geoloc, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
      feature.setId(`route-${item.id}`);
      feature.set('name', item.name);
      feature.set('itemType', 'route');
      feature.set('realId', item.id);
      feature.setStyle(new Style({
        stroke: new Stroke({ color: '#f59e0b', width: 4 }),
      }));
      return feature;
    });

    vectorSourceRef.current.clear();
    vectorSourceRef.current.addFeatures([...geoFeatures, ...routeFeatures]);
  }, [geometries, routes]); // Geometriler veya rotalar değiştiğinde tetiklensin

  useEffect(() => {
    if (!osmLayerRef.current || !satelliteLayerRef.current || !labelsLayerRef.current || !roadsLayerRef.current) return;
    osmLayerRef.current.setVisible(baseLayer === 'osm');
    satelliteLayerRef.current.setVisible(baseLayer === 'satellite');
    roadsLayerRef.current.setVisible(baseLayer === 'satellite');
    labelsLayerRef.current.setVisible(baseLayer === 'satellite');
  }, [baseLayer]);

  useEffect(() => {
    if (!map || !zoomTo) return;
    try {
      const format = new GeoJSON();
      const feature = format.readFeature(zoomTo.geoloc, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
      const view = map.getView();
      if (zoomTo.geometryType === 'Point') {
        view.animate({ center: feature.getGeometry().getCoordinates(), zoom: 15, duration: 1000 });
      } else {
        view.fit(feature.getGeometry().getExtent(), { duration: 1000, padding: [100, 100, 100, 100] });
      }
    } catch (error) { }
  }, [map, zoomTo]);

  // Geometri Düzenleme Modu (Modify)
  useEffect(() => {
    if (!map) return;
    if (selectRef.current) map.removeInteraction(selectRef.current);
    if (modifyRef.current) map.removeInteraction(modifyRef.current);

    if (isEditMode) {
      const select = new Select({ condition: click });
      selectRef.current = select;
      map.addInteraction(select);

      select.on('select', (event) => {
        if (event.selected.length > 0) {
          const clonedFeature = event.selected[0];
          const id = clonedFeature.getId();

          // route düzenlemeyi engellemek istiyorsak:
          if (clonedFeature.get('itemType') === 'route') {
            notify("Bilgi", "Güzergahlar bu modda düzenlenemez.", "info");
            selectRef.current.getFeatures().clear();
            return;
          }

          const originalFeature = vectorSourceRef.current.getFeatureById(id);
          if (originalFeature) {
            setSelectedFeature(originalFeature);
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
      const modify = new Modify({ source: vectorSourceRef.current });
      modifyRef.current = modify;
      map.addInteraction(modify);

      // Vertex sürükleme bittikten sonra veritabanına kaydet
      modify.on('modifyend', async (event) => {
        const modifiedFeatures = event.features.getArray();
        if (modifiedFeatures.length === 0) return;

        for (const feature of modifiedFeatures) {
          const id = feature.getId();
          if (!id) continue;

          const realId = feature.get('realId') || id;
          if (feature.get('itemType') === 'route') continue; // Rota güncellenmesin

          const format = new GeoJSON();
          const updatedGeometry = format.writeGeometryObject(feature.getGeometry(), {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
          });

          const payload = {
            id: realId,
            name: feature.get('name') || 'İsimsiz',
            geometryType: feature.getGeometry().getType(),
            geoloc: updatedGeometry
          };

          console.log("Güncellenen payload:", payload);

          try {
            await geometryService.update(realId, payload);
          } catch (error) {
            console.error("Geometri güncelleme hatası:", error);
            notify("Hata", "Konum güncellenemedi.", "info");
          }
        }
      });

      // Cursor'u düzenleme modunda değiştir
      map.getTargetElement().style.cursor = 'crosshair';
    } else {
      map.getTargetElement().style.cursor = '';
    }
  }, [map, isEditMode]);

  useEffect(() => {
    if (!map) return;

    if (measureDrawRef.current) map.removeInteraction(measureDrawRef.current);
    if (snapRef.current) map.removeInteraction(snapRef.current);
    if (listenerRef.current) unByKey(listenerRef.current);
    if (measureTooltipOverlayRef.current) map.removeOverlay(measureTooltipOverlayRef.current);

    measureDrawRef.current = null;
    snapRef.current = null;
    listenerRef.current = null;
    measureTooltipOverlayRef.current = null;
    measureTooltipRef.current = null;
    sketchRef.current = null;

    if (!measureMode) {
      map.getTargetElement().style.cursor = '';
      return;
    }

    map.getTargetElement().style.cursor = 'crosshair';

    const snap = new Snap({ source: vectorSourceRef.current, pixelTolerance: 15 });
    map.addInteraction(snap);
    snapRef.current = snap;

    createMeasureTooltip(map);

    const draw = new Draw({
      source: measureSourceRef.current,
      type: measureMode,
      style: new Style({
        fill: new Fill({ color: 'rgba(16, 185, 129, 0.12)' }),
        stroke: new Stroke({ color: '#10b981', width: 2, lineDash: [6, 4] }),
        image: new Circle({ radius: 5, stroke: new Stroke({ color: '#10b981', width: 2 }), fill: new Fill({ color: 'rgba(16,185,129,0.4)' }) }),
      }),
    });
    map.addInteraction(draw);
    measureDrawRef.current = draw;

    const viewport = map.getViewport();
    const handleContextMenu = (e) => {
      e.preventDefault();
      if (measureDrawRef.current) {
        measureDrawRef.current.finishDrawing();
      }
    };
    viewport.addEventListener('contextmenu', handleContextMenu);

    draw.on('drawstart', (evt) => {
      sketchRef.current = evt.feature;
      listenerRef.current = sketchRef.current.getGeometry().on('change', (e) => {
        const geom = e.target;
        let output = '';
        let coord;
        if (geom.getType() === 'Polygon') {
          output = getArea(geom) >= 1000000 ? `${(getArea(geom) / 1000000).toFixed(3)} km²` : `${Math.round(getArea(geom))} m²`;
          coord = geom.getInteriorPoint().getCoordinates();
        } else if (geom.getType() === 'LineString') {
          output = getLength(geom) >= 1000 ? `${(getLength(geom) / 1000).toFixed(2)} km` : `${Math.round(getLength(geom))} m`;
          coord = geom.getLastCoordinate();
        }
        if (measureTooltipRef.current) measureTooltipRef.current.innerHTML = output;
        if (measureTooltipOverlayRef.current) measureTooltipOverlayRef.current.setPosition(coord);
      });
    });

    draw.on('drawend', (evt) => {
      const feature = evt.feature;
      const geom = feature.getGeometry();
      let output = '';
      let coord;
      if (geom.getType() === 'Polygon') {
        output = `📐 ` + (getArea(geom) >= 1000000 ? `${(getArea(geom) / 1000000).toFixed(3)} km²` : `${Math.round(getArea(geom))} m²`);
        coord = geom.getInteriorPoint().getCoordinates();
      } else {
        output = `📏 ` + (getLength(geom) >= 1000 ? `${(getLength(geom) / 1000).toFixed(2)} km` : `${Math.round(getLength(geom))} m`);
        coord = geom.getLastCoordinate();
      }
      createStaticTooltip(map, output, coord);
      if (listenerRef.current) unByKey(listenerRef.current);
      if (measureTooltipOverlayRef.current) map.removeOverlay(measureTooltipOverlayRef.current);
      listenerRef.current = null;
      measureTooltipOverlayRef.current = null;
      measureTooltipRef.current = null;
      sketchRef.current = null;

      const typeMap = { 'Point': 'Nokta', 'LineString': 'Mesafe Ölçümü', 'Polygon': 'Alan Ölçümü' };
      const typeName = typeMap[measureMode] || 'Ölçüm';

      notify(
        "Yeni Ölçüm Kaydı",
        `Ölçülen ${typeName} için bir isim giriniz:`,
        "prompt",
        async (inputName) => {
          let finalName = inputName && inputName.trim() !== "" ? inputName.trim() : null;

          if (!finalName) {
            const existingUnnamed = (vectorSourceRef.current.getFeatures() || []).filter(g =>
              g.get('name') && g.get('name').startsWith(`İsimsiz ${typeName} -`)
            ).length;
            finalName = `İsimsiz ${typeName} - ${existingUnnamed + 1}`;
          }

          const format = new GeoJSON();
          const geoJsonGeometry = format.writeGeometryObject(geom, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
          });

          try {
            const createdItem = await geometryService.create({
              name: finalName,
              geometryType: measureMode,
              geoloc: geoJsonGeometry
            });
            feature.setId(`geo-${createdItem.id}`);
            feature.set('realId', createdItem.id);
            feature.set('itemType', 'geometry');
            feature.set('name', finalName);
            vectorSourceRef.current.addFeature(feature);
            measureSourceRef.current.removeFeature(feature);
            if (refreshData) await refreshData();
          } catch (error) {
            console.error("Kayıt hatası:", error);
            notify("Hata", "Ölçüm kaydedilemedi.", "info");
            measureSourceRef.current.removeFeature(feature);
          }
        },
        "",
        () => {
          // İptal edilirse, feature measureSource'ta kalabilir
        }
      );

      setTimeout(() => { if (map && measureMode) createMeasureTooltip(map); }, 50);
    });

    return () => {
      viewport.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [map, measureMode, createMeasureTooltip, createStaticTooltip]);

  // --- OSRM Rota Hesaplama Mantığı (TEMİZ) ---
  useEffect(() => {
    if (!map) return;

    if (routingDrawRef.current) map.removeInteraction(routingDrawRef.current);

    if (!routingMode) {
      setRoutingPoints([]);
      routingSourceRef.current.clear();
      return;
    }

    const draw = new Draw({
      type: 'Point',
      style: new Style({
        image: new Circle({ radius: 6, fill: new Fill({ color: '#f59e0b' }) })
      })
    });

    draw.on('drawend', (evt) => {
      const coords = transform(evt.feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');

      setRoutingPoints(prev => {
        const newPoints = [...prev, coords];

        // Yeni bir rota başlangıcıysa haritayı temizle
        if (newPoints.length === 1) {
          routingSourceRef.current.clear();
        }

        // Haritaya noktayı ekle (Eğer listede yoksa ekle)
        const features = routingSourceRef.current.getFeatures();
        if (!features.includes(evt.feature)) {
          routingSourceRef.current.addFeature(evt.feature);
        }



        if (newPoints.length === 2) {
          setActiveRouteCoords([newPoints[0], newPoints[1]]);
          return []; // State'i sıfırla
        }
        return newPoints;
      });
    });

    map.addInteraction(draw);
    routingDrawRef.current = draw;

    return () => {
      if (map && routingDrawRef.current) map.removeInteraction(routingDrawRef.current);
    };
  }, [map, routingMode]);

  useEffect(() => {
    if (!routingMode) {
      setActiveRouteCoords(null);
      setCurrentRouteData(null);
      routingSourceRef.current.clear();
    }
  }, [routingMode]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!activeRouteCoords || activeRouteCoords.length !== 2) return;
      const [start, end] = activeRouteCoords;
      try {
        let url;
        let response;

        if (routeProfile === 'driving') {
          url = `http://localhost:5000/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
          try {
            response = await osrmAxios.get(url);
          } catch (e) {
            console.warn(`Localhost OSRM failed for driving, falling back to public server...`);
            url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
            response = await osrmAxios.get(url);
          }
        } else if (routeProfile === 'foot') {
          url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
          response = await osrmAxios.get(url);
        } else if (routeProfile === 'bike') {
          url = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
          response = await osrmAxios.get(url);
        }

        if (response && response.data && response.data.code === 'Ok') {
          const routeGeoJSON = response.data.routes[0].geometry;
          const distance = (response.data.routes[0].distance / 1000).toFixed(2);
          const duration = Math.round(response.data.routes[0].duration / 60);

          const format = new GeoJSON();
          const routeFeature = format.readFeature(routeGeoJSON, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          });

          routingSourceRef.current.clear();
          routingSourceRef.current.addFeature(routeFeature);

          setCurrentRouteData({ routeGeoJSON, distance, duration });
        }
      } catch (error) {
        console.error("OSRM Hatası:", error);
        if (notify) notify("Hata", "Rota hesaplanamadı. OSRM sunucusu kapalı olabilir.", "info");
      }
    };

    fetchRoute();
  }, [activeRouteCoords, routeProfile, notify]);

  // Kayıtlı Rota Seçildiğinde Profil Değişimi Hesaplaması
  useEffect(() => {
    const updateSelectedRoute = async () => {
      if (!selectedFeature || selectedFeature.get('itemType') !== 'route' || !selectedRouteProfile || !originalRouteGeoJSON) return;
      
      const coords = originalRouteGeoJSON.coordinates;
      if (!coords || coords.length < 2) return;
      
      const startCoord = coords[0];
      const endCoord = coords[coords.length - 1];

      try {
        let url;
        let response;
        if (selectedRouteProfile === 'driving') {
          url = `http://localhost:5000/route/v1/driving/${startCoord[0]},${startCoord[1]};${endCoord[0]},${endCoord[1]}?overview=full&geometries=geojson`;
          try {
            response = await osrmAxios.get(url);
          } catch (e) {
            url = `https://router.project-osrm.org/route/v1/driving/${startCoord[0]},${startCoord[1]};${endCoord[0]},${endCoord[1]}?overview=full&geometries=geojson`;
            response = await osrmAxios.get(url);
          }
        } else if (selectedRouteProfile === 'foot') {
          url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${startCoord[0]},${startCoord[1]};${endCoord[0]},${endCoord[1]}?overview=full&geometries=geojson`;
          response = await osrmAxios.get(url);
        } else if (selectedRouteProfile === 'bike') {
          url = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${startCoord[0]},${startCoord[1]};${endCoord[0]},${endCoord[1]}?overview=full&geometries=geojson`;
          response = await osrmAxios.get(url);
        }

        if (response && response.data && response.data.code === 'Ok') {
          const routeGeoJSON = response.data.routes[0].geometry;
          const distance = (response.data.routes[0].distance / 1000).toFixed(2);
          const duration = Math.round(response.data.routes[0].duration / 60);

          const format = new GeoJSON();
          const routeFeature = format.readFeature(routeGeoJSON, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          });

          // Güncel geometriyi haritada göster
          selectedFeature.setGeometry(routeFeature.getGeometry());
          setSelectedRouteData({ distance, duration, routeGeoJSON });
        }
      } catch (error) {
        console.error("OSRM update error:", error);
      }
    };

    updateSelectedRoute();
  }, [selectedRouteProfile, selectedFeature, originalRouteGeoJSON]);


  // Çizim İşlemi ve Kayıt Mantığı - Önce Kaydet, Sonra İsim Sor
  useEffect(() => {
    if (!map) return;
    if (drawRef.current) map.removeInteraction(drawRef.current);
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
              feature.setId(`geo-${createdItem.id}`);
              feature.set('realId', createdItem.id);
              feature.set('itemType', 'geometry');
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
      map.addInteraction(draw);
      drawRef.current = draw;
    }
  }, [map, drawType]);

  const handleEdit = async () => {
    if (!selectedFeature) return;
    const realId = selectedFeature.get('realId');
    const isRoute = selectedFeature.get('itemType') === 'route';
    const oldName = selectedFeature.get('name');

    notify("İsim Düzenle", "Yeni ismi giriniz:", "prompt", async (newName) => {
      if (newName && newName !== oldName) {
        try {
          const format = new GeoJSON();
          const geoJsonGeometry = format.writeGeometryObject(selectedFeature.getGeometry(), {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
          });

          const service = isRoute ? routeService : geometryService;
          const refreshFunc = isRoute ? refreshRoutes : refreshData;

          await service.update(realId, {
            id: realId,
            name: newName,
            geometryType: selectedFeature.getGeometry().getType(),
            geoloc: geoJsonGeometry
          });

          if (refreshFunc) await refreshFunc();

          selectedFeature.set('name', newName);
          notify("Başarılı", "İsim güncellendi.", "info");
        } catch (error) {
          notify("Hata", "Güncelleme başarısız oldu.", "info");
        }
      }
    }, oldName);
  };

  const handleDelete = async () => {
    if (!selectedFeature) return;
    const realId = selectedFeature.get('realId');
    const isRoute = selectedFeature.get('itemType') === 'route';
    if (!realId) return;

    notify("Silme Onayı", "Bu kaydı silmek istediğinize emin misiniz?", "confirm", async () => {
      try {
        const service = isRoute ? routeService : geometryService;
        const refreshFunc = isRoute ? refreshRoutes : refreshData;

        await service.delete(realId);
        if (refreshFunc) await refreshFunc();
        vectorSourceRef.current.removeFeature(selectedFeature);
        overlayRef.current.setPosition(undefined);
        setSelectedFeature(null);
        notify("Başarılı", "Kayıt haritadan silindi.", "info");
      } catch (error) {
        notify("Hata", "Silme işlemi sırasında bir sorun oluştu.", "info");
      }
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, pointerEvents: 'none', width: '100%', height: '100%' }}>
        {measureMode && (
          <button type="button" className="measure-clear-btn" style={{ pointerEvents: 'auto' }} onClick={clearMeasurements}>
            🗑 Temizle
          </button>
        )}
        {routingMode && (
          <div style={{ 
            pointerEvents: 'auto', 
            position: 'absolute', 
            top: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'flex', 
            gap: '8px', 
            background: 'rgba(15,23,42,0.95)', 
            padding: '8px', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)'
          }}>
            <button 
              style={{
                background: routeProfile === 'driving' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => setRouteProfile('driving')}
            >
              🚗 Araba
            </button>
            <button 
              style={{
                background: routeProfile === 'foot' ? '#10b981' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => setRouteProfile('foot')}
            >
              🚶‍♂️ Yaya
            </button>
            <button 
              style={{
                background: routeProfile === 'bike' ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => setRouteProfile('bike')}
            >
              🚲 Bisiklet
            </button>
          </div>
        )}
        
        {routingMode && currentRouteData && (
          <div style={{ 
            pointerEvents: 'auto', 
            position: 'absolute', 
            top: '75px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            background: 'rgba(15,23,42,0.95)', 
            padding: '15px 25px', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#60a5fa' }}>
               Mesafe: {currentRouteData.distance} km &nbsp;|&nbsp; Süre: {formatDuration(currentRouteData.duration)}
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button 
                onClick={() => {
                  notify(
                    "Rotayı Kaydet",
                    "Bu rotayı kaydetmek için bir isim giriniz:",
                    "prompt",
                    async (inputName) => {
                      let finalName = inputName && inputName.trim() !== "" ? inputName.trim() : null;
                      if (!finalName) {
                        const existingUnnamed = (routes || []).filter(r => r.name && r.name.startsWith(`İsimsiz Güzergah -`)).length;
                        finalName = `İsimsiz Güzergah - ${existingUnnamed + 1}`;
                      }
                      try {
                        await routeService.create({
                          name: finalName,
                          geometryType: "LineString",
                          geoloc: currentRouteData.routeGeoJSON
                        });
                        if (refreshRoutes) await refreshRoutes();
                        notify("Başarılı", "Rota kaydedildi.", "info");
                        // Rota kaydedildi, ui'ı sıfırla
                        setActiveRouteCoords(null);
                        setCurrentRouteData(null);
                        routingSourceRef.current.clear();
                      } catch (error) {
                        notify("Hata", "Rota kaydedilemedi.", "info");
                      }
                    }
                  );
                }}
                style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#2563eb'}
                onMouseOut={(e) => e.target.style.background = '#3b82f6'}
              >
                Kaydet
              </button>
              <button 
                onClick={() => {
                  setActiveRouteCoords(null);
                  setCurrentRouteData(null);
                  routingSourceRef.current.clear();
                }}
                style={{ flex: 1, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.target.style.background = '#ef4444'; e.target.style.color = 'white'; }}
                onMouseOut={(e) => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.color = '#ef4444'; }}
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>
      <div ref={popupElement} className="ol-popup-wrapper">
        {selectedFeature && (
          <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>

            {/* Ana Popup Kartı */}
            <div className="ol-popup">
              <button className="ol-popup-closer" onClick={() => {
                overlayRef.current.setPosition(undefined);
                if (activeRouteFeatureRef.current && activeRouteOriginalGeoJSONRef.current) {
                  const format = new GeoJSON();
                  activeRouteFeatureRef.current.setGeometry(format.readGeometry(activeRouteOriginalGeoJSONRef.current, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }));
                }
                
                activeRouteFeatureRef.current = null;
                activeRouteOriginalGeoJSONRef.current = null;
                
                setSelectedFeature(null);
                setSelectedRouteProfile(null);
                setSelectedRouteData(null);
                setOriginalRouteGeoJSON(null);
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
                <div className="detail-panel" style={{ marginLeft: '8px' }}>
                  <h4>📋 Detay Bilgisi</h4>
                  <div className="detail-row"><span className="detail-label">ID</span><span className="detail-value">#{info.id}</span></div>
                  <div className="detail-row"><span className="detail-label">İsim</span><span className="detail-value">{info.name || 'İsimsiz'}</span></div>
                  <div className="detail-row"><span className="detail-label">Tip</span><span className="detail-value">{info.type}</span></div>
                  {info.coords && <div className="detail-row"><span className="detail-label">Konum</span><span className="detail-value">{info.coords}</span></div>}
                  {info.length && <div className="detail-row"><span className="detail-label">Uzunluk</span><span className="detail-value">{info.length}</span></div>}
                  {info.area && <div className="detail-row"><span className="detail-label">Alan</span><span className="detail-value">{info.area}</span></div>}
                  
                  {selectedFeature.get('itemType') === 'route' && (
                    <div className="route-profile-editor" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                        <button 
                          style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: selectedRouteProfile === 'driving' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                          onClick={() => setSelectedRouteProfile('driving')}
                        >🚗</button>
                        <button 
                          style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: selectedRouteProfile === 'foot' ? '#10b981' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                          onClick={() => setSelectedRouteProfile('foot')}
                        >🚶‍♂️</button>
                        <button 
                          style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: selectedRouteProfile === 'bike' ? '#f59e0b' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                          onClick={() => setSelectedRouteProfile('bike')}
                        >🚲</button>
                      </div>
                      
                      {selectedRouteData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div className="detail-row"><span className="detail-label" style={{ color: '#60a5fa' }}>Tahmini Süre</span><span className="detail-value">{formatDuration(selectedRouteData.duration)}</span></div>
                          <div className="detail-row"><span className="detail-label" style={{ color: '#60a5fa' }}>Yeni Mesafe</span><span className="detail-value">{selectedRouteData.distance} km</span></div>
                          
                          <button 
                            style={{ width: '100%', marginTop: '10px', background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            onClick={async () => {
                              try {
                                const realId = selectedFeature.get('realId');
                                await routeService.update(realId, {
                                  id: realId,
                                  name: selectedFeature.get('name'),
                                  geometryType: "LineString",
                                  geoloc: selectedRouteData.routeGeoJSON
                                });
                                setOriginalRouteGeoJSON(selectedRouteData.routeGeoJSON);
                                activeRouteOriginalGeoJSONRef.current = selectedRouteData.routeGeoJSON;
                                if (refreshRoutes) refreshRoutes();
                                notify("Başarılı", "Güzergah başarıyla güncellendi.", "info");
                              } catch(e) {
                                notify("Hata", "Güzergah güncellenemedi.", "info");
                              }
                            }}
                          >
                            Değişiklikleri Kaydet
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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