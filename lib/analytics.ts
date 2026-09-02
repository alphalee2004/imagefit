export type AnalyticsEventName =
  | 'page_view'
  | 'upload_started'
  | 'image_loaded'
  | 'optimization_started'
  | 'optimization_completed'
  | 'optimization_failed'
  | 'optimization_cancelled'
  | 'download_clicked'
  | 'target_size_selected'
  | 'format_selected'
  | 'batch_started'
  | 'batch_completed';

export type AnalyticsPropertyValue = string | number | boolean | null | undefined;
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

export interface AnalyticsProvider {
  readonly name: string;
  init(): void;
  track(eventName: AnalyticsEventName, properties?: AnalyticsProperties): void;
}

const FORBIDDEN_KEYS = new Set([
  'filename',
  'file_name',
  'name',
  'data',
  'blob',
  'url',
  'content',
  'binary',
  'thumbnail',
]);

let activeProvider: AnalyticsProvider | null = null;
let providerInitialized = false;

export function track(eventName: AnalyticsEventName, properties?: AnalyticsProperties): void {
  getProvider().track(eventName, sanitizeProperties(properties));
}

/** Test hook only: swaps the active provider without touching business components. */
export function setAnalyticsProviderForTests(provider: AnalyticsProvider | null): void {
  activeProvider = provider;
  providerInitialized = false;
}

function getProvider(): AnalyticsProvider {
  if (!activeProvider) {
    activeProvider = createProvider();
    providerInitialized = false;
  }
  if (!providerInitialized) {
    activeProvider.init();
    providerInitialized = true;
  }
  return activeProvider;
}

function createProvider(): AnalyticsProvider {
  const providerName = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER?.toLowerCase() ?? '';
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (providerName === 'plausible' && plausibleDomain) {
    return new PlausibleProvider(plausibleDomain);
  }
  if (providerName === 'ga4' && gaMeasurementId) {
    return new Ga4Provider(gaMeasurementId);
  }
  if (providerName === 'cloudflare') {
    return new CloudflareProvider();
  }
  return new DevAnalyticsProvider();
}

function sanitizeProperties(properties: AnalyticsProperties | undefined): AnalyticsProperties | undefined {
  if (!properties) return undefined;

  const safe: AnalyticsProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    const normalizedKey = key.toLowerCase();
    if (FORBIDDEN_KEYS.has(normalizedKey)) continue;
    if (value === null || value === undefined) {
      safe[key] = value;
      continue;
    }
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      continue;
    }
    if (typeof value === 'string' && value.length > 200) continue;
    safe[key] = value;
  }
  return safe;
}

class DevAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'development';
  private readonly enabled = process.env.NODE_ENV === 'development';

  init(): void {}

  track(eventName: AnalyticsEventName, properties?: AnalyticsProperties): void {
    if (this.enabled) {
      console.debug(`[analytics] ${eventName}`, properties ?? {});
    }
  }
}

class PlausibleProvider implements AnalyticsProvider {
  readonly name = 'plausible';

  constructor(private readonly domain: string) {}

  init(): void {
    // Script injection is added when a production domain is configured.
  }

  track(eventName: AnalyticsEventName, properties?: AnalyticsProperties): void {
    if (typeof window === 'undefined') return;
    const plausible = (
      window as unknown as {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
      }
    ).plausible;
    plausible?.(eventName, { props: { ...properties } });
  }
}

class Ga4Provider implements AnalyticsProvider {
  readonly name = 'ga4';

  constructor(private readonly measurementId: string) {}

  init(): void {
    // Script injection is added when a production measurement id is configured.
  }

  track(eventName: AnalyticsEventName, properties?: AnalyticsProperties): void {
    if (typeof window === 'undefined') return;
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.('event', eventName, { ...properties });
  }
}

class CloudflareProvider implements AnalyticsProvider {
  readonly name = 'cloudflare';

  init(): void {}

  track(eventName: AnalyticsEventName, properties?: AnalyticsProperties): void {
    if (typeof window === 'undefined') return;
    const beacon = (
      window as unknown as {
        Cloudflare?: { beacon?: { push: (event: unknown) => void } };
      }
    ).Cloudflare?.beacon;
    beacon?.push({ event: eventName, ...properties });
  }
}
