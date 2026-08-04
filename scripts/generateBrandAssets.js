#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const sourcePath = path.join(rootDir, 'src/images/brand/computer.png');
const publicDir = path.join(rootDir, 'public');
const publicImagesDir = path.join(publicDir, 'images');
const articleFallbackPath = path.join(rootDir, 'src/images/content/articles-fallback.jpg');

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const desktopTeal = { r: 0, g: 128, b: 128, alpha: 1 };

async function mark(size, ratio = 0.84) {
  const inset = Math.round(size * ratio);
  return sharp(sourcePath).trim({ background: transparent }).resize({ width: inset, height: inset, fit: 'contain', kernel: sharp.kernel.nearest, background: transparent }).png().toBuffer();
}

async function squareIcon(size, background = transparent, ratio = 0.84) {
  const computer = await mark(size, ratio);
  const metadata = await sharp(computer).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([
      {
        input: computer,
        left: Math.floor((size - (metadata.width || size)) / 2),
        top: Math.floor((size - (metadata.height || size)) / 2),
      },
    ])
    .png()
    .toBuffer();
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

const glyphs = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00110', '00110'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function pixelText(text, x, y, scale, color) {
  const rectangles = [];
  for (const [characterIndex, character] of [...text.toUpperCase()].entries()) {
    const rows = glyphs[character] || glyphs[' '];
    rows.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel === '1') {
          rectangles.push(`<rect x="${x + (characterIndex * 6 + columnIndex) * scale}" y="${y + rowIndex * scale}" width="${scale}" height="${scale}" fill="${color}"/>`);
        }
      });
    });
  }
  return rectangles.join('');
}

function cardSvg(width, height, title = 'Denis Bunchenko', subtitle = 'Personal blog') {
  const margin = Math.round(width * 0.055);
  const titleHeight = Math.round(height * 0.095);
  const contentX = margin + Math.round(width * 0.06);
  const mainScale = Math.max(5, Math.round(width / 190));
  const subtitleScale = Math.max(3, Math.round(width / 310));
  const smallScale = Math.max(2, Math.round(width / 600));

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#008080"/>
      <path d="M0 0h${width}v${height}H0z" fill="none" stroke="#ffffff" stroke-opacity=".06" stroke-width="2" stroke-dasharray="8 8"/>
      <rect x="${margin + 8}" y="${margin + 10}" width="${width - margin * 2}" height="${height - margin * 2}" fill="#003f3f" opacity=".35"/>
      <rect x="${margin}" y="${margin}" width="${width - margin * 2}" height="${height - margin * 2}" fill="#c0c0c0" stroke="#000" stroke-width="4"/>
      <path d="M${margin + 4} ${margin + 4}H${width - margin - 4} M${margin + 4} ${margin + 4}V${height - margin - 4}" stroke="#fff" stroke-width="4"/>
      <rect x="${margin + 8}" y="${margin + 8}" width="${width - margin * 2 - 16}" height="${titleHeight}" fill="#000080"/>
      ${pixelText('DENISBUNCHENKO.COM', margin + 24, margin + 22, smallScale, '#fff')}
      ${pixelText(title, contentX, Math.round(height * 0.42), mainScale, '#000')}
      ${pixelText(subtitle, contentX, Math.round(height * 0.56), subtitleScale, '#000')}
      <line x1="${contentX}" y1="${Math.round(height * 0.67)}" x2="${Math.round(width * 0.62)}" y2="${Math.round(height * 0.67)}" stroke="#808080" stroke-width="3"/>
      <line x1="${contentX}" y1="${Math.round(height * 0.67) + 3}" x2="${Math.round(width * 0.62)}" y2="${Math.round(height * 0.67) + 3}" stroke="#fff" stroke-width="3"/>
      ${pixelText('EN / RU - ASTRO - NETLIFY', contentX, height - margin - 42, smallScale, '#000')}
    </svg>
  `);
}

async function socialCard(width, height) {
  const base = await sharp(cardSvg(width, height)).png().toBuffer();
  const logoSize = Math.round(height * 0.44);
  const logo = await mark(logoSize, 1);
  return sharp(base)
    .composite([{ input: logo, left: Math.round(width * 0.68), top: Math.round(height * 0.36) }])
    .png()
    .toBuffer();
}

await fs.mkdir(publicImagesDir, { recursive: true });
await fs.mkdir(path.dirname(articleFallbackPath), { recursive: true });

await fs.writeFile(path.join(publicDir, 'favicon-96x96.png'), await squareIcon(96, transparent, 0.9));
await fs.writeFile(path.join(publicDir, 'apple-touch-icon.png'), await squareIcon(180, desktopTeal, 0.76));
await fs.writeFile(path.join(publicDir, 'web-app-manifest-192x192.png'), await squareIcon(192, desktopTeal, 0.72));
await fs.writeFile(path.join(publicDir, 'web-app-manifest-512x512.png'), await squareIcon(512, desktopTeal, 0.72));

const icoImages = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await squareIcon(size, transparent, 0.92) })));
await fs.writeFile(path.join(publicDir, 'favicon.ico'), encodeIco(icoImages));

await fs.writeFile(path.join(publicImagesDir, 'og.png'), await socialCard(1200, 630));
await fs.writeFile(path.join(publicImagesDir, 'x.png'), await socialCard(1600, 900));
await fs.writeFile(path.join(publicImagesDir, 'structured-preview.png'), await socialCard(1920, 1080));

const articleCard = await socialCard(1600, 900);
await sharp(articleCard).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toFile(articleFallbackPath);

console.log('Generated favicon, manifest, social-preview, and article-fallback assets.');
