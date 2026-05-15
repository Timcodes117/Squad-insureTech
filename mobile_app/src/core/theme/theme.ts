// TODO: align tokens with design system / NativeWind theme extension.

export const theme = {
  colors: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    brand: '#2563eb',
    brandMuted: '#dbeafe',
  },
} as const;

export type Theme = typeof theme;
