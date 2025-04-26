export const typography = {
  titleXL: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleLG: {
    fontSize: 20,
    fontWeight: '600',
  },
  textBase: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
  },
} as const;

export type TypographyToken = keyof typeof typography; 