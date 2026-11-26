import { catalog, findArtwork } from '../domain/catalog';
import { getOperations } from './operations';

export function publicCatalog() {
  const creatorWorks = getOperations().list(true).map(work => work.artwork).filter(work => !work.showcase);
  return [...creatorWorks, ...catalog];
}
export function publicArtwork(id: string) { return findArtwork(id) ?? getOperations().publishedArtwork(id); }
