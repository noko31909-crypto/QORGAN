import { useCallback, useEffect, useState } from 'react';
import { useThreat } from '../context/ThreatContext';
import { ScreenShell } from '../components/ScreenShell';
import { api } from '../services/api';
import { Incident } from '../types';
import { Colors } from '../theme';
import { socketService } from '../services/socket';

export const MapPage = () => {
  const { threat } = useThreat();
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);
  const [errorText, setErrorText] = useState('');

  const load = useCallback(async () => {
    try {
      const incidents = await api.getIncidents({ limit: 1 });
      setLatestIncident(incidents?.[0] || null);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load map alerts.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = socketService.onWeaponAlert(() => { load(); });
    return unsub;
  }, [load]);

  return (
    <ScreenShell title="Map">
      <div style={{ padding: 16 }}>
        {errorText && <p style={{ color: '#B00020', fontWeight: 600 }}>{errorText}</p>}

        <div style={{
          height: 280,
          borderRadius: 12,
          background: '#fff',
          border: `1px solid ${Colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <p style={{ color: Colors.primary, fontWeight: 800, fontSize: 16, marginBottom: 10 }}>School Safety Map</p>
          <p style={{ color: Colors.muted, fontWeight: 600, textAlign: 'center', lineHeight: '22px', margin: 0 }}>
            Main entrance &nbsp;&bull;&nbsp; East corridor exit<br />
            Gym exit &nbsp;&bull;&nbsp; Back gate
          </p>
          {threat && (
            <p style={{ color: '#B91C1C', fontWeight: 700, marginTop: 12, textAlign: 'center' }}>
              Warning: Active threat: {threat.location || 'Unknown location'}
            </p>
          )}
        </div>

        <button
          onClick={() => alert('Emergency Exits:\n\n\u2022 Main entrance (front)\n\u2022 East corridor exit\n\u2022 Gym exit (south)\n\u2022 Back gate (staff only)\n\nMove away from the building and wait for guard instructions.')}
          style={{
            width: '100%',
            background: Colors.primary,
            borderRadius: 10,
            padding: 12,
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 14,
            fontSize: 14,
          }}
        >
          Free exits
        </button>

        <div style={{ marginTop: 10, background: Colors.primary, borderRadius: 10, padding: 12 }}>
          <p style={{ color: '#fff', fontSize: 12, margin: 0 }}>
            Latest incident: {latestIncident ? `${latestIncident.type.replace('_', ' ')} at ${latestIncident.location || 'Unknown'}` : 'No incidents'}
          </p>
        </div>

        {threat && (
          <div style={{ marginTop: 10, background: '#B91C1C', padding: 12, borderRadius: 8 }}>
            <p style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Danger: {threat.location || 'Unknown location'}</p>
          </div>
        )}
      </div>
    </ScreenShell>
  );
};
