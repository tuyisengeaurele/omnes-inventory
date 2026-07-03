// Pulls the brand palette out of logo.png so the apps never hardcode colors
// that drift from the actual logo. Run with: npx tsx scripts/extract-theme.ts
//
// Output goes to packages/shared/src/theme.json. If a color pair fails WCAG AA
// contrast we nudge lightness (never hue) until it passes and log the change.

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const LOGO = path.resolve('logo.png');
const OUT = path.resolve('packages/shared/src/theme.json');

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = h / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const chan = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(chan(hn + 1 / 3) * 255),
    g: Math.round(chan(hn) * 255),
    b: Math.round(chan(hn - 1 / 3) * 255),
  };
}

function hex({ r, g, b }: RGB): string {
  const p = (v: number) => v.toString(16).padStart(2, '0');
  return `#${p(r)}${p(g)}${p(b)}`;
}

// WCAG relative luminance and contrast ratio
function luminance({ r, g, b }: RGB): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: RGB, b: RGB): number {
  const la = luminance(a),
    lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Moves lightness toward the direction that raises contrast against bg,
// leaves hue and saturation alone. Reports what it did.
function ensureContrast(fg: RGB, bg: RGB, target: number, label: string): RGB {
  if (contrast(fg, bg) >= target) return fg;
  const hsl = rgbToHsl(fg);
  const bgIsDark = luminance(bg) < 0.5;
  const original = hsl.l;
  let candidate = { ...hsl };
  for (let i = 0; i < 100; i++) {
    candidate = { ...candidate, l: candidate.l + (bgIsDark ? 0.01 : -0.01) };
    candidate.l = Math.min(1, Math.max(0, candidate.l));
    if (contrast(hslToRgb(candidate), bg) >= target) break;
  }
  const adjusted = hslToRgb(candidate);
  console.log(
    `  adjusted ${label}: lightness ${(original * 100).toFixed(0)}% -> ${(candidate.l * 100).toFixed(0)}% ` +
      `(contrast ${contrast(fg, bg).toFixed(2)} -> ${contrast(adjusted, bg).toFixed(2)}, target ${target})`,
  );
  return adjusted;
}

async function main() {
  const { data, info } = await sharp(LOGO)
    .resize(400, null, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // group saturated pixels into 15 degree hue buckets, weighted by chroma,
  // so the gray backdrop and soft glow do not pollute the result
  const buckets = new Map<number, { weight: number; r: number; g: number; b: number }>();
  const lights: RGB[] = [];
  const darks: RGB[] = [];

  for (let i = 0; i < data.length; i += info.channels) {
    const px = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const chroma = Math.max(px.r, px.g, px.b) - Math.min(px.r, px.g, px.b);
    const { h, s, l } = rgbToHsl(px);

    // the navy wordmark is dark but still saturated, so sample darks by
    // lightness alone before the chroma cutoff throws them out. Dark pixels
    // that are also colorful still count toward the hue families below,
    // otherwise the deep end of the ring gradient goes missing.
    if (l < 0.25) darks.push(px);
    if (chroma < 24) {
      if (l > 0.82) lights.push(px); // cream face of the box
      continue;
    }
    if (s < 0.25 || l < 0.12 || l > 0.95) continue;

    const key = Math.floor(h / 15);
    const entry = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 };
    entry.weight += chroma;
    entry.r += px.r * chroma;
    entry.g += px.g * chroma;
    entry.b += px.b * chroma;
    buckets.set(key, entry);
  }

  // merge adjacent buckets into hue families
  const sorted = [...buckets.entries()].sort((a, b) => b[1].weight - a[1].weight);
  const families: { hueKey: number; weight: number; color: RGB }[] = [];
  for (const [key, e] of sorted) {
    const near = families.find((f) => Math.abs(f.hueKey - key) <= 1 || Math.abs(f.hueKey - key) >= 23);
    const color = {
      r: Math.round(e.r / e.weight),
      g: Math.round(e.g / e.weight),
      b: Math.round(e.b / e.weight),
    };
    if (near) {
      if (e.weight > near.weight) Object.assign(near, { hueKey: key, weight: near.weight + e.weight, color });
      else near.weight += e.weight;
    } else {
      families.push({ hueKey: key, weight: e.weight, color });
    }
  }

  if (families.length < 2) {
    throw new Error('expected at least two hue families in the logo, check logo.png');
  }

  const avg = (list: RGB[], fallback: RGB): RGB =>
    list.length === 0
      ? fallback
      : {
          r: Math.round(list.reduce((n, p) => n + p.r, 0) / list.length),
          g: Math.round(list.reduce((n, p) => n + p.g, 0) / list.length),
          b: Math.round(list.reduce((n, p) => n + p.b, 0) / list.length),
        };

  const primary = families[0].color;
  const secondary = families[1].color;
  // accent: third family when the logo has one, otherwise a brighter cut of the secondary
  const accent =
    families.length >= 3
      ? families[2].color
      : hslToRgb({ ...rgbToHsl(secondary), l: Math.min(0.7, rgbToHsl(secondary).l + 0.15) });

  // backgrounds: keep the hue of the dark wordmark but push it to app-shell depths
  const darkBase = rgbToHsl(avg(darks, { r: 22, g: 34, b: 54 }));
  const lightBase = rgbToHsl(avg(lights, { r: 245, g: 240, b: 232 }));
  const neutralDark = hslToRgb({ h: darkBase.h, s: Math.min(darkBase.s, 0.45), l: 0.07 });
  const neutralDarkRaised = hslToRgb({ h: darkBase.h, s: Math.min(darkBase.s, 0.4), l: 0.11 });
  const neutralLight = hslToRgb({ h: lightBase.h, s: Math.min(lightBase.s, 0.3), l: 0.96 });

  console.log('extracted from logo.png:');
  console.log(`  primary   ${hex(primary)}`);
  console.log(`  secondary ${hex(secondary)}`);
  console.log(`  accent    ${hex(accent)}`);
  console.log(`  dark      ${hex(neutralDark)} / raised ${hex(neutralDarkRaised)}`);
  console.log(`  light     ${hex(neutralLight)}`);

  console.log('contrast checks (WCAG AA):');
  const text = ensureContrast(neutralLight, neutralDark, 4.5, 'text on dark');
  const primaryOnDark = ensureContrast(primary, neutralDark, 4.5, 'primary on dark');
  const secondaryOnDark = ensureContrast(secondary, neutralDark, 4.5, 'secondary on dark');
  const accentOnDark = ensureContrast(accent, neutralDark, 4.5, 'accent on dark');
  if (
    text === neutralLight &&
    primaryOnDark === primary &&
    secondaryOnDark === secondary &&
    accentOnDark === accent
  ) {
    console.log('  all pairs pass without adjustment');
  }

  const theme = {
    source: 'logo.png',
    colors: {
      primary: hex(primary),
      secondary: hex(secondary),
      accent: hex(accent),
      neutralDark: hex(neutralDark),
      neutralDarkRaised: hex(neutralDarkRaised),
      neutralLight: hex(neutralLight),
    },
    // safe-on-dark variants, lightness-corrected where the raw color fell short of AA
    onDark: {
      text: hex(text),
      primary: hex(primaryOnDark),
      secondary: hex(secondaryOnDark),
      accent: hex(accentOnDark),
    },
  };

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(theme, null, 2) + '\n');
  console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
