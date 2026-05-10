import { useNavigate } from 'react-router-dom';
import { Colors } from '../theme';

export const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100%',
      padding: '60px 22px 40px',
      background: Colors.surface,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <h1 style={{ fontSize: 42, fontWeight: 800, color: Colors.primary, textAlign: 'center', margin: 0 }}>
        Qorgan
      </h1>
      <img
        src="https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=900&auto=format&fit=crop"
        alt="School safety"
        style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 16, marginTop: 14 }}
      />
      <p style={{ color: '#444', textAlign: 'center', marginTop: 8, marginBottom: 30, fontWeight: 600 }}>
        Real-time school safety response
      </p>
      <button
        onClick={() => navigate('/register')}
        style={{
          width: '100%',
          padding: '16px 0',
          borderRadius: 14,
          border: 'none',
          background: Colors.primary,
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        Create a new account
      </button>
      <button
        onClick={() => navigate('/login')}
        style={{
          width: '100%',
          padding: '16px 0',
          borderRadius: 14,
          border: `1.3px solid ${Colors.primary}`,
          background: '#fff',
          color: Colors.primary,
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        Log in
      </button>
    </div>
  );
};
