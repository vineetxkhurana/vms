import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        background: '#050d1a',
        surface: '#0c1629',
        'surface-card': 'rgba(10,20,45,0.7)',
        'surface-elevated': 'rgba(10,20,45,0.9)',
        'surface-container-lowest': 'rgba(8,16,36,0.85)',
        'surface-container-low': 'rgba(10,20,45,0.55)',
        'surface-container': 'rgba(10,20,45,0.65)',
        primary: '#00c2ff',
        'primary-dark': '#0077ff',
        'primary-container': 'rgba(0,194,255,0.12)',
        'on-primary': '#ffffff',
        secondary: '#00e5a0',
        'secondary-container': 'rgba(0,229,160,0.14)',
        'on-secondary-container': '#00e5a0',
        tertiary: '#7c3aed',
        'on-surface': '#e8f4fd',
        'on-surface-muted': '#8fafc7',
        'on-surface-variant': '#8fafc7',
        border: 'rgba(0,194,255,0.15)',
        'border-glow': 'rgba(0,194,255,0.4)',
        'outline-variant': 'rgba(0,194,255,0.12)',
        error: '#ef4444',
        'error-container': 'rgba(239,68,68,0.12)',
        'on-error': '#ffffff',
      },
    },
  },
  plugins: [],
}
export default config
