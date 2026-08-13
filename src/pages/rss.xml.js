import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { useTranslations } from '@utils/i18n';
import { sortArticleList } from '@utils/blog';
import { themeConfig } from '~/theme.config';

const defaultLocale = themeConfig.i18n.defaultLocale;
const t = useTranslations(defaultLocale);

export async function GET(context) {
  const articles = sortArticleList(
    await getCollection('articles', ({ id, data }) => {
      // only show articles that are not drafts and mind locale
      return !data.draft && id.startsWith(defaultLocale + '/');
    }),
  );
  return rss({
    title: t('rss.title'),
    description: t('rss.description'),
    site: context.site,
    trailingSlash: false,
    customData: `<language>${defaultLocale}</language>`,
    items: articles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.publishDate,
      description: article.data.excerpt,
      link: `/blog/${article.id.split('/')[1]}`,
    })),
  });
}
