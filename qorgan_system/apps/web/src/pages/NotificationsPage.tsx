import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';
import { timeAgo } from '../utils/time';
import { socketService } from '../services/socket';

export const NotificationsPage = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setItems(data);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = socketService.onWeaponAlert(() => { load(); });
    return unsub;
  }, [load]);

  const onRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to update notification.');
    }
  };

  return (
    <ScreenShell title="Notifications">
      <div style={{ padding: 16 }}>
        {errorText && <p style={{ color: '#B00020', fontWeight: 600 }}>{errorText}</p>}
        {loading && <div className="spinner" style={{ margin: '20px auto' }} />}

        {items.length === 0 && !loading && (
          <p style={{ color: Colors.muted }}>No notifications</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onRead(item.id)}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
              borderBottom: `1px solid ${Colors.border}`,
              opacity: item.is_read ? 0.6 : 1,
              cursor: 'pointer',
            }}
          >
            <p style={{ color: Colors.text, fontWeight: 700, margin: '0 0 4px' }}>{item.title}</p>
            <p style={{ color: '#4A4A56', margin: 0 }}>{item.message}</p>
            <p style={{ color: Colors.muted, fontSize: 11, margin: '2px 0 0' }}>{timeAgo(item.created_at)}</p>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
};
