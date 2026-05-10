import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  steps: string[];
  videoUrl?: string;
  videoLabel?: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'active_threat',
    title: 'Active Threat — Run. Hide. Fight.',
    subtitle: 'What to do if a weapon is detected in school',
    icon: '🚨',
    steps: [
      'RUN: If there is a safe exit route, evacuate immediately. Leave belongings behind.',
      'HIDE: If you cannot run, find a room with a lockable door. Turn off lights. Silence your phone.',
      'Block the door with heavy furniture if possible.',
      'FIGHT: Only as a last resort. Act aggressively — throw objects, make noise.',
      'When safe: call emergency services. Do not approach the threat.',
    ],
    videoUrl: 'https://youtu.be/RDbXTRzfzMM',
    videoLabel: 'Watch: Active Threat Response',
  },
  {
    id: 'lockdown',
    title: 'Lockdown Procedures',
    subtitle: 'Step-by-step lockdown actions for students',
    icon: '🔒',
    steps: [
      'When the Qorgan alert arrives: stay calm, do not go into hallways.',
      'Move to the nearest classroom or room with a lock immediately.',
      'Lock and barricade the door. Cover windows.',
      'Turn off all lights and move away from doors and windows.',
      'Stay silent. Do not respond to knocking unless police confirm identity.',
      'Use SOS in Qorgan to alert guards of your location.',
      'Wait for official ALL CLEAR announcement before moving.',
    ],
    videoUrl: 'https://youtu.be/jiJ3zDEtEIo',
    videoLabel: 'Watch: School Lockdown Guide',
  },
  {
    id: 'evacuation',
    title: 'Emergency Evacuation',
    subtitle: 'How to exit safely during an alarm',
    icon: '🚪',
    steps: [
      'Follow the nearest marked emergency exit — do not use elevators.',
      'Walk quickly, do not push. Help people with mobility issues.',
      'Do not return for belongings.',
      'Move at least 300 meters away from the building.',
      'Report to your class assembly point and wait for your teacher.',
      'Do not use your phone except to contact emergency services.',
    ],
    videoUrl: 'https://youtu.be/D32SG9ucX-8',
    videoLabel: 'Watch: Evacuation Safety',
  },
  {
    id: 'sos',
    title: 'How to Use Qorgan SOS',
    subtitle: 'Alert guards instantly from your phone',
    icon: '📱',
    steps: [
      'Open the Qorgan app and tap the SOS button.',
      'Confirm the alert when prompted — this prevents false alarms.',
      'Your GPS location is sent automatically to all guards.',
      'Stay in place after sending SOS so guards can reach you.',
      'Add a short message if you can — e.g., "Room 204, 3 students".',
      'Keep the app open so guards can update you on the situation.',
    ],
  },
  {
    id: 'first_aid',
    title: 'Basic First Aid in Emergency',
    subtitle: 'Immediate actions before paramedics arrive',
    icon: '🩹',
    steps: [
      'Check for safety — do not approach if threat is not resolved.',
      'Call emergency services first (112 in Kazakhstan).',
      'For bleeding: apply firm pressure with cloth. Do not remove it.',
      'For unconscious person: check breathing. If none — begin CPR.',
      'CPR: 30 chest compressions, 2 rescue breaths. Repeat.',
      'For shock: lay person flat, elevate legs slightly, keep warm.',
      'Stay with the person and talk calmly until help arrives.',
    ],
    videoUrl: 'https://youtu.be/JCoM929a6wM',
    videoLabel: 'Watch: First Aid Basics',
  },
  {
    id: 'earthquake',
    title: 'Earthquake Safety',
    subtitle: 'Drop, Cover, and Hold On',
    icon: '🏫',
    steps: [
      'DROP to hands and knees immediately.',
      'Take COVER under a sturdy desk or against an interior wall.',
      'HOLD ON until the shaking stops.',
      'Stay away from windows, exterior walls, and objects that can fall.',
      'After shaking stops: check for injuries, then evacuate if safe.',
      'Do not use elevators. Watch for falling debris when exiting.',
    ],
  },
];

const openVideo = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Cannot open video', 'Please visit the link manually: ' + url);
  }
};

export const LessonsScreen = () => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = LESSONS.filter(
    (l) =>
      l.title.toLowerCase().includes(query.toLowerCase()) ||
      l.subtitle.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <ScreenShell title="Lessons">
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.tip}>
          Learn how to react fast in emergencies. Tap any lesson to expand.
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search lessons..."
          placeholderTextColor={Colors.muted}
          style={styles.search}
        />
        <View style={styles.list}>
          {filtered.map((lesson) => {
            const isOpen = expanded === lesson.id;
            return (
              <View key={lesson.id} style={styles.card}>
                <Pressable
                  style={styles.header}
                  onPress={() => setExpanded(isOpen ? null : lesson.id)}
                >
                  <Text style={styles.icon}>{lesson.icon}</Text>
                  <View style={styles.headerText}>
                    <Text style={styles.title}>{lesson.title}</Text>
                    <Text style={styles.subtitle}>{lesson.subtitle}</Text>
                  </View>
                  <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                </Pressable>

                {isOpen && (
                  <View style={styles.body}>
                    {lesson.steps.map((step, i) => (
                      <View key={i} style={styles.step}>
                        <Text style={styles.stepNum}>{i + 1}</Text>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                    {lesson.videoUrl && (
                      <Pressable
                        style={styles.videoBtn}
                        onPress={() => openVideo(lesson.videoUrl!)}
                      >
                        <Text style={styles.videoBtnText}>
                          ▶  {lesson.videoLabel ?? 'Watch video'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tip: {
    color: '#C4B93A',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 13,
  },
  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.4,
    borderColor: Colors.primary,
    padding: 12,
    marginBottom: 14,
  },
  list: { gap: 10 },

  card: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  icon: { fontSize: 22 },
  headerText: { flex: 1 },
  title: { color: '#fff', fontWeight: '700', fontSize: 14 },
  subtitle: { color: '#E7D8FF', fontSize: 12, marginTop: 2 },
  chevron: { color: '#E7D8FF', fontSize: 14 },

  body: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  step: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  stepNum: {
    color: '#C4B93A',
    fontWeight: '700',
    fontSize: 13,
    minWidth: 18,
  },
  stepText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },
  videoBtn: {
    marginTop: 10,
    backgroundColor: '#C4B93A',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  videoBtnText: {
    color: '#1a1a2e',
    fontWeight: '700',
    fontSize: 13,
  },
});
