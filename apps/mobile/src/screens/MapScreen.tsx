import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useThreat } from '../context/ThreatContext';
import { ScreenShell } from '../components/ScreenShell';
import { api } from '../services/api';
import { Incident } from '../types';
import { Colors } from '../theme';

const FALLBACK = { latitude: 43.238949, longitude: 76.889709 };

export const MapScreen = () => {
  const { threat } = useThreat();
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);
  const [errorText, setErrorText] = useState('');

  const load = useCallback(async () => {
    try {
      const incidents = await api.getIncidents({ limit: 1 });
      setLatestIncident(incidents?.[0] || null);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load map alerts.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mapsAvailable = Platform.OS !== 'web' && (() => {
    try {
      require('react-native-maps');
      return true;
    } catch {
      return false;
    }
  })();

  let MapViewComp: any = null;
  let MarkerComp: any = null;
  if (mapsAvailable) {
    const maps = require('react-native-maps');
    MapViewComp = maps.default;
    MarkerComp = maps.Marker;
  }

  return (
    <ScreenShell title="Map">
      <View style={styles.container}>
        {!!errorText && <Text style={styles.error}>{errorText}</Text>}
        {!mapsAvailable ? (
          <View style={styles.planPlaceholder}>
            <Text style={styles.placeholderText}>Map is unavailable on this build. Open from a native build with maps support.</Text>
          </View>
        ) : (
          <MapViewComp style={styles.map} initialRegion={{ ...FALLBACK, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
            <MarkerComp coordinate={FALLBACK} title="School" />
            {threat && <MarkerComp coordinate={FALLBACK} pinColor="red" title={threat.location || 'Threat'} description={threat.class_name} />}
          </MapViewComp>
        )}
        <Pressable style={styles.action}><Text style={styles.actionText}>Free exits</Text></Pressable>
        <View style={styles.info}>
          <Text style={styles.infoText}>
            Latest backend incident: {latestIncident ? `${latestIncident.type} at ${latestIncident.location || 'Unknown'}` : 'No incidents'}
          </Text>
        </View>
        {threat && (
          <View style={styles.banner}><Text style={styles.bannerText}>Danger: {threat.location || 'Unknown location'}</Text></View>
        )}
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  error: { color: '#B00020', marginBottom: 8, fontWeight: '600' },
  map: { height: 280, borderRadius: 12 },
  planPlaceholder: { height: 280, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: Colors.muted, fontWeight: '600' },
  action: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  actionText: { color: '#fff', fontWeight: '700' },
  info: { marginTop: 10, backgroundColor: Colors.primary, borderRadius: 10, padding: 12 },
  infoText: { color: '#fff', fontSize: 12 },
  banner: { marginTop: 10, backgroundColor: '#B91C1C', padding: 12, borderRadius: 8 },
  bannerText: { color: '#fff', fontWeight: '700' },
});
