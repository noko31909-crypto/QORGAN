import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

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

  useEffect(() => { load(); }, [load]);

  const onRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      await load();
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to update notification.');
    }
  };

  return (
    <ScreenShell title="Notification">
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        ListEmptyComponent={<Text style={{ color: Colors.muted }}>No notifications</Text>}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, item.is_read && styles.read]} onPress={() => onRead(item.id)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </Pressable>
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  read: { opacity: 0.6 },
  error: { color: '#B00020', marginBottom: 10, fontWeight: '600' },
  title: { color: Colors.text, fontWeight: '700', marginBottom: 4 },
  message: { color: '#4A4A56' },
});
