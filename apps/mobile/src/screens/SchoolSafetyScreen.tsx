import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { api } from '../services/api';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

export const SchoolSafetyScreen = () => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [errorText, setErrorText] = useState('');

  const load = useCallback(async () => {
    try {
      const [cams, inc] = await Promise.all([api.getCameras(), api.getIncidents()]);
      setCameras(cams);
      setIncidents(inc);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load safety data.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScreenShell title="School Safety">
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        {!!errorText && <Text style={styles.error}>{errorText}</Text>}
        <View style={styles.preview} />
        <View style={styles.alert}><Text style={styles.alertText}>CCTV captured {incidents.length || 0} unknown persons.</Text></View>
        <View style={styles.alert}><Text style={styles.alertText}>Room 8 door and window open.</Text></View>
        <Text style={styles.section}>Active Cameras: {cameras.length}</Text>
        {cameras.map((cam) => <Text key={cam.id} style={styles.item}>• {cam.name} ({cam.location})</Text>)}
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn}><Text style={styles.actionText}>Ambulance: 911</Text></Pressable>
          <Pressable style={styles.actionBtn}><Text style={styles.actionText}>Police: 100</Text></Pressable>
        </View>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  preview: { height: 130, backgroundColor: '#DDD', borderRadius: 10, marginBottom: 10 },
  alert: { backgroundColor: Colors.primary, borderRadius: 10, padding: 12, marginBottom: 8 },
  alertText: { color: '#fff', fontWeight: '600' },
  section: { color: Colors.text, fontWeight: '700', marginVertical: 8 },
  error: { color: '#B00020', marginBottom: 8, fontWeight: '600' },
  item: { color: '#4A4A56', marginBottom: 4 },
  actions: { marginTop: 14, gap: 8 },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 12 },
  actionText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
