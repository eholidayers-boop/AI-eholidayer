import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'bg-subtle': 'var(--color-bg-subtle)',
        fg: 'var(--color-fg)',
        'fg-muted': 'var(--color-fg-muted)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-soft': 'var(--color-accent-soft)',
        warn: 'var(--color-warn)',
        error: 'var(--color-error)',
        success: 'var(--color-success)'
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
