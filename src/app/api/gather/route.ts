import { getGatheringRepository } from '../../../server/gathering-repository';
import { parseGroupNotes } from '../../../domain/gifting-modes';
import { assertDemoMode } from '../../../server/mode';
import { readJson } from '../../../server/request-json';

const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const roomKey = /^[a-f0-9]{48}$/;

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('room') ?? '';
  try { assertDemoMode(); } catch { return response({ error: 'Unavailable' }, 503); }
  const guests = roomKey.test(key) ? getGatheringRepository().list(key, Math.floor(Date.now() / 1000)) : undefined;
  return guests ? response({ guests }) : response({ error: 'Room unavailable' }, 404);
}

export async function POST(request: Request) {
  try { assertDemoMode(); } catch { return response({ error: 'Unavailable' }, 503); }
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return response({ error: 'Origin mismatch' }, 403);
  let data: Record<string, unknown>;
  try {
    const raw = await readJson(request, 2048);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error();
    data = raw as Record<string, unknown>;
  } catch { return response({ error: 'Invalid input' }, 400); }
  const now = Math.floor(Date.now() / 1000);
  if (data.room === undefined) {
    const { seats, deadline } = data;
    if (typeof seats !== 'number' || !Number.isInteger(seats) || seats < 2 || seats > 8 ||
      typeof deadline !== 'number' || !Number.isSafeInteger(deadline) || deadline <= now || deadline > now + 31 * 86400) {
      return response({ error: 'Invalid gathering' }, 400);
    }
    const room = getGatheringRepository().create(seats, deadline, now);
    return room ? response({ room }, 201) : response({ error: 'Room capacity reached' }, 503);
  }
  const room = data.room;
  const id = data.id;
  const note = parseGroupNotes([data.note, data.note])?.[0];
  if (typeof room !== 'string' || !roomKey.test(room) ||
    typeof id !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id) || !note) {
    return response({ error: 'Invalid guest' }, 400);
  }
  const result = getGatheringRepository().join(room, id, note, now);
  if (result.status !== 200) return response({ error: result.status === 409 ? 'Room filled' : 'Room closed' }, result.status);
  return response({ guests: result.guests });
}
