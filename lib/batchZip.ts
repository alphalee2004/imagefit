import { zip, type AsyncZippable } from 'fflate';
import { makeUniqueFilename } from './batchQueue';
import { sanitizeFilename } from './utils';

export interface BatchZipItem {
  name: string;
  blob: Blob;
}

export async function createBatchZip(items: BatchZipItem[]): Promise<Blob> {
  const archive: AsyncZippable = {};
  const usedNames = new Set<string>();
  const stableModifiedTime = new Date('1980-01-01T00:00:00.000Z');

  for (const item of items) {
    const name = makeUniqueFilename(sanitizeFilename(item.name), usedNames);
    const data = new Uint8Array(await item.blob.arrayBuffer());
    archive[name] = [data, { level: 0, mtime: stableModifiedTime }];
  }

  return new Promise((resolve, reject) => {
    zip(
      archive,
      { level: 0, mtime: stableModifiedTime },
      (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(new Blob([data], { type: 'application/zip' }));
      },
    );
  });
}
