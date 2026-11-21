import { catalog, findArtwork } from '../domain/catalog';
import { getOperations } from './operations';

export function publicCatalog() { return [...getOperations().list(true).map(work => work.artwork), ...catalog]; }
export function publicArtwork(id: string) { return findArtwork(id) ?? getOperations().publishedArtwork(id); }
