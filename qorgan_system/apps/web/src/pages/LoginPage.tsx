import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';

export const LoginPage = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('SCH-1234');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const onLogin = async () => {
    if (submitting) return;
    const value = identifier.trim();
    if (!value || !password.trim()) {
      setErrorText('Enter login and password.');
      return;
    }

    setSubmitting(true);
    setErrorText('');
    try {
      const payload: { email?: string; phone?: string; password: string; school_code: string } = {
        password,
        school_code: schoolCode,
      };
      if (value.includes('@')) {
        payload.email = value;
      } else {
        payload.phone = value;
      }
      await login(payload);
    } catch (e: any) {
      setErrorText(e?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ height: '100%', padding: 18, background: Colors.surface }}>
      <h1 style={{ fontSize: 42, color: Colors.primary, fontWeight: 800, margin: '0 0 18px' }}>Log in</h1>

      <label style={labelStyle}>Email or Phone Number</label>
      <input
        placeholder="Email / Phone Number"
        autoCapitalize="none"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Password</label>
      <input
        placeholder="Minimum 8 characters"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>School code</label>
      <input
        placeholder="SCH-1234"
        value={schoolCode}
        onChange={(e) => setSchoolCode(e.target.value)}
        style={inputStyle}
      />

      {errorText && <p style={{ color: '#B00020', fontWeight: 600, margin: '4px 0 8px' }}>{errorText}</p>}

      <button
        onClick={onLogin}
        disabled={submitting}
        style={{
          width: '100%',
          padding: 15,
          borderRadius: 12,
          border: 'none',
          background: Colors.primary,
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          marginTop: 14,
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? 'Signing in...' : 'Log in'}
      </button>

      <p
        onClick={() => alert('Contact your school administrator to reset your password.')}
        style={{ color: Colors.primary, textAlign: 'center', marginTop: 14, textDecoration: 'underline', cursor: 'pointer' }}
      >
        Forgot password?
      </p>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', color: '#444', fontWeight: 600, marginBottom: 6, marginTop: 6 };
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#F3F3F6',
  color: '#1F1F25',
  borderRadius: 12,
  padding: 13,
  border: 'none',
  marginBottom: 8,
  fontSize: 14,
  boxSizing: 'border-box',
};
