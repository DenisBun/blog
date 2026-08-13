# Project Configuration Plan

## Confirmed scope

- [x] Use Stardrive in `project` mode.
- [x] Keep the site statically generated (SSG).
- [x] Keep only the public content routes for Home, About, Blog, and individual posts.
- [x] Use English as the default locale and Russian as the second locale (`/ru/`).
- [x] Preserve the useful Stardrive optimizations: metadata, canonical and hreflang links, Open Graph/X cards, Schema.org data, sitemap, robots, RSS, web manifest, optimized images, accessibility, performance, and `llms.txt` generation.
- [x] Restyle the site around Patrika's quiet, notebook-inspired editorial interface.
- [x] Add a project-local Astro Docs MCP connection in `.codex/config.toml` (takes effect after reloading Codex).

## Confirmed project decisions

- [x] Use “Denis Bunchenko” as the site name and “Personal blog of Denis Bunchenko” as the initial fallback description.
- [x] Use `https://denisbunchenko.com` as the canonical production URL.
- [x] Use Denis Bunchenko as the public author and publisher, linked to the canonical home page.
- [x] Use Patrika's warm paper palette, dot grid, serif/mono typography, and fixed light theme.
- [x] Keep the complete blog feature set, including categories, tags, social sharing, reading time, table of contents, pagination, RSS, and article metadata.
- [x] Keep one matching English/Russian example-post pair and remove the other demo posts.
- [x] Create an editorial monogram favicon/logo that matches the site.
- [x] Configure deployment for Netlify.

## Configuration and implementation

- [x] Audit the current dirty worktree and preserve unrelated pre-existing changes while pruning the Stardrive demo.
- [x] Update `package.json` project metadata and reduce dependencies to those used by the retained site.
- [x] Replace the boilerplate README headline and description with project-specific information.
- [x] Configure `theme.config.ts`: site identity, author/publisher metadata, English/Russian i18n, blog behavior, disabled promotions, static rendering, and project-specific LLM text.
- [x] Add complete, key-compatible `en.json` and `ru.json` translation files; remove German, French, and Spanish.
- [x] Reduce the article collection to English/Russian and remove the events collection and event-specific sitemap/runtime logic.
- [x] Reduce routes to `/`, `/about`, `/blog`, `/blog/[post]`, their `/ru` equivalents, and technical endpoints (`404`, RSS, sitemap, robots, manifest, generated metadata/LLM files).
- [x] Remove demo-only pages, content, components, data, styles, images, map assets, integrations, and unused dependencies.
- [x] Simplify navigation, header, footer, layouts, home, about, blog list, and post UI for the retained routes.
- [x] Implement the chosen Patrika-derived design with semantic HTML, visible focus states, keyboard/touch support, sufficient contrast, and reduced-motion support.
- [x] Keep SVG assets as components/static head resources and never pass them through Astro Image.
- [x] Generate/replace the six required favicon assets and remove unused dark variants if the site uses one fixed theme.
- [x] Replace social fallback images (`og.png`, `x.png`, `structured-preview.png`) and the article fallback image.
- [x] Review Open Graph/X, canonical, hreflang, structured data, RSS, sitemap, robots, web manifest, and `llms.txt` output for both languages.
- [x] Adjust deployment files only for the confirmed host.

## Validation

- [x] Run the complete Astro, TypeScript, ESLint, and Prettier check suite under native Node 22 and fix all issues.
- [x] Run the production build and postbuild scripts; verify generated English/Russian routes and technical outputs.
- [x] Check keyboard navigation, language switching, responsive layout, and missing-translation fallbacks.
- [x] Review the final diff for accidental deletion of user-owned changes or retained demo references.
- [x] Re-audit generated bilingual SEO output and add a build-time regression check for metadata, social cards, structured data, sitemap, RSS, and crawl directives.

## Follow-up enhancements

- [x] Restore a localized, provider-neutral “Ask AI about Denis” section backed by `/llms.txt`, without restoring the larger WebMCP demo.
- [x] Restyle the English and Russian 404 routes as quiet editorial error pages with clear recovery actions and Netlify fallbacks.
