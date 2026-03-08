import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createImmigrationQueryResolvers } from '../../resolvers/immigration.js';

vi.mock('../../uscisApi.js', () => ({
  fetchUscisStatus: vi.fn(),
}));

import { fetchUscisStatus } from '../../uscisApi.js';

describe('immigration resolvers', () => {
  let resolvers: ReturnType<typeof createImmigrationQueryResolvers>;

  beforeEach(() => {
    vi.clearAllMocks();
    resolvers = createImmigrationQueryResolvers();
  });

  it('validates receipt number format and rejects invalid ones', async () => {
    await expect(resolvers.checkCaseStatus(null, { receiptNumber: 'INVALID' }))
      .rejects.toThrow('Invalid receipt number format');

    await expect(resolvers.checkCaseStatus(null, { receiptNumber: '' }))
      .rejects.toThrow('Invalid receipt number format');

    await expect(resolvers.checkCaseStatus(null, { receiptNumber: 'AB1234567890' }))
      .rejects.toThrow('Invalid receipt number format');
  });

  it('accepts valid receipt number format (3 letters + 10 digits)', async () => {
    const mockResult = { status: 'Case Was Received', details: 'On Jan 1...' };
    vi.mocked(fetchUscisStatus).mockResolvedValueOnce(mockResult);

    const result = await resolvers.checkCaseStatus(null, { receiptNumber: 'EAC2190000001' });

    expect(fetchUscisStatus).toHaveBeenCalledWith('EAC2190000001');
    expect(result).toEqual(mockResult);
  });

  it('normalizes receipt number to uppercase and trims whitespace', async () => {
    vi.mocked(fetchUscisStatus).mockResolvedValueOnce({ status: 'OK' });

    await resolvers.checkCaseStatus(null, { receiptNumber: '  eac2190000002  ' });

    expect(fetchUscisStatus).toHaveBeenCalledWith('EAC2190000002');
  });

  it('returns cached result on second call with same receipt number', async () => {
    vi.mocked(fetchUscisStatus).mockResolvedValueOnce({ status: 'Approved' });

    await resolvers.checkCaseStatus(null, { receiptNumber: 'MSC2190000002' });
    await resolvers.checkCaseStatus(null, { receiptNumber: 'MSC2190000002' });

    // fetchUscisStatus should only be called once due to caching
    expect(fetchUscisStatus).toHaveBeenCalledTimes(1);
  });
});
