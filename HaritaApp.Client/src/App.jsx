import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import GeometryList from './components/GeometryList';
import { geometryService } from './services/geometryService';
import { routeService } from './services/routeService';
import { stopService } from './services/stopService';
import { MapPin, Share2, Pentagon, XCircle, Menu, Info, AlertTriangle, Edit2, LogOut, User as UserIcon, Navigation } from 'lucide-react';
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
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [zoomTo, setZoomTo] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [baseLayer, setBaseLayer] = useState(localStorage.getItem('baseLayer') || 'osm');
  const [isEditMode, setIsEditMode] = useState(false);
  const [measureMode, setMeasureMode] = useState(null);
  const [routingMode, setRoutingMode] = useState(false);
  const [hiddenRoutes, setHiddenRoutes] = useState([]);

  const toggleRouteVisibility = (routeId) => {
    setHiddenRoutes(prev => 
      prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]
    );
  };


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
      console.error("Geometri yükleme hatası:", error);
    }
  };

  const fetchRoutes = async () => {
    if (!user) return;
    try {
      const data = await routeService.getAll();
      setRoutes(data);
    } catch (error) {
      console.error("Rota yükleme hatası:", error);
    }
  };

  const fetchStops = async () => {
    if (!user) return;
    try {
      const data = await stopService.getAll();
      setStops(data);
    } catch (error) {
      console.error("Durak yükleme hatası:", error);
    }
  };

  useEffect(() => {
    fetchGeometries();
    fetchRoutes();
    fetchStops();
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
            onClick={() => { setDrawType('Point'); setMeasureMode(null); setIsEditMode(false); }}
            data-tooltip="Nokta Çiz"
          >
            <MapPin size={18} /> Point
          </button>
          <button
            className={`nav-btn ${drawType === 'LineString' ? 'active' : ''}`}
            onClick={() => { setDrawType('LineString'); setMeasureMode(null); setIsEditMode(false); }}
            data-tooltip="Çizgi Çiz"
          >
            <Share2 size={18} /> Line
          </button>
          <button
            className={`nav-btn ${drawType === 'Polygon' ? 'active' : ''}`}
            onClick={() => { setDrawType('Polygon'); setMeasureMode(null); setIsEditMode(false); }}
            data-tooltip="Poligon Çiz"
          >
            <Pentagon size={18} /> Polygon
          </button>
          <button
            className={`nav-btn ${isEditMode ? 'active edit-active' : ''}`}
            onClick={() => {
              setIsEditMode(!isEditMode);
              setDrawType(null);
              setMeasureMode(null);
            }}
            data-tooltip={isEditMode ? 'Düzenlemeyi Kapat' : 'Düzenlemeyi Aç'}
          >
            <Edit2 size={18} />
          </button>

          <div className="nav-divider" />

          <button
            type="button"
            className={`nav-btn measure-btn ${measureMode === 'LineString' ? 'active measure-active' : ''}`}
            onClick={() => {
              setMeasureMode(measureMode === 'LineString' ? null : 'LineString');
              setDrawType(null);
              setIsEditMode(false);
            }}
            data-tooltip="Mesafe Ölç"
          >
            <Share2 size={18} /> Mesafe
          </button>
          <button
            type="button"
            className={`nav-btn measure-btn ${measureMode === 'Polygon' ? 'active measure-active' : ''}`}
            onClick={() => {
              setMeasureMode(measureMode === 'Polygon' ? null : 'Polygon');
              setDrawType(null);
              setIsEditMode(false);
            }}
            data-tooltip="Alan Ölç"
          >
            <Pentagon size={18} /> Alan
          </button>

          <button
            type="button"
            className={`nav-btn routing-btn ${routingMode ? 'active routing-active' : ''}`}
            onClick={() => {
              setRoutingMode(!routingMode);
              setDrawType(null);
              setMeasureMode(null);
              setIsEditMode(false);
            }}
            data-tooltip="Rota Oluştur"
          >
            <Navigation size={18} /> Rota
          </button>

          {(drawType || measureMode || routingMode) && (
            <button
              className="nav-btn cancel-btn"
              onClick={() => { setDrawType(null); setMeasureMode(null); setRoutingMode(false); }}
              data-tooltip="İptal Et"
            >
              <XCircle size={18} /> İptal
            </button>
          )}

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
            routes={routes}
            stops={stops}
            onDelete={handleDelete}
            notify={(t, m, tp, cb, dv, ccb) => showModal(t, m, tp, cb, dv, ccb)}
            refreshData={fetchGeometries}
            refreshRoutes={fetchRoutes}
            refreshStops={fetchStops}
            onZoom={(geo) => { setZoomTo(geo); setIsSidebarOpen(false); }}
            hiddenRoutes={hiddenRoutes}
            toggleRouteVisibility={toggleRouteVisibility}
          />
        </div>

        <main className="map-container">
          <MapComponent
            drawType={drawType}
            setDrawType={setDrawType}
            geometries={geometries}
            routes={routes}
            refreshData={fetchGeometries}
            refreshRoutes={fetchRoutes}
            zoomTo={zoomTo}
            baseLayer={baseLayer}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            measureMode={measureMode}
            setMeasureMode={setMeasureMode}
            routingMode={routingMode}
            setRoutingMode={setRoutingMode}
            notify={(t, m, tp, cb, dv, ccb) => showModal(t, m, tp, cb, dv, ccb)}
            hiddenRoutes={hiddenRoutes}
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