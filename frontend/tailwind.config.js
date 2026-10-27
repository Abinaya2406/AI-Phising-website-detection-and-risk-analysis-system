/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          darkest: '#050a14',
          bg: '#080e1c',
          card: '#0e182e',
          cardHover: '#13213f',
          border: '#1a2b52',
          borderGlow: '#00e5ff33',
          blue: '#1d4ed8',
          electric: '#2563eb',
          cyan: '#06b6d4',
          neonCyan: '#00f0ff',
          neonGreen: '#10b981',
          neonYellow: '#f59e0b',
          neonRed: '#ef4444',
          muted: '#8194b3',
          light: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'blue-glow': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'danger-glow': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'safe-glow': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.02)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'scan': 'scanline 4s linear infinite',
      },
    },
  },
  plugins: [],
};

