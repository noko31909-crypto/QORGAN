import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { ScreenShell } from '../components/ScreenShell';
import { Toggle } from '../components/Toggle';
import { Colors, Radius } from '../theme';

export const SosScreen = () => {
  const [sending, setSending] = useState(false);
  const [locationShare, setLocationShare] = useState(false);
  const [deviceEmergency, setDeviceEmergency] = useState(true);
  const [instantlyHelping, setInstantlyHelping] = useState(true);

  const send = () => {
    Alert.alert(
      'Send SOS Alert?',
      'This will immediately notify all guards. Only use in a real emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setSending(true);
            try {
              let coords: any = null;
              if (locationShare) {
                const perm = await Location.requestForegroundPermissionsAsync();
                if (perm.status === 'granted') {
                  const loc = await Location.getCurrentPositionAsync({});
                  coords = loc.coords;
                }
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
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenShell title="SOS">
      <View style={styles.container}>
        <Text style={styles.tip}>
          We are always here in case of emergencies!{'\n'}Tap to initiate emergency protocol!
        </Text>

        <View style={styles.buttonWrap}>
          <Pressable style={styles.button} onPress={send} disabled={sending}>
            <View style={styles.innerButton}>
              <Ionicons name="radio" size={48} color={Colors.white} />
            </View>
          </Pressable>
        </View>

        <View style={styles.card}>
          <ToggleRow
            icon="location"
            label="Location sharing"
            value={locationShare}
            onChange={setLocationShare}
          />
          <ToggleRow
            icon="phone-portrait"
            label="Device emergency"
            value={deviceEmergency}
            onChange={setDeviceEmergency}
          />
          <ToggleRow
            icon="flash"
            label="Instantly helping"
            value={instantlyHelping}
            onChange={setInstantlyHelping}
          />

          <View style={styles.callRow}>
            <Pressable style={[styles.callBtn, { backgroundColor: Colors.success }]} onPress={() => Linking.openURL('tel:103')}>
              <Ionicons name="medkit" size={22} color={Colors.text} />
              <Text style={styles.callLabel}>Ambulance: 103</Text>
            </Pressable>
            <Pressable style={[styles.callBtn, { backgroundColor: Colors.info }]} onPress={() => Linking.openURL('tel:102')}>
              <Ionicons name="shield" size={22} color={Colors.text} />
              <Text style={styles.callLabel}>Police: 102</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenShell>
  );
};

const ToggleRow = ({
  icon,
  label,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <View style={styles.toggleRow}>
    <Ionicons name={icon} size={22} color={Colors.text} />
    <Text style={styles.toggleLabel}>{label}</Text>
    <Toggle value={value} onChange={onChange} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 18, alignItems: 'center' },
  tip: {
    color: Colors.accentDark,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  buttonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  button: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: Colors.dangerDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.danger,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  innerButton: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: 16,
    marginTop: 10,
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  toggleLabel: { flex: 1, color: Colors.white, fontWeight: '600', fontSize: 14 },
  callRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  callBtn: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callLabel: { color: Colors.text, fontWeight: '700', fontSize: 14 },
});
