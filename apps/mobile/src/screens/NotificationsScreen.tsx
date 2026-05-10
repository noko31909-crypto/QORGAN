import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { ScreenShell } from '../components/ScreenShell';
import { Colors, Radius } from '../theme';
import { socketService } from '../services/socket';

type Section = { title: string; data: NotificationItem[] };

const groupNotifications = (items: NotificationItem[]): Section[] => {
  const now = new Date();
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const weekend: NotificationItem[] = [];
  const older: NotificationItem[] = [];

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now);
  const yStart = new Date(todayStart.getTime() - 86400_000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400_000);

  items.forEach((n) => {
    const d = new Date(n.created_at);
    if (d >= todayStart) today.push(n);
    else if (d >= yStart) yesterday.push(n);
    else if (d >= weekStart) weekend.push(n);
    else older.push(n);
  });

  const sections: Section[] = [];
  if (today.length) sections.push({ title: 'Today', data: today });
  if (yesterday.length) sections.push({ title: 'Yesterday', data: yesterday });
  if (weekend.length) sections.push({ title: 'This Weekend', data: weekend });
  if (older.length) sections.push({ title: 'Earlier', data: older });
  return sections;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${hh}:${mm} - ${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
};

export const NotificationsScreen = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setItems(data);
      setErrorText('');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const unsub = socketService.onWeaponAlert(() => load());
    return unsub;
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const sections = useMemo(() => groupNotifications(items), [items]);

  const flatData = useMemo(() => {
    const list: ({ kind: 'header'; title: string } | { kind: 'item'; item: NotificationItem })[] = [];
    sections.forEach((s) => {
      list.push({ kind: 'header', title: s.title });
      s.data.forEach((item) => list.push({ kind: 'item', item }));
    });
    return list;
  }, [sections]);

  const onRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      await load();
    } catch {
      // non-critical
    }
  };

  return (
    <ScreenShell title="Notification">
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        data={flatData}
        keyExtractor={(row, i) => (row.kind === 'header' ? `h-${row.title}` : `n-${row.item.id}-${i}`)}
        ListHeaderComponent={errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No notifications yet.</Text> : null
        }
        renderItem={({ item }) => {
          if (item.kind === 'header') return <Text style={styles.section}>{item.title}</Text>;
          const n = item.item;
          return (
            <Pressable style={styles.row} onPress={() => onRead(n.id)}>
              <View style={styles.bell}>
                <Ionicons name="notifications" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, n.is_read && styles.readTitle]}>{n.title}</Text>
                <Text style={styles.message}>{n.message}</Text>
                <Text style={styles.time}>{formatTime(n.created_at)}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30 },
  section: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.text, fontWeight: '800', fontSize: 15 },
  readTitle: { color: Colors.muted, fontWeight: '600' },
  message: { color: Colors.textSoft, fontSize: 13, marginTop: 2 },
  time: { color: Colors.muted, fontSize: 11, marginTop: 4 },
  error: { color: '#B00020', fontWeight: '600', marginBottom: 8 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 24 },
});
