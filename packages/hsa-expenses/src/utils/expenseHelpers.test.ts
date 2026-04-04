import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  dollarsToAmountCents,
  isFileTooLarge,
  getCategoryColor,
  getCategoryLabelKey,
  CATEGORY_OPTIONS,
} from './expenseHelpers';
import { HSAExpenseCategory } from '../types';

describe('formatAmount', () => {
  it('formats zero cents as $0.00', () => {
    expect(formatAmount(0)).toBe('$0.00');
  });

  it('formats 100 cents as $1.00', () => {
    expect(formatAmount(100)).toBe('$1.00');
  });

  it('formats 4599 cents as $45.99', () => {
    expect(formatAmount(4599)).toBe('$45.99');
  });

  it('formats 1 cent as $0.01', () => {
    expect(formatAmount(1)).toBe('$0.01');
  });

  it('formats large amounts correctly', () => {
    expect(formatAmount(1000000)).toBe('$10000.00');
  });

  it('formats negative amounts with $ before sign', () => {
    // formatAmount places $ prefix before the negative sign: $-5.00
    expect(formatAmount(-500)).toBe('$-5.00');
  });
});

describe('dollarsToAmountCents', () => {
  it('converts "45.99" to 4599', () => {
    expect(dollarsToAmountCents('45.99')).toBe(4599);
  });

  it('converts "0" to 0', () => {
    expect(dollarsToAmountCents('0')).toBe(0);
  });

  it('converts "abc" to 0', () => {
    expect(dollarsToAmountCents('abc')).toBe(0);
  });

  it('strips $ prefix and converts "$125.50" to 12550', () => {
    expect(dollarsToAmountCents('$125.50')).toBe(12550);
  });

  it('converts "1" to 100', () => {
    expect(dollarsToAmountCents('1')).toBe(100);
  });

  it('converts empty string to 0', () => {
    expect(dollarsToAmountCents('')).toBe(0);
  });

  it('handles trailing zeros like "10.10"', () => {
    expect(dollarsToAmountCents('10.10')).toBe(1010);
  });

  it('rounds fractional cents (e.g. "1.999")', () => {
    expect(dollarsToAmountCents('1.999')).toBe(200);
  });

  it('strips minus sign and parses the numeric value', () => {
    // The regex strips all non-digit/non-dot characters including minus, so "-5.00" → "5.00" → 500
    expect(dollarsToAmountCents('-5.00')).toBe(500);
  });
});

describe('isFileTooLarge', () => {
  it('returns false for file under the limit', () => {
    const file = new File(['x'.repeat(100)], 'small.jpg', { type: 'image/jpeg' });
    expect(isFileTooLarge(file, 5)).toBe(false);
  });

  it('returns true for file over the limit', () => {
    // Create a file that reports as > 5MB via size override
    const content = new ArrayBuffer(6 * 1024 * 1024);
    const file = new File([content], 'big.jpg', { type: 'image/jpeg' });
    expect(isFileTooLarge(file, 5)).toBe(true);
  });

  it('returns false for file exactly at the limit', () => {
    const content = new ArrayBuffer(5 * 1024 * 1024);
    const file = new File([content], 'exact.jpg', { type: 'image/jpeg' });
    expect(isFileTooLarge(file, 5)).toBe(false);
  });
});

describe('CATEGORY_OPTIONS', () => {
  it('has exactly 7 items', () => {
    expect(CATEGORY_OPTIONS).toHaveLength(7);
  });

  it('contains all HSAExpenseCategory values', () => {
    const values = CATEGORY_OPTIONS.map((opt) => opt.value);
    expect(values).toContain(HSAExpenseCategory.MEDICAL);
    expect(values).toContain(HSAExpenseCategory.DENTAL);
    expect(values).toContain(HSAExpenseCategory.VISION);
    expect(values).toContain(HSAExpenseCategory.PRESCRIPTION);
    expect(values).toContain(HSAExpenseCategory.MENTAL_HEALTH);
    expect(values).toContain(HSAExpenseCategory.LAB_TEST);
    expect(values).toContain(HSAExpenseCategory.OTHER);
  });

  it('each option has a labelKey string', () => {
    CATEGORY_OPTIONS.forEach((opt) => {
      expect(typeof opt.labelKey).toBe('string');
      expect(opt.labelKey.length).toBeGreaterThan(0);
    });
  });
});

describe('getCategoryLabelKey', () => {
  it('returns hsaExpenses.medical for MEDICAL', () => {
    expect(getCategoryLabelKey(HSAExpenseCategory.MEDICAL)).toBe('hsaExpenses.medical');
  });

  it('returns hsaExpenses.dental for DENTAL', () => {
    expect(getCategoryLabelKey(HSAExpenseCategory.DENTAL)).toBe('hsaExpenses.dental');
  });

  it('returns hsaExpenses.vision for VISION', () => {
    expect(getCategoryLabelKey(HSAExpenseCategory.VISION)).toBe('hsaExpenses.vision');
  });

  it('returns hsaExpenses.prescription for PRESCRIPTION', () => {
    expect(getCategoryLabelKey(HSAExpenseCategory.PRESCRIPTION)).toBe('hsaExpenses.prescription');
  });

  it('returns hsaExpenses.mentalHealth for MENTAL_HEALTH', () => {
    expect(getCategoryLabelKey(HSAExpenseCategory.MENTAL_HEALTH)).toBe('hsaExpenses.mentalHealth');
  });

  it('returns hsaExpenses.labTest for LAB_TEST', () => {
    expect(getCategoryLabelKey(HSAExpenseCategory.LAB_TEST)).toBe('hsaExpenses.labTest');
  });

  it('returns hsaExpenses.other for OTHER', () => {
    expect(getCategoryLabelKey(HSAExpenseCategory.OTHER)).toBe('hsaExpenses.other');
  });
});

describe('getCategoryColor', () => {
  it('returns blue classes for MEDICAL', () => {
    const color = getCategoryColor(HSAExpenseCategory.MEDICAL);
    expect(color).toContain('bg-blue-100');
    expect(color).toContain('text-blue-800');
    expect(color).toContain('dark:bg-blue-900');
  });

  it('returns purple classes for DENTAL', () => {
    const color = getCategoryColor(HSAExpenseCategory.DENTAL);
    expect(color).toContain('bg-purple-100');
    expect(color).toContain('text-purple-800');
  });

  it('returns cyan classes for VISION', () => {
    const color = getCategoryColor(HSAExpenseCategory.VISION);
    expect(color).toContain('bg-cyan-100');
    expect(color).toContain('text-cyan-800');
  });

  it('returns green classes for PRESCRIPTION', () => {
    const color = getCategoryColor(HSAExpenseCategory.PRESCRIPTION);
    expect(color).toContain('bg-green-100');
    expect(color).toContain('text-green-800');
  });

  it('returns pink classes for MENTAL_HEALTH', () => {
    const color = getCategoryColor(HSAExpenseCategory.MENTAL_HEALTH);
    expect(color).toContain('bg-pink-100');
    expect(color).toContain('text-pink-800');
  });

  it('returns orange classes for LAB_TEST', () => {
    const color = getCategoryColor(HSAExpenseCategory.LAB_TEST);
    expect(color).toContain('bg-orange-100');
    expect(color).toContain('text-orange-800');
  });

  it('returns gray classes for OTHER', () => {
    const color = getCategoryColor(HSAExpenseCategory.OTHER);
    expect(color).toContain('bg-gray-100');
    expect(color).toContain('text-gray-800');
  });

  it('includes dark mode variants for every category', () => {
    Object.values(HSAExpenseCategory).forEach((cat) => {
      const color = getCategoryColor(cat);
      expect(color).toMatch(/dark:/);
    });
  });
});
