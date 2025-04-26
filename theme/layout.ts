export const layout = {
  buttonHeight: 48,
  buttonRadius: 12,
  inputHeight: 48,
  inputRadius: 10,
  iconSize: {
    small: 20,
    medium: 24,
  },
  cardPadding: 16,
  screenPadding: 20,
} as const;

export type LayoutToken = keyof typeof layout; 