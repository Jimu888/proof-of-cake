import { blessings } from '../../../domain/catalog';
import { publicCatalog } from '../../../server/public-catalog';
export function GET() { return Response.json({ mode: 'demo', artworks: publicCatalog(), blessings }); }
