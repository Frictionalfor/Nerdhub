import { describe, expect, it, vi, afterEach } from 'vitest';
import { NerdHubApiClient } from './client.js';
import { ApiClientError } from './errors.js';

function installFetchMock(response: Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(response))
  );
}

function mockFetch(): ReturnType<typeof vi.fn> {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

describe('NerdHubApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts JSON and parses an ok response envelope', async () => {
    const body = { data: { id: 'abc' }, meta: { requestId: 'req-1' } };
    installFetchMock(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-1' },
      })
    );

    const client = new NerdHubApiClient({ baseUrl: 'http://localhost:4000/api/v1' });
    const result = await client.post<{ id: string }>('/health', { name: 'nerd' });

    const fetchMock = mockFetch();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0]!;
    expect(call[0]).toBe('http://localhost:4000/api/v1/health');
    expect(call[1]?.method).toBe('POST');
    expect(call[1]?.headers?.['Accept']).toBe('application/json');
    expect(result.data).toEqual({ id: 'abc' });
    expect(result.meta.requestId).toBe('req-1');
  });

  it('throws ApiClientError for non-ok responses', async () => {
    const errorBody = {
      error: { code: 'VALIDATION_ERROR', message: 'bad input', requestId: 'req-2' },
    };
    installFetchMock(
      new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    );

    const client = new NerdHubApiClient({ baseUrl: 'http://localhost:4000/api/v1' });
    await expect(client.get('/health')).rejects.toMatchObject(
      new ApiClientError(400, 'bad input', 'VALIDATION_ERROR', errorBody)
    );
  });

  it('supplies the bearer token from getAccessToken', async () => {
    installFetchMock(
      new Response(JSON.stringify({ data: null, meta: { requestId: 'req-3' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const client = new NerdHubApiClient({
      baseUrl: 'http://localhost:4000/api/v1',
      getAccessToken: () => 'token-123',
    });
    await client.get('/health');

    const fetchMock = mockFetch();
    expect(fetchMock.mock.calls[0]![1]?.headers?.['Authorization']).toBe('Bearer token-123');
  });

  it('includes Content-Type: application/json on POST with a JSON body', async () => {
    installFetchMock(
      new Response(JSON.stringify({ data: { id: 'abc' }, meta: { requestId: 'req-4' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const client = new NerdHubApiClient({ baseUrl: 'http://localhost:4000/api/v1' });
    await client.post<{ id: string }>('/items', { name: 'nerd' });

    const fetchMock = mockFetch();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0]!;
    expect(call[1]?.method).toBe('POST');
    expect(call[1]?.headers?.['Content-Type']).toBe('application/json');
    expect(call[1]?.body).toBe(JSON.stringify({ name: 'nerd' }));
  });

  it('includes Content-Type: application/json on PATCH with a JSON body', async () => {
    installFetchMock(
      new Response(JSON.stringify({ data: { id: 'abc' }, meta: { requestId: 'req-5' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const client = new NerdHubApiClient({ baseUrl: 'http://localhost:4000/api/v1' });
    await client.patch<{ id: string }>('/items/1', { name: 'nerd' });

    const fetchMock = mockFetch();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0]!;
    expect(call[1]?.method).toBe('PATCH');
    expect(call[1]?.headers?.['Content-Type']).toBe('application/json');
    expect(call[1]?.body).toBe(JSON.stringify({ name: 'nerd' }));
  });

  it('preserves caller-supplied custom headers', async () => {
    installFetchMock(
      new Response(JSON.stringify({ data: null, meta: { requestId: 'req-6' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const client = new NerdHubApiClient({ baseUrl: 'http://localhost:4000/api/v1' });
    await client.post<{ id: string }>(
      '/items',
      { name: 'nerd' },
      {
        headers: { 'x-custom-header': 'custom-value' },
      }
    );

    const fetchMock = mockFetch();
    const call = fetchMock.mock.calls[0]!;
    expect(call[1]?.headers?.['x-custom-header']).toBe('custom-value');
  });

  it('does not add Content-Type to bodyless GET requests', async () => {
    installFetchMock(
      new Response(JSON.stringify({ data: null, meta: { requestId: 'req-7' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const client = new NerdHubApiClient({ baseUrl: 'http://localhost:4000/api/v1' });
    await client.get('/items');

    const fetchMock = mockFetch();
    const call = fetchMock.mock.calls[0]!;
    expect(call[1]?.method).toBe('GET');
    expect(call[1]?.headers?.['Content-Type']).toBeUndefined();
  });

  it('does not add Content-Type to bodyless DELETE requests', async () => {
    installFetchMock(
      new Response(JSON.stringify({ data: null, meta: { requestId: 'req-8' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const client = new NerdHubApiClient({ baseUrl: 'http://localhost:4000/api/v1' });
    await client.delete('/items/1');

    const fetchMock = mockFetch();
    const call = fetchMock.mock.calls[0]!;
    expect(call[1]?.method).toBe('DELETE');
    expect(call[1]?.headers?.['Content-Type']).toBeUndefined();
  });
});
