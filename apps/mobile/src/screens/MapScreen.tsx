import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenShell } from '../components/ScreenShell';
import { api } from '../services/api';
import { Incident } from '../types';
import { useThreat } from '../context/ThreatContext';
import { socketService } from '../services/socket';
import { Colors, Radius } from '../theme';

const LEGEND = [
  { color: Colors.success, label: 'Safe Zone' },
  { color: Colors.danger, label: 'Danger' },
  { color: Colors.info, label: 'Exit' },
  { color: Colors.accent, label: 'Fire extinguisher' },
];

export const MapScreen = () => {
  const { threat } = useThreat();
  const [latestIncident, setLatestIncident] = useState<Incident | null>(null);

  const load = useCallback(async () => {
    try {
      const incidents = await api.getIncidents({ limit: 1 });
      setLatestIncident(incidents?.[0] || null);
    } catch {
      // silent — offline or no incidents
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
    <ScreenShell title="Map">
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.planCard}>
          <View style={styles.legend}>
            {LEGEND.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.planImage}>
            <Text style={styles.planTitle}>ПЛАН ЭВАКУАЦИИ ЛЮДЕЙ ПРИ ПОЖАРЕ</Text>
            <Text style={styles.planFloor}>ЭТАЖ 3</Text>
            <View style={styles.planGrid}>
              <View style={[styles.planExit, { top: 10, left: 20 }]} />
              <View style={[styles.planExit, { top: 10, right: 20 }]} />
              <View style={[styles.planExit, { bottom: 10, left: '45%' }]} />
            </View>
          </View>
        </View>

        <Pressable
          style={styles.exitsBtn}
          onPress={() =>
            Alert.alert(
              'Free exits',
              '• Main entrance (front)\n• East corridor exit\n• Gym exit (south)\n• Back gate (staff only)',
            )
          }
        >
          <Ionicons name="walk" size={18} color={Colors.white} />
          <Text style={styles.exitsBtnText}>Free exits</Text>
        </Pressable>

        <InfoCard
          icon="alert"
          color={Colors.accent}
          title="Stay calm during evacuation"
          subtitle="Proceed to the nearest exit as planned."
        />
        <InfoCard
          icon="flame"
          color="#FFA94D"
          title="Fire shield and fire extinguishers"
          subtitle="Located in the corridors and at the exits"
        />

        {(threat || latestIncident) && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={20} color={Colors.white} />
            <Text style={styles.alertText}>
              Active alert: {threat?.location || latestIncident?.location || 'Location unknown'}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
};

const InfoCard = ({
  icon,
  color,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
}) => (
  <View style={styles.infoCard}>
    <Ionicons name={icon} size={22} color={color} style={{ marginRight: 10 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoSub}>{subtitle}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 30, gap: 12 },
  planCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    padding: 10,
  },
  legend: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    padding: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: Colors.text, fontWeight: '600', fontSize: 12 },
  planImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F7FC',
    borderRadius: Radius.sm,
    padding: 10,
  },
  planTitle: { color: Colors.danger, fontWeight: '800', textAlign: 'center', fontSize: 11 },
  planFloor: { color: Colors.text, fontWeight: '700', textAlign: 'center', marginTop: 6, fontSize: 11 },
  planGrid: { flex: 1, marginTop: 8, position: 'relative' },
  planExit: {
    position: 'absolute',
    width: 18,
    height: 12,
    backgroundColor: Colors.success,
    borderRadius: 2,
  },

  exitsBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  exitsBtnText: { color: Colors.white, fontWeight: '700' },

  infoCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  infoSub: { color: '#E7D8FF', fontSize: 12, marginTop: 2 },

  alertBanner: {
    backgroundColor: Colors.danger,
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: { color: Colors.white, fontWeight: '700', flex: 1 },
});
