export function consumeChatLink(parameter: 'task' | 'chatWorker' | 'chatPeer') {
  const url = new URL(window.location.href);
  url.searchParams.delete(parameter);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}
