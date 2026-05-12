import React, { useState } from 'react';
import { Trash2, Navigation, Search, Info, ChevronDown, ChevronUp, Map, Route as RouteIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, EyeOff } from 'lucide-react';
import { geometryService } from '../services/geometryService';
import { routeService } from '../services/routeService';
import { getRouteColor } from '../utils/colorUtils';
import RouteStopEditor from './RouteStopEditor';

const GeometryList = ({ geometries, routes, stops, refreshData, refreshRoutes, refreshStops, onZoom, notify, hiddenRoutes = [], toggleRouteVisibility }) => {
  const [searchGeometries, setSearchGeometries] = useState('');
  const [searchRoutes, setSearchRoutes] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [sectionOpen, setSectionOpen] = useState({ geometries: false, routes: false, stops: false });
  const [currentPageGeometries, setCurrentPageGeometries] = useState(1);
  const [currentPageRoutes, setCurrentPageRoutes] = useState(1);
  const itemsPerPage = 5;

  const handleSearchGeometries = (e) => {
    setSearchGeometries(e.target.value);
    setCurrentPageGeometries(1);
  };

  const handleSearchRoutes = (e) => {
    setSearchRoutes(e.target.value);
    setCurrentPageRoutes(1);
  };

  const toggleSection = (section) => {
    setSectionOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredGeometries = geometries.filter(geo =>
    geo.name.toLowerCase().includes(searchGeometries.toLowerCase())
  );

  const uniqueRoutes = (routes || []).filter(
    (r, idx, arr) => arr.findIndex(x => x.id === r.id) === idx
  );

  const filteredRoutes = uniqueRoutes.filter(route =>
    route.name.toLowerCase().includes(searchRoutes.toLowerCase())
  );

  const totalPagesGeometries = Math.ceil(filteredGeometries.length / itemsPerPage);
  const totalPagesRoutes = Math.ceil(filteredRoutes.length / itemsPerPage);

  const paginatedGeometries = filteredGeometries.slice(
    (currentPageGeometries - 1) * itemsPerPage,
    currentPageGeometries * itemsPerPage
  );

  const paginatedRoutes = filteredRoutes.slice(
    (currentPageRoutes - 1) * itemsPerPage,
    currentPageRoutes * itemsPerPage
  );

  const handleDeleteGeometry = async (id) => {
    notify(
      "Silme Onayı",
      "Bu geometriyi silmek istediğinize emin misiniz?",
      "confirm",
      async () => {
        try {
          await geometryService.delete(id);
          if (refreshData) await refreshData();
          notify("Başarılı", "Geometri başarıyla silindi.", "info");
        } catch (error) {
          console.error("Silme hatası:", error);
          notify("Hata", "Silme işlemi başarısız oldu.", "info");
        }
      }
    );
  };

  const handleDeleteRoute = async (id) => {
    notify(
      "Silme Onayı",
      "Bu güzergahı silmek istediğinize emin misiniz?",
      "confirm",
      async () => {
        try {
          await routeService.delete(id);
          if (refreshRoutes) await refreshRoutes();
          notify("Başarılı", "Güzergah başarıyla silindi.", "info");
        } catch (error) {
          console.error("Silme hatası:", error);
          notify("Hata", "Silme işlemi başarısız oldu.", "info");
        }
      }
    );
  };

  const typeIcon = (type) => {
    if (type === 'Point') return '📍';
    if (type === 'LineString') return '📏';
    if (type === 'Polygon') return '🔷';
    return '📌';
  };

  const renderItem = (item, type, onDelete) => {
    const isRoute = type === 'route';
    const routeColor = isRoute ? getRouteColor(item.id) : null;

    return (
      <div key={item.id} className="geometry-item-wrapper">
        <div className="geometry-item" style={isRoute ? { borderLeft: `4px solid ${routeColor}`, paddingLeft: '10px' } : {}}>
          {isRoute && (
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: routeColor,
              flexShrink: 0,
              boxShadow: `0 0 6px ${routeColor}`,
              marginRight: '4px'
            }} />
          )}
          <div className="item-info" style={isRoute && hiddenRoutes.includes(item.id) ? { opacity: 0.5 } : {}}>
            <div className="item-name">{typeIcon(item.geometryType)} {item.name}</div>
            <div className="item-type">{item.geometryType}</div>
          </div>
          <div className="item-actions">
            <button
              className={`action-btn info-btn ${expandedId === item.id ? 'active' : ''}`}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              title="Detay"
            >
              <Info size={15} />
            </button>
            {isRoute && (
              <button
                className="action-btn"
                onClick={() => toggleRouteVisibility && toggleRouteVisibility(item.id)}
                title={hiddenRoutes.includes(item.id) ? "Göster" : "Gizle"}
              >
                {hiddenRoutes.includes(item.id) ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            )}
            <button
              className="action-btn zoom-btn"
              onClick={() => onZoom(item)}
              title="Haritada Göster"
            >
              <Navigation size={15} />
            </button>
            <button
              className="action-btn delete-btn-small"
              onClick={() => onDelete(item.id)}
              title="Sil"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        {expandedId === item.id && (
          <div className="item-detail">
            <div className="item-detail-row">
              <span>ID</span><span>#{item.id}</span>
            </div>
            {isRoute && (
              <div className="item-detail-row">
                <span>Renk</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '3px', background: routeColor, boxShadow: `0 0 5px ${routeColor}` }} />
                  {routeColor}
                </span>
              </div>
            )}
            <div className="item-detail-row">
              <span>Tarih</span>
              <span>{new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
            
            {isRoute && (
              <RouteStopEditor 
                route={item} 
                allStops={stops} 
                notify={notify} 
                onUpdate={() => { refreshRoutes && refreshRoutes(); }} 
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="geometry-list-panel">
      <div className="panel-header">
        <h2>Veri Katmanları</h2>
      </div>

      <div className="list-container">
        {/* GEOMETRİLER BÖLÜMÜ */}
        <div className="collapsible-section">
          <div className="section-header" onClick={() => toggleSection('geometries')}>
            <div className="section-title">
              <span>Kayıtlı Geometriler</span>
            </div>
            <div className="section-chevron">
              <span className="chevron-icon">{sectionOpen.geometries ? <ChevronDown size={18} /> : <ChevronDown size={18} style={{transform: 'rotate(-90deg)'}} />}</span>
            </div>
          </div>
          {sectionOpen.geometries && (
            <div className="section-content">
              <div className="search-container" style={{ padding: '0 0 1rem 0' }}>
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Geometrilerde Ara..."
                    value={searchGeometries}
                    onChange={handleSearchGeometries}
                    className="search-input"
                  />
                </div>
              </div>
              {paginatedGeometries.length === 0 ? (
                <div className="empty-state">Kayıt bulunamadı.</div>
              ) : (
                <>
                  {paginatedGeometries.map(geo => renderItem(geo, 'geometry', handleDeleteGeometry))}
                  {totalPagesGeometries > 1 && (
                    <div className="pagination-container">
                      <button 
                        className="pagination-btn"
                        disabled={currentPageGeometries === 1} 
                        onClick={() => setCurrentPageGeometries(1)}
                        title="İlk Sayfa"
                      >
                        <ChevronsLeft size={18} />
                      </button>
                      <button 
                        className="pagination-btn"
                        disabled={currentPageGeometries === 1} 
                        onClick={() => setCurrentPageGeometries(prev => prev - 1)}
                        title="Önceki"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="pagination-info">{currentPageGeometries} / {totalPagesGeometries}</span>
                      <button 
                        className="pagination-btn"
                        disabled={currentPageGeometries === totalPagesGeometries} 
                        onClick={() => setCurrentPageGeometries(prev => prev + 1)}
                        title="Sonraki"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button 
                        className="pagination-btn"
                        disabled={currentPageGeometries === totalPagesGeometries} 
                        onClick={() => setCurrentPageGeometries(totalPagesGeometries)}
                        title="Son Sayfa"
                      >
                        <ChevronsRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* GÜZERGAHLAR BÖLÜMÜ */}
        <div className="collapsible-section">
          <div className="section-header" onClick={() => toggleSection('routes')}>
            <div className="section-title">
              <span>Güzergahlar</span>
            </div>
            <div className="section-chevron">
              <span className="chevron-icon">{sectionOpen.routes ? <ChevronDown size={18} /> : <ChevronDown size={18} style={{transform: 'rotate(-90deg)'}} />}</span>
            </div>
          </div>
          {sectionOpen.routes && (
            <div className="section-content">
              <div className="search-container" style={{ padding: '0 0 1rem 0' }}>
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Güzergahlarda Ara..."
                    value={searchRoutes}
                    onChange={handleSearchRoutes}
                    className="search-input"
                  />
                </div>
              </div>
              {paginatedRoutes.length === 0 ? (
                <div className="empty-state">Kayıt bulunamadı.</div>
              ) : (
                <>
                  {paginatedRoutes.map(route => renderItem(route, 'route', handleDeleteRoute))}
                  {totalPagesRoutes > 1 && (
                    <div className="pagination-container">
                      <button 
                        className="pagination-btn"
                        disabled={currentPageRoutes === 1} 
                        onClick={() => setCurrentPageRoutes(1)}
                        title="İlk Sayfa"
                      >
                        <ChevronsLeft size={18} />
                      </button>
                      <button 
                        className="pagination-btn"
                        disabled={currentPageRoutes === 1} 
                        onClick={() => setCurrentPageRoutes(prev => prev - 1)}
                        title="Önceki"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="pagination-info">{currentPageRoutes} / {totalPagesRoutes}</span>
                      <button 
                        className="pagination-btn"
                        disabled={currentPageRoutes === totalPagesRoutes} 
                        onClick={() => setCurrentPageRoutes(prev => prev + 1)}
                        title="Sonraki"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button 
                        className="pagination-btn"
                        disabled={currentPageRoutes === totalPagesRoutes} 
                        onClick={() => setCurrentPageRoutes(totalPagesRoutes)}
                        title="Son Sayfa"
                      >
                        <ChevronsRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeometryList;
