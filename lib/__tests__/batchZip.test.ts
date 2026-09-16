import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { createBatchZip } from '../batchZip';

describe('createBatchZip', () => {
  it('creates a ZIP with unique output names', async () => {
    const blob = await createBatchZip([
      { name: 'photo.jpg', blob: new Blob(['first']) },
      { name: 'photo.jpg', blob: new Blob(['second']) },
    ]);
    const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const names = Object.keys(archive).sort();

    expect(names).toEqual(['photo-2.jpg', 'photo.jpg']);
    expect(new TextDecoder().decode(archive['photo.jpg'])).toBe('first');
    expect(new TextDecoder().decode(archive['photo-2.jpg'])).toBe('second');
  });

  it('does not keep path separators in archive entry names', async () => {
    const blob = await createBatchZip([
      { name: '../photo.jpg', blob: new Blob(['safe']) },
    ]);
    const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const names = Object.keys(archive);

    expect(names).toHaveLength(1);
    expect(names[0]).not.toContain('/');
  });
});
