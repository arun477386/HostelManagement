export const colors = {
  primary: '#4B9EFF',
  primaryLight: '#E8F2FF',
  accent: '#FFB84C',
  background: '#F9FAFB',
  cardBackground: '#FFFFFF',
  textPrimary: '#1E1E1E',
  textSecondary: '#606770',
  borderColor: '#E0E0E0',
  error: '#FF4C4C',
  success: '#4CAF50',
} as const;

export type ColorToken = keyof typeof colors; 