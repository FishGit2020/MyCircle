import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import CaseCard from './CaseCard';
import type { ImmigrationCase, CaseStatus } from '../types';

const mockCase: ImmigrationCase = {
  id: '1',
  receiptNumber: 'IOE0912345678',
  formType: 'I-485',
  nickname: 'Green Card',
  createdAt: { seconds: 1700000000, nanoseconds: 0 },
};

const mockStatus: CaseStatus = {
  receiptNumber: 'IOE0912345678',
  formType: 'I-485',
  status: 'Case Was Approved',
  statusDescription: 'Your case has been approved.',
  checkedAt: '2026-03-01T12:00:00Z',
};

describe('CaseCard', () => {
  const onRefresh = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders receipt number and form type', () => {
    render(
      <CaseCard caseData={mockCase} loading={false} onRefresh={onRefresh} onDelete={onDelete} />
    );
    expect(screen.getByText('IOE0912345678')).toBeInTheDocument();
    expect(screen.getByText('I-485')).toBeInTheDocument();
  });

  it('renders nickname', () => {
    render(
      <CaseCard caseData={mockCase} loading={false} onRefresh={onRefresh} onDelete={onDelete} />
    );
    expect(screen.getByText('Green Card')).toBeInTheDocument();
  });

  it('shows "not checked" when no status', () => {
    render(
      <CaseCard caseData={mockCase} loading={false} onRefresh={onRefresh} onDelete={onDelete} />
    );
    expect(screen.getByText('immigration.notChecked')).toBeInTheDocument();
  });

  it('shows "checking" when loading', () => {
    render(
      <CaseCard caseData={mockCase} loading={true} onRefresh={onRefresh} onDelete={onDelete} />
    );
    expect(screen.getByText('immigration.checking')).toBeInTheDocument();
  });

  it('renders status when provided', () => {
    render(
      <CaseCard
        caseData={mockCase}
        status={mockStatus}
        loading={false}
        onRefresh={onRefresh}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText('Case Was Approved')).toBeInTheDocument();
    expect(screen.getByText('Your case has been approved.')).toBeInTheDocument();
  });

  it('calls onDelete with confirmation', () => {
    render(
      <CaseCard caseData={mockCase} loading={false} onRefresh={onRefresh} onDelete={onDelete} />
    );
    // First click shows confirm
    fireEvent.click(screen.getByLabelText('immigration.delete'));
    expect(screen.getByText('immigration.confirm')).toBeInTheDocument();
    // Second click confirms
    fireEvent.click(screen.getByText('immigration.confirm'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
