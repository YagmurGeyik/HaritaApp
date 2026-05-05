import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import GeometryList from './components/GeometryList';
import { geometryService } from './services/api';
import { MapPin, Share2, Pentagon, XCircle, Menu, Info, AlertTriangle, Edit2, LogOut, User as UserIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
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

function AppContent() {
  const [drawType, setDrawType] = useState(null);
  const [geometries, setGeometries] = useState([]);
  const [zoomTo, setZoomTo] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [baseLayer, setBaseLayer] = useState(localStorage.getItem('baseLayer') || 'osm');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { user, logout } = useAuth();

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
    if (!user) return;
    try {
      const data = await geometryService.getAll();
      setGeometries(data);
    } catch (error) {
      console.error("Yükleme hatası:", error);
    }
  };

  useEffect(() => {
    fetchGeometries();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('baseLayer', baseLayer);
  }, [baseLayer]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Eğer sidebar açıksa ve tıklanan yer sidebar veya menü butonu değilse kapat
      if (isSidebarOpen && 
          !event.target.closest('.sidebar-wrapper') && 
          !event.target.closest('.menu-toggle-btn')) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

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

  if (!user) {
      return <LoginPage />;
  }

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
          <button 
            className={`nav-btn ${drawType === 'Point' ? 'active' : ''}`} 
            onClick={() => setDrawType('Point')}
            data-tooltip="Nokta Çiz"
          >
            <MapPin size={18} /> Point
          </button>
          <button 
            className={`nav-btn ${drawType === 'LineString' ? 'active' : ''}`} 
            onClick={() => setDrawType('LineString')}
            data-tooltip="Çizgi Çiz"
          >
            <Share2 size={18} /> Line
          </button>
          <button 
            className={`nav-btn ${drawType === 'Polygon' ? 'active' : ''}`} 
            onClick={() => setDrawType('Polygon')}
            data-tooltip="Poligon Çiz"
          >
            <Pentagon size={18} /> Polygon
          </button>
          {drawType && (
            <button 
              className="nav-btn cancel-btn" 
              onClick={() => setDrawType(null)}
              data-tooltip="Çizimi İptal Et"
            >
              <XCircle size={18} /> İptal
            </button>
          )}
          <button
            className={`nav-btn ${isEditMode ? 'active edit-active' : ''}`}
            onClick={() => {
              setIsEditMode(!isEditMode);
              setDrawType(null);
            }}
            data-tooltip={isEditMode ? 'Düzenlemeyi Kapat' : 'Düzenlemeyi Aç'}
          >
            <Edit2 size={18} />
          </button>
          
          <div className="user-info">
            <div className="username-display">
               <UserIcon size={16} /> {user.username}
            </div>
            <button className="logout-btn" onClick={logout} title="Çıkış Yap">
                <LogOut size={18} />
            </button>
          </div>
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

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;