import { useEffect, useRef, useState } from 'react';
import {
  STANDALONE_LIGHT_THEME_CLASS,
  STANDALONE_LIGHT_THEME_CSS,
  shouldApplyStandaloneLightTheme,
} from './standaloneLightTheme';

interface ExportedStaticPageProps {
  sourcePath: string;
}

interface AttributeSnapshot {
  className: string;
  style: string;
  attributes: Array<{ name: string; value: string }>;
}

function normalizeStandaloneRoute(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/') {
    return '/';
  }

  if (
    normalizedPath === '/about'
    || normalizedPath === '/blog'
    || normalizedPath === '/contact'
    || normalizedPath === '/legal-pages/privacy-policy'
  ) {
    return normalizedPath;
  }

  if (/^\/blog\/[^/]+$/.test(normalizedPath)) {
    return normalizedPath;
  }

  return null;
}

function resolveStandaloneNavigationHref(href: string) {
  if (!href || href.startsWith('#')) {
    return null;
  }

  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return null;
    }

    const normalizedPath = normalizeStandaloneRoute(url.pathname);
    if (!normalizedPath) {
      return null;
    }

    return `${normalizedPath}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function normalizeAssetPath(value: string) {
  if (!value.startsWith('assets/')) {
    return value;
  }

  return `/${value}`;
}

function normalizeSrcSet(value: string) {
  return value
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      if (!parts.length) {
        return entry;
      }

      parts[0] = normalizeAssetPath(parts[0]);
      return parts.join(' ');
    })
    .join(', ');
}

function normalizeInlineStyle(styleText: string) {
  return styleText.replace(/url\((['"]?)assets\//g, 'url($1/assets/');
}

function normalizeStaticDocument(documentFragment: Document) {
  documentFragment.querySelectorAll<HTMLElement>('*').forEach((element) => {
    ['src', 'href', 'poster'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) {
        return;
      }

      element.setAttribute(attribute, normalizeAssetPath(value));
    });

    const srcSet = element.getAttribute('srcset');
    if (srcSet) {
      element.setAttribute('srcset', normalizeSrcSet(srcSet));
    }

    const style = element.getAttribute('style');
    if (style) {
      element.setAttribute('style', normalizeInlineStyle(style));
    }
  });
}

function recreateScript(source: HTMLScriptElement) {
  const script = document.createElement('script');

  for (const { name, value } of Array.from(source.attributes)) {
    script.setAttribute(name, value);
  }

  script.textContent = source.textContent;
  return script;
}

function waitForScriptLoad(script: HTMLScriptElement) {
  if (!script.src || script.type === 'module') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`Failed to load script: ${script.src}`)), { once: true });
  });
}

function captureAttributes(element: HTMLElement): AttributeSnapshot {
  return {
    className: element.className,
    style: element.getAttribute('style') ?? '',
    attributes: Array.from(element.attributes).map(({ name, value }) => ({ name, value })),
  };
}

function restoreAttributes(element: HTMLElement, snapshot: AttributeSnapshot) {
  Array.from(element.attributes).forEach(({ name }) => {
    element.removeAttribute(name);
  });

  snapshot.attributes.forEach(({ name, value }) => {
    element.setAttribute(name, value);
  });

  element.className = snapshot.className;

  if (snapshot.style) {
    element.setAttribute('style', snapshot.style);
  } else {
    element.removeAttribute('style');
  }
}

function applyAttributes(target: HTMLElement, source: HTMLElement) {
  Array.from(target.attributes).forEach(({ name }) => {
    target.removeAttribute(name);
  });

  Array.from(source.attributes).forEach(({ name, value }) => {
    target.setAttribute(name, value);
  });
}

export default function ExportedStaticPage({ sourcePath }: ExportedStaticPageProps) {
  const mountNodeRef = useRef<HTMLDivElement | null>(null);
  const [markup, setMarkup] = useState('');
  const scriptTemplatesRef = useRef<HTMLScriptElement[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const appendedHeadNodes: HTMLElement[] = [];
    const shouldApplyLightTheme = shouldApplyStandaloneLightTheme(sourcePath);
    const shouldInjectStandaloneEnhancer = sourcePath === '/landing-export/index.txt';
    const previousTitle = document.title;
    const htmlSnapshot = captureAttributes(document.documentElement);
    const bodySnapshot = captureAttributes(document.body);
    const mountNode = document.createElement('div');
    mountNode.setAttribute('data-exported-static-root', sourcePath);
    document.body.appendChild(mountNode);
    mountNodeRef.current = mountNode;

    const loadPage = async () => {
      const response = await fetch(sourcePath, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to load static page: ${response.status}`);
      }

      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      normalizeStaticDocument(parsed);
      applyAttributes(document.documentElement, parsed.documentElement);
      applyAttributes(document.body, parsed.body);
      if (shouldApplyLightTheme) {
        document.body.classList.add(STANDALONE_LIGHT_THEME_CLASS);
      }

      document.title = parsed.title || previousTitle;

      scriptTemplatesRef.current = Array.from(parsed.querySelectorAll('script'));
      parsed.querySelectorAll('script').forEach((script) => script.remove());

      parsed.head.querySelectorAll<HTMLElement>('style, link, meta[name^="twitter:"], meta[property^="og:"]').forEach((node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute('data-exported-static-head', sourcePath);
        document.head.appendChild(clone);
        appendedHeadNodes.push(clone);
      });

      if (shouldInjectStandaloneEnhancer && !parsed.head.querySelector('link[href="/assets/css/site.css"]')) {
        const enhancerStylesheet = document.createElement('link');
        enhancerStylesheet.rel = 'stylesheet';
        enhancerStylesheet.href = '/assets/css/site.css';
        enhancerStylesheet.setAttribute('data-exported-static-head', `${sourcePath}:site-enhancer`);
        document.head.appendChild(enhancerStylesheet);
        appendedHeadNodes.push(enhancerStylesheet);
      }

      if (shouldApplyLightTheme) {
        const themeStyle = document.createElement('style');
        themeStyle.setAttribute('data-exported-static-theme', sourcePath);
        themeStyle.textContent = STANDALONE_LIGHT_THEME_CSS;
        document.head.appendChild(themeStyle);
        appendedHeadNodes.push(themeStyle);
      }

      setMarkup(parsed.body.innerHTML);
    };

    loadPage().catch(() => {
      setMarkup('<main style="min-height:100vh;background:#000"></main>');
    });

    return () => {
      controller.abort();
      appendedHeadNodes.forEach((node) => node.remove());
      scriptTemplatesRef.current = [];
      document.title = previousTitle;
      mountNodeRef.current?.remove();
      mountNodeRef.current = null;
      restoreAttributes(document.documentElement, htmlSnapshot);
      restoreAttributes(document.body, bodySnapshot);
    };
  }, [sourcePath]);

  useEffect(() => {
    const mountNode = mountNodeRef.current;
    if (!mountNode || !markup) {
      return;
    }

    mountNode.innerHTML = markup;
    const appendedScripts: HTMLScriptElement[] = [];
    const shouldForceStandaloneNavigation = sourcePath === '/landing-export/index.txt';
    const shouldInjectStandaloneEnhancer = sourcePath === '/landing-export/index.txt';
    let cancelled = false;

    const handleStandaloneNavigation = (event: MouseEvent) => {
      if (!shouldForceStandaloneNavigation) {
        return;
      }

      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const clickable = target.closest('a[href], [data-nested-link][href]');
      if (!(clickable instanceof HTMLElement)) {
        return;
      }

      const rawHref = clickable.getAttribute('href');
      const nextHref = rawHref ? resolveStandaloneNavigationHref(rawHref) : null;
      if (!nextHref) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.location.assign(nextHref);
    };

    if (shouldForceStandaloneNavigation) {
      mountNode.addEventListener('click', handleStandaloneNavigation, true);
    }

    const initializeScripts = async () => {
      const blockingLoads: Array<Promise<void>> = [];

      for (const template of scriptTemplatesRef.current) {
        const script = recreateScript(template);
        script.setAttribute('data-exported-static-script', sourcePath);
        document.body.appendChild(script);
        appendedScripts.push(script);
        blockingLoads.push(waitForScriptLoad(script));
      }

      if (shouldInjectStandaloneEnhancer) {
        const enhancerScript = document.createElement('script');
        enhancerScript.src = '/assets/js/site.js';
        enhancerScript.setAttribute('data-exported-static-script', `${sourcePath}:site-enhancer`);
        document.body.appendChild(enhancerScript);
        appendedScripts.push(enhancerScript);
        blockingLoads.push(waitForScriptLoad(enhancerScript));
      }

      try {
        await Promise.all(blockingLoads);
      } catch {
        // Keep the page usable even if one enhancer script fails to load.
      }

      if (cancelled) {
        return;
      }

      // The exported standalone scripts expect to initialize on document load.
      // Re-dispatching these events lets route changes behave like a fresh page load.
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
      window.dispatchEvent(new Event('load'));
    };

    void initializeScripts();

    return () => {
      cancelled = true;
      if (shouldForceStandaloneNavigation) {
        mountNode.removeEventListener('click', handleStandaloneNavigation, true);
      }

      mountNode.innerHTML = '';
      appendedScripts.forEach((script) => script.remove());
    };
  }, [markup, sourcePath]);

  return null;
}
