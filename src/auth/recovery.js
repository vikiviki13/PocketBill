export function getRecoveryCode() {
  if (typeof window === 'undefined') return null;
  const search = new URLSearchParams(window.location.search);
  const code = search.get('code');
  const type = search.get('type');
  return code && type === 'recovery' ? code : null;
}

export function clearRecoveryParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('type');
  window.history.replaceState(null, '', url.toString());
}