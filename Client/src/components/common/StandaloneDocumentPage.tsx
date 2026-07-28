import { useEffect } from 'react';

interface StandaloneDocumentPageProps {
  sourcePath: string;
}

function rewriteInternalLinks(documentFragment: Document) {
  documentFragment.querySelectorAll('a[href]').forEach((node) => {
    if (!(node instanceof HTMLAnchorElement)) {
      return;
    }

    const href = node.getAttribute('href');
    if (!href) {
      return;
    }

    if (href === '/about/') {
      node.setAttribute('href', '/about');
      return;
    }

    if (href === '/blog/') {
      node.setAttribute('href', '/blog');
      return;
    }

    if (href === '/contact/') {
      node.setAttribute('href', '/contact');
      return;
    }

    if (href === '/legal-pages/privacy-policy/') {
      node.setAttribute('href', '/legal-pages/privacy-policy');
      return;
    }

    const blogPostMatch = href.match(/^\/blog\/([^/]+)\/$/);
    if (blogPostMatch) {
      node.setAttribute('href', `/blog/${blogPostMatch[1]}`);
    }
  });
}

export default function StandaloneDocumentPage({ sourcePath }: StandaloneDocumentPageProps) {
  useEffect(() => {
    let isCancelled = false;

    const renderStandaloneDocument = async () => {
      const response = await fetch(sourcePath, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load standalone document: ${response.status}`);
      }

      const html = await response.text();
      if (isCancelled) {
        return;
      }

      const parsed = new DOMParser().parseFromString(html, 'text/html');
      rewriteInternalLinks(parsed);

      document.open();
      document.write(`<!doctype html>\n${parsed.documentElement.outerHTML}`);
      document.close();
    };

    renderStandaloneDocument().catch(() => {
      if (isCancelled) {
        return;
      }

      document.open();
      document.write(
        '<!doctype html><html><head><title>Page not found</title></head><body style="margin:0;background:#000;color:#fff;font-family:sans-serif;display:grid;place-items:center;min-height:100vh">Unable to load page.</body></html>',
      );
      document.close();
    });

    return () => {
      isCancelled = true;
    };
  }, [sourcePath]);

  return null;
}
