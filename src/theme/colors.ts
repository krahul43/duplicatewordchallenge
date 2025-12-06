export const colors = {
  primary: '#0B6FFF',
  secondary: '#FF8A00',
  background: '#F6F7FB',
  surface: '#FFFFFF',
  text: '#0F1724',
  muted: '#6B7280',
  success: '#10B981',
  error: '#EF4444',
  tile: '#FBE8C8',
  tileText: '#2B2B2B',

  premium: {
    doubleLetter: '#BEE3FF',
    tripleLetter: '#6AA6FF',
    doubleWord: '#FFD6EA',
    tripleWord: '#FF5C7A',
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
