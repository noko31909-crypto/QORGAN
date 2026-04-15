import { useState } from 'react';
import { api } from '../services/api';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

export const SosPage = () => {
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!confirm('This will immediately notify all guards. Only use in a real emergency.\n\nSend SOS?')) return;

    setLoading(true);
    try {
      let coords: { latitude?: number; longitude?: number } = {};
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch {
          // location permission denied — send without coords
        }
      }
      await api.sendSOS({
        description: 'SOS Alert',
        location: 'Web App',
        ...coords,
      });
      alert('SOS sent! Emergency alert has been sent to all guards.');
    } catch (e: any) {
      alert('SOS failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="SOS">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 18 }}>
        <p style={{ color: '#C4B93A', textAlign: 'center', margin: '26px 0', fontWeight: 600 }}>
          We are always here in case of emergency<br />Tap to initiate protocol
        </p>

        <button
          onClick={send}
          disabled={loading}
          style={{
            width: 170,
            height: 170,
            borderRadius: '50%',
            background: Colors.danger,
            border: 'none',
            color: '#fff',
            fontSize: 36,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: `0 0 40px ${Colors.danger}80`,
            transition: 'transform 0.1s',
          }}
        >
          {loading ? '...' : 'SOS'}
        </button>

        <p style={{ color: '#C4B93A', textAlign: 'center', marginTop: 24, fontSize: 14, lineHeight: '22px', padding: '0 20px' }}>
          Your GPS coordinates are sent automatically with the SOS alert.<br />
          All guards are notified instantly via live alert.
        </p>
      </div>
    </ScreenShell>
  );
};
