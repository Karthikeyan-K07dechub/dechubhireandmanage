import { useEffect } from 'react';

const SCRIPT_ID = 'elevenlabs-convai-widget-script';
const WIDGET_ID = 'elevenlabs-convai-visitor-widget';
const WIDGET_SCRIPT_URL = 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.25.1';

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

function getAgentId(): string {
  return import.meta.env.VITE_ELEVENLABS_VISITOR_AGENT_ID?.trim() || '';
}

function scheduleAfterLoad(callback: () => void): () => void {
  let timeoutId: number | undefined;
  let idleId: number | undefined;
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(callback, { timeout: 1200 });
      return;
    }
    timeoutId = window.setTimeout(callback, 0);
  };

  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener('load', run);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    if (idleId !== undefined && 'cancelIdleCallback' in window) {
      (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
    }
  };
}

export function mountAskAiWidget(targetDocument = document): () => void {
  const agentId = getAgentId();
  if (!agentId) {
    if (import.meta.env.DEV) {
      console.warn('Ask AI widget is disabled: VITE_ELEVENLABS_VISITOR_AGENT_ID is not configured.');
    }
    return () => undefined;
  }

  let widget: HTMLElement | null = null;
  const cancelScheduledMount = scheduleAfterLoad(() => {
    if (!targetDocument.body || targetDocument.getElementById(WIDGET_ID)) return;

    const script = targetDocument.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      const nextScript = targetDocument.createElement('script');
      nextScript.id = SCRIPT_ID;
      nextScript.src = WIDGET_SCRIPT_URL;
      nextScript.async = true;
      nextScript.type = 'text/javascript';
      targetDocument.head.appendChild(nextScript);
    }

    widget = targetDocument.createElement('elevenlabs-convai');
    widget.id = WIDGET_ID;
    widget.setAttribute('agent-id', agentId);
    widget.setAttribute('markdown-link-allowed-hosts', 'calendar.app.google,bridge.dechub.ai');
    targetDocument.body.appendChild(widget);
  });

  return () => {
    cancelScheduledMount();
    widget?.remove();
    targetDocument.getElementById(WIDGET_ID)?.remove();
  };
}

export default function AskAiWidget() {
  useEffect(() => mountAskAiWidget(), []);
  return null;
}
