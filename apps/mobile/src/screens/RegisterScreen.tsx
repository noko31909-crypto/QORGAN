import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';

export const RegisterScreen = () => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.input} placeholderTextColor={Colors.muted} />
      <Text style={styles.label}>Phone Number</Text>
      <TextInput placeholder="(996) 555 22 44 55" autoCapitalize="none" value={phone} onChangeText={setPhone} style={styles.input} placeholderTextColor={Colors.muted} />
      <Text style={styles.label}>Password</Text>
      <TextInput placeholder="********" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} placeholderTextColor={Colors.muted} />
      <Text style={styles.label}>School code</Text>
      <TextInput placeholder="SCH-1234" value={schoolCode} onChangeText={setSchoolCode} style={styles.input} placeholderTextColor={Colors.muted} />
      <Text style={styles.label}>Role</Text>
      <View style={styles.row}>
        <Pressable style={[styles.pill, role === 'guard' && styles.pillActive]} onPress={() => setRole('guard')}><Text style={styles.pillText}>Guard</Text></Pressable>
        <Pressable style={[styles.pill, role === 'student' && styles.pillActive]} onPress={() => setRole('student')}><Text style={styles.pillText}>Student</Text></Pressable>
      </View>
      {!!errorText && <Text style={styles.error}>{errorText}</Text>}
      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onRegister} disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Creating account...' : 'Create account'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: Colors.surface },
  title: { fontSize: 36, color: Colors.primary, fontWeight: '800', marginBottom: 14 },
  label: { color: '#444', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#F3F3F6', color: Colors.text, borderRadius: 12, padding: 13, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EEEAF7' },
  pillActive: { backgroundColor: Colors.primary },
  pillText: { color: '#2A2438', fontWeight: '600' },
  error: { color: '#B00020', marginBottom: 8, fontWeight: '600' },
  button: { backgroundColor: Colors.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700' },
});
