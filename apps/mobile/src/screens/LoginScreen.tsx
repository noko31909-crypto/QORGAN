import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';

export const LoginScreen = () => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.label}>Email or Phone Number</Text>
      <TextInput placeholder="Email / Phone Number" autoCapitalize="none" value={identifier} onChangeText={setIdentifier} style={styles.input} placeholderTextColor={Colors.muted} />
      <Text style={styles.label}>Password</Text>
      <TextInput placeholder="Minimum 8 characters" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} placeholderTextColor={Colors.muted} />
      <Text style={styles.label}>School code</Text>
      <TextInput placeholder="SCH-1234" value={schoolCode} onChangeText={setSchoolCode} style={styles.input} placeholderTextColor={Colors.muted} />
      {!!errorText && <Text style={styles.error}>{errorText}</Text>}
      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onLogin} disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Signing in...' : 'Log in'}</Text>
      </Pressable>
      <Text style={styles.forgot}>Forgot password?</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: Colors.surface },
  title: { fontSize: 42, color: Colors.primary, fontWeight: '800', marginBottom: 18 },
  label: { color: '#444', fontWeight: '600', marginBottom: 6, marginTop: 6 },
  input: { backgroundColor: '#F3F3F6', color: Colors.text, borderRadius: 12, padding: 13, marginBottom: 8 },
  error: { color: '#B00020', marginTop: 4, marginBottom: 8, fontWeight: '600' },
  button: { backgroundColor: Colors.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  buttonDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700' },
  forgot: { color: Colors.primary, textAlign: 'center', marginTop: 14, textDecorationLine: 'underline' },
});
