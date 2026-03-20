import React from 'react';
import { ScrollView, Text, StyleSheet, View, TextInput } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { Colors } from '../theme';

export const FirstAidScreen = () => (
  <ScreenShell title="First Aid">
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.tip}>Use the following guides to help someone in case of an emergency!</Text>
      <TextInput placeholder="Search a symptom/procedure" placeholderTextColor={Colors.muted} style={styles.search} />
      <View style={styles.grid}>
        {['Control Bleeding', 'Dog Bite', 'Seizures', 'CPR (Heart Beating Stop)', 'Choking', 'Burns'].map((item) => (
          <View key={item} style={styles.tile}><Text style={styles.item}>{item}</Text></View>
        ))}
      </View>
    </ScrollView>
  </ScreenShell>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  tip: { color: '#C4B93A', textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  search: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1.4, borderColor: Colors.primary, padding: 12, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47%', minHeight: 86, borderRadius: 14, backgroundColor: '#F4EFFF', padding: 10, justifyContent: 'flex-end' },
  item: { color: Colors.text, fontWeight: '700' },
});
