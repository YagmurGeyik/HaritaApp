import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import GeometryList from './components/GeometryList';
import { geometryService } from './services/geometryService';
import { routeService } from './services/routeService';
import { stopService } from './services/stopService';
import { MapPin, Share2, Pentagon, XCircle, Menu, Info, AlertTriangle, Edit2, LogOut, User as UserIcon, Navigation, Layers } from 'lucide-react';
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
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
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

  // Toast State
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const showModal = (title, message, type = 'info', onConfirm = null, defaultValue = '', onCancel = null) => {
    if (type === 'toast') {
      showToast(message, 'success');
      return;
    }

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
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Info size={18} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

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
            toggleRouteVisibility={toggleRouteVisibility}
          />

          {/* Katmanlar Floating Paneli */}
          <div className="katmanlar-widget">
            {isLayerPanelOpen && (
              <div className="katmanlar-options">
                <button
                  className={`katmanlar-option-btn ${baseLayer === 'osm' ? 'active' : ''}`}
                  onClick={() => { setBaseLayer('osm'); setIsLayerPanelOpen(false); }}
                >
                  {/* Standart / OSM Harita Önizleme */}
                  <svg className="katmanlar-option-preview" viewBox="0 0 50 38" xmlns="http://www.w3.org/2000/svg">
                    <rect width="50" height="38" fill="#f2efe9" />
                    {/* Park alanları */}
                    <ellipse cx="38" cy="28" rx="11" ry="8" fill="#c8e6c0" />
                    <ellipse cx="9" cy="7" rx="8" ry="5" fill="#d4eacc" />
                    {/* Nehir/su */}
                    <path d="M0,16 Q12,14 25,17 Q38,20 50,17" stroke="#b3d9f0" strokeWidth="4" fill="none" />
                    {/* Ana yollar */}
                    <rect x="19" y="0" width="3.5" height="38" fill="#d4cfc7" />
                    <rect x="0" y="22" width="50" height="2.5" fill="#d4cfc7" />
                    {/* Küçük yollar */}
                    <rect x="32" y="0" width="1.5" height="38" fill="#e8e4dc" />
                    <rect x="0" y="10" width="50" height="1.5" fill="#e8e4dc" />
                  </svg>
                  <span>Standart</span>
                </button>
                <button
                  className={`katmanlar-option-btn ${baseLayer === 'satellite' ? 'active' : ''}`}
                  onClick={() => { setBaseLayer('satellite'); setIsLayerPanelOpen(false); }}
                >
                  {/* Uydu Önizleme - diyagonal yol dokusu */}
                  <svg className="katmanlar-option-preview" viewBox="0 0 50 38" xmlns="http://www.w3.org/2000/svg">
                    {/* Zemin katmanları */}
                    <rect width="50" height="38" fill="#4a4d44" />
                    <polygon points="0,0 50,0 50,12 0,22" fill="#3e4139" />
                    <polygon points="0,22 50,12 50,38 0,38" fill="#424640" />
                    {/* Diyagonal yol - geniş */}
                    <polygon points="-2,30 6,18 52,2 52,10" fill="#696c61" />
                    {/* Yol kenarı çizgileri */}
                    <line x1="6" y1="18" x2="52" y2="2" stroke="#797c71" strokeWidth="0.7" opacity="0.9" />
                    <line x1="-2" y1="30" x2="44" y2="14" stroke="#797c71" strokeWidth="0.5" opacity="0.6" />
                    {/* Orta çizgi - beyaz kesik */}
                    <line x1="2" y1="24" x2="52" y2="6" stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" strokeDasharray="3,2" />
                    {/* İkincil yol izi */}
                    <line x1="0" y1="6" x2="50" y2="6" stroke="#505349" strokeWidth="2" opacity="0.5" />
                    {/* Arazi dokusu gölge */}
                    <rect x="0" y="28" width="30" height="10" fill="#3a3d35" opacity="0.4" />
                  </svg>
                  <span>Uydu</span>
                </button>
              </div>

            )}
            <button
              className={`katmanlar-toggle-btn ${isLayerPanelOpen ? 'open' : ''}`}
              onClick={() => setIsLayerPanelOpen(prev => !prev)}
              title="Katmanlar"
            >
              <Layers size={22} />
              <span>Katmanlar</span>
            </button>
          </div>
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