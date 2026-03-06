import { useEffect } from 'react';

const DEFAULT_TITLE = 'MS Piparda School Management System';
const SITE_ORIGIN = 'https://mspiparda.vercel.app';

function upsertMeta(name, content) {
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href) {
  let tag = document.head.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

export function useSEO({ title, description, path = '/', robots = 'index,follow' }) {
  useEffect(() => {
    const previousTitle = document.title;

    document.title = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;

    if (description) {
      upsertMeta('description', description);
    }

    upsertMeta('robots', robots);

    const canonical = new URL(path, SITE_ORIGIN).toString();
    upsertCanonical(canonical);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, path, robots]);
}
