import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../theme';

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  onColor?: string;
};

export const Toggle = ({ value, onChange, onColor = Colors.success }: Props) => (
  <Pressable
    onPress={() => onChange(!value)}
    style={[styles.track, { backgroundColor: value ? onColor : '#C9C4D6' }]}
  >
    <View style={[styles.thumb, { transform: [{ translateX: value ? 18 : 0 }] }]} />
  </Pressable>
);

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
});
