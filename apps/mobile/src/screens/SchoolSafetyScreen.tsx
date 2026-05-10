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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [locationShare, setLocationShare] = useState(false);
  const [geofencing, setGeofencing] = useState(true);
  const [inactivity, setInactivity] = useState(true);

  const streamHost = API_BASE_URL.replace(/\/api$/, '');
  const primaryCameraId = cameras[0]?.id;
  const feedUri = token && primaryCameraId
    ? `${streamHost}/api/video-feed/${primaryCameraId}?token=${encodeURIComponent(token)}`
    : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cams, inc] = await Promise.all([
        api.getCameras(),
        api.getIncidents({ limit: 10 }),
      ]);
      setCameras(cams);
      setIncidents(inc);
    } catch {
      // tolerant on first launch
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

  const unknownCount = incidents.filter((i) => i.type === 'weapon_detected').length;
  const safeScale = Math.max(0, 100 - unknownCount * 15);

  return (
    <ScreenShell title="School Safety">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
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
              <Text style={styles.previewText}>No active camera</Text>
            </View>
          )}
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
  previewText: { color: Colors.muted, fontWeight: '600' },

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
