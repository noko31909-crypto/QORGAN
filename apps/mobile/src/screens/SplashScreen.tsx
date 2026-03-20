import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';

export const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Welcome'), 1500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Qorgan</Text>
      <Text style={styles.sub}>School safety in real-time</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary },
  logo: { color: '#fff', fontSize: 42, fontWeight: '800' },
  sub: { color: '#EFE4FF', marginTop: 10 },
});
