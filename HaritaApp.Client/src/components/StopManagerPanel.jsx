import React, { useState } from 'react';
import { Trash2, Edit2, Navigation, Search, MapPin } from 'lucide-react';
import { stopService } from '../services/api';

const StopManagerPanel = ({ stops, refreshStops, onZoom, notify }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredStops = stops.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredStops.length / itemsPerPage);
  const paginatedStops = filteredStops.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id) => {
    notify(
      "Silme Onayı",
      "Bu durağı kalıcı olarak silmek istediğinize emin misiniz? (Bağlı olduğu güzergahlardan da silinir)",
      "confirm",
      async () => {
        try {
          await stopService.delete(id);
          if (refreshStops) await refreshStops();
          notify("Başarılı", "Durak silindi.", "info");
        } catch (e) {
          notify("Hata", "Durak silinemedi.", "info");
        }
      }
    );
  };

  const handleEdit = (stop) => {
    notify(
      "İsim Düzenle",
      "Yeni durak ismini giriniz:",
      "prompt",
      async (newName) => {
        if (newName && newName !== stop.name) {
          try {
            await stopService.update(stop.id, { ...stop, name: newName });
            if (refreshStops) await refreshStops();
            notify("Başarılı", "Durak ismi güncellendi.", "info");
          } catch (e) {
            notify("Hata", "Güncelleme başarısız.", "info");
          }
        }
      },
      stop.name
    );
  };

  return (
    <div className="section-content">
      <div className="search-container" style={{ padding: '0 0 1rem 0' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Duraklarda Ara..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="search-input"
          />
        </div>
      </div>
      
      {paginatedStops.length === 0 ? (
        <div className="empty-state">Kayıt bulunamadı.</div>
      ) : (
        <>
          {paginatedStops.map(stop => (
            <div key={stop.id} className="geometry-item-wrapper">
              <div className="geometry-item">
                <div className="item-info">
                  <div className="item-name"><MapPin size={14}/> {stop.name}</div>
                </div>
                <div className="item-actions">
                  <button className="action-btn edit-icon-btn" onClick={() => handleEdit(stop)} title="Düzenle">
                    <Edit2 size={15} />
                  </button>
                  <button className="action-btn zoom-btn" onClick={() => onZoom(stop)} title="Haritada Göster">
                    <Navigation size={15} />
                  </button>
                  <button className="action-btn delete-btn-small" onClick={() => handleDelete(stop.id)} title="Sil">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="pagination-btn"
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ◀
              </button>
              <span className="pagination-info">{currentPage} / {totalPages}</span>
              <button 
                className="pagination-btn"
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
              >
                ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StopManagerPanel;
