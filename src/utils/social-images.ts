import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export async function getArticleSocialImages(source?: ImageMetadata) {
  if (!source) return {};

  const [openGraph, x] = await Promise.all([getImage({ src: source, width: 1200, height: 630, fit: 'cover', format: 'jpg' }), getImage({ src: source, width: 1600, height: 900, fit: 'cover', format: 'jpg' })]);

  return {
    openGraph: openGraph.src,
    x: x.src,
  };
}
