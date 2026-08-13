import type { ThemeConfig } from './types/theme-config.d.ts';

import enStrings from './src/i18n/en.json' with { type: 'json' };
import ruStrings from './src/i18n/ru.json' with { type: 'json' };

export const themeConfig: ThemeConfig = {
  site: import.meta.env?.SITE_OVERRIDE || 'https://denisbunchenko.com',
  primaryColor: '#788c5d',
  themeColor: '#f5f4ed',
  generateWebmanifest: true,
  name: 'Denis Bunchenko',
  shortName: 'Denis',
  ogTitle: 'Denis Bunchenko',
  darkMode: false,
  robots: import.meta.env?.ROBOTS || 'index, follow',
  xHandle: '',

  author: {
    type: 'Person',
    name: 'Denis Bunchenko',
    url: 'https://denisbunchenko.com',
    image: '/web-app-manifest-512x512.png',
  },
  publisher: {
    type: 'Person',
    name: 'Denis Bunchenko',
    url: 'https://denisbunchenko.com',
    image: '/web-app-manifest-512x512.png',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    languages: {
      en: 'English',
      ru: 'Русский',
    },
    languageModules: {
      en: enStrings,
      ru: ruStrings,
    },
  },

  expressiveCodeThemes: {
    light: 'min-light',
  },

  articles: {
    imageFallback: true,
    gridView: true,
    textOverImage: false,
    categories: true,
    tags: true,
    entriesPerPage: 6,
    tocMaxDepth: 3,
    defaults: {
      author: {
        name: 'Denis Bunchenko',
        url: 'https://denisbunchenko.com',
      },
    },
    social: {
      buttons: {
        email: true,
        facebook: true,
        hackernews: true,
        linkedin: true,
        pinterest: false,
        reddit: true,
        telegram: true,
        x: true,
        whatsapp: true,
      },
      buttonsSmallScreen: {
        email: true,
        facebook: true,
        hackernews: false,
        linkedin: true,
        pinterest: false,
        reddit: true,
        telegram: true,
        x: true,
        whatsapp: true,
      },
    },
  },

  promotions: {
    newsletterSignup: false,
    footerBanner: false,
    navAd: false,
    topBanner: false,
    heroChip: false,
  },

  onDemandRenderedCollections: [],

  llms: {
    autoGeneration: true,
    intro: 'Personal website and bilingual blog of Denis Bunchenko, with articles published in English and Russian.',
    excludePagesPattern: [],
    includePages: [],
    addArticles: 'all',
  },

  askAiTrigger: 'Using https://denisbunchenko.com/llms.txt as the primary source, tell me about Denis Bunchenko and his work. Distinguish confirmed facts from inferences, cite the pages you used, and clearly say when information is missing.',

  droppedFeatures: ['cloudflare', 'contact', 'docs', 'events', 'examples', 'faq', 'features', 'integrations', 'legal-pages', 'pricing', 'promotions', 'signup', 'webmcp'],
};
