import type { Config } from 'tailwindcss';
import theme from '../../packages/shared/src/theme.json';

// palette comes from the logo via scripts/extract-theme.ts, nothing here is hand picked
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: theme.colors.neutralDark,
        raised: theme.colors.neutralDarkRaised,
        bone: theme.colors.neutralLight,
        blue: theme.onDark.primary,
        'blue-deep': theme.colors.primary,
        teal: theme.colors.secondary,
        green: theme.colors.accent,
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
