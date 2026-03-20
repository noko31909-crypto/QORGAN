import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, RefreshControl, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { api } from '../services/api';
import { ScreenShell } from '../components/ScreenShell';
import { Incident, IncidentNote } from '../types';
import { Colors } from '../theme';

export const SchoolSafetyScreen = () => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');
  const [noteByIncident, setNoteByIncident] = useState<Record<number, string>>({});
  const [notesByIncident, setNotesByIncident] = useState<Record<number, IncidentNote[]>>({});
  const [token, setToken] = useState<string>('');

  const loadToken = useCallback(async () => {
    const value = await AsyncStorage.getItem('auth_token');
    setToken(value || '');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cams, inc] = await Promise.all([api.getCameras(), api.getIncidents({ limit: 30 })]);
      setCameras(cams);
      setIncidents(inc);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load safety data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadToken(); }, [loadToken]);

  const visibleIncidents = incidents.filter((inc) => statusFilter === 'all' || (inc.status || 'new') === statusFilter);

  const updateStatus = async (incidentId: number, status: 'acknowledged' | 'resolved') => {
    setUpdatingId(incidentId);
    try {
      await api.updateIncidentStatus(incidentId, status);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to update incident status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const loadNotes = async (incidentId: number) => {
    try {
      const notes = await api.getIncidentNotes(incidentId);
      setNotesByIncident((prev) => ({ ...prev, [incidentId]: notes }));
    } catch {
      // non-critical panel
    }
  };

  const saveNote = async (incidentId: number) => {
    const note = (noteByIncident[incidentId] || '').trim();
    if (!note) return;
    setUpdatingId(incidentId);
    try {
      await api.addIncidentNote(incidentId, note);
      setNoteByIncident((prev) => ({ ...prev, [incidentId]: '' }));
      await loadNotes(incidentId);
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to add note.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleFalsePositive = async (incidentId: number, current: boolean) => {
    setUpdatingId(incidentId);
    try {
      await api.setFalsePositive(incidentId, !current);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to update false-positive flag.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ScreenShell title="School Safety">
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {!!errorText && <Text style={styles.error}>{errorText}</Text>}
        <View style={styles.previewWrap}>
          {token ? (
            <WebView
              source={{ uri: `http://YOUR_IP:5001/api/video-feed/1?token=${token}` }}
              style={styles.preview}
              originWhitelist={['*']}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
            />
          ) : (
            <View style={styles.previewFallback}>
              <Text style={styles.previewText}>Login required to load camera feed.</Text>
            </View>
          )}
        </View>
        <View style={styles.filterRow}>
          {['all', 'new', 'acknowledged', 'resolved'].map((s) => (
            <Pressable key={s} style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]} onPress={() => setStatusFilter(s as any)}>
              <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>Active Cameras: {cameras.length}</Text>
        {cameras.map((cam) => <Text key={cam.id} style={styles.item}>• {cam.name} ({cam.location})</Text>)}
        <Text style={styles.section}>Incidents ({visibleIncidents.length})</Text>
        {visibleIncidents.length === 0 && <Text style={styles.item}>No incidents for selected filter.</Text>}
        {visibleIncidents.map((inc) => (
          <View key={inc.id} style={styles.incidentCard}>
            <Text style={styles.incidentTitle}>{inc.type.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.item}>{inc.description || 'No description'}</Text>
            <Text style={styles.item}>Location: {inc.location || 'Unknown'}</Text>
            <Text style={styles.item}>Status: {inc.status || 'new'}</Text>
            <Text style={styles.item}>False positive: {inc.is_false_positive ? 'yes' : 'no'}</Text>
            <View style={styles.actionsInline}>
              <Pressable
                style={[styles.smallBtn, updatingId === inc.id && styles.disabledBtn]}
                onPress={() => updateStatus(inc.id, 'acknowledged')}
                disabled={updatingId === inc.id}
              >
                <Text style={styles.smallBtnText}>Acknowledge</Text>
              </Pressable>
              <Pressable
                style={[styles.smallBtn, styles.resolveBtn, updatingId === inc.id && styles.disabledBtn]}
                onPress={() => updateStatus(inc.id, 'resolved')}
                disabled={updatingId === inc.id}
              >
                <Text style={styles.smallBtnText}>Resolve</Text>
              </Pressable>
              <Pressable
                style={[styles.smallBtn, styles.fpBtn, updatingId === inc.id && styles.disabledBtn]}
                onPress={() => toggleFalsePositive(inc.id, Boolean(inc.is_false_positive))}
                disabled={updatingId === inc.id}
              >
                <Text style={styles.smallBtnText}>{inc.is_false_positive ? 'Unflag FP' : 'Mark FP'}</Text>
              </Pressable>
              <Pressable
                style={[styles.smallBtn, styles.noteBtn]}
                onPress={() => loadNotes(inc.id)}
              >
                <Text style={styles.smallBtnText}>Timeline</Text>
              </Pressable>
            </View>
            <TextInput
              value={noteByIncident[inc.id] || ''}
              onChangeText={(value) => setNoteByIncident((prev) => ({ ...prev, [inc.id]: value }))}
              placeholder="Guard note (what happened, action taken)"
              style={styles.noteInput}
              placeholderTextColor={Colors.muted}
            />
            <Pressable style={[styles.smallBtn, styles.noteSaveBtn]} onPress={() => saveNote(inc.id)}>
              <Text style={styles.smallBtnText}>Add Note</Text>
            </Pressable>
            {(notesByIncident[inc.id] || []).slice(-3).map((n) => (
              <Text key={n.id} style={styles.noteRow}>• {n.note}</Text>
            ))}
          </View>
        ))}
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
  previewWrap: { height: 220, borderRadius: 10, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  preview: { flex: 1, backgroundColor: '#DDD' },
  previewFallback: { flex: 1, backgroundColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  previewText: { color: '#4A4A56', fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#EEEAF7' },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { color: '#2A2438', fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: '#fff' },
  section: { color: Colors.text, fontWeight: '700', marginVertical: 8 },
  error: { color: '#B00020', marginBottom: 8, fontWeight: '600' },
  item: { color: '#4A4A56', marginBottom: 4 },
  incidentCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  incidentTitle: { color: Colors.primary, fontWeight: '800', marginBottom: 4 },
  actionsInline: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  resolveBtn: { backgroundColor: '#2F855A' },
  fpBtn: { backgroundColor: '#B45309' },
  noteBtn: { backgroundColor: '#1D4ED8' },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  noteInput: { backgroundColor: '#F8F7FC', borderColor: Colors.border, borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 6, color: Colors.text },
  noteSaveBtn: { alignSelf: 'flex-start' },
  noteRow: { color: '#3F3D56', fontSize: 12, marginTop: 4 },
  disabledBtn: { opacity: 0.55 },
  actions: { marginTop: 14, gap: 8 },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 12 },
  actionText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
