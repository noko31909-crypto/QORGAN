import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../theme';

type Props = {
  title: string;
  showBack?: boolean;
  showBell?: boolean;
  onBell?: () => void;
  children: React.ReactNode;
};

export const ScreenShell = ({ title, showBack = true, showBell = true, onBell, children }: Props) => {
  const navigation = useNavigation<any>();
  const canGoBack = showBack && navigation.canGoBack();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable hitSlop={10} onPress={() => navigation.goBack()} style={styles.leftBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>
        ) : (
          <View style={styles.leftBtn} />
        )}
        <Text style={styles.title}>{title}</Text>
        {showBell ? (
          <Pressable
            hitSlop={10}
            onPress={onBell || (() => navigation.navigate('Alerts'))}
            style={styles.bell}
          >
            <Ionicons name="notifications" size={18} color={Colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.leftBtn} />
        )}
      </View>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.accent, fontWeight: '800', fontSize: 22 },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
  },
});
