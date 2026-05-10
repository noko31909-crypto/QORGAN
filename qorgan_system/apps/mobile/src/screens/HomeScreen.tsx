import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ScreenShell } from '../components/ScreenShell';
import { api } from '../services/api';
import { DetectionStatus, Incident, MetricsSummary, MetricsTrendPoint } from '../types';
import { Colors } from '../theme';
import { socketService } from '../services/socket';

export const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus | null>(null);
  const [trends, setTrends] = useState<MetricsTrendPoint[]>([]);
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const unsub = socketService.onWeaponAlert(() => {
      load();
    });
    return unsub;
  }, [load]);

  return (
    <ScreenShell title="School Safety">
      <View style={styles.container}>
        <Text style={styles.subtitle}>{user?.role === 'guard' ? 'Guard dashboard' : 'Student view'}</Text>
        {loading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 12 }} />}
        {!!errorText && <Text style={styles.error}>{errorText}</Text>}

        {user?.role === 'guard' && (
          <>
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
          </>
        )}

        {user?.role === 'student' && (
          <>
            {/* Threat status banner */}
            {!!latestIncident && latestIncident.status !== 'resolved' && (
              <View style={styles.threatBanner}>
                <Text style={styles.threatIcon}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.threatTitle}>Active alert in school</Text>
                  <Text style={styles.threatSub}>
                    {latestIncident.location || 'Location unknown'} · Stay in your room until ALL CLEAR
                  </Text>
                </View>
              </View>
            )}

            {/* What to do right now */}
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>If you see something dangerous</Text>
              <Pressable
                style={styles.actionRow}
                onPress={() => navigation.navigate('SOS')}
              >
                <Text style={styles.actionIcon}>🆘</Text>
                <View>
                  <Text style={styles.actionLabel}>Send SOS Alert</Text>
                  <Text style={styles.actionSub}>Guards are notified with your location instantly</Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.actionRow}
                onPress={() => Alert.alert(
                  'Emergency: Run · Hide · Fight',
                  'RUN if you have a safe exit.\nHIDE in a locked room, silence phone.\nFIGHT only as last resort.\n\nCall 112 when safe.',
                )}
              >
                <Text style={styles.actionIcon}>🏃</Text>
                <View>
                  <Text style={styles.actionLabel}>Run · Hide · Fight</Text>
                  <Text style={styles.actionSub}>Tap to review your immediate action steps</Text>
                </View>
              </Pressable>
            </View>

            {/* Preparedness cards */}
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Be prepared</Text>
              <Pressable style={styles.actionRow} onPress={() => navigation.navigate('Lessons')}>
                <Text style={styles.actionIcon}>📖</Text>
                <View>
                  <Text style={styles.actionLabel}>Emergency Lessons</Text>
                  <Text style={styles.actionSub}>Lockdown, evacuation, active threat response</Text>
                </View>
              </Pressable>
              <Pressable style={styles.actionRow} onPress={() => navigation.navigate('FirstAid')}>
                <Text style={styles.actionIcon}>🩹</Text>
                <View>
                  <Text style={styles.actionLabel}>First Aid Guides</Text>
                  <Text style={styles.actionSub}>CPR, bleeding, choking — step by step</Text>
                </View>
              </Pressable>
              <Pressable style={styles.actionRow} onPress={() => navigation.navigate('Map')}>
                <Text style={styles.actionIcon}>🚪</Text>
                <View>
                  <Text style={styles.actionLabel}>Emergency Exits</Text>
                  <Text style={styles.actionSub}>Know your evacuation routes before you need them</Text>
                </View>
              </Pressable>
            </View>

            {/* Emergency number */}
            <View style={[styles.statusCard, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <Text style={{ fontSize: 22 }}>📞</Text>
              <View>
                <Text style={styles.statusTitle}>Emergency: 112</Text>
                <Text style={styles.statusText}>Kazakhstan emergency services — call if in immediate danger</Text>
              </View>
            </View>
          </>
        )}

        {user?.role !== 'student' && (
          <>
            <Pressable style={styles.card} onPress={() => navigation.navigate('FirstAid')}><Text style={styles.cardText}>First Aid guides</Text></Pressable>
            <Pressable style={styles.card} onPress={() => navigation.navigate('Lessons')}><Text style={styles.cardText}>Lessons and emergency training</Text></Pressable>
          </>
        )}
        <Pressable style={styles.logoutBtn} onPress={logout}><Text style={styles.cardText}>Log out</Text></Pressable>
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
  logoutBtn: { backgroundColor: '#9155C4', padding: 16, borderRadius: 12, marginTop: 14 },
  cardText: { color: '#fff', fontWeight: '700' },
  threatBanner: {
    backgroundColor: '#E05C5C',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  threatIcon: { fontSize: 22 },
  threatTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  threatSub: { color: '#FFD0D0', fontSize: 12, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  actionSub: { color: Colors.muted, fontSize: 12, marginTop: 1 },
});
