export const Colors = {
  primary: '#6B2FBF',
  primaryDark: '#521F9C',
  primaryLight: '#8648D9',
  primarySoft: '#A98AE6',
  accent: '#F5C518',
  accentDark: '#D6A800',
  danger: '#E74C3C',
  dangerDark: '#B0322A',
  success: '#6FCF97',
  info: '#6FA8DC',
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F2F7',
  text: '#1F1F25',
  textSoft: '#3F3D56',
  muted: '#8B8A95',
  border: '#E6E2EF',
  inputBg: '#EFEDF3',
  white: '#FFFFFF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const Typography = {
  titleHeader: { fontSize: 22, fontWeight: '800' as const, color: Colors.accent },
  titleLarge: { fontSize: 34, fontWeight: '800' as const, color: Colors.primary },
  titleSection: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  body: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  caption: { fontSize: 12, fontWeight: '500' as const, color: Colors.muted },
  label: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSoft },
};
