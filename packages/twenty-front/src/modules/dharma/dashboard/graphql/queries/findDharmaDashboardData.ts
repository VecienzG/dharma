import { type RecordGqlOperationGqlRecordFields } from 'twenty-shared/types';

// Per-widget GraphQL field selections + filters. Each widget owns a
// useFindManyRecords call with these. Centralizing here lets us swap the
// shape (e.g. switch to a single server-side aggregator) without rewriting
// every widget.

export const DHARMA_DASHBOARD_LIMITS = {
  deadlines: 10,
  dormantContacts: 8,
  paymentsDue: 10,
  incomeWeek: 50,
} as const;

export const DEADLINES_LOOKAHEAD_DAYS = 7;
export const PAYMENTS_DUE_LOOKAHEAD_DAYS = 14;
export const DORMANT_INACTIVITY_DAYS = 30;

export const taskWidgetGqlFields: RecordGqlOperationGqlRecordFields = {
  id: true,
  title: true,
  status: true,
  dueAt: true,
};

export const personWidgetGqlFields: RecordGqlOperationGqlRecordFields = {
  id: true,
  name: { firstName: true, lastName: true },
  jobTitle: true,
  dharmaPriority: true,
  updatedAt: true,
};

export const incomeWidgetGqlFields: RecordGqlOperationGqlRecordFields = {
  id: true,
  description: true,
  grossAmount: {
    amountMicros: true,
    currencyCode: true,
  },
  receivedAt: true,
};

export const expenseWidgetGqlFields: RecordGqlOperationGqlRecordFields = {
  id: true,
  description: true,
  amount: {
    amountMicros: true,
    currencyCode: true,
  },
  paidAt: true,
};
