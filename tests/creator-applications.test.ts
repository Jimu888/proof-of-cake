import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCreatorApplication } from '../src/domain/creator-applications';
import { CreatorApplicationRepository } from '../src/server/creator-application-repository';
const input = { name: '演示创作者', contact: 'example@example.com', portfolio: 'https://example.com/art', medium: 'image', proposal: '希望创作一系列关于相遇的礼物。' };

test('applications require complete inputs and safe portfolio links; applicant cannot approve themselves', () => {
  for (const portfolio of ['javascript:alert(1)', 'file:///tmp/test', 'https://name:secret@example.com/']) assert.throws(() => parseCreatorApplication({ ...input, portfolio }));
  assert.throws(() => parseCreatorApplication({ ...input, name: '' }));
  assert.throws(() => parseCreatorApplication({ ...input, proposal: 'x'.repeat(1201) }));
  assert.throws(() => parseCreatorApplication({ ...input, medium: 'unknown' }));
  assert.throws(() => parseCreatorApplication({ ...input, status: 'approved' }));
});
test('application retries are idempotent and manual review survives restart', () => {
  const folder = mkdtempSync(join(tmpdir(), 'mement-application-'));
  let repository = new CreatorApplicationRepository(join(folder, 'applications.sqlite'));
  try {
    const first = repository.submit(input, 'application_1234567890');
    assert.equal(first.status, 'pending');
    assert.equal(repository.submit(input, 'application_1234567890').id, first.id);
    assert.throws(() => repository.submit({ ...input, name: 'another' }, 'application_1234567890'));
    const approved = repository.review(first.id, 'approved');
    assert.equal(approved.status, 'approved');
    assert.ok(approved.reviewedAt);
    assert.deepEqual(repository.review(first.id, 'approved'), approved);
    assert.throws(() => repository.review(first.id, 'rejected'));
    repository.close();
    repository = new CreatorApplicationRepository(join(folder, 'applications.sqlite'));
    assert.deepEqual(repository.list(), [approved]);
    assert.throws(() => repository.review('unknown', 'approved'));
  } finally { repository.close(); rmSync(folder, { recursive: true, force: true }); }
});
