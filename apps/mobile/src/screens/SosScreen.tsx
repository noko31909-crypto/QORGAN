import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

export const SosScreen = () => {
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      let coords: any = null;
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        coords = loc.coords;
      }

      await api.sendSOS({
        description: 'SOS Alert',
        location: 'Mobile App',
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      Alert.alert('SOS sent', 'Emergency alert has been sent.');
    } catch (e: any) {
      Alert.alert('SOS failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="SOS">
      <View style={styles.container}>
        <Text style={styles.tip}>We are always here in case of emergency{'\n'}Tap to initiate protocol</Text>
        <Pressable style={styles.button} onPress={send} disabled={loading}>
          <Text style={styles.text}>{loading ? 'Sending...' : 'SOS'}</Text>
        </Pressable>
        <View style={styles.row}>
          <View style={styles.card}><Text style={styles.cardTitle}>Location{'\n'}Sharing</Text></View>
          <View style={styles.card}><Text style={styles.cardTitle}>Device{'\n'}Geofencing</Text></View>
          <View style={styles.card}><Text style={styles.cardTitle}>Inactivity{'\n'}Tracking</Text></View>
        </View>
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 18 },
  tip: { color: '#C4B93A', textAlign: 'center', marginVertical: 26, fontWeight: '600' },
  button: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.danger,
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  text: { color: 'white', fontSize: 36, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 10, marginTop: 26 },
  card: { backgroundColor: Colors.primary, padding: 10, borderRadius: 10, width: 102, minHeight: 72, justifyContent: 'center' },
  cardTitle: { color: '#fff', fontWeight: '600', fontSize: 12, textAlign: 'center' },
});
