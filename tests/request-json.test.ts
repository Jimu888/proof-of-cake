import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JsonRequestError, readJson } from '../src/server/request-json';

test('JSON requests stop reading as soon as the streamed byte limit is exceeded', async () => {
  let reads = 0;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { reads++; controller.enqueue(new Uint8Array(8)); },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const request = new Request('http://localhost/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: stream, duplex: 'half',
  } as RequestInit);
  await assert.rejects(readJson(request, 12), error => error instanceof JsonRequestError && error.status === 413);
  assert.equal(reads, 2);
  assert.equal(cancelled, true);
});
