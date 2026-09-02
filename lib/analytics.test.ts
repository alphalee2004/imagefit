import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  setAnalyticsProviderForTests,
  track,
  type AnalyticsEventName,
  type AnalyticsProperties,
  type AnalyticsProvider,
} from './analytics';

class MockProvider implements AnalyticsProvider {
  readonly name = 'mock';
  events: Array<{ eventName: AnalyticsEventName; properties?: AnalyticsProperties }> = [];
  initCalls = 0;

  init(): void {
    this.initCalls += 1;
  }

  track(eventName: AnalyticsEventName, properties?: AnalyticsProperties): void {
    this.events.push({ eventName, properties });
  }
}

const REQUIRED_EVENTS: AnalyticsEventName[] = [
  'page_view',
  'upload_started',
  'image_loaded',
  'optimization_started',
  'optimization_completed',
  'optimization_failed',
  'optimization_cancelled',
  'download_clicked',
  'target_size_selected',
  'format_selected',
];

describe('analytics abstraction', () => {
  beforeEach(() => {
    setAnalyticsProviderForTests(null);
  });

  afterEach(() => {
    setAnalyticsProviderForTests(null);
  });

  it('routes all required events through the active provider', () => {
    const provider = new MockProvider();
    setAnalyticsProviderForTests(provider);

    for (const eventName of REQUIRED_EVENTS) {
      track(eventName, { success: true });
    }

    expect(provider.events.map((event) => event.eventName)).toEqual(REQUIRED_EVENTS);
    expect(provider.initCalls).toBe(1);
  });

  it('strips forbidden properties such as filenames and binary data', () => {
    const provider = new MockProvider();
    setAnalyticsProviderForTests(provider);

    track('upload_started', {
      fileFormat: 'png',
      originalSize: 1024,
      filename: 'private-photo.jpg',
      binary: '...',
    });

    expect(provider.events[0].properties).toEqual({
      fileFormat: 'png',
      originalSize: 1024,
    });
  });

  it('drops non-primitive values before forwarding', () => {
    const provider = new MockProvider();
    setAnalyticsProviderForTests(provider);

    track(
      'optimization_completed',
      {
        outputSize: 100,
        blob: {},
        url: 'blob:http://localhost/x',
      } as unknown as AnalyticsProperties,
    );

    expect(provider.events[0].properties).toEqual({ outputSize: 100 });
  });

  it('works without a configured provider and never throws', () => {
    expect(() => track('page_view', { path: '/' })).not.toThrow();
    expect(() => track('format_selected', { format: 'webp' })).not.toThrow();
  });
});
