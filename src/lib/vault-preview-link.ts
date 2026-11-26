// Demo links carry only deliberately shared preview fields in the fragment.
export function previewLink(path: string, key: string, payload: unknown) {
  const url = new URL(path, location.origin);
  url.hash = new URLSearchParams({ [key]: JSON.stringify(payload) }).toString();
  return url.href;
}

export function readPreview(key: string): unknown {
  const data = new URLSearchParams(location.hash.slice(1)).get(key);
  if (!data || data.length > 2400) return null;
  try { return JSON.parse(data); }
  catch { return null; }
}
