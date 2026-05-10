import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '../components/ScreenShell';
import { Colors, Radius } from '../theme';

interface Guide {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  tileColor: string;
  urgent: boolean;
  warning?: string;
  steps: string[];
}

const GUIDES: Guide[] = [
  {
    id: 'bleeding',
    title: 'Control Bleeding',
    icon: 'water',
    tileColor: '#F9E3D6',
    urgent: true,
    warning: 'Call 112 for severe bleeding.',
    steps: [
      'Put on gloves if available.',
      'Apply firm direct pressure with a clean cloth.',
      'Do NOT remove the cloth — add more on top if needed.',
      'Elevate the injured limb above heart level.',
      'Maintain pressure for at least 10 minutes.',
      'If bleeding continues, apply tourniquet 5–7 cm above wound.',
    ],
  },
  {
    id: 'dog_bite',
    title: 'Dog Bite',
    icon: 'paw',
    tileColor: '#F9E3D6',
    urgent: false,
    steps: [
      'Move away from the animal safely.',
      'Wash the wound with soap and water for 5 minutes.',
      'Apply gentle pressure to control bleeding.',
      'Cover with a clean bandage.',
      'Seek medical attention — rabies risk.',
    ],
  },
  {
    id: 'seizures',
    title: 'Seizures',
    icon: 'flash',
    tileColor: '#E9DCF7',
    urgent: false,
    warning: 'Call 112 if seizure lasts more than 5 minutes.',
    steps: [
      'Stay calm. Note the start time.',
      'Clear the area of hard or sharp objects.',
      'Do NOT restrain the person.',
      'Cushion their head with something soft.',
      'Do NOT put anything in their mouth.',
      'After shaking stops, turn them onto their side.',
    ],
  },
  {
    id: 'sting',
    title: 'Insect Sting',
    icon: 'bug',
    tileColor: '#FDE2EE',
    urgent: false,
    steps: [
      'Remove the stinger by scraping (not squeezing).',
      'Wash the area with soap and water.',
      'Apply a cold compress for 10 minutes.',
      'Watch for allergic reaction — swelling, trouble breathing.',
      'Call 112 if allergic symptoms appear.',
    ],
  },
  {
    id: 'cpr',
    title: 'CPR (Heart Beating Stop)',
    icon: 'heart',
    tileColor: '#D7F0DE',
    urgent: true,
    warning: 'Call 112 first. Every second counts.',
    steps: [
      'Check unresponsive and not breathing.',
      'Call 112 or have someone call.',
      'Place heel of hand on centre of chest.',
      'Push hard and fast — 5 cm deep, 100–120/min.',
      'After 30 compressions, give 2 rescue breaths.',
      'Repeat 30:2 until help arrives.',
    ],
  },
  {
    id: 'choking',
    title: 'Choking',
    icon: 'medical',
    tileColor: '#FDE2EE',
    urgent: true,
    warning: 'Act immediately if person cannot breathe.',
    steps: [
      'Ask: "Are you choking?"',
      'Stand behind, lean them forward.',
      'Give 5 back blows between shoulder blades.',
      'If blockage remains, give 5 abdominal thrusts.',
      'Alternate 5 blows and 5 thrusts until cleared.',
      'If unconscious, begin CPR and call 112.',
    ],
  },
];

export const FirstAidScreen = () => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Guide | null>(null);

  const filtered = useMemo(
    () =>
      GUIDES.filter((g) => g.title.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  return (
    <ScreenShell title="First Aid">
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.tip}>
          Use the following guides to help someone in{'\n'}case of an emergency!
        </Text>

        <View style={styles.searchBar}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search a symptom/procedure"
            placeholderTextColor="#E7D8FF"
            style={styles.searchInput}
          />
          <Pressable style={styles.searchBtn} onPress={() => {}}>
            <Ionicons name="search" size={20} color={Colors.white} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {filtered.map((guide) => (
            <Pressable
              key={guide.id}
              style={[styles.tile, { backgroundColor: guide.tileColor }]}
              onPress={() => setSelected(guide)}
            >
              <View style={styles.tileIcon}>
                <Ionicons name={guide.icon} size={38} color={Colors.primary} />
              </View>
              <Text style={styles.tileLabel} numberOfLines={2}>
                {guide.title}
              </Text>
            </Pressable>
          ))}
          {filtered.length === 0 && (
            <Text style={styles.empty}>No guides match your search.</Text>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected?.title}</Text>
              <Pressable hitSlop={10} onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            {selected?.warning && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={18} color="#B91C1C" />
                <Text style={styles.warningText}>{selected.warning}</Text>
              </View>
            )}
            <ScrollView style={{ maxHeight: 380 }}>
              {selected?.steps.map((s, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{s}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={styles.callBtn}
              onPress={() => Alert.alert('Call 112', 'Dialing emergency services...')}
            >
              <Ionicons name="call" size={18} color={Colors.white} />
              <Text style={styles.callBtnText}>Call 112</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 30 },
  tip: {
    color: Colors.accentDark,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: 18,
  },
  searchInput: { flex: 1, color: Colors.white, paddingHorizontal: 14, height: 46 },
  searchBtn: {
    width: 52,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '31.5%',
    aspectRatio: 0.95,
    borderRadius: Radius.md,
    padding: 8,
    justifyContent: 'space-between',
  },
  tileIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { color: Colors.text, fontWeight: '700', fontSize: 12, marginTop: 4 },
  empty: { color: Colors.muted, padding: 20, textAlign: 'center', width: '100%' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 20,
    gap: 14,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE4E4',
    padding: 10,
    borderRadius: Radius.sm,
    gap: 8,
  },
  warningText: { color: '#B91C1C', fontWeight: '600', flex: 1 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: Colors.white, fontWeight: '800' },
  stepText: { flex: 1, color: Colors.text, lineHeight: 20 },
  callBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.danger,
    padding: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});
