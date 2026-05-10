import { useState } from 'react';
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
    id: 'active_threat', title: 'Active Threat \u2014 Run. Hide. Fight.', subtitle: 'What to do if a weapon is detected in school', icon: '🚨',
    steps: [
      'RUN: If there is a safe exit route, evacuate immediately. Leave belongings behind.',
      'HIDE: If you cannot run, find a room with a lockable door. Turn off lights. Silence your phone.',
      'Block the door with heavy furniture if possible.',
      'FIGHT: Only as a last resort. Act aggressively \u2014 throw objects, make noise.',
      'When safe: call emergency services. Do not approach the threat.',
    ],
    videoUrl: 'https://youtu.be/RDbXTRzfzMM', videoLabel: 'Watch: Active Threat Response',
  },
  {
    id: 'lockdown', title: 'Lockdown Procedures', subtitle: 'Step-by-step lockdown actions for students', icon: '🔒',
    steps: [
      'When the Qorgan alert arrives: stay calm, do not go into hallways.',
      'Move to the nearest classroom or room with a lock immediately.',
      'Lock and barricade the door. Cover windows.',
      'Turn off all lights and move away from doors and windows.',
      'Stay silent. Do not respond to knocking unless police confirm identity.',
      'Use SOS in Qorgan to alert guards of your location.',
      'Wait for official ALL CLEAR announcement before moving.',
    ],
    videoUrl: 'https://youtu.be/jiJ3zDEtEIo', videoLabel: 'Watch: School Lockdown Guide',
  },
  {
    id: 'evacuation', title: 'Emergency Evacuation', subtitle: 'How to exit safely during an alarm', icon: '🚪',
    steps: [
      'Follow the nearest marked emergency exit \u2014 do not use elevators.',
      'Walk quickly, do not push. Help people with mobility issues.',
      'Do not return for belongings.',
      'Move at least 300 meters away from the building.',
      'Report to your class assembly point and wait for your teacher.',
      'Do not use your phone except to contact emergency services.',
    ],
    videoUrl: 'https://youtu.be/D32SG9ucX-8', videoLabel: 'Watch: Evacuation Safety',
  },
  {
    id: 'sos', title: 'How to Use Qorgan SOS', subtitle: 'Alert guards instantly from your phone', icon: '📱',
    steps: [
      'Open the Qorgan app and tap the SOS button.',
      'Confirm the alert when prompted \u2014 this prevents false alarms.',
      'Your GPS location is sent automatically to all guards.',
      'Stay in place after sending SOS so guards can reach you.',
      'Add a short message if you can \u2014 e.g., "Room 204, 3 students".',
      'Keep the app open so guards can update you on the situation.',
    ],
  },
  {
    id: 'first_aid', title: 'Basic First Aid in Emergency', subtitle: 'Immediate actions before paramedics arrive', icon: '🩹',
    steps: [
      'Check for safety \u2014 do not approach if threat is not resolved.',
      'Call emergency services first (112 in Kazakhstan).',
      'For bleeding: apply firm pressure with cloth. Do not remove it.',
      'For unconscious person: check breathing. If none \u2014 begin CPR.',
      'CPR: 30 chest compressions, 2 rescue breaths. Repeat.',
      'For shock: lay person flat, elevate legs slightly, keep warm.',
      'Stay with the person and talk calmly until help arrives.',
    ],
    videoUrl: 'https://youtu.be/JCoM929a6wM', videoLabel: 'Watch: First Aid Basics',
  },
  {
    id: 'earthquake', title: 'Earthquake Safety', subtitle: 'Drop, Cover, and Hold On', icon: '🏫',
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

export const LessonsPage = () => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = LESSONS.filter(
    (l) =>
      l.title.toLowerCase().includes(query.toLowerCase()) ||
      l.subtitle.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <ScreenShell title="Lessons">
      <div style={{ padding: 16, paddingBottom: 40 }}>
        <p style={{ color: '#C4B93A', textAlign: 'center', marginBottom: 12, fontWeight: 600, fontSize: 13, marginTop: 0 }}>
          Learn how to react fast in emergencies. Tap any lesson to expand.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons..."
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
          {filtered.map((lesson) => {
            const isOpen = expanded === lesson.id;
            return (
              <div key={lesson.id} style={{ background: Colors.primary, borderRadius: 12, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpanded(isOpen ? null : lesson.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: 14, gap: 10, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 22 }}>{lesson.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, display: 'block' }}>{lesson.title}</span>
                    <span style={{ color: '#E7D8FF', fontSize: 12, marginTop: 2, display: 'block' }}>{lesson.subtitle}</span>
                  </div>
                  <span style={{ color: '#E7D8FF', fontSize: 14 }}>{isOpen ? '\u25B2' : '\u25BC'}</span>
                </div>

                {isOpen && (
                  <div style={{ background: 'rgba(255,255,255,0.07)', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lesson.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: '#C4B93A', fontWeight: 700, fontSize: 13, minWidth: 18 }}>{i + 1}</span>
                        <span style={{ color: '#fff', fontSize: 13, flex: 1, lineHeight: '19px' }}>{step}</span>
                      </div>
                    ))}
                    {lesson.videoUrl && (
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginTop: 10,
                          background: '#C4B93A',
                          borderRadius: 8,
                          padding: 10,
                          textAlign: 'center',
                          color: '#1a1a2e',
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: 'none',
                          display: 'block',
                        }}
                      >
                        \u25B6 &nbsp;{lesson.videoLabel ?? 'Watch video'}
                      </a>
                    )}
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
