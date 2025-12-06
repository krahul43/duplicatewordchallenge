export const colors = {
  primary: '#3E7BC4',
  secondary: '#E85D4D',
  accent: '#4DB5BC',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#2B2B2B',
  muted: '#6B7280',
  success: '#4DB5BC',
  error: '#E85D4D',
  warning: '#F6C445',

  tile: '#E8B861',
  tileText: '#2B2B2B',
  tileBorder: '#D4A853',

  splash: {
    blue: '#3E7BC4',
    darkBlue: '#2E5F9E',
  },

  button: {
    primary: '#4DB5BC',
    secondary: '#E85D4D',
    outline: '#CCCCCC',
    text: '#FFFFFF',
  },

  premium: {
    doubleLetter: '#A7D8F0',
    tripleLetter: '#4DB5BC',
    doubleWord: '#FFB3B3',
    tripleWord: '#E85D4D',
  },

  board: {
    background: '#E8E8E8',
    grid: '#D0D0D0',
  },

  dark: {
    background: '#0F1724',
    surface: '#1A2332',
    text: '#F6F7FB',
    muted: '#9CA3AF',
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 29,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};
