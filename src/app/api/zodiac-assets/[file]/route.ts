import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const ALLOWED_FILES: Record<string, string> = {
  'voxel-goat.glb': 'model/gltf-binary',
  'voxel-horse.glb': 'model/gltf-binary',
  'voxel-ox.glb': 'model/gltf-binary',
  'voxel-dragon.glb': 'model/gltf-binary',
  'voxel-goat-preview.png': 'image/png',
  'voxel-horse-preview.png': 'image/png',
  'voxel-ox-preview.png': 'image/png',
  'voxel-dragon-preview.png': 'image/png',
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const contentType = ALLOWED_FILES[file];
  if (!Object.hasOwn(ALLOWED_FILES, file)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const fullPath = path.join(process.cwd(), 'assets', 'gifts', 'voxel-zodiac', file);
  try {
    const buffer = await readFile(fullPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset unavailable' }, { status: 404 });
  }
}
