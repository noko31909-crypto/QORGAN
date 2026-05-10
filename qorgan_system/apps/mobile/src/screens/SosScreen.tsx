import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

export const SosScreen = () => {
  const [loading, setLoading] = useState(false);

  const send = async () => {
    Alert.alert(
      'Send SOS Alert?',
      'This will immediately notify all guards. Only use in a real emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
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
              Alert.alert('SOS sent', 'Emergency alert has been sent to all guards.');
            } catch (e: any) {
              Alert.alert('SOS failed', e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenShell title="SOS">
      <View style={styles.container}>
        <Text style={styles.tip}>We are always here in case of emergency{'\n'}Tap to initiate protocol</Text>
        <Pressable style={styles.button} onPress={send} disabled={loading}>
          <Text style={styles.text}>{loading ? 'Sending...' : 'SOS'}</Text>
        </Pressable>
        <Text style={styles.infoText}>
          Your GPS coordinates are sent automatically with the SOS alert.{'\n'}
          All guards are notified instantly via live alert.
        </Text>
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
  infoText: { color: '#C4B93A', textAlign: 'center', marginTop: 24, fontSize: 14, lineHeight: 22, paddingHorizontal: 20 },
});