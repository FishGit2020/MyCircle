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

export interface HSAExpense {
  id: string;
  provider: string;
  dateOfService: string;
  amountCents: number;
  category: HSAExpenseCategory;
  description: string | null;
  status: HSAExpenseStatus;
  receiptUrl: string | null;
  receiptContentType: string | null;
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
