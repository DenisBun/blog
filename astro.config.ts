import { defineConfig, svgoOptimizer } from 'astro/config';
import type { Config } from 'svgo';

import sitemap from '@astrojs/sitemap';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import astroExpressiveCode from 'astro-expressive-code';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { externalLinking } from './src/plugins/external-linking';
import { rehypeYoutubePlugin } from './src/plugins/youtube-embed';
import { themeConfig } from './theme.config';

export const sitemap_i18n = {
  defaultLocale: themeConfig.i18n.defaultLocale,
  locales: themeConfig.i18n.locales.reduce((acc, lang) => ({ ...acc, [lang]: lang }), {}),
};

const svgoConfig: Config = {
  multipass: true,
  floatPrecision: 5,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          inlineStyles: false,
          mergeStyles: false,
          removeHiddenElems: false,
          convertShapeToPath: false,
          convertEllipseToCircle: false,
          convertPathData: false,
          convertTransform: false,
          removeEmptyAttrs: false,
          removeDesc: false,
        },
      },
    },
    'convertStyleToAttrs',
    'removeRasterImages',
    'reusePaths',
    { name: 'removeXlink', params: { includeLegacy: true } },
  ],
};

export default defineConfig({
  site: themeConfig.site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  image: {
    remotePatterns: [{ protocol: 'https' }],
    responsiveStyles: true,
    layout: 'constrained',
    breakpoints: [414, 576, 768, 976, 1440, 1600],
  },
  experimental: {
    svgOptimizer: svgoOptimizer(svgoConfig),
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['debug', 'ms', 'reading-time', 'expressive-code > postcss'],
    },
  },
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeYoutubePlugin, rehypeHeadingIds, [rehypeAutolinkHeadings, { behavior: 'wrap' }], [externalLinking, { domain: themeConfig.site }]],
    }),
  },
  i18n: {
    defaultLocale: themeConfig.i18n.defaultLocale,
    locales: themeConfig.i18n.locales,
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'redirect',
    },
  },
  integrations: [
    sitemap({ i18n: sitemap_i18n }),
    astroExpressiveCode(),
    (await import('astro-compress')).default({
      CSS: false,
      HTML: { 'html-minifier-terser': { removeAttributeQuotes: false } },
      SVG: { svgo: svgoConfig },
    }),
  ],
});
