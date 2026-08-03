import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { API_BASE_URL } from '../services/network';
import { ScreenShell } from '../components/ScreenShell';
import { Incident, IncidentNote } from '../types';
import { Colors } from '../theme';
import { timeAgo } from '../utils/time';

export const SchoolSafetyPage = () => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [cameraStatuses, setCameraStatuses] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');
  const [noteByIncident, setNoteByIncident] = useState<Record<number, string>>({});
  const [notesByIncident, setNotesByIncident] = useState<Record<number, IncidentNote[]>>({});

  const token = api.getToken();
  const streamHost = API_BASE_URL.replace(/\/api$/, '');
  const activeCamId = selectedCameraId ?? cameras[0]?.id;
  const feedUri = token && activeCamId
    ? `${streamHost}/api/video-feed/${activeCamId}?token=${encodeURIComponent(token)}`
    : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cams, status, inc] = await Promise.all([
        api.getCameras(),
        api.getCamerasStatus(),
        api.getIncidents({ limit: 30 }),
      ]);
      setCameras(cams);
      setCameraStatuses(status);
      setIncidents(inc);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load safety data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStartCamera = async (cameraId: number) => {
    try {
      await api.startCamera(cameraId);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to start camera.');
    }
  };

  const handleStopCamera = async (cameraId: number) => {
    try {
      await api.stopCamera(cameraId);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to stop camera.');
    }
  };

  const isRunning = (cameraId: number) => {
    return cameraStatuses.find((c) => c.id === cameraId)?.is_running ?? false;
  };

  const visibleIncidents = incidents.filter((inc) => statusFilter === 'all' || (inc.status || 'new') === statusFilter);

  const updateStatus = async (incidentId: number, status: 'acknowledged' | 'resolved') => {
    setUpdatingId(incidentId);
    try {
      await api.updateIncidentStatus(incidentId, status);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to update incident status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const loadNotes = async (incidentId: number) => {
    try {
      const notes = await api.getIncidentNotes(incidentId);
      setNotesByIncident((prev) => ({ ...prev, [incidentId]: notes }));
    } catch { /* non-critical */ }
  };

  const saveNote = async (incidentId: number) => {
    const note = (noteByIncident[incidentId] || '').trim();
    if (!note) return;
    setUpdatingId(incidentId);
    try {
      await api.addIncidentNote(incidentId, note);
      setNoteByIncident((prev) => ({ ...prev, [incidentId]: '' }));
      await loadNotes(incidentId);
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to add note.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleFalsePositive = async (incidentId: number, current: boolean) => {
    setUpdatingId(incidentId);
    try {
      await api.setFalsePositive(incidentId, !current);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to update false-positive flag.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ScreenShell title="School Safety">
      <div style={{ padding: 16, overflow: 'auto' }}>
        {errorText && <p style={{ color: '#B00020', fontWeight: 600 }}>{errorText}</p>}

        {/* Camera selector */}
        <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ color: Colors.text, fontWeight: 700, fontSize: 13, marginRight: 4 }}>Cameras:</span>
          {cameras.map((cam: any) => {
            const running = isRunning(cam.id);
            const isSelected = activeCamId === cam.id;
            return (
              <div key={cam.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setSelectedCameraId(cam.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: isSelected ? '2px solid #2F855A' : '1px solid #DDD',
                    background: isSelected ? '#C6F6D5' : '#FFF',
                    color: Colors.text,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {cam.name}
                </button>
                <button
                  onClick={() => running ? handleStopCamera(cam.id) : handleStartCamera(cam.id)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: running ? '#E53E3E' : '#38A169',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {running ? 'Stop' : 'Start'}
                </button>
                <span style={{ fontSize: 11, color: running ? '#E53E3E' : '#A0AEC0' }}>
                  {running ? '● ON' : '○ OFF'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Camera feed */}
        <div style={{
          height: 280,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 10,
          border: `1px solid ${Colors.border}`,
        }}>
          {feedUri ? (
            <img src={feedUri} alt="Camera feed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              height: '100%',
              background: '#DDD',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <span style={{ color: '#4A4A56', fontWeight: 600 }}>
                {token ? 'Select a camera and press Start to monitor.' : 'Login required to load camera feed.'}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          {(['all', 'new', 'acknowledged', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 10px',
                borderRadius: 16,
                border: 'none',
                background: statusFilter === s ? Colors.primary : '#EEEAF7',
                color: statusFilter === s ? '#fff' : '#2A2438',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <p style={{ color: Colors.text, fontWeight: 700, margin: '8px 0' }}>
          Active Cameras: {cameras.filter((c) => isRunning(c.id)).length} / {cameras.length}
        </p>

        <p style={{ color: Colors.text, fontWeight: 700, margin: '8px 0' }}>Incidents ({visibleIncidents.length})</p>
        {visibleIncidents.length === 0 && <p style={{ color: '#4A4A56' }}>No incidents for selected filter.</p>}

        {visibleIncidents.map((inc) => (
          <div key={inc.id} style={incidentCard}>
            <p style={{ color: Colors.primary, fontWeight: 800, margin: '0 0 4px' }}>
              {inc.type.replace('_', ' ').toUpperCase()}
            </p>
            <p style={itemText}>{inc.description || 'No description'}</p>
            <p style={itemText}>Location: {inc.location || 'Unknown'}</p>
            <p style={itemText}>Status: {inc.status || 'new'}</p>
            <p style={itemText}>Reported: {timeAgo(inc.created_at)}</p>
            {inc.confidence != null && (
              <p style={{ ...itemText, fontWeight: 700, color: inc.confidence > 0.8 ? '#B91C1C' : '#D97706' }}>
                AI confidence: {Math.round(inc.confidence * 100)}%
              </p>
            )}
            <p style={itemText}>False positive: {inc.is_false_positive ? 'yes' : 'no'}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <button style={smallBtn} disabled={updatingId === inc.id} onClick={() => updateStatus(inc.id, 'acknowledged')}>Acknowledge</button>
              <button style={{ ...smallBtn, background: '#2F855A' }} disabled={updatingId === inc.id} onClick={() => updateStatus(inc.id, 'resolved')}>Resolve</button>
              <button style={{ ...smallBtn, background: '#B45309' }} disabled={updatingId === inc.id} onClick={() => toggleFalsePositive(inc.id, Boolean(inc.is_false_positive))}>
                {inc.is_false_positive ? 'Unflag FP' : 'Mark FP'}
              </button>
              <button style={{ ...smallBtn, background: '#1D4ED8' }} onClick={() => loadNotes(inc.id)}>Timeline</button>
            </div>

            <input
              value={noteByIncident[inc.id] || ''}
              onChange={(e) => setNoteByIncident((prev) => ({ ...prev, [inc.id]: e.target.value }))}
              placeholder="Guard note (what happened, action taken)"
              style={{
                width: '100%',
                background: '#F8F7FC',
                border: `1px solid ${Colors.border}`,
                borderRadius: 8,
                padding: 10,
                marginTop: 8,
                marginBottom: 6,
                color: Colors.text,
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
            <button style={smallBtn} onClick={() => saveNote(inc.id)}>Add Note</button>

            {(notesByIncident[inc.id] || []).slice(-3).map((n) => (
              <p key={n.id} style={{ color: '#3F3D56', fontSize: 12, margin: '4px 0 0' }}>&bull; {n.note}</p>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="tel:911" style={emergencyBtn}>Ambulance: 911</a>
          <a href="tel:100" style={emergencyBtn}>Police: 100</a>
        </div>
      </div>
    </ScreenShell>
  );
};

const incidentCard: React.CSSProperties = {
  background: '#fff', borderRadius: 10, padding: 10, marginBottom: 8,
  border: `1px solid ${Colors.border}`,
};
const itemText: React.CSSProperties = { color: '#4A4A56', margin: '0 0 4px', fontSize: 13 };
const smallBtn: React.CSSProperties = {
  background: Colors.primary, borderRadius: 8, padding: '8px 10px',
  border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
};
const emergencyBtn: React.CSSProperties = {
  background: Colors.primary, borderRadius: 10, padding: 12,
  color: '#fff', textAlign: 'center', fontWeight: 700, textDecoration: 'none', display: 'block',
};
