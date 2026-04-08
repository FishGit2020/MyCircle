export enum HSAExpenseCategory {
  MEDICAL = 'MEDICAL',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  PRESCRIPTION = 'PRESCRIPTION',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  LAB_TEST = 'LAB_TEST',
  OTHER = 'OTHER',
}

export enum HSAExpenseStatus {
  PENDING = 'PENDING',
  REIMBURSED = 'REIMBURSED',
}

export interface HSAReceipt {
  id: string;
  url: string;
  contentType: string;
  fileName: string;
  uploadedAt: string;
  trashedAt: string | null;
}

export interface HSAExpense {
  id: string;
  provider: string;
  dateOfService: string;
  amountCents: number;
  category: HSAExpenseCategory;
  description: string | null;
  status: HSAExpenseStatus;
  receipts: HSAReceipt[];
  createdAt: string;
  updatedAt: string;
}

export interface HSAExpenseInput {
  provider: string;
  dateOfService: string;
  amountCents: number;
  category: HSAExpenseCategory;
  description?: string;
}

export interface HSAExpenseUpdateInput {
  provider?: string;
  dateOfService?: string;
  amountCents?: number;
  category?: HSAExpenseCategory;
  description?: string;
}
