import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import GeometryList from './components/GeometryList';
import { geometryService } from './services/api';
import { MapPin, Share2, Pentagon, XCircle, Menu, Info, AlertTriangle, Edit2 } from 'lucide-react';
import './App.css';

// Modern Modal Bileşeni (Giriş Desteği ile)
const CustomModal = ({ isOpen, title, message, type, defaultValue, onConfirm, onCancel }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) setInputValue(defaultValue || '');
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className={`modal-icon ${type}`}>
          {type === 'confirm' ? <AlertTriangle size={32} /> :
            type === 'prompt' ? <Pentagon size={32} /> : <Info size={32} />}
        </div>
        <h3>{title}</h3>
        <p>{message}</p>

        {type === 'prompt' && (
          <input
            type="text"
            className="modal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
            placeholder="Bir isim giriniz..."
          />
        )}

        <div className="modal-actions">
          {type === 'info' ? (
            <button className="modal-btn primary" onClick={() => onConfirm()}>Tamam</button>
          ) : (
            <>
              <button className="modal-btn cancel" onClick={onCancel}>İptal</button>
              <button
                className={`modal-btn ${type === 'confirm' ? 'confirm' : 'primary'}`}
                onClick={() => onConfirm(inputValue)}
              >
                {type === 'confirm' ? 'Evet, Sil' : 'Kaydet'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [drawType, setDrawType] = useState(null);
  const [geometries, setGeometries] = useState([]);
  const [zoomTo, setZoomTo] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [baseLayer, setBaseLayer] = useState(localStorage.getItem('baseLayer') || 'osm');
  const [isEditMode, setIsEditMode] = useState(false);

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false, title: '', message: '', type: 'info', defaultValue: '', onConfirm: null, onCancel: null
  });

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const showModal = (title, message, type = 'info', onConfirm = null, defaultValue = '', onCancel = null) => {
    const wrappedConfirm = async (val) => {
      if (onConfirm) await onConfirm(val);
      closeModal();
    };

    const wrappedCancel = () => {
      if (onCancel) onCancel();
      closeModal();
    };

    setModal({
      isOpen: true, title, message, type, defaultValue,
      onConfirm: wrappedConfirm,
      onCancel: wrappedCancel
    });
  };

  const fetchGeometries = async () => {
    try {
      const data = await geometryService.getAll();
      setGeometries(data);
    } catch (error) {
      console.error("Yükleme hatası:", error);
    }
  };

  useEffect(() => {
    fetchGeometries();
  }, []);

  useEffect(() => {
    localStorage.setItem('baseLayer', baseLayer);
  }, [baseLayer]);

  const handleDelete = async (id) => {
    showModal(
      "Silme Onayı",
      "Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?",
      "confirm",
      async () => {
        try {
          await geometryService.delete(id);
          fetchGeometries();
          closeModal();
          showModal("Başarılı", "Kayıt silindi.", "info", closeModal);
        } catch (error) {
          showModal("Hata", "Silme işlemi başarısız oldu.", "info", closeModal);
        }
      }
    );
  };

  return (
    <div className="app-container">
      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        defaultValue={modal.defaultValue}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />

      <nav className="navbar">
        <div className="navbar-left">
          <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={24} />
          </button>
          <div className="navbar-brand">
            <MapPin size={28} color="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            <span>HaritaAPP</span>
          </div>
        </div>

        <div className="navbar-center">
          <div className="layer-switcher">
            <button className={`layer-btn ${baseLayer === 'osm' ? 'active' : ''}`} onClick={() => setBaseLayer('osm')}>Standart</button>
            <button className={`layer-btn ${baseLayer === 'satellite' ? 'active' : ''}`} onClick={() => setBaseLayer('satellite')}>Uydu</button>
          </div>
        </div>

        <div className="navbar-buttons">
          <button className={`nav-btn ${drawType === 'Point' ? 'active' : ''}`} onClick={() => setDrawType('Point')}>
            <MapPin size={18} /> Point
          </button>
          <button className={`nav-btn ${drawType === 'LineString' ? 'active' : ''}`} onClick={() => setDrawType('LineString')}>
            <Share2 size={18} /> Line
          </button>
          <button className={`nav-btn ${drawType === 'Polygon' ? 'active' : ''}`} onClick={() => setDrawType('Polygon')}>
            <Pentagon size={18} /> Polygon
          </button>
          {drawType && (
            <button className="nav-btn cancel-btn" onClick={() => setDrawType(null)}>
              <XCircle size={18} /> İptal
            </button>
          )}
          <button
            className={`nav-btn ${isEditMode ? 'active edit-active' : ''}`}
            onClick={() => {
              setIsEditMode(!isEditMode);
              setDrawType(null); // Edit modda çizim iptal edilsin
            }}
            title="Geometri Düzenleme Modu"
          >
            <Edit2 size={18} /> {isEditMode ? 'Düzenleme: Açık' : 'Düzenle'}
          </button>
        </div>
      </nav>

      <div className="main-layout">
        <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
          <GeometryList
            geometries={geometries}
            onDelete={handleDelete}
            onZoom={(geo) => { setZoomTo(geo); setIsSidebarOpen(false); }}
          />
        </div>

        <main className="map-container">
          <MapComponent
            drawType={drawType}
            setDrawType={setDrawType}
            geometries={geometries}
            refreshData={fetchGeometries}
            zoomTo={zoomTo}
            baseLayer={baseLayer}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            notify={(t, m, tp, cb, dv, ccb) => showModal(t, m, tp, cb, dv, ccb)}
          />
        </main>
      </div>
    </div>
  );
}

export default App;