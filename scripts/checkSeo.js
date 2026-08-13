#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const site = (process.env.SITE_OVERRIDE || 'https://denisbunchenko.com').replace(/\/+$/, '');
const expectedRobots = (process.env.ROBOTS || 'index, follow').toLowerCase();
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function walkHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(fullPath);
    return entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

function routeFromFile(filePath) {
  const relative = path.relative(distDir, filePath).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  return `/${relative.replace(/\.html$/, '')}`;
}

function meta(doc, selector) {
  return doc.querySelector(selector)?.getAttribute('content')?.trim() ?? '';
}

function localAssetExists(urlValue) {
  const url = new URL(urlValue);
  if (url.origin !== site) return true;
  return fs.existsSync(path.join(distDir, decodeURIComponent(url.pathname).replace(/^\//, '')));
}

function normalizeUrl(urlValue) {
  return urlValue === site ? `${site}/` : urlValue;
}

assert(fs.existsSync(distDir), 'dist/ is missing; run the production build before the SEO audit.');

const pageCanonicals = new Set();

for (const filePath of fs.existsSync(distDir) ? walkHtml(distDir) : []) {
  const route = routeFromFile(filePath);
  const doc = new JSDOM(fs.readFileSync(filePath, 'utf8')).window.document;
  const isError = route === '/404' || route.endsWith('/404');
  const label = route;
  const expectedLocale = route === '/ru' || route.startsWith('/ru/') ? 'ru' : 'en';
  const robots = meta(doc, 'meta[name="robots"]');
  const canonicalLinks = [...doc.querySelectorAll('link[rel="canonical"]')];
  const structuredScripts = [...doc.querySelectorAll('script[type="application/ld+json"]')];

  assert(doc.documentElement.lang === expectedLocale, `${label}: html lang must be ${expectedLocale}.`);
  assert(doc.querySelectorAll('title').length === 1 && Boolean(doc.title.trim()), `${label}: requires one non-empty title.`);
  assert(Boolean(meta(doc, 'meta[name="description"]')), `${label}: missing meta description.`);

  if (isError) {
    assert(robots.includes('noindex'), `${label}: error pages must be noindex.`);
    assert(canonicalLinks.length === 0, `${label}: error pages must not emit a canonical URL.`);
    assert(structuredScripts.length === 0, `${label}: error pages must not emit indexable structured data.`);
    continue;
  }

  assert(robots.toLowerCase() === expectedRobots, `${label}: expected robots directive “${expectedRobots}”.`);
  assert(canonicalLinks.length === 1, `${label}: requires exactly one canonical URL.`);

  const canonical = canonicalLinks[0]?.getAttribute('href') ?? '';
  assert(canonical.startsWith(`${site}/`) || canonical === `${site}/`, `${label}: canonical must use the configured site URL.`);
  if (canonical.startsWith(site)) pageCanonicals.add(canonical);

  const rssUrl = doc.querySelector('link[rel="alternate"][type="application/rss+xml"]')?.getAttribute('href');
  const expectedRss = `${site}${expectedLocale === 'ru' ? '/ru' : ''}/rss.xml`;
  assert(rssUrl === expectedRss, `${label}: expected localized RSS discovery URL ${expectedRss}.`);

  for (const language of ['en', 'ru', 'x-default']) {
    assert(Boolean(doc.querySelector(`link[rel="alternate"][hreflang="${language}"]`)), `${label}: missing ${language} hreflang.`);
  }

  for (const property of ['og:title', 'og:description', 'og:image', 'og:image:type', 'og:image:alt', 'og:url', 'og:type', 'og:locale']) {
    assert(Boolean(meta(doc, `meta[property="${property}"]`)), `${label}: missing ${property}.`);
  }
  assert(meta(doc, 'meta[property="og:url"]') === canonical, `${label}: og:url must match the canonical URL.`);
  assert(/^[a-z]{2}_[A-Z]{2}$/.test(meta(doc, 'meta[property="og:locale"]')), `${label}: og:locale must use language_TERRITORY format.`);

  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
    assert(Boolean(meta(doc, `meta[name="${name}"]`)), `${label}: missing ${name}.`);
  }

  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const imageUrl = meta(doc, selector);
    assert(!imageUrl || localAssetExists(imageUrl), `${label}: social image does not exist at ${imageUrl}.`);
  }

  assert(structuredScripts.length > 0, `${label}: missing JSON-LD structured data.`);
  const structuredObjects = structuredScripts.flatMap((script) => {
    try {
      return [JSON.parse(script.textContent ?? '')];
    } catch {
      failures.push(`${label}: contains invalid JSON-LD.`);
      return [];
    }
  });

  if (meta(doc, 'meta[property="og:type"]') === 'article') {
    const article = structuredObjects.find((value) => value['@type'] === 'BlogPosting');
    assert(Boolean(article), `${label}: article page is missing BlogPosting JSON-LD.`);
    for (const property of ['headline', 'datePublished', 'dateModified', 'author', 'publisher', 'mainEntityOfPage', 'breadcrumb']) {
      assert(Boolean(article?.[property]), `${label}: BlogPosting is missing ${property}.`);
    }
  }
}

const robotsPath = path.join(distDir, 'robots.txt');
const sitemapPath = path.join(distDir, 'sitemap-0.xml');
assert(fs.existsSync(robotsPath), 'robots.txt is missing.');
assert(fs.existsSync(sitemapPath), 'sitemap-0.xml is missing.');

if (fs.existsSync(robotsPath)) {
  assert(fs.readFileSync(robotsPath, 'utf8').includes(`Sitemap: ${site}/sitemap-index.xml`), 'robots.txt does not advertise the sitemap index.');
}

if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const sitemapUrls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => normalizeUrl(match[1])));
  assert(![...sitemapUrls].some((url) => url.endsWith('/404')), 'The sitemap must not contain 404 routes.');
  for (const canonical of pageCanonicals) {
    assert(sitemapUrls.has(canonical), `Sitemap is missing canonical URL ${canonical}.`);
  }
}

for (const [locale, relativePath] of [
  ['en', 'rss.xml'],
  ['ru', 'ru/rss.xml'],
]) {
  const feedPath = path.join(distDir, relativePath);
  assert(fs.existsSync(feedPath), `${relativePath} is missing.`);
  if (!fs.existsSync(feedPath)) continue;

  const feed = new JSDOM(fs.readFileSync(feedPath, 'utf8'), { contentType: 'text/xml' }).window.document;
  assert(feed.querySelector('channel > language')?.textContent === locale, `${relativePath}: channel language must be ${locale}.`);
  const dates = [...feed.querySelectorAll('item > pubDate')].map((node) => Date.parse(node.textContent ?? ''));
  assert(
    dates.every((date, index) => index === 0 || dates[index - 1] >= date),
    `${relativePath}: items must be newest first.`,
  );
}

if (failures.length > 0) {
  console.error(`SEO audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`✅ SEO audit passed for ${pageCanonicals.size} pages.`);
