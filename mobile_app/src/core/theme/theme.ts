// TODO: align tokens with design system / NativeWind theme extension.

export const theme = {
  colors: {
    background: '#ffffff',
    foreground: '#0a0a0a',
  },
} as const;

export type Theme = typeof theme;
