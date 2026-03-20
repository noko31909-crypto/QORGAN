import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Colors } from '../theme';

export const WelcomeScreen = ({ navigation }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Security</Text>
    <Image
      style={styles.hero}
      resizeMode="contain"
      source={{ uri: 'https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=900&auto=format&fit=crop' }}
    />
    <Text style={styles.subtitle}>Easy and safe for your School</Text>
    <Pressable style={[styles.button, styles.primary]} onPress={() => navigation.navigate('Register')}>
      <Text style={styles.primaryText}>Create a new account</Text>
    </Pressable>
    <Pressable style={[styles.button, styles.secondary]} onPress={() => navigation.navigate('Login')}>
      <Text style={styles.secondaryText}>Log in</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 80, backgroundColor: Colors.surface },
  title: { fontSize: 42, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  hero: { width: '100%', height: 260, marginTop: 14 },
  subtitle: { color: '#444', textAlign: 'center', marginTop: 8, marginBottom: 30, fontWeight: '600' },
  button: { paddingVertical: 16, borderRadius: 14, marginBottom: 12, alignItems: 'center' },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: '#FFFFFF', borderWidth: 1.3, borderColor: Colors.primary },
  primaryText: { color: 'white', fontWeight: '700' },
  secondaryText: { color: Colors.primary, fontWeight: '700' },
});
