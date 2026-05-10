import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';

export const RegisterPage = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('SCH-1234');
  const [role, setRole] = useState<'guard' | 'student'>('guard');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const onRegister = async () => {
    if (submitting) return;
    if ((!email.trim() && !phone.trim()) || !password.trim() || !schoolCode.trim()) {
      setErrorText('Fill email or phone, password and school code.');
      return;
    }
    setSubmitting(true);
    setErrorText('');
    try {
      await register({
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        school_code: schoolCode,
        role,
      });
    } catch (e: any) {
      setErrorText(e?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ height: '100%', padding: 18, background: Colors.surface, overflow: 'auto' }}>
      <h1 style={{ fontSize: 36, color: Colors.primary, fontWeight: 800, margin: '0 0 14px' }}>Create an account</h1>

      <label style={labelStyle}>Email</label>
      <input placeholder="Email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Phone Number</label>
      <input placeholder="(996) 555 22 44 55" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Password</label>
      <input placeholder="********" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

      <label style={labelStyle}>School code</label>
      <input placeholder="SCH-1234" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Role</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['guard', 'student'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            style={{
              padding: '10px 16px',
              borderRadius: 20,
              border: 'none',
              background: role === r ? Colors.primary : '#EEEAF7',
              color: role === r ? '#fff' : '#2A2438',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {errorText && <p style={{ color: '#B00020', fontWeight: 600, margin: '0 0 8px' }}>{errorText}</p>}

      <button
        onClick={onRegister}
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
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? 'Creating account...' : 'Create account'}
      </button>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', color: '#444', fontWeight: 600, marginBottom: 6 };
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#F3F3F6',
  color: '#1F1F25',
  borderRadius: 12,
  padding: 13,
  border: 'none',
  marginBottom: 10,
  fontSize: 14,
  boxSizing: 'border-box',
};
