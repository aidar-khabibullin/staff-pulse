export const theme = {
  colors: {
    text: '#1a1a2e',
    textMuted: '#5b5f77',
    textDark: '#383b57',
    background: '#f6f7fb',
    surface: '#ffffff',
    border: '#e2e4ee',
    borderLight: '#d7d9e6',
    accent: '#4c5bd4',
    accentHover: '#eef0fb',
    accentSelected: '#e4e6f6',
    headerBackground: '#f0f1f9',
    neutralDot: '#adb0c4',
    success: '#2f9e44',
    successText: '#1f7a34',
    warning: '#f0a900',
    fallback: '#8a6100',
    danger: '#e03131',
    dangerText: '#b3261e',
    highlight: '#fff3bf',
  },
  radii: {
    sm: '0.35rem',
    md: '0.5rem',
    lg: '0.6rem',
    xl: '0.75rem',
  },
  font: {
    family: 'system-ui, sans-serif',
  },
} as const

export type AppTheme = typeof theme
