import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { useTranslations } from '@utils/i18n';
import { sortArticleList } from '@utils/blog';
import { themeConfig } from '~/theme.config';

export function getStaticPaths() {
  return themeConfig.i18n.locales
    .filter((lang) => lang !== themeConfig.i18n.defaultLocale)
    .map((lang) => ({
      params: { lang: lang },
    }));
}

export async function GET(context) {
  const locale = context.params.lang;
  const t = useTranslations(locale);
  const articles = sortArticleList(
    await getCollection('articles', ({ id, data }) => {
      // only show articles that are not drafts and mind locale
      return !data.draft && id.startsWith(locale + '/');
    }),
  );
  return rss({
    title: t('rss.title'),
    description: t('rss.description'),
    site: context.site + '/' + locale,
    trailingSlash: false,
    customData: `<language>${locale}</language>`,
    items: articles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.publishDate,
      description: article.data.excerpt,
      link: `/${locale}/blog/${article.id.split('/')[1]}`,
    })),
  });
}
