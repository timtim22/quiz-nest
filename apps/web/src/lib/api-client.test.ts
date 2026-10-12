import { ErrorCode } from '@quiz-nest/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiClient, setAccessToken, setAccessTokenRefresher } from './api-client';

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
    setAccessTokenRefresher(null);
  });

  it('returns `data` from a successful response', async () => {
    mockFetch(jsonResponse({ success: true, data: { id: 1 } }));

    await expect(apiClient.get('/things/1')).resolves.toEqual({ id: 1 });
  });

  it('sends JSON bodies and query params', async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: null }));

    await apiClient.post('/things', { name: 'x' }, { query: { page: 2, skip: undefined } });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/things?page=2');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"x"}');
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
  });

  it('throws ApiError with the code from the server', async () => {
    mockFetch(
      jsonResponse(
        { success: false, error: { code: 'EXAM_EXPIRED', message: 'This exam has ended.' } },
        410,
      ),
    );

    const error = await apiClient.get('/exams/1').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: ErrorCode.EXAM_EXPIRED,
      message: 'This exam has ended.',
      status: 410,
    });
  });

  it('throws CONNECTION_UNAVAILABLE when the network is down', async () => {
    mockFetch(new TypeError('Failed to fetch'));

    await expect(apiClient.get('/health')).rejects.toMatchObject({
      code: ErrorCode.CONNECTION_UNAVAILABLE,
      status: 0,
    });
  });

  it('handles responses that are not JSON', async () => {
    mockFetch(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expect(apiClient.get('/health')).rejects.toMatchObject({
      code: ErrorCode.SERVICE_UNAVAILABLE,
      status: 502,
    });
  });
});

describe('apiClient login handling', () => {
  const expired = () =>
    jsonResponse(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Please log in.' } },
      401,
    );

  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
    setAccessTokenRefresher(null);
  });

  const authHeader = (call: unknown) =>
    new Headers((call as [string, RequestInit])[1].headers).get('Authorization');

  it('sends the access token', async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, data: null }));
    setAccessToken('token-1');

    await apiClient.get('/subjects');

    expect(authHeader(fetchMock.mock.calls[0])).toBe('Bearer token-1');
  });

  it('gets a new token and retries once when the token has expired', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(expired())
      .mockResolvedValueOnce(jsonResponse({ success: true, data: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);
    setAccessToken('old');
    setAccessTokenRefresher(async () => {
      setAccessToken('new');
      return 'new';
    });

    await expect(apiClient.get('/subjects')).resolves.toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authHeader(fetchMock.mock.calls[1])).toBe('Bearer new');
  });

  it('gives up when the user is logged out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(expired())),
    );
    setAccessTokenRefresher(async () => null);

    await expect(apiClient.get('/subjects')).rejects.toMatchObject({ status: 401 });
  });

  it('never refreshes for calls that opt out, like login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(expired())),
    );
    const refresher = vi.fn(async () => 'new');
    setAccessTokenRefresher(refresher);

    await expect(
      apiClient.post('/auth/login', {}, { retryOnUnauthorized: false }),
    ).rejects.toThrow();
    expect(refresher).not.toHaveBeenCalled();
  });
});
