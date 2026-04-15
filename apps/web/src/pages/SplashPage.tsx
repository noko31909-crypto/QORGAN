import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Colors } from '../theme';

export const SplashPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/welcome', { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: Colors.primary,
    }}>
      <span style={{ color: '#fff', fontSize: 42, fontWeight: 800 }}>Qorgan</span>
      <span style={{ color: '#EFE4FF', marginTop: 10 }}>School safety in real-time</span>
    </div>
  );
};
