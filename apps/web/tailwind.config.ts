import type { Config, PluginAPI } from 'tailwindcss/types/config';
import theme from '../../packages/shared/src/theme.json';

// same palette source as the marketing site, exposed as css variables so a
// per-tenant override later only has to swap variable values. Variables hold
// raw rgb channels so tailwind opacity modifiers still work.
function channels(hex: string): string {
  return [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)]
    .map((pair) => parseInt(pair, 16))
    .join(' ');
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        raised: 'rgb(var(--color-raised) / <alpha-value>)',
        bone: 'rgb(var(--color-bone) / <alpha-value>)',
        blue: 'rgb(var(--color-primary) / <alpha-value>)',
        teal: 'rgb(var(--color-secondary) / <alpha-value>)',
        green: 'rgb(var(--color-accent) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [
    function themeVariables({ addBase }: PluginAPI) {
      addBase({
        ':root': {
          '--color-ink': channels(theme.colors.neutralDark),
          '--color-raised': channels(theme.colors.neutralDarkRaised),
          '--color-bone': channels(theme.colors.neutralLight),
          '--color-primary': channels(theme.onDark.primary),
          '--color-secondary': channels(theme.onDark.secondary),
          '--color-accent': channels(theme.onDark.accent),
        },
      });
    },
  ],
} satisfies Config;
