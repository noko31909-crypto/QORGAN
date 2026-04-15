import { useLocation, useNavigate } from 'react-router-dom';
import { Colors } from '../theme';

const tabs = [
  { path: '/safety', label: 'Safety', icon: '🛡️' },
  { path: '/home', label: 'Live', icon: '📊' },
  { path: '/sos', label: 'SOS', icon: '🚨' },
  { path: '/first-aid', label: 'Medic', icon: '🏥' },
  { path: '/notifications', label: 'Alerts', icon: '🔔' },
  { path: '/map', label: 'Map', icon: '🗺️' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex',
      height: 62,
      background: '#fff',
      borderTop: '1px solid ' + Colors.border,
      flexShrink: 0,
    }}>
      {tabs.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? Colors.accent : '#4B4B55',
              fontWeight: 700,
              fontSize: 10,
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
