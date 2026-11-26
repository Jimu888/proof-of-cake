import { catalog, findArtwork } from '../domain/catalog';
import { getOperations } from './operations';

export function publicCatalog() {
  try {
    const creatorWorks = getOperations().list(true).map(work => work.artwork).filter(work => !work.showcase);
    return [...creatorWorks, ...catalog];
  } catch {
    return [...catalog];
  }
}
export function publicArtwork(id: string) {
  const builtin = findArtwork(id);
  if (builtin) return builtin;
  try { return getOperations().publishedArtwork(id); } catch { return undefined; }
}
