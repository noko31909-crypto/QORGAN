import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TextInput,
  Pressable,
} from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

interface Guide {
  id: string;
  title: string;
  icon: string;
  urgent: boolean;
  steps: string[];
  warning?: string;
}

const GUIDES: Guide[] = [
  {
    id: 'bleeding',
    title: 'Control Bleeding',
    icon: '🩸',
    urgent: true,
    warning: 'Call 112 immediately for severe bleeding.',
    steps: [
      'Put on gloves if available. Protect yourself from blood contact.',
      'Apply firm, direct pressure to the wound with a clean cloth or bandage.',
      'Do NOT remove the cloth — add more on top if it soaks through.',
      'Elevate the injured limb above heart level if possible.',
      'Maintain pressure for at least 10 minutes without lifting.',
      'If bleeding does not slow, apply tourniquet 5–7 cm above the wound.',
      'Mark the time tourniquet was applied and do not remove it.',
    ],
  },
  {
    id: 'cpr',
    title: 'CPR (Heart Stopped)',
    icon: '❤️',
    urgent: true,
    warning: 'Call 112 first. Begin CPR immediately — every second counts.',
    steps: [
      'Check the person is unresponsive and not breathing normally.',
      'Call 112 or send someone to call while you start CPR.',
      'Place the heel of your hand on the centre of the chest.',
      'Push down hard and fast — at least 5 cm depth, 100–120 times per minute.',
      'After 30 compressions: tilt head back, lift chin, give 2 rescue breaths.',
      'Each breath: seal their mouth with yours, breathe in for 1 second.',
      'Repeat 30:2 ratio until emergency services arrive or the person recovers.',
    ],
  },
  {
    id: 'choking',
    title: 'Choking',
    icon: '🫁',
    urgent: true,
    warning: 'If the person cannot speak, cough, or breathe — act immediately.',
    steps: [
      'Ask: "Are you choking?" If they can cough, encourage them to keep coughing.',
      'If they cannot cough or breathe: stand behind them, lean them forward.',
      'Give 5 firm back blows between the shoulder blades with the heel of your hand.',
      'Check mouth — remove visible obstruction only if you can clearly see it.',
      'If blockage remains: give 5 abdominal thrusts (Heimlich). Make a fist, place above navel, pull sharply upward.',
      'Alternate 5 back blows and 5 abdominal thrusts until cleared.',
      'If person becomes unconscious: begin CPR and call 112.',
    ],
  },
  {
    id: 'seizure',
    title: 'Seizures',
    icon: '⚡',
    urgent: false,
    warning: 'Call 112 if seizure lasts more than 5 minutes or person does not recover.',
    steps: [
      'Stay calm. Note the time the seizure started.',
      'Clear the area of hard or sharp objects that could cause injury.',
      'Do NOT hold the person down or restrain them.',
      'Gently cushion their head with something soft.',
      'Do NOT put anything in their mouth.',
      'After shaking stops: turn them onto their side (recovery position).',
      'Stay with them until fully conscious. Speak calmly and reassuringly.',
    ],
  },
  {
    id: 'burns',
    title: 'Burns',
    icon: '🔥',
    urgent: false,
    warning: 'Large burns, burns on face/hands/joints — call 112.',
    steps: [
      'Remove the person from the burn source immediately.',
      'Cool the burn under cool (not cold) running water for 20 minutes.',
      'Do NOT use ice, butter, or toothpaste — this makes it worse.',
      'Remove jewellery and clothing near the burn — unless stuck to skin.',
      'Cover with a clean non-fluffy material (cling film or clean plastic bag).',
      'Do NOT pop blisters.',
      'Seek medical attention for all burns larger than the person\'s palm.',
    ],
  },
  {
    id: 'dog_bite',
    title: 'Dog Bite',
    icon: '🐕',
    urgent: false,
    steps: [
      'Move away from the animal safely.',
      'Wash the wound thoroughly with soap and clean water for at least 5 minutes.',
      'Apply gentle pressure with a clean cloth to control minor bleeding.',
      'Apply antiseptic if available.',
      'Cover with a clean bandage.',
      'Seek medical attention — dog bites carry infection and rabies risk.',
      'Report the bite and provide information about the animal to authorities.',
    ],
  },
];

export const FirstAidScreen = () => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = GUIDES.filter(
    (g) =>
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.steps.some((s) => s.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <ScreenShell title="First Aid">
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.tip}>
          Step-by-step emergency first aid. Tap any guide to expand.
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search symptom or procedure..."
          placeholderTextColor={Colors.muted}
          style={styles.search}
        />
        <View style={styles.list}>
          {filtered.map((guide) => {
            const isOpen = expanded === guide.id;
            return (
              <View key={guide.id} style={[styles.card, guide.urgent && styles.cardUrgent]}>
                <Pressable
                  style={styles.header}
                  onPress={() => setExpanded(isOpen ? null : guide.id)}
                >
                  <Text style={styles.icon}>{guide.icon}</Text>
                  <View style={styles.headerText}>
                    <Text style={styles.title}>{guide.title}</Text>
                    {guide.urgent && <Text style={styles.urgentTag}>URGENT</Text>}
                  </View>
                  <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                </Pressable>

                {isOpen && (
                  <View style={styles.body}>
                    {guide.warning && (
                      <View style={styles.warningBox}>
                        <Text style={styles.warningText}>⚠ {guide.warning}</Text>
                      </View>
                    )}
                    {guide.steps.map((step, i) => (
                      <View key={i} style={styles.step}>
                        <Text style={styles.stepNum}>{i + 1}</Text>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
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
  cardUrgent: {
    borderWidth: 1.5,
    borderColor: '#E05C5C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  icon: { fontSize: 22 },
  headerText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#fff', fontWeight: '700', fontSize: 14 },
  urgentTag: {
    backgroundColor: '#E05C5C',
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  chevron: { color: '#E7D8FF', fontSize: 14 },
  body: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  warningBox: {
    backgroundColor: 'rgba(224,92,92,0.2)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  warningText: {
    color: '#FFAAAA',
    fontSize: 12,
    fontWeight: '600',
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
});
