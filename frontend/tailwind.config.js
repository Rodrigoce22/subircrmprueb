/** @type {import('tailwindcss').Config} */
import tailwindAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── shadcn CSS variable tokens ────────────────────────────────────────
        border:      'var(--border)',
        input:       'var(--input)',
        ring:        'var(--ring)',
        foreground:  'var(--foreground)',
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        muted:       { DEFAULT: 'var(--muted)',       foreground: 'var(--muted-foreground)' },
        accent:      { DEFAULT: 'var(--accent)',      foreground: 'var(--accent-foreground)' },
        popover:     { DEFAULT: 'var(--popover)',     foreground: 'var(--popover-foreground)' },

        // ── Obsidian Glass — complete Material Design 3 token set ─────────────
        background:           '#131313',
        surface:              '#131313',
        'surface-dim':        '#131313',
        'surface-bright':     '#3a3939',
        'surface-variant':    '#353534',
        'surface-lowest':     '#0e0e0e',
        'surface-container-lowest': '#0e0e0e',
        'surface-low':        '#1c1b1b',
        'surface-container-low':    '#1c1b1b',
        'surface-container':        '#201f1f',
        'surface-high':       '#2a2a2a',
        'surface-container-high':   '#2a2a2a',
        'surface-highest':    '#353534',
        'surface-container-highest':'#353534',
        'surface-tint':       '#aac7ff',

        // Primary scale
        'primary':                  '#aac7ff',
        'primary-container':        '#3e90ff',
        'primary-fixed':            '#d6e3ff',
        'primary-fixed-dim':        '#aac7ff',
        'on-primary':               '#003064',
        'on-primary-container':     '#002957',
        'on-primary-fixed':         '#001b3e',
        'on-primary-fixed-variant': '#00468d',
        'inverse-primary':          '#005db8',

        // Secondary scale
        'secondary':                '#c6c6cb',
        'secondary-container':      '#46464b',
        'secondary-fixed':          '#e3e2e7',
        'secondary-fixed-dim':      '#c6c6cb',
        'on-secondary':             '#2f3034',
        'on-secondary-container':   '#b5b4ba',
        'on-secondary-fixed':       '#1a1b1f',
        'on-secondary-fixed-variant':'#46464b',

        // Tertiary scale
        'tertiary':                 '#c6c6c7',
        'tertiary-container':       '#909191',
        'tertiary-fixed':           '#e2e2e2',
        'tertiary-fixed-dim':       '#c6c6c7',
        'on-tertiary':              '#2f3131',
        'on-tertiary-container':    '#282a2a',
        'on-tertiary-fixed':        '#1a1c1c',
        'on-tertiary-fixed-variant':'#454747',

        // Surface text
        'on-surface':               '#e5e2e1',
        'on-surface-variant':       '#c1c6d7',
        'on-background':            '#e5e2e1',
        'inverse-surface':          '#e5e2e1',
        'inverse-on-surface':       '#313030',

        // Outline
        'outline':                  '#8b90a0',
        'outline-variant':          '#414755',

        // Error
        'error':                    '#ffb4ab',
        'error-container':          '#93000a',
        'on-error':                 '#690005',
        'on-error-container':       '#ffdad6',

        // Legacy obs aliases
        obs: {
          base:    '#0e0e0e',
          low:     '#131313',
          mid:     '#201f1f',
          high:    '#2a2a2a',
          highest: '#353534',
          bright:  '#3a3939',
          primary: '#aac7ff',
          'primary-dim': '#3e90ff',
          on:      '#e5e2e1',
          'on-var':'#c1c6d7',
          muted:   '#8b90a0',
          cyan:    '#4cd6ff',
          amber:   '#ffb77f',
          success: '#aac7ff',
          error:   '#ffb4ab',
          'error-bg': '#93000a',
          outline: '#414755',
        }
      },
      fontFamily: {
        display:  ['Inter', 'system-ui', 'sans-serif'],
        sans:     ['Inter', 'system-ui', 'sans-serif'],
        headline: ['Inter', 'system-ui', 'sans-serif'],
        body:     ['Inter', 'system-ui', 'sans-serif'],
        label:    ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg:      '2rem',
        xl:      '3rem',
        full:    '9999px',
      },
      backgroundImage: {
        'primary-gradient':  'linear-gradient(135deg, #aac7ff 0%, #3e90ff 100%)',
        'obsidian-gradient': 'linear-gradient(135deg, #131313 0%, #1c1b1b 100%)',
      },
      boxShadow: {
        'ambient':      '0px 20px 40px rgba(0,0,0,0.4)',
        'ambient-sm':   '0px 10px 20px rgba(0,0,0,0.3)',
        'glow-primary': '0 0 20px rgba(170,199,255,0.25)',
        'glow-blue':    '0 0 20px rgba(62,144,255,0.3)',
        'edge':         '0px 4px 20px rgba(0,0,0,0.4)',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.2, 0, 0, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bloom': {
          '0%, 100%': { opacity: '0.05', transform: 'scale(1)' },
          '50%': { opacity: '0.1', transform: 'scale(1.05)' },
        },
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'bloom': 'bloom 4s ease-in-out infinite',
      },
    }
  },
  plugins: [tailwindAnimate],
};
