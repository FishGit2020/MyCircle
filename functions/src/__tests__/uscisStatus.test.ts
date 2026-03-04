import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import axios from 'axios';

const MOCK_API_RESPONSE = {
  case_status: {
    receiptNumber: 'MSC0000000099',
    formType: 'I-765',
    current_case_status_text_en: 'Case Was Approved',
    current_case_status_desc_en: 'On October 19, 2023, we approved your Form I-765.',
    submittedDate: '2023-06-15',
    modifiedDate: '2023-10-19',
    hist_case_status: [
      { date: '2023-10-19', case_status_text_en: 'Case Was Approved' },
      { date: '2023-06-15', case_status_text_en: 'Case Was Received' },
    ],
  },
};

function mockOAuthToken() {
  vi.mocked(axios.post).mockResolvedValueOnce({
    data: { access_token: 'mock-token', expires_in: 3600 },
  } as any);
}

describe('fetchUscisStatus (uscisApi module)', () => {
  let fetchUscisStatus: any;
  let _resetTokenCache: any;

  beforeEach(async () => {
    vi.mocked(axios.post).mockReset();
    vi.mocked(axios.get).mockReset();
    const mod = await import('../uscisApi.js');
    fetchUscisStatus = mod.fetchUscisStatus;
    _resetTokenCache = mod._resetTokenCache;
    _resetTokenCache();
  });

  afterEach(() => {
    delete process.env.USCIS_CREDS;
  });

  it('fetches case status via official API', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    const result = await fetchUscisStatus('MSC0000000099');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/oauth/accesstoken'),
      'grant_type=client_credentials',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Basic '),
        }),
      }),
    );
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/case-status/MSC0000000099'),
      expect.objectContaining({
        headers: { 'Authorization': 'Bearer mock-token' },
      }),
    );
    expect(result).toEqual(expect.objectContaining({
      receiptNumber: 'MSC0000000099',
      formType: 'I-765',
      status: 'Case Was Approved',
      submittedDate: '2023-06-15',
      modifiedDate: '2023-10-19',
      history: [
        { date: '2023-10-19', status: 'Case Was Approved' },
        { date: '2023-06-15', status: 'Case Was Received' },
      ],
    }));
  });

  it('refreshes token on 401 and retries', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    vi.mocked(axios.post)
      .mockResolvedValueOnce({ data: { access_token: 'token-1', expires_in: 3600 } } as any)
      .mockResolvedValueOnce({ data: { access_token: 'token-2', expires_in: 3600 } } as any);

    vi.mocked(axios.get)
      .mockRejectedValueOnce({ response: { status: 401 }, message: 'Unauthorized' })
      .mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    const result = await fetchUscisStatus('MSC0000000099');

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('Case Was Approved');
  });

  it('throws when USCIS_CREDS is not configured', async () => {
    delete process.env.USCIS_CREDS;
    await expect(fetchUscisStatus('MSC0000000099')).rejects.toThrow('USCIS_CREDS secret not configured');
  });

  it('caches OAuth token across calls', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    mockOAuthToken();

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any)
      .mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    await fetchUscisStatus('MSC0000000099');
    await fetchUscisStatus('MSC0000000098');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('throws on unexpected API response shape', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockResolvedValueOnce({ data: {} } as any);

    await expect(fetchUscisStatus('MSC0000000099')).rejects.toThrow('missing case_status');
  });

  it('propagates API errors with RFC-9457 message extraction', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockRejectedValueOnce({
      response: {
        status: 400,
        data: { errors: [{ message: 'Invalid receipt number format' }] },
      },
      message: 'Request failed with status code 400',
    });

    await expect(fetchUscisStatus('BADRECEIPT')).rejects.toThrow('Invalid receipt number format');
  });

  it('extracts simple message format from error response', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: 'Receipt number not recognized' },
      },
      message: 'Not Found',
    });

    await expect(fetchUscisStatus('MSC0000000099')).rejects.toThrow('Receipt number not recognized');
  });

  it('falls back to raw error message when no structured error', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockRejectedValueOnce({
      response: { status: 500, data: {} },
      message: 'Internal Server Error',
    });

    await expect(fetchUscisStatus('MSC0000000099')).rejects.toThrow('Internal Server Error');
  });

  it('uses configurable apiBase and oauthUrl from secret', async () => {
    process.env.USCIS_CREDS = JSON.stringify({
      clientId: 'test-id',
      clientSecret: 'test-secret',
      apiBase: 'https://api-int.uscis.gov',
      oauthUrl: 'https://api-int.uscis.gov/oauth/accesstoken',
    });
    mockOAuthToken();
    vi.mocked(axios.get).mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    await fetchUscisStatus('MSC0000000099');

    expect(axios.post).toHaveBeenCalledWith(
      'https://api-int.uscis.gov/oauth/accesstoken',
      expect.any(String),
      expect.any(Object),
    );
    expect(axios.get).toHaveBeenCalledWith(
      'https://api-int.uscis.gov/case-status/MSC0000000099',
      expect.any(Object),
    );
  });

  it('falls back to default URLs when apiBase/oauthUrl not provided', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    await fetchUscisStatus('MSC0000000099');

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.uscis.gov/oauth/accesstoken',
      expect.any(String),
      expect.any(Object),
    );
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.uscis.gov/case-status/MSC0000000099',
      expect.any(Object),
    );
  });

  it('sends demo_id header when demoId is present', async () => {
    process.env.USCIS_CREDS = JSON.stringify({
      clientId: 'test-id',
      clientSecret: 'test-secret',
      demoId: '1234',
    });
    mockOAuthToken();
    vi.mocked(axios.get).mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    await fetchUscisStatus('MSC0000000099');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/case-status/MSC0000000099'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'demo_id': '1234' }),
      }),
    );
  });

  it('does not send demo_id header when demoId is absent', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    await fetchUscisStatus('MSC0000000099');

    const callHeaders = vi.mocked(axios.get).mock.calls[0][1]?.headers;
    expect(callHeaders).not.toHaveProperty('demo_id');
  });
});
