import { catalog, blessings } from '../../../domain/catalog';
export function GET() { return Response.json({ mode: 'demo', artworks: catalog, blessings }); }
