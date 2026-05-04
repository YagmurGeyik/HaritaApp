import React, { useState } from 'react';
import { Trash2, Navigation, Search, Info } from 'lucide-react';

const GeometryList = ({ geometries, onDelete, onZoom }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredGeometries = geometries.filter(geo =>
    geo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    geo.geometryType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeIcon = (type) => {
    if (type === 'Point') return '📍';
    if (type === 'LineString') return '📏';
    if (type === 'Polygon') return '🔷';
    return '📌';
  };

  return (
    <div className="geometry-list-panel">
      <div className="panel-header">
        <div>
          <h2>Kayıtlı Geometriler</h2>
          <span className="count-badge">{filteredGeometries.length} kayıt bulundu</span>
        </div>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="İsim veya tür ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="list-container">
        {filteredGeometries.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? "Sonuç bulunamadı." : "Henüz bir kayıt yok."}
          </div>
        ) : (
          filteredGeometries.map((geo) => (
            <div key={geo.id} className="geometry-item-wrapper">
              <div className="geometry-item">
                <div className="item-info">
                  <div className="item-name">{typeIcon(geo.geometryType)} {geo.name}</div>
                  <div className="item-type">{geo.geometryType}</div>
                </div>
                <div className="item-actions">
                  <button
                    className={`action-btn info-btn ${expandedId === geo.id ? 'active' : ''}`}
                    onClick={() => setExpandedId(expandedId === geo.id ? null : geo.id)}
                    title="Detay"
                  >
                    <Info size={15} />
                  </button>
                  <button
                    className="action-btn zoom-btn"
                    onClick={() => onZoom(geo)}
                    title="Haritada Göster"
                  >
                    <Navigation size={15} />
                  </button>
                  <button
                    className="action-btn delete-btn-small"
                    onClick={() => onDelete(geo.id)}
                    title="Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Genişleyen Detay Satırı */}
              {expandedId === geo.id && (
                <div className="item-detail">
                  <div className="item-detail-row">
                    <span>ID</span><span>#{geo.id}</span>
                  </div>
                  <div className="item-detail-row">
                    <span>Tip</span><span>{geo.geometryType}</span>
                  </div>
                  {geo.createdAt && (
                    <div className="item-detail-row">
                      <span>Tarih</span>
                      <span>{new Date(geo.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GeometryList;
