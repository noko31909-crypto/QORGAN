import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenShell } from '../components/ScreenShell';
import { api } from '../services/api';
import { DetectionStatus, Incident, MetricsSummary, MetricsTrendPoint } from '../types';
import { Colors } from '../theme';
import { socketService } from '../services/socket';

export const HomePage = () => {
  const navigate = useNavigate();
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

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsub = socketService.onWeaponAlert(() => { load(); });
    return unsub;
  }, [load]);

  return (
    <ScreenShell title="School Safety">
      <div style={{ padding: 18 }}>
        <p style={{ color: Colors.muted, marginBottom: 14, fontWeight: 600, marginTop: 0 }}>
          {user?.role === 'guard' ? 'Guard dashboard' : 'Student view'}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div className="spinner" />
          </div>
        )}
        {errorText && <p style={{ color: '#B00020', fontWeight: 600 }}>{errorText}</p>}

        {/* GUARD VIEW */}
        {user?.role === 'guard' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={statCard}>
                <span style={{ color: Colors.primary, fontWeight: 800, fontSize: 24 }}>{summary?.incidents.open ?? '-'}</span>
                <span style={{ color: Colors.muted, marginTop: 2, fontSize: 12, fontWeight: 600 }}>Open incidents</span>
              </div>
              <div style={statCard}>
                <span style={{ color: Colors.primary, fontWeight: 800, fontSize: 24 }}>{summary?.notifications.unread ?? '-'}</span>
                <span style={{ color: Colors.muted, marginTop: 2, fontSize: 12, fontWeight: 600 }}>Unread alerts</span>
              </div>
            </div>

            <div style={card}>
              <p style={cardTitle}>Detection service</p>
              <p style={cardText}>
                {detectionStatus
                  ? `${detectionStatus.enabled ? 'Enabled' : 'Disabled'} \u2022 ${detectionStatus.is_running ? 'Running' : 'Idle'}`
                  : 'Loading...'}
              </p>
              {summary && <p style={cardText}>False positive rate: {summary.incidents.false_positive_rate_pct}%</p>}
              {latestIncident && <p style={cardText}>Last event: {latestIncident.type} at {latestIncident.location || 'Unknown'}</p>}
            </div>

            <div style={card}>
              <p style={cardTitle}>Weekly detection trend</p>
              {trends.length === 0
                ? <p style={cardText}>No trend data yet.</p>
                : trends.map((pt) => (
                    <p key={pt.date} style={cardText}>{pt.date}: {pt.total_detections} detections ({pt.false_positives} FP)</p>
                  ))
              }
            </div>
          </>
        )}

        {/* STUDENT VIEW */}
        {user?.role === 'student' && (
          <>
            {latestIncident && latestIncident.status !== 'resolved' && (
              <div style={threatBanner}>
                <span style={{ fontSize: 22 }}>🚨</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: 0 }}>Active alert in school</p>
                  <p style={{ color: '#FFD0D0', fontSize: 12, margin: '2px 0 0' }}>
                    {latestIncident.location || 'Location unknown'} · Stay in your room until ALL CLEAR
                  </p>
                </div>
              </div>
            )}

            <div style={card}>
              <p style={cardTitle}>If you see something dangerous</p>
              <div style={actionRow} onClick={() => navigate('/sos')}>
                <span style={{ fontSize: 20 }}>🆘</span>
                <div>
                  <p style={actionLabel}>Send SOS Alert</p>
                  <p style={actionSub}>Guards are notified with your location instantly</p>
                </div>
              </div>
              <div style={actionRow} onClick={() => alert('RUN if you have a safe exit.\nHIDE in a locked room, silence phone.\nFIGHT only as last resort.\n\nCall 112 when safe.')}>
                <span style={{ fontSize: 20 }}>🏃</span>
                <div>
                  <p style={actionLabel}>Run · Hide · Fight</p>
                  <p style={actionSub}>Tap to review your immediate action steps</p>
                </div>
              </div>
            </div>

            <div style={card}>
              <p style={cardTitle}>Be prepared</p>
              <div style={actionRow} onClick={() => navigate('/lessons')}>
                <span style={{ fontSize: 20 }}>📖</span>
                <div>
                  <p style={actionLabel}>Emergency Lessons</p>
                  <p style={actionSub}>Lockdown, evacuation, active threat response</p>
                </div>
              </div>
              <div style={actionRow} onClick={() => navigate('/first-aid')}>
                <span style={{ fontSize: 20 }}>🩹</span>
                <div>
                  <p style={actionLabel}>First Aid Guides</p>
                  <p style={actionSub}>CPR, bleeding, choking — step by step</p>
                </div>
              </div>
              <div style={actionRow} onClick={() => navigate('/map')}>
                <span style={{ fontSize: 20 }}>🚪</span>
                <div>
                  <p style={actionLabel}>Emergency Exits</p>
                  <p style={actionSub}>Know your evacuation routes before you need them</p>
                </div>
              </div>
            </div>

            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>📞</span>
              <div>
                <p style={cardTitle}>Emergency: 112</p>
                <p style={cardText}>Kazakhstan emergency services — call if in immediate danger</p>
              </div>
            </div>
          </>
        )}

        {user?.role !== 'student' && (
          <>
            <button style={navBtn} onClick={() => navigate('/first-aid')}>First Aid guides</button>
            <button style={navBtn} onClick={() => navigate('/lessons')}>Lessons and emergency training</button>
          </>
        )}

        <button
          onClick={logout}
          style={{ ...navBtn, background: '#9155C4', marginTop: 14 }}
        >
          Log out
        </button>
      </div>
    </ScreenShell>
  );
};

const statCard: React.CSSProperties = {
  flex: 1, background: '#fff', borderRadius: 12, padding: 12,
  border: `1px solid ${Colors.border}`, display: 'flex', flexDirection: 'column',
};
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 12,
  border: `1px solid ${Colors.border}`, marginBottom: 10,
};
const cardTitle: React.CSSProperties = { color: Colors.text, fontWeight: 700, margin: '0 0 2px' };
const cardText: React.CSSProperties = { color: '#4A4A56', fontSize: 12, margin: '2px 0' };
const navBtn: React.CSSProperties = {
  width: '100%', background: Colors.primary, padding: 16, borderRadius: 12,
  border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 10, fontSize: 14,
};
const threatBanner: React.CSSProperties = {
  background: '#E05C5C', borderRadius: 12, padding: 14,
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
};
const actionRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
  borderBottom: `1px solid ${Colors.border}`, cursor: 'pointer',
};
const actionLabel: React.CSSProperties = { color: Colors.text, fontWeight: 700, fontSize: 14, margin: 0 };
const actionSub: React.CSSProperties = { color: Colors.muted, fontSize: 12, margin: '1px 0 0' };
