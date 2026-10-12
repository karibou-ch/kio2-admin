// Contexte ajouté aux HttpErrorResponse status 0 avant envoi Sentry.
// Le message Angular « 0 Unknown Error » ne contient ni durée, ni query string,
// ni état réseau : ces champs servent à départager les causes.

export interface BrowserNetSnapshot {
  online: boolean | null;
  visibilityState: string | null;
  wasDiscarded: boolean | null;
  swControlled: boolean | null;
  effectiveType: string | null;
}

export interface HttpStatusZeroContext {
  source: 'interceptor' | 'capture-time-only';
  method: string | null;
  pathname: string | null;
  queryKeys: string[];
  elapsedMs: number | null;
  elapsedBucket: string | null;
  onlineAtStart: boolean | null;
  onlineAtFailure: boolean | null;
  onlineChanged: boolean | null;
  visibilityAtStart: string | null;
  visibilityAtFailure: string | null;
  wasDiscarded: boolean | null;
  swControlled: boolean | null;
  effectiveType: string | null;
}

export function captureBrowserNetSnapshot(): BrowserNetSnapshot {
  const doc = typeof document !== 'undefined' ? document : null;
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const connection = nav ? (nav as Navigator & {
    connection?: { effectiveType?: string };
  }).connection : null;
  const discarded = doc ? (doc as Document & { wasDiscarded?: boolean }).wasDiscarded : null;

  return {
    online: nav ? nav.onLine : null,
    visibilityState: doc ? doc.visibilityState : null,
    wasDiscarded: discarded === undefined ? null : !!discarded,
    swControlled: nav && 'serviceWorker' in nav ? !!nav.serviceWorker.controller : null,
    effectiveType: connection && connection.effectiveType ? connection.effectiveType : null,
  };
}

export function elapsedBucket(elapsedMs: number | null): string | null {
  if (elapsedMs === null || elapsedMs < 0 || !isFinite(elapsedMs)) {
    return null;
  }
  if (elapsedMs < 1000) {
    return '<1s';
  }
  if (elapsedMs < 10000) {
    return '1-10s';
  }
  if (elapsedMs < 30000) {
    return '10-30s';
  }
  if (elapsedMs < 60000) {
    return '30-60s';
  }
  if (elapsedMs < 120000) {
    return '60-120s';
  }
  return '>120s';
}

export function queryKeysFromUrl(url: string | null | undefined): { pathname: string | null; queryKeys: string[] } {
  if (!url) {
    return { pathname: null, queryKeys: [] };
  }
  try {
    const parsed = new URL(url, 'https://admin.karibou.ch');
    return {
      pathname: parsed.pathname,
      queryKeys: Array.from(parsed.searchParams.keys()).sort(),
    };
  } catch {
    return { pathname: null, queryKeys: [] };
  }
}

export function buildHttpStatusZeroContext(options: {
  method?: string | null;
  url?: string | null;
  startedAtMs: number;
  failedAtMs: number;
  start: BrowserNetSnapshot;
  end: BrowserNetSnapshot;
}): HttpStatusZeroContext {
  const elapsedMs = options.failedAtMs - options.startedAtMs;
  const parsed = queryKeysFromUrl(options.url);
  const onlineAtStart = options.start.online;
  const onlineAtFailure = options.end.online;

  return {
    source: 'interceptor',
    method: options.method || null,
    pathname: parsed.pathname,
    queryKeys: parsed.queryKeys,
    elapsedMs,
    elapsedBucket: elapsedBucket(elapsedMs),
    onlineAtStart,
    onlineAtFailure,
    onlineChanged: onlineAtStart === null || onlineAtFailure === null ? null : onlineAtStart !== onlineAtFailure,
    visibilityAtStart: options.start.visibilityState,
    visibilityAtFailure: options.end.visibilityState,
    wasDiscarded: options.end.wasDiscarded,
    swControlled: options.end.swControlled,
    effectiveType: options.end.effectiveType || options.start.effectiveType,
  };
}

export function captureTimeOnlyContext(): HttpStatusZeroContext {
  const now = captureBrowserNetSnapshot();
  return {
    source: 'capture-time-only',
    method: null,
    pathname: null,
    queryKeys: [],
    elapsedMs: null,
    elapsedBucket: null,
    onlineAtStart: null,
    onlineAtFailure: now.online,
    onlineChanged: null,
    visibilityAtStart: null,
    visibilityAtFailure: now.visibilityState,
    wasDiscarded: now.wasDiscarded,
    swControlled: now.swControlled,
    effectiveType: now.effectiveType,
  };
}

export function readHttpStatusZeroContext(error: unknown): HttpStatusZeroContext | null {
  const seen = new Set<object>();
  const stack: unknown[] = [error];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) {
      continue;
    }
    seen.add(current);
    const record = current as {
      kioDiag?: HttpStatusZeroContext;
      ngOriginalError?: unknown;
      rejection?: unknown;
    };
    if (record.kioDiag && record.kioDiag.source) {
      return record.kioDiag;
    }
    if (record.ngOriginalError) {
      stack.push(record.ngOriginalError);
    }
    if (record.rejection) {
      stack.push(record.rejection);
    }
  }

  return null;
}

export function isUnknownStatusZero(error: unknown, extracted: unknown): boolean {
  const http = findStatus(error);
  if (http === 0) {
    return true;
  }
  return typeof extracted === 'string' && extracted.indexOf(': 0 Unknown Error') !== -1;
}

function findStatus(error: unknown): number | null {
  const seen = new Set<object>();
  const stack: unknown[] = [error];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) {
      continue;
    }
    seen.add(current);
    const record = current as {
      status?: number;
      ngOriginalError?: unknown;
      rejection?: unknown;
    };
    if (typeof record.status === 'number') {
      return record.status;
    }
    if (record.ngOriginalError) {
      stack.push(record.ngOriginalError);
    }
    if (record.rejection) {
      stack.push(record.rejection);
    }
  }

  return null;
}
