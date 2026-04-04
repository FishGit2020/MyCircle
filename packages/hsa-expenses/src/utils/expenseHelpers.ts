import { HSAExpenseCategory } from '../types';

export function formatAmount(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

export function dollarsToAmountCents(dollars: string): number {
  const parsed = parseFloat(dollars.replace(/[^0-9.]/g, ''));
  if (isNaN(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isFileTooLarge(file: File, maxMB: number): boolean {
  return file.size > maxMB * 1024 * 1024;
}

export const CATEGORY_OPTIONS: { value: HSAExpenseCategory; labelKey: string }[] = [
  { value: HSAExpenseCategory.MEDICAL, labelKey: 'hsaExpenses.medical' },
  { value: HSAExpenseCategory.DENTAL, labelKey: 'hsaExpenses.dental' },
  { value: HSAExpenseCategory.VISION, labelKey: 'hsaExpenses.vision' },
  { value: HSAExpenseCategory.PRESCRIPTION, labelKey: 'hsaExpenses.prescription' },
  { value: HSAExpenseCategory.MENTAL_HEALTH, labelKey: 'hsaExpenses.mentalHealth' },
  { value: HSAExpenseCategory.LAB_TEST, labelKey: 'hsaExpenses.labTest' },
  { value: HSAExpenseCategory.OTHER, labelKey: 'hsaExpenses.other' },
];

export function getCategoryLabelKey(category: HSAExpenseCategory): string {
  const map: Record<HSAExpenseCategory, string> = {
    [HSAExpenseCategory.MEDICAL]: 'hsaExpenses.medical',
    [HSAExpenseCategory.DENTAL]: 'hsaExpenses.dental',
    [HSAExpenseCategory.VISION]: 'hsaExpenses.vision',
    [HSAExpenseCategory.PRESCRIPTION]: 'hsaExpenses.prescription',
    [HSAExpenseCategory.MENTAL_HEALTH]: 'hsaExpenses.mentalHealth',
    [HSAExpenseCategory.LAB_TEST]: 'hsaExpenses.labTest',
    [HSAExpenseCategory.OTHER]: 'hsaExpenses.other',
  };
  return map[category];
}

export function getCategoryColor(category: HSAExpenseCategory): string {
  const colors: Record<HSAExpenseCategory, string> = {
    [HSAExpenseCategory.MEDICAL]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [HSAExpenseCategory.DENTAL]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [HSAExpenseCategory.VISION]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    [HSAExpenseCategory.PRESCRIPTION]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [HSAExpenseCategory.MENTAL_HEALTH]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    [HSAExpenseCategory.LAB_TEST]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    [HSAExpenseCategory.OTHER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  return colors[category];
}
