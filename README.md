# Denis Bunchenko

The source for [denisbunchenko.com](https://denisbunchenko.com): a statically generated, bilingual personal blog with a quiet, notebook-inspired editorial interface.

## Stack

- Astro and TypeScript
- Tailwind CSS
- Markdown content collections
- English and Russian internationalization
- Netlify deployment

## Commands

```sh
npm run dev
npm run check
npm run build
npm run check:seo
```

The production build runs the generated-output SEO audit automatically. `npm run check:seo` can rerun it against the current `dist/` directory.

Articles live in `src/content/articles/en/` and `src/content/articles/ru/`. Matching filenames connect translated versions for language switching and `hreflang` metadata.

The project is based on Astro Stardrive and retains its SEO, structured-data, RSS, sitemap, social-preview, accessibility, performance, and `llms.txt` foundations.

The visual system is adapted from [Patrika](https://github.com/thelocalhoststudio/patrika), an MIT-licensed Astro publishing theme by The Localhost Studio.
