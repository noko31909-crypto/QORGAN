import React, { useMemo, useState } from 'react';
import {
  Linking,
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

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  steps: string[];
  videoUrl?: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'fire',
    title: 'Fire Safety',
    subtitle: 'Learn how to respond to fire emergencies',
    duration: '10 min',
    videoUrl: 'https://youtu.be/D32SG9ucX-8',
    steps: [
      'Pull the fire alarm and alert others.',
      'Evacuate using the nearest marked exit — never use elevators.',
      'Close doors behind you to slow the fire.',
      'If smoke is thick, stay low and crawl.',
      'Meet at your assigned assembly point.',
    ],
  },
  {
    id: 'earthquake',
    title: 'Earthquake Preparedness',
    subtitle: 'Drop, Cover, and Hold On techniques',
    duration: '8 min',
    steps: [
      'DROP to hands and knees immediately.',
      'Take COVER under a sturdy desk or interior wall.',
      'HOLD ON until the shaking stops.',
      'Stay away from windows and heavy objects.',
      'Evacuate if safe after shaking stops.',
    ],
  },
  {
    id: 'lockdown',
    title: 'Lockdown Procedures',
    subtitle: 'What to do during a security threat',
    duration: '12 min',
    videoUrl: 'https://youtu.be/jiJ3zDEtEIo',
    steps: [
      'Move to the nearest room with a lock.',
      'Lock and barricade the door. Cover windows.',
      'Turn off all lights. Silence phones.',
      'Stay silent and away from doors.',
      'Wait for official ALL CLEAR before moving.',
    ],
  },
  {
    id: 'exits',
    title: 'Emergency Exits',
    subtitle: 'Know your evacuation routes',
    duration: '5 min',
    steps: [
      'Learn the two nearest exits from every classroom.',
      'Count doors — helps in smoke or darkness.',
      'Never use elevators.',
      'Do not push. Help those with mobility issues.',
      'Report to your assembly point after exit.',
    ],
  },
  {
    id: 'responder',
    title: 'First Responder Contact',
    subtitle: 'Know how to contact emergency services',
    duration: '6 min',
    steps: [
      'Dial 112 for any life-threatening emergency.',
      'State your location first — building, floor, room.',
      'Describe the emergency clearly.',
      'Do not hang up until told to.',
      'Send Qorgan SOS at the same time for instant guard alert.',
    ],
  },
  {
    id: 'firstaid',
    title: 'Basic First Aid',
    subtitle: 'Learn how to treat minor injuries',
    duration: '7 min',
    videoUrl: 'https://youtu.be/JCoM929a6wM',
    steps: [
      'Check the scene is safe.',
      'Call 112 if serious.',
      'For bleeding: apply firm pressure with clean cloth.',
      'For burns: cool under running water for 20 minutes.',
      'For shock: lay flat, elevate legs, keep warm.',
    ],
  },
];

export const LessonsScreen = () => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Lesson | null>(null);

  const filtered = useMemo(
    () =>
      LESSONS.filter(
        (l) =>
          l.title.toLowerCase().includes(query.trim().toLowerCase()) ||
          l.subtitle.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  return (
    <ScreenShell title="Lessons">
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.tip}>
          Use the following guides as lessons to learn{'\n'}how to act in dangerous situations.
        </Text>

        <View style={styles.searchBar}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search lessons..."
            placeholderTextColor={Colors.muted}
            style={styles.searchInput}
          />
          <Pressable style={styles.searchBtn}>
            <Ionicons name="search" size={20} color={Colors.white} />
          </Pressable>
        </View>

        {filtered.map((lesson) => (
          <Pressable key={lesson.id} style={styles.lessonCard} onPress={() => setSelected(lesson)}>
            <View style={styles.playBadge}>
              <Ionicons name="play" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonSub}>{lesson.subtitle}</Text>
              <View style={styles.durationRow}>
                <Ionicons name="time-outline" size={12} color={'#E7D8FF'} />
                <Text style={styles.durationText}>{lesson.duration}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {filtered.length === 0 && (
          <Text style={styles.empty}>No lessons match your search.</Text>
        )}
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected?.title}</Text>
              <Pressable hitSlop={10} onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>{selected?.subtitle}</Text>
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
            {selected?.videoUrl && (
              <Pressable
                style={styles.videoBtn}
                onPress={() => Linking.openURL(selected.videoUrl!)}
              >
                <Ionicons name="play" size={16} color={Colors.white} />
                <Text style={styles.videoBtnText}>Watch video</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 30, gap: 10 },
  tip: {
    color: Colors.accentDark,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, paddingHorizontal: 14, height: 46 },
  searchBtn: {
    width: 52,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: '#E7D8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonTitle: { color: Colors.accent, fontWeight: '800', fontSize: 15 },
  lessonSub: { color: Colors.white, fontSize: 12, marginTop: 2 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  durationText: { color: '#E7D8FF', fontSize: 11 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 24 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 20,
    gap: 12,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  modalSub: { color: Colors.muted, fontSize: 13 },
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
  videoBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  videoBtnText: { color: Colors.white, fontWeight: '700' },
});
