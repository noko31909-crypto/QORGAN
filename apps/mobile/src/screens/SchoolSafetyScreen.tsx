import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { API_BASE_URL } from '../services/network';
import { ScreenShell } from '../components/ScreenShell';
import { Toggle } from '../components/Toggle';
import { Incident } from '../types';
import { Colors, Radius } from '../theme';
import { socketService } from '../services/socket';

export const SchoolSafetyScreen = () => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [cameraStatuses, setCameraStatuses] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [locationShare, setLocationShare] = useState(false);
  const [geofencing, setGeofencing] = useState(true);
  const [inactivity, setInactivity] = useState(true);
  const [errorText, setErrorText] = useState('');

  const streamHost = API_BASE_URL.replace(/\/api$/, '');
  const activeCamId = selectedCameraId ?? cameras[0]?.id;
  const feedUri = token && activeCamId
    ? `${streamHost}/api/video-feed/${activeCamId}?token=${encodeURIComponent(token)}`
    : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cams, status, inc] = await Promise.all([
        api.getCameras(),
        api.getCamerasStatus(),
        api.getIncidents({ limit: 10 }),
      ]);
      setCameras(cams);
      setCameraStatuses(status);
      setIncidents(inc);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    AsyncStorage.getItem('auth_token').then((v) => setToken(v || ''));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const unsub = socketService.onWeaponAlert(() => load());
    return unsub;
  }, [load]);

  const handleStartCamera = async (cameraId: number) => {
    try {
      await api.startCamera(cameraId);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to start camera');
    }
  };

  const handleStopCamera = async (cameraId: number) => {
    try {
      await api.stopCamera(cameraId);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to stop camera');
    }
  };

  const isRunning = (cameraId: number) => {
    return cameraStatuses.find((c) => c.id === cameraId)?.is_running ?? false;
  };

  const unknownCount = incidents.filter((i) => i.type === 'weapon_detected').length;
  const safeScale = Math.max(0, 100 - unknownCount * 15);

  return (
    <ScreenShell title="School Safety">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* Camera selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {cameras.map((cam: any) => {
            const running = isRunning(cam.id);
            const isSelected = activeCamId === cam.id;
            return (
              <View key={cam.id} style={styles.cameraRow}>
                <Pressable
                  onPress={() => setSelectedCameraId(cam.id)}
                  style={[styles.cameraBtn, isSelected && styles.cameraBtnSelected]}
                >
                  <Text style={[styles.cameraText, isSelected && styles.cameraTextSelected]}>
                    {cam.name}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => (running ? handleStopCamera(cam.id) : handleStartCamera(cam.id))}
                  style={[styles.toggleCameraBtn, running ? styles.toggleCameraStop : styles.toggleCameraStart]}
                >
                  <Text style={styles.toggleCameraText}>{running ? 'Stop' : 'Start'}</Text>
                </Pressable>
                <Text style={[styles.cameraStatusText, running ? styles.statusOn : styles.statusOff]}>
                  {running ? '● ON' : '○ OFF'}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <View style={styles.preview}>
          {feedUri ? (
            <WebView
              source={{ uri: feedUri }}
              style={styles.previewInner}
              originWhitelist={['*']}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
            />
          ) : (
            <View style={[styles.previewInner, styles.previewFallback]}>
              <Ionicons name="videocam-off" size={32} color={Colors.muted} />
              <Text style={styles.previewText}>
                {token
                  ? 'Select a camera and press Start to monitor.'
                  : 'No active camera'}
              </Text>
            </View>
          )}
        </View>

        {/* Active cameras count */}
        <View style={styles.statCard}>
          <Ionicons name="videocam" size={20} color={Colors.accent} />
          <Text style={styles.statText}>
            Active: {cameras.filter((c) => isRunning(c.id)).length} / {cameras.length}
          </Text>
        </View>

        <AlertBar icon="flame" text={`CCTV captured ${unknownCount || 0} unknown persons.`} />
        <AlertBar icon="alert-circle" text="Room 6 door and window open" />

        <View style={styles.tilesRow}>
          <Tile
            icon="location"
            label="Location Sharing"
            value={locationShare}
            onChange={setLocationShare}
          />
          <Tile
            icon="locate"
            label="Device Geofencing"
            value={geofencing}
            onChange={setGeofencing}
          />
          <Tile
            icon="phone-portrait"
            label="Inactivity Tracking"
            value={inactivity}
            onChange={setInactivity}
          />
        </View>

        <View style={styles.contactBar}>
          <Pressable style={styles.contactItem} onPress={() => Linking.openURL('tel:103')}>
            <Ionicons name="medkit" size={18} color={Colors.white} />
            <Text style={styles.contactLabel}>
              Ambulance: <Text style={styles.contactValue}>103</Text>
            </Text>
          </Pressable>
          <View style={styles.contactDivider} />
          <Pressable style={styles.contactItem} onPress={() => Linking.openURL('tel:102')}>
            <Ionicons name="shield" size={18} color={Colors.white} />
            <Text style={styles.contactLabel}>
              Police: <Text style={styles.contactValue}>102</Text>
            </Text>
          </Pressable>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="happy" size={20} color={Colors.accent} />
          <Text style={styles.statText}>safe scale {safeScale}%</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="person" size={20} color={Colors.accent} />
          <Text style={styles.statText}>{unknownCount || 0} strange</Text>
        </View>
      </ScrollView>
    </ScreenShell>
  );
};

const AlertBar = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.alertBar}>
    <Ionicons name={icon} size={18} color={Colors.accent} />
    <Text style={styles.alertText}>{text}</Text>
  </View>
);

const Tile = ({
  icon,
  label,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <View style={styles.tile}>
    <Ionicons name={icon} size={28} color={Colors.accent} />
    <Text style={styles.tileLabel} numberOfLines={2}>
      {label}
    </Text>
    <Toggle value={value} onChange={onChange} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 30, gap: 12 },
  preview: {
    height: 180,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewInner: { flex: 1, backgroundColor: '#DDDDE2' },
  previewFallback: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  previewText: { color: Colors.muted, fontWeight: '600', textAlign: 'center' },
  errorText: { color: '#B00020', fontWeight: '700', marginBottom: 6 },

  cameraRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 4 },
  cameraBtn: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FFF',
  },
  cameraBtnSelected: { borderColor: '#2F855A', backgroundColor: '#C6F6D5' },
  cameraText: { color: Colors.text, fontWeight: '700', fontSize: 12 },
  cameraTextSelected: { color: '#2F855A' },
  toggleCameraBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginLeft: 4 },
  toggleCameraStart: { backgroundColor: '#38A169' },
  toggleCameraStop: { backgroundColor: '#E53E3E' },
  toggleCameraText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  cameraStatusText: { fontSize: 11, marginLeft: 4 },
  statusOn: { color: '#E53E3E' },
  statusOff: { color: '#A0AEC0' },

  alertBar: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: { color: Colors.white, fontWeight: '600', flex: 1, fontSize: 13 },

  tilesRow: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    minHeight: 120,
  },
  tileLabel: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },

  contactBar: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  contactDivider: { width: 1, height: 24, backgroundColor: Colors.primaryLight },
  contactLabel: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  contactValue: { color: Colors.accent, fontWeight: '800' },

  statCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
