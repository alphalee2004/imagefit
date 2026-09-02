import { describe, expect, it } from 'vitest';
import { getTaskPreset, TASK_PRESETS } from '../toolConfig';

describe('task presets', () => {
  it('defines one preset per task key', () => {
    expect(getTaskPreset('general').key).toBe('general');
    for (const task of TASK_PRESETS) {
      expect(getTaskPreset(task.key)).toBe(task);
    }
  });

  it('keeps real-world defaults within supported target presets', () => {
    expect(getTaskPreset('email').targetPreset).toBe('1mb');
    expect(getTaskPreset('cv-photo').targetPreset).toBe('500kb');
    expect(getTaskPreset('forum-avatar').maxWidth).toBe(1024);
    expect(getTaskPreset('store-product').format).toBe('jpeg');
    expect(getTaskPreset('website-image').format).toBe('webp');
  });
});
