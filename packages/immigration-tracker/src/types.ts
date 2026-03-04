export interface ImmigrationCase {
  id: string;
  receiptNumber: string;
  formType: string;
  nickname: string;
  createdAt: { seconds: number; nanoseconds: number };
}

export interface CaseStatus {
  receiptNumber: string;
  formType: string;
  status: string;
  statusDescription: string;
  checkedAt: string;
  submittedDate?: string;
  modifiedDate?: string;
  history?: Array<{ date: string; status: string }>;
  source?: 'api' | 'scraper';
}

export interface CaseStatusHistory {
  id: string;
  receiptNumber: string;
  status: string;
  checkedAt: string;
}

export type StatusColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray';
