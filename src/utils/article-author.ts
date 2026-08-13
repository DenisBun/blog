interface ArticleAuthor {
  name: string;
  url?: string;
}

export function resolveArticleAuthor(articleAuthor?: ArticleAuthor, defaultAuthor?: ArticleAuthor): ArticleAuthor | undefined {
  return articleAuthor ?? defaultAuthor;
}
