// Builds favicon PNGs from logo.png. Run with: npx tsx scripts/generate-favicons.ts
//
// The logo ships on an opaque gray backdrop, so we cannot just resize it.
// We flood fill from the image edges and drop every connected near-gray pixel,
// which leaves the ring, the box and the glow intact, then place the mark on
// the brand dark color from the extracted theme. Output goes to assets/brand,
// app workspaces copy from there into their public folders.

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import theme from '../packages/shared/src/theme.json';

const LOGO = path.resolve('logo.png');
const OUT_DIR = path.resolve('assets/brand');
const SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 512, name: 'icon-512.png' },
];

function hexToRgb(hexColor: string) {
  return {
    r: parseInt(hexColor.slice(1, 3), 16),
    g: parseInt(hexColor.slice(3, 5), 16),
    b: parseInt(hexColor.slice(5, 7), 16),
  };
}

async function main() {
  const meta = await sharp(LOGO).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;

  const { data, info } = await sharp(LOGO).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;

  // threshold sits between the soft glow (mostly below 45) and the navy
  // wordmark (around 65), so the fill eats the glow but stops at real ink
  const isBackdrop = (idx: number) => {
    const r = data[idx],
      g = data[idx + 1],
      b = data[idx + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    return chroma < 45;
  };

  // BFS from every border pixel; anything near-gray and connected to the
  // border is backdrop. The cream box face is also low chroma but it sits
  // inside the colored outline, so the fill never reaches it.
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];
  for (let x = 0; x < w; x++) {
    queue.push(x, (h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    queue.push(y * w, y * w + w - 1);
  }
  while (queue.length > 0) {
    const p = queue.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    if (!isBackdrop(p * ch)) continue;
    data[p * ch + 3] = 0;
    const x = p % w,
      y = Math.floor(p / w);
    if (x > 0) queue.push(p - 1);
    if (x < w - 1) queue.push(p + 1);
    if (y > 0) queue.push(p - w);
    if (y < h - 1) queue.push(p + w);
  }

  // bounding box of what survived, then pad it into a square
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * ch + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // only keep the mark (ring + box), which is the left part of the lockup.
  // there is a column gap between the ring and the wordmark, find it by
  // scanning column density from the left edge of the mark
  const density = (x: number) => {
    let n = 0;
    for (let y = minY; y <= maxY; y++) {
      if (data[(y * w + x) * ch + 3] > 0) n++;
    }
    return n;
  };
  let cutX = maxX;
  let gapRun = 0;
  for (let x = minX + Math.round((maxY - minY) * 0.5); x <= maxX; x++) {
    if (density(x) < (maxY - minY) * 0.02) {
      gapRun++;
      if (gapRun >= 8) {
        cutX = x - gapRun;
        break;
      }
    } else {
      gapRun = 0;
    }
  }
  maxX = cutX;

  // retighten the box vertically now that the wordmark is gone
  let top = maxY,
    bottom = minY;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (data[(y * w + x) * ch + 3] > 0) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        break;
      }
    }
  }
  minY = top;
  maxY = bottom;

  const side = Math.max(maxX - minX, maxY - minY);
  const pad = Math.round(side * 0.16);
  const box = side + pad * 2;
  const bg = hexToRgb(theme.colors.neutralDark);

  const mark = await sharp(data, { raw: { width: w, height: h, channels: ch as 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX, height: maxY - minY })
    .toBuffer();

  const markMeta = { width: maxX - minX, height: maxY - minY };

  mkdirSync(OUT_DIR, { recursive: true });
  for (const { size, name } of SIZES) {
    const inner = size - 2 * Math.max(1, Math.round((pad / box) * size));
    const scaled = await sharp(mark, {
      raw: { width: markMeta.width, height: markMeta.height, channels: 4 },
    })
      .resize(inner, inner, { fit: 'inside' })
      .png()
      .toBuffer();

    const out = await sharp({
      create: { width: size, height: size, channels: 4, background: { ...bg, alpha: 1 } },
    })
      .composite([{ input: scaled, gravity: 'centre' }])
      .png()
      .toBuffer();

    writeFileSync(path.join(OUT_DIR, name), out);
    console.log(`wrote assets/brand/${name}`);
  }

  // trimmed transparent mark at full resolution, handy for loading screens
  const markPng = await sharp(mark, {
    raw: { width: markMeta.width, height: markMeta.height, channels: 4 },
  })
    .png()
    .toBuffer();
  writeFileSync(path.join(OUT_DIR, 'mark.png'), markPng);
  console.log('wrote assets/brand/mark.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
