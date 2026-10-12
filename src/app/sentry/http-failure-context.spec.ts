import {
  buildHttpStatusZeroContext,
  elapsedBucket,
  isUnknownStatusZero,
  queryKeysFromUrl,
  readHttpStatusZeroContext,
} from './http-failure-context';

describe('http failure context', () => {
  const visible = {
    online: true,
    visibilityState: 'visible',
    wasDiscarded: false,
    swControlled: false,
    effectiveType: '4g',
  };

  it('buckets elapsed time at the boundaries used in Sentry', () => {
    expect(elapsedBucket(0)).toBe('<1s');
    expect(elapsedBucket(999)).toBe('<1s');
    expect(elapsedBucket(1000)).toBe('1-10s');
    expect(elapsedBucket(30000)).toBe('30-60s');
    expect(elapsedBucket(120000)).toBe('>120s');
    expect(elapsedBucket(null)).toBeNull();
  });

  it('keeps query keys and drops query values', () => {
    const parsed = queryKeysFromUrl(
      'https://admin.karibou.ch/api/v1/orders?payment=authorized&month=10&year=2026&padding=true'
    );
    expect(parsed.pathname).toBe('/api/v1/orders');
    expect(parsed.queryKeys).toEqual(['month', 'padding', 'payment', 'year']);
  });

  it('records whether the browser went offline during the request', () => {
    const diag = buildHttpStatusZeroContext({
      method: 'GET',
      url: 'https://admin.karibou.ch/api/v1/orders?month=10&year=2026',
      startedAtMs: 1000,
      failedAtMs: 76000,
      start: visible,
      end: { ...visible, online: false, visibilityState: 'hidden', wasDiscarded: true },
    });

    expect(diag.elapsedMs).toBe(75000);
    expect(diag.elapsedBucket).toBe('60-120s');
    expect(diag.onlineChanged).toBe(true);
    expect(diag.visibilityAtFailure).toBe('hidden');
    expect(diag.wasDiscarded).toBe(true);
    expect(diag.queryKeys).toEqual(['month', 'year']);
  });

  it('reads a diagnostic stashed on a wrapped HttpErrorResponse', () => {
    const diag = buildHttpStatusZeroContext({
      method: 'GET',
      url: 'https://admin.karibou.ch/api/v1/orders',
      startedAtMs: 0,
      failedAtMs: 50,
      start: visible,
      end: visible,
    });
    const wrapped = { rejection: { ngOriginalError: { status: 0, kioDiag: diag } } };

    expect(readHttpStatusZeroContext(wrapped)).toBe(diag);
    expect(isUnknownStatusZero(wrapped, 'ignored')).toBe(true);
    expect(isUnknownStatusZero(null, 'Http failure response for https://admin.karibou.ch/api/v1/orders: 0 Unknown Error')).toBe(true);
    expect(isUnknownStatusZero({ status: 504 }, 'Http failure response for /api/v1/orders: 504 Gateway Time-out')).toBe(false);
  });
});
