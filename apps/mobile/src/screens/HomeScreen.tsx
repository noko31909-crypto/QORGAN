import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ScreenShell } from '../components/ScreenShell';
import { api } from '../services/api';
import { DetectionStatus, Incident, MetricsSummary, MetricsTrendPoint } from '../types';
import { Colors } from '../theme';

export const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus | null>(null);
  const [trends, setTrends] = useState<MetricsTrendPoint[]>([]);
  const [errorText, setErrorText] = useState('');

  const load = useCallback(async () => {
    try {
      const [summaryData, incidents, detection, trendData] = await Promise.all([
        api.getMetricsSummary(),
        api.getIncidents({ limit: 1 }),
        api.getDetectionStatus(),
        api.getMetricsTrends(7),
      ]);
      setSummary(summaryData);
      setLatestIncident(incidents?.[0] || null);
      setDetectionStatus(detection);
      setTrends(trendData?.series || []);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load dashboard.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScreenShell title="School Safety">
      <View style={styles.container}>
        <Text style={styles.subtitle}>Guard mode: {user?.role}</Text>
        {!!errorText && <Text style={styles.error}>{errorText}</Text>}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary?.incidents.open ?? '-'}</Text>
            <Text style={styles.statLabel}>Open incidents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary?.notifications.unread ?? '-'}</Text>
            <Text style={styles.statLabel}>Unread alerts</Text>
          </View>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Detection service</Text>
          <Text style={styles.statusText}>
            {detectionStatus
              ? `${detectionStatus.enabled ? 'Enabled' : 'Disabled'} • ${detectionStatus.is_running ? 'Running' : 'Idle'}`
              : 'Loading...'}
          </Text>
          {!!summary && (
            <Text style={styles.statusText}>
              False positive rate: {summary.incidents.false_positive_rate_pct}%
            </Text>
          )}
          {!!latestIncident && (
            <Text style={styles.statusText}>
              Last event: {latestIncident.type} at {latestIncident.location || 'Unknown'}
            </Text>
          )}
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Weekly detection trend</Text>
          {trends.length === 0 ? (
            <Text style={styles.statusText}>No trend data yet.</Text>
          ) : (
            trends.map((point) => (
              <Text key={point.date} style={styles.statusText}>
                {point.date}: {point.total_detections} detections ({point.false_positives} FP)
              </Text>
            ))
          )}
        </View>
        {user?.role === 'guard' && (
          <Pressable style={styles.card} onPress={() => navigation.navigate('SchoolSafety')}><Text style={styles.cardText}>CCTV and school dashboard</Text></Pressable>
        )}
        <Pressable style={styles.card} onPress={() => navigation.navigate('FirstAid')}><Text style={styles.cardText}>First Aid guides</Text></Pressable>
        <Pressable style={styles.card} onPress={() => navigation.navigate('Lessons')}><Text style={styles.cardText}>Lessons and emergency training</Text></Pressable>
        <Pressable style={styles.alert} onPress={logout}><Text style={styles.cardText}>Log out</Text></Pressable>
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  subtitle: { color: Colors.muted, marginBottom: 14, fontWeight: '600' },
  error: { color: '#B00020', marginBottom: 8, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  statValue: { color: Colors.primary, fontWeight: '800', fontSize: 24 },
  statLabel: { color: Colors.muted, marginTop: 2, fontSize: 12, fontWeight: '600' },
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  statusTitle: { color: Colors.text, fontWeight: '700', marginBottom: 2 },
  statusText: { color: '#4A4A56', fontSize: 12 },
  card: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, marginBottom: 10 },
  alert: { backgroundColor: '#9155C4', padding: 16, borderRadius: 12, marginTop: 14 },
  cardText: { color: '#fff', fontWeight: '700' },
});
