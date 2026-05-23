export type SplitConfig = {
  taxPercent: number;
  blPercent: number;
  personalPercent: number;
};

export type CassettiSplit = {
  taxAmountMicros: number;
  blAmountMicros: number;
  personalAmountMicros: number;
  currencyCode: string;
};

export type DharmaFinanceKpi = {
  period: string;
  grossIncome: number;
  taxCassetto: number;
  blCassetto: number;
  personalCassetto: number;
  totalExpenses: number;
  collaboratorPayouts: number;
  blAvailable: number;
  netPersonal: number;
  entryCount: number;
};

// Minimal record shapes returned by workspace repositories
export type DharmaIncomeEntryRecord = {
  id: string;
  grossAmount: { amountMicros: number; currencyCode: string } | null;
  taxAmount: { amountMicros: number; currencyCode: string } | null;
  beautifulLifeAmount: { amountMicros: number; currencyCode: string } | null;
  personalAmount: { amountMicros: number; currencyCode: string } | null;
  incomeType: 'INVOICED' | 'CASH' | null;
  splitConfig: SplitConfig | null;
  receivedAt: Date | string | null;
};

export type DharmaExpenseEntryRecord = {
  id: string;
  amount: { amountMicros: number; currencyCode: string } | null;
  paidAt: Date | string | null;
};

export type DharmaCollaboratorPayoutRecord = {
  id: string;
  feeAmount: { amountMicros: number; currencyCode: string } | null;
  status: 'PENDING' | 'PAID' | null;
};

export const INVOICED_SPLIT_DEFAULTS: SplitConfig = {
  taxPercent: 35,
  blPercent: 30,
  personalPercent: 35,
};

export const CASH_SPLIT_DEFAULTS: SplitConfig = {
  taxPercent: 0,
  blPercent: 50,
  personalPercent: 50,
};

export const DEFAULT_CURRENCY_CODE = 'EUR';
