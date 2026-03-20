import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

export const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  return (
    <ScreenShell title="School Safety">
      <View style={styles.container}>
        <Text style={styles.subtitle}>Guard mode: {user?.role}</Text>
        {user?.role === 'guard' && (
          <Pressable style={styles.card} onPress={() => navigation.navigate('SchoolSafety')}><Text style={styles.cardText}>CCTV and school dashboard</Text></Pressable>
        )}
        <Pressable style={styles.card} onPress={() => navigation.navigate('FirstAid')}><Text style={styles.cardText}>First Aid guides</Text></Pressable>
        <Pressable style={styles.card} onPress={() => navigation.navigate('Lessons')}><Text style={styles.cardText}>Lessons and emergency training</Text></Pressable>
        <Pressable style={styles.alert} onPress={logout}><Text style={styles.cardText}>Log out</Text></Pressable>
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  subtitle: { color: Colors.muted, marginBottom: 14, fontWeight: '600' },
  card: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, marginBottom: 10 },
  alert: { backgroundColor: '#9155C4', padding: 16, borderRadius: 12, marginTop: 14 },
  cardText: { color: '#fff', fontWeight: '700' },
});
