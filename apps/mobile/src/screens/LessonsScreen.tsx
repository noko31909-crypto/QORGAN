import React from 'react';
import { ScrollView, Text, StyleSheet, View, TextInput } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

export const LessonsScreen = () => (
  <ScreenShell title="Lessons">
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.tip}>Use the following guides or lessons to learn how to act in dangerous situations.</Text>
      <TextInput placeholder="Search lessons..." style={styles.search} />
      <View style={styles.list}>
        {['Fire Safety', 'Earthquake Preparedness', 'Lockdown Procedures', 'Emergency Exits', 'First Responder Contact', 'Basic First Aid'].map((item) => (
          <View key={item} style={styles.lesson}>
            <Text style={styles.item}>{item}</Text>
            <Text style={styles.small}>Know how to react fast</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  </ScreenShell>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  tip: { color: '#C4B93A', textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  search: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1.4, borderColor: Colors.primary, padding: 12, marginBottom: 14 },
  list: { gap: 9 },
  lesson: { backgroundColor: Colors.primary, borderRadius: 11, padding: 12 },
  item: { color: '#fff', fontWeight: '700' },
  small: { color: '#E7D8FF', marginTop: 2, fontSize: 12 },
});
