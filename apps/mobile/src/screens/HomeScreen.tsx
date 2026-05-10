import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenShell } from '../components/ScreenShell';
import { api } from '../services/api';
import { DetectionStatus, Incident, MetricsSummary } from '../types';
import { Colors, Radius } from '../theme';
import { socketService } from '../services/socket';
import { timeAgo } from '../utils/time';
import { useAuth } from '../context/AuthContext';

export const HomeScreen = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [detection, setDetection] = useState<DetectionStatus | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, i] = await Promise.all([
        api.getMetricsSummary(),
        api.getDetectionStatus(),
        api.getIncidents({ limit: 5 }),
      ]);
      setSummary(s);
      setDetection(d);
      setIncidents(i);
    } catch {
      // tolerant
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
    const unsub = socketService.onWeaponAlert(() => load());
    return unsub;
  }, [load]);

  return (
    <ScreenShell title="Live">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={styles.subtitle}>
          {user?.role === 'guard' ? 'Guard dashboard' : 'Student live feed'}
        </Text>

        {loading && <ActivityIndicator color={Colors.primary} style={{ marginVertical: 8 }} />}

        <View style={styles.statsRow}>
          <StatCard label="Open incidents" value={summary?.incidents.open ?? '—'} />
          <StatCard label="Unread alerts" value={summary?.notifications.unread ?? '—'} />
        </View>

        <View style={styles.detectionCard}>
          <View style={styles.detectionRow}>
            <Ionicons
              name={detection?.is_running ? 'pulse' : 'pause-circle'}
              size={22}
              color={Colors.accent}
            />
            <Text style={styles.detectionTitle}>
              AI Detection · {detection?.is_running ? 'Running' : 'Idle'}
            </Text>
          </View>
          {!!summary && (
            <Text style={styles.detectionSub}>
              False-positive rate: {summary.incidents.false_positive_rate_pct}% ·{' '}
              {summary.incidents.total} total events
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recent incidents</Text>
        {incidents.length === 0 ? (
          <Text style={styles.empty}>No incidents reported.</Text>
        ) : (
          incidents.map((inc) => (
            <View key={inc.id} style={styles.incidentCard}>
              <View style={styles.incidentIcon}>
                <Ionicons
                  name={inc.type === 'weapon_detected' ? 'warning' : 'alert-circle'}
                  size={18}
                  color={Colors.white}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.incidentTitle}>
                  {inc.type.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.incidentSub}>
                  {inc.location || 'Unknown'} · {timeAgo(inc.created_at)}
                </Text>
              </View>
              {inc.confidence != null && (
                <Text style={styles.confidence}>{Math.round(inc.confidence * 100)}%</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenShell>
  );
};

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 30 },
  subtitle: { color: Colors.muted, fontWeight: '600', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 14,
  },
  statValue: { color: Colors.accent, fontSize: 26, fontWeight: '800' },
  statLabel: { color: Colors.white, fontSize: 12, fontWeight: '600', marginTop: 2 },
  detectionCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 14,
    gap: 6,
    marginBottom: 16,
  },
  detectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detectionTitle: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  detectionSub: { color: '#E7D8FF', fontSize: 12 },
  sectionTitle: { color: Colors.text, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  empty: { color: Colors.muted, fontStyle: 'italic' },
  incidentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  incidentIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentTitle: { color: Colors.text, fontWeight: '800', fontSize: 13 },
  incidentSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  confidence: { color: Colors.primary, fontWeight: '800', fontSize: 12 },
});
