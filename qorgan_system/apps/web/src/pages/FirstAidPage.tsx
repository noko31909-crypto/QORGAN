import { useState } from 'react';
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
    id: 'bleeding', title: 'Control Bleeding', icon: '🩸', urgent: true,
    warning: 'Call 112 immediately for severe bleeding.',
    steps: [
      'Put on gloves if available. Protect yourself from blood contact.',
      'Apply firm, direct pressure to the wound with a clean cloth or bandage.',
      'Do NOT remove the cloth \u2014 add more on top if it soaks through.',
      'Elevate the injured limb above heart level if possible.',
      'Maintain pressure for at least 10 minutes without lifting.',
      'If bleeding does not slow, apply tourniquet 5\u20137 cm above the wound.',
      'Mark the time tourniquet was applied and do not remove it.',
    ],
  },
  {
    id: 'cpr', title: 'CPR (Heart Stopped)', icon: '❤️', urgent: true,
    warning: 'Call 112 first. Begin CPR immediately \u2014 every second counts.',
    steps: [
      'Check the person is unresponsive and not breathing normally.',
      'Call 112 or send someone to call while you start CPR.',
      'Place the heel of your hand on the centre of the chest.',
      'Push down hard and fast \u2014 at least 5 cm depth, 100\u2013120 times per minute.',
      'After 30 compressions: tilt head back, lift chin, give 2 rescue breaths.',
      'Each breath: seal their mouth with yours, breathe in for 1 second.',
      'Repeat 30:2 ratio until emergency services arrive or the person recovers.',
    ],
  },
  {
    id: 'choking', title: 'Choking', icon: '🫁', urgent: true,
    warning: 'If the person cannot speak, cough, or breathe \u2014 act immediately.',
    steps: [
      'Ask: "Are you choking?" If they can cough, encourage them to keep coughing.',
      'If they cannot cough or breathe: stand behind them, lean them forward.',
      'Give 5 firm back blows between the shoulder blades with the heel of your hand.',
      'Check mouth \u2014 remove visible obstruction only if you can clearly see it.',
      'If blockage remains: give 5 abdominal thrusts (Heimlich). Make a fist, place above navel, pull sharply upward.',
      'Alternate 5 back blows and 5 abdominal thrusts until cleared.',
      'If person becomes unconscious: begin CPR and call 112.',
    ],
  },
  {
    id: 'seizure', title: 'Seizures', icon: '\u26A1', urgent: false,
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
    id: 'burns', title: 'Burns', icon: '🔥', urgent: false,
    warning: 'Large burns, burns on face/hands/joints \u2014 call 112.',
    steps: [
      'Remove the person from the burn source immediately.',
      'Cool the burn under cool (not cold) running water for 20 minutes.',
      'Do NOT use ice, butter, or toothpaste \u2014 this makes it worse.',
      'Remove jewellery and clothing near the burn \u2014 unless stuck to skin.',
      'Cover with a clean non-fluffy material (cling film or clean plastic bag).',
      'Do NOT pop blisters.',
      'Seek medical attention for all burns larger than the person\'s palm.',
    ],
  },
  {
    id: 'dog_bite', title: 'Dog Bite', icon: '🐕', urgent: false,
    steps: [
      'Move away from the animal safely.',
      'Wash the wound thoroughly with soap and clean water for at least 5 minutes.',
      'Apply gentle pressure with a clean cloth to control minor bleeding.',
      'Apply antiseptic if available.',
      'Cover with a clean bandage.',
      'Seek medical attention \u2014 dog bites carry infection and rabies risk.',
      'Report the bite and provide information about the animal to authorities.',
    ],
  },
];

export const FirstAidPage = () => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = GUIDES.filter(
    (g) =>
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.steps.some((s) => s.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <ScreenShell title="First Aid">
      <div style={{ padding: 16, paddingBottom: 40 }}>
        <p style={{ color: '#C4B93A', textAlign: 'center', marginBottom: 12, fontWeight: 600, fontSize: 13, marginTop: 0 }}>
          Step-by-step emergency first aid. Tap any guide to expand.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symptom or procedure..."
          style={{
            width: '100%',
            background: '#fff',
            borderRadius: 10,
            border: `1.4px solid ${Colors.primary}`,
            padding: 12,
            marginBottom: 14,
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((guide) => {
            const isOpen = expanded === guide.id;
            return (
              <div key={guide.id} style={{
                background: Colors.primary,
                borderRadius: 12,
                overflow: 'hidden',
                border: guide.urgent ? '1.5px solid #E05C5C' : 'none',
              }}>
                <div
                  onClick={() => setExpanded(isOpen ? null : guide.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 14,
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{guide.icon}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{guide.title}</span>
                    {guide.urgent && (
                      <span style={{
                        background: '#E05C5C', color: '#fff', fontSize: 9, fontWeight: 800,
                        padding: '2px 5px', borderRadius: 4, letterSpacing: 0.5,
                      }}>URGENT</span>
                    )}
                  </div>
                  <span style={{ color: '#E7D8FF', fontSize: 14 }}>{isOpen ? '\u25B2' : '\u25BC'}</span>
                </div>

                {isOpen && (
                  <div style={{ background: 'rgba(255,255,255,0.07)', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {guide.warning && (
                      <div style={{ background: 'rgba(224,92,92,0.2)', borderRadius: 8, padding: 10, marginBottom: 4 }}>
                        <span style={{ color: '#FFAAAA', fontSize: 12, fontWeight: 600 }}>Warning: {guide.warning}</span>
                      </div>
                    )}
                    {guide.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: '#C4B93A', fontWeight: 700, fontSize: 13, minWidth: 18 }}>{i + 1}</span>
                        <span style={{ color: '#fff', fontSize: 13, flex: 1, lineHeight: '19px' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ScreenShell>
  );
};
