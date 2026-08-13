import { visit } from 'unist-util-visit';
import type { RehypePlugin } from '@astrojs/markdown-remark';
import type { Element, Root } from 'hast';

interface ExternalLinkingOptions {
  domain: string;
}

export const externalLinking: RehypePlugin = (options: ExternalLinkingOptions) => {
  const siteDomain = options.domain;
  return (tree: Root) => {
    visit(tree, (node, _index, parent) => {
      if (node.type != 'element') {
        return;
      }
      const el = node as Element;
      if (!isLink(el) && !isImage(el)) {
        return;
      }
      const url = el.properties['href']?.toString() || '';
      // we open in a new tab, if the link is external
      if (url !== '' && isExternal(url, siteDomain)) {
        setExternalLink(el);
        return;
      }
      if (!parent || parent.type != 'element') {
        return;
      }
      const parentEl = parent as Element;
      if (isLink(parentEl)) {
        // for linked images, we also open in a new tab
        setExternalLink(parentEl);
      }
    });
  };
};

const isLink = (element: Element) => element.tagName == 'a' && element.properties && 'href' in element.properties;

const isExternal = (url: string, domain: string) => {
  try {
    const siteUrl = new URL(domain);
    const targetUrl = new URL(url, siteUrl);
    return ['http:', 'https:'].includes(targetUrl.protocol) && targetUrl.origin !== siteUrl.origin;
  } catch {
    return false;
  }
};

const isImage = (element: Element) => element.tagName == 'img' && element.properties && 'src' in element.properties;

const setExternalLink = (element: Element) => {
  element.properties.target = '_blank';
  element.properties.rel = [...new Set([...(Array.isArray(element.properties.rel) ? element.properties.rel.map(String) : []), 'noopener', 'noreferrer'])];
  const classNames = Array.isArray(element.properties.className) ? element.properties.className.map(String) : [];
  element.properties.className = [...new Set([...classNames, 'external-link'])];
};
