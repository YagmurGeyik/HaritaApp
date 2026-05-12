import React, { useState, useEffect } from 'react';
import { Trash2, GripVertical, Check, X, Edit2 } from 'lucide-react';
import { routeStopService } from '../services/routeStopService';
import { stopService } from '../services/stopService';

const RouteStopEditor = ({ route, allStops, notify, onUpdate }) => {
  const [routeStops, setRouteStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [editingStopId, setEditingStopId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchRouteStops();
  }, [route.id]);

  const fetchRouteStops = async () => {
    setLoading(true);
    try {
      const data = await routeStopService.getRouteStops(route.id);
      setRouteStops(data);
    } catch (e) {
      console.error("Duraklar yüklenemedi", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const newStops = [...routeStops];
    const [movedItem] = newStops.splice(draggedIdx, 1);
    newStops.splice(targetIdx, 0, movedItem);

    const updatedStops = newStops.map((s, idx) => ({ ...s, orderIndex: idx }));
    setRouteStops(updatedStops);
    setDraggedIdx(null);

    try {
      const reorderPayload = updatedStops.map(s => ({ stopId: s.stopId, orderIndex: s.orderIndex }));
      await routeStopService.reorderStops(route.id, reorderPayload);
      if (onUpdate) onUpdate();
    } catch (err) {
      notify("Hata", "Sıralama kaydedilemedi.", "info");
      fetchRouteStops();
    }
  };

  const handleRemoveStop = async (stopId) => {
    try {
      await routeStopService.removeStopFromRoute(route.id, stopId);
      await fetchRouteStops();
      if (onUpdate) onUpdate();
    } catch (err) {
      notify("Hata", "Durak kaldırılamadı.", "info");
    }
  };

  const startEdit = (rs) => {
    setEditingStopId(rs.stopId);
    setEditingName(rs.name);
  };

  const cancelEdit = () => {
    setEditingStopId(null);
    setEditingName('');
  };

  const saveEdit = async (rs) => {
    const newName = editingName.trim();
    if (!newName || newName === rs.name) {
      cancelEdit();
      return;
    }
    try {
      await stopService.update(rs.stopId, {
        id: rs.stopId,
        name: newName,
        longitude: rs.longitude,
        latitude: rs.latitude,
      });
      await fetchRouteStops();
      if (onUpdate) onUpdate();
      cancelEdit();
    } catch (err) {
      notify("Hata", "İsim kaydedilemedi.", "info");
    }
  };

  if (loading) return <div style={{ padding: '10px', color: '#94a3b8' }}>Duraklar yükleniyor...</div>;

  return (
    <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
      <h5 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '0.85rem' }}>Güzergah Durakları</h5>

      {routeStops.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Bu güzergahta durak yok.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {routeStops.map((rs, index) => (
            <div
              key={rs.stopId}
              draggable={editingStopId !== rs.stopId}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)',
                padding: '6px', borderRadius: '6px', fontSize: '0.8rem',
                border: editingStopId === rs.stopId
                  ? '1px solid rgba(59,130,246,0.5)'
                  : '1px solid rgba(255,255,255,0.05)',
                opacity: draggedIdx === index ? 0.5 : 1,
                cursor: editingStopId === rs.stopId ? 'default' : 'grab',
                transition: 'border 0.15s'
              }}
            >
              <GripVertical size={14} style={{ color: '#64748b', marginRight: '6px', flexShrink: 0 }} />
              <span style={{ fontWeight: 'bold', marginRight: '6px', color: '#f59e0b', minWidth: '16px' }}>
                {index + 1}
              </span>

              {editingStopId === rs.stopId ? (
                /* Düzenleme modu */
                <>
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(rs);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.08)', border: 'none', outline: 'none',
                      color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '0.8rem'
                    }}
                  />
                  <button
                    onClick={() => saveEdit(rs)}
                    style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px 4px' }}
                    title="Kaydet"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px' }}
                    title="İptal"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                /* Normal görünüm */
                <>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rs.name}
                  </span>
                  <button
                    onClick={() => startEdit(rs)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px 4px' }}
                    title="İsmi Düzenle"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleRemoveStop(rs.stopId)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                    title="Kaldır"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RouteStopEditor;
