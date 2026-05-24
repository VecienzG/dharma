import { useMemo } from 'react';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  type DharmaCassettiBalances,
  type DharmaExpenseEntryRecord,
  type DharmaIncomeEntryRecord,
  type DharmaMonthlyKpi,
} from '@/dharma/finance/types/DharmaFinanceTypes';
import { microsToUnits } from '@/dharma/finance/utils/formatCurrency';

const CURRENCY_RECORD_GQL_FIELDS = {
  amountMicros: true,
  currencyCode: true,
};

const INCOME_ENTRY_GQL_FIELDS = {
  id: true,
  description: true,
  receivedAt: true,
  invoiceNumber: true,
  incomeType: true,
  splitConfig: true,
  grossAmount: CURRENCY_RECORD_GQL_FIELDS,
  taxAmount: CURRENCY_RECORD_GQL_FIELDS,
  beautifulLifeAmount: CURRENCY_RECORD_GQL_FIELDS,
  personalAmount: CURRENCY_RECORD_GQL_FIELDS,
  dharmaProject: { id: true, name: true },
  company: { id: true, name: true },
};

const EXPENSE_ENTRY_GQL_FIELDS = {
  id: true,
  description: true,
  paidAt: true,
  expenseCategory: true,
  receiptUrl: true,
  amount: CURRENCY_RECORD_GQL_FIELDS,
};

const getMonthBounds = (
  reference: Date = new Date(),
): { start: Date; end: Date; prevStart: Date; prevEnd: Date } => {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  const prevStart = new Date(
    reference.getFullYear(),
    reference.getMonth() - 1,
    1,
  );
  const prevEnd = new Date(reference.getFullYear(), reference.getMonth(), 1);
  return { start, end, prevStart, prevEnd };
};

const computeKpi = (
  incomes: DharmaIncomeEntryRecord[],
  expenses: DharmaExpenseEntryRecord[],
): DharmaMonthlyKpi => {
  const grossIncome = incomes.reduce(
    (acc, entry) => acc + microsToUnits(entry.grossAmount?.amountMicros ?? 0),
    0,
  );
  const totalExpenses = expenses.reduce(
    (acc, entry) => acc + microsToUnits(entry.amount?.amountMicros ?? 0),
    0,
  );
  const invoicedTotal = incomes
    .filter((entry) => entry.incomeType === 'INVOICED')
    .reduce(
      (acc, entry) => acc + microsToUnits(entry.grossAmount?.amountMicros ?? 0),
      0,
    );
  const cashTotal = grossIncome - invoicedTotal;

  return {
    grossIncome,
    totalExpenses,
    net: grossIncome - totalExpenses,
    invoicedShare: grossIncome === 0 ? 0 : invoicedTotal / grossIncome,
    cashShare: grossIncome === 0 ? 0 : cashTotal / grossIncome,
    entryCount: incomes.length,
  };
};

const computeBalances = (
  incomes: DharmaIncomeEntryRecord[],
  expenses: DharmaExpenseEntryRecord[],
): DharmaCassettiBalances => {
  const taxTotal = incomes.reduce(
    (acc, entry) => acc + microsToUnits(entry.taxAmount?.amountMicros ?? 0),
    0,
  );
  const blTotal = incomes.reduce(
    (acc, entry) =>
      acc + microsToUnits(entry.beautifulLifeAmount?.amountMicros ?? 0),
    0,
  );
  const personalTotal = incomes.reduce(
    (acc, entry) =>
      acc + microsToUnits(entry.personalAmount?.amountMicros ?? 0),
    0,
  );
  const expensesTotal = expenses.reduce(
    (acc, entry) => acc + microsToUnits(entry.amount?.amountMicros ?? 0),
    0,
  );

  return {
    taxTotal,
    blTotal,
    personalTotal,
    blAvailable: Math.max(0, blTotal - expensesTotal),
  };
};

export type UseFinanceDataResult = {
  loading: boolean;
  error?: Error;
  incomeEntries: DharmaIncomeEntryRecord[];
  expenseEntries: DharmaExpenseEntryRecord[];
  previousIncomeEntries: DharmaIncomeEntryRecord[];
  previousExpenseEntries: DharmaExpenseEntryRecord[];
  monthlyKpi: DharmaMonthlyKpi;
  previousMonthlyKpi: DharmaMonthlyKpi;
  balances: DharmaCassettiBalances;
  refetch: () => void;
};

export const useFinanceData = (
  reference: Date = new Date(),
): UseFinanceDataResult => {
  const { start, end, prevStart, prevEnd } = useMemo(
    () => getMonthBounds(reference),
    [reference],
  );

  const incomeMonth = useFindManyRecords<DharmaIncomeEntryRecord>({
    objectNameSingular: 'dharmaIncomeEntry',
    filter: {
      receivedAt: { gte: start.toISOString(), lt: end.toISOString() },
    },
    orderBy: [{ receivedAt: 'DescNullsLast' }],
    recordGqlFields: INCOME_ENTRY_GQL_FIELDS,
  });

  const incomePrev = useFindManyRecords<DharmaIncomeEntryRecord>({
    objectNameSingular: 'dharmaIncomeEntry',
    filter: {
      receivedAt: { gte: prevStart.toISOString(), lt: prevEnd.toISOString() },
    },
    recordGqlFields: INCOME_ENTRY_GQL_FIELDS,
  });

  const expenseMonth = useFindManyRecords<DharmaExpenseEntryRecord>({
    objectNameSingular: 'dharmaExpenseEntry',
    filter: {
      paidAt: { gte: start.toISOString(), lt: end.toISOString() },
    },
    orderBy: [{ paidAt: 'DescNullsLast' }],
    recordGqlFields: EXPENSE_ENTRY_GQL_FIELDS,
  });

  const expensePrev = useFindManyRecords<DharmaExpenseEntryRecord>({
    objectNameSingular: 'dharmaExpenseEntry',
    filter: {
      paidAt: { gte: prevStart.toISOString(), lt: prevEnd.toISOString() },
    },
    recordGqlFields: EXPENSE_ENTRY_GQL_FIELDS,
  });

  const incomeEntries = incomeMonth.records;
  const expenseEntries = expenseMonth.records;
  const previousIncomeEntries = incomePrev.records;
  const previousExpenseEntries = expensePrev.records;

  const monthlyKpi = useMemo(
    () => computeKpi(incomeEntries, expenseEntries),
    [incomeEntries, expenseEntries],
  );

  const previousMonthlyKpi = useMemo(
    () => computeKpi(previousIncomeEntries, previousExpenseEntries),
    [previousIncomeEntries, previousExpenseEntries],
  );

  const balances = useMemo(
    () => computeBalances(incomeEntries, expenseEntries),
    [incomeEntries, expenseEntries],
  );

  const refetch = () => {
    void incomeMonth.refetch();
    void incomePrev.refetch();
    void expenseMonth.refetch();
    void expensePrev.refetch();
  };

  return {
    loading:
      incomeMonth.loading ||
      incomePrev.loading ||
      expenseMonth.loading ||
      expensePrev.loading,
    error:
      incomeMonth.error ??
      incomePrev.error ??
      expenseMonth.error ??
      expensePrev.error ??
      undefined,
    incomeEntries,
    expenseEntries,
    previousIncomeEntries,
    previousExpenseEntries,
    monthlyKpi,
    previousMonthlyKpi,
    balances,
    refetch,
  };
};
