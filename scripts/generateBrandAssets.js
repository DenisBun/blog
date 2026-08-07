#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const publicDir = path.join(rootDir, 'public');
const publicImagesDir = path.join(publicDir, 'images');
const articleFallbackPath = path.join(rootDir, 'src/images/content/articles-fallback.jpg');

const paper = '#f5f4ed';
const ink = '#141413';
const muted = '#8a867c';
const border = '#c7c3b9';
const clay = '#d97757';

function monogramSvg(size, background = 'transparent') {
  const glyph = size <= 32 ? 'D' : 'DB';
  const fontSize = Math.round(size * (glyph.length === 1 ? 0.7 : 0.48));
  const lineWidth = Math.max(1, Math.round(size * 0.025));
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.08)}" fill="${background}"/>
      <text x="50%" y="48%" fill="${ink}" font-family="Georgia, serif" font-size="${fontSize}" font-style="italic" text-anchor="middle" dominant-baseline="middle">${glyph}</text>
      <line x1="${Math.round(size * 0.25)}" y1="${Math.round(size * 0.76)}" x2="${Math.round(size * 0.75)}" y2="${Math.round(size * 0.76)}" stroke="${clay}" stroke-width="${lineWidth}"/>
    </svg>
  `);
}

async function squareIcon(size, background = 'transparent') {
  return sharp(monogramSvg(size, background)).png().toBuffer();
}

function encodeIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size === 256 ? 0 : size, entry);
    header.writeUInt8(size === 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

function socialCardSvg(width, height) {
  const margin = Math.round(width * 0.075);
  const titleSize = Math.round(width * 0.066);
  const subtitleSize = Math.round(width * 0.025);
  const metaSize = Math.round(width * 0.014);
  const dotSize = Math.max(16, Math.round(width / 60));

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="dots" width="${dotSize}" height="${dotSize}" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="${border}" opacity=".62"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="${paper}"/>
      <rect width="${width}" height="${height}" fill="url(#dots)"/>
      <line x1="${margin}" y1="${margin}" x2="${width - margin}" y2="${margin}" stroke="${border}"/>
      <text x="${margin}" y="${margin + metaSize * 2.6}" fill="${muted}" font-family="monospace" font-size="${metaSize}" letter-spacing="${Math.round(metaSize * 0.16)}">PERSONAL BLOG · EN / RU</text>
      <text x="${margin}" y="${Math.round(height * 0.5)}" fill="${ink}" font-family="Georgia, serif" font-size="${titleSize}" font-style="italic">Denis Bunchenko</text>
      <text x="${margin}" y="${Math.round(height * 0.61)}" fill="${muted}" font-family="Georgia, serif" font-size="${subtitleSize}" font-style="italic">Notes, experiments, and things worth remembering.</text>
      <line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" stroke="${border}"/>
      <text x="${margin}" y="${height - margin - metaSize * 1.3}" fill="${muted}" font-family="monospace" font-size="${metaSize}">DENISBUNCHENKO.COM</text>
      <line x1="${width - margin - titleSize * 1.4}" y1="${height - margin - metaSize * 1.5}" x2="${width - margin}" y2="${height - margin - metaSize * 1.5}" stroke="${clay}" stroke-width="${Math.max(2, Math.round(width / 500))}"/>
    </svg>
  `);
}

async function socialCard(width, height) {
  return sharp(socialCardSvg(width, height)).png().toBuffer();
}

await fs.mkdir(publicImagesDir, { recursive: true });
await fs.mkdir(path.dirname(articleFallbackPath), { recursive: true });

await fs.writeFile(path.join(publicDir, 'favicon-96x96.png'), await squareIcon(96));
await fs.writeFile(path.join(publicDir, 'apple-touch-icon.png'), await squareIcon(180, paper));
await fs.writeFile(path.join(publicDir, 'web-app-manifest-192x192.png'), await squareIcon(192, paper));
await fs.writeFile(path.join(publicDir, 'web-app-manifest-512x512.png'), await squareIcon(512, paper));

const icoImages = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await squareIcon(size) })));
await fs.writeFile(path.join(publicDir, 'favicon.ico'), encodeIco(icoImages));

await fs.writeFile(path.join(publicImagesDir, 'og.png'), await socialCard(1200, 630));
await fs.writeFile(path.join(publicImagesDir, 'x.png'), await socialCard(1600, 900));
await fs.writeFile(path.join(publicImagesDir, 'structured-preview.png'), await socialCard(1920, 1080));

const articleCard = await socialCard(1600, 900);
await sharp(articleCard).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toFile(articleFallbackPath);

console.log('Generated editorial favicon, manifest, social-preview, and article-fallback assets.');
