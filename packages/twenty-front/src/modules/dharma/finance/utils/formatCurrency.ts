// Currency utilities for Dharma Finance views.
// All Dharma amounts are stored as micros (1 EUR = 1_000_000 micros) in line
// with Twenty's CurrencyMicros pattern. The UI always displays italian EUR.

const MICROS_PER_UNIT = 1_000_000;

const DEFAULT_LOCALE = 'it-IT';
const DEFAULT_CURRENCY = 'EUR';

const currencyFormatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
  style: 'currency',
  currency: DEFAULT_CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export const microsToUnits = (
  amountMicros: number | null | undefined,
): number => {
  if (
    amountMicros === null ||
    amountMicros === undefined ||
    Number.isNaN(amountMicros)
  ) {
    return 0;
  }

  return amountMicros / MICROS_PER_UNIT;
};

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return currencyFormatter.format(0);
  }

  return currencyFormatter.format(amount);
};

export const formatCurrencyFromMicros = (
  amountMicros: number | null | undefined,
): string => formatCurrency(microsToUnits(amountMicros));

export const formatPercent = (ratio: number | null | undefined): string => {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) {
    return percentFormatter.format(0);
  }

  return percentFormatter.format(ratio);
};

export const formatItalianDate = (
  value: string | Date | null | undefined,
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
