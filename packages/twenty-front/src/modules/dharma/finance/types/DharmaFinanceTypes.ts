// UI-level types for Dharma Finance.
// Backend stores monetary values as `{ amountMicros, currencyCode }` objects.
// We keep the same shape on the wire but normalize to numbers in selectors.

// Index signature matches twenty-shared `ObjectRecord` so these types
// can flow through useFindManyRecords without `as unknown` casts.
type ObjectRecordLike = {
  id: string;
  __typename: string;
  [key: string]: unknown;
};

export type CurrencyAmount = {
  amountMicros: number | null;
  currencyCode: string | null;
};

export type DharmaIncomeType = 'INVOICED' | 'CASH';

export type DharmaSplitConfig = {
  taxPercent: number;
  blPercent: number;
  personalPercent: number;
};

export type DharmaIncomeEntryRecord = ObjectRecordLike & {
  description: string | null;
  grossAmount: CurrencyAmount | null;
  taxAmount: CurrencyAmount | null;
  beautifulLifeAmount: CurrencyAmount | null;
  personalAmount: CurrencyAmount | null;
  incomeType: DharmaIncomeType | null;
  receivedAt: string | null;
  invoiceNumber: string | null;
  splitConfig: DharmaSplitConfig | null;
  dharmaProject?: { id: string; name: string | null } | null;
  company?: { id: string; name: string | null } | null;
};

export type DharmaExpenseEntryRecord = ObjectRecordLike & {
  description: string | null;
  amount: CurrencyAmount | null;
  expenseCategory: string | null;
  paidAt: string | null;
  receiptUrl: string | null;
};

export type DharmaCollaboratorPayoutCandidate = {
  personId: string;
  name: string;
  pendingFee: number;
  taskCount: number;
};

export type DharmaCassettiBalances = {
  taxTotal: number;
  blTotal: number;
  personalTotal: number;
  blAvailable: number;
};

export type DharmaMonthlyKpi = {
  grossIncome: number;
  totalExpenses: number;
  net: number;
  invoicedShare: number;
  cashShare: number;
  entryCount: number;
};
