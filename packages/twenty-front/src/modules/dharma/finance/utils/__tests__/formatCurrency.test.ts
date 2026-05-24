import {
  formatCurrency,
  formatCurrencyFromMicros,
  formatItalianDate,
  formatPercent,
  microsToUnits,
} from '@/dharma/finance/utils/formatCurrency';

// Italian non-breaking space used by Intl between number and currency symbol.
const NBSP = ' ';
const NNBSP = ' ';

const normalizeSpaces = (value: string): string =>
  value.replaceAll(NNBSP, NBSP);

describe('formatCurrency utilities', () => {
  describe('microsToUnits', () => {
    it('converts integer micros to currency units', () => {
      expect(microsToUnits(1_000_000)).toBe(1);
      expect(microsToUnits(2_500_000)).toBe(2.5);
    });

    it('returns 0 for null/undefined/NaN', () => {
      expect(microsToUnits(null)).toBe(0);
      expect(microsToUnits(undefined)).toBe(0);
      expect(microsToUnits(Number.NaN)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('formats euro amounts with italian decimal separator and EUR symbol', () => {
      const formatted = normalizeSpaces(formatCurrency(1234.5));
      // Allow either grouped ("1.234,50") or ungrouped ("1234,50") because
      // ICU thousand separator data is environment-dependent in jsdom.
      expect(formatted).toMatch(/^1\.?234,50\s?€$/);
      expect(normalizeSpaces(formatCurrency(0))).toBe(`0,00${NBSP}€`);
    });

    it('returns 0 EUR for null/undefined', () => {
      expect(normalizeSpaces(formatCurrency(null))).toBe(`0,00${NBSP}€`);
      expect(normalizeSpaces(formatCurrency(undefined))).toBe(`0,00${NBSP}€`);
    });
  });

  describe('formatCurrencyFromMicros', () => {
    it('formats micros directly as italian EUR', () => {
      expect(normalizeSpaces(formatCurrencyFromMicros(500_000))).toBe(
        `0,50${NBSP}€`,
      );
      const formatted = normalizeSpaces(
        formatCurrencyFromMicros(1_234_560_000),
      );
      expect(formatted).toMatch(/^1\.?234,56\s?€$/);
    });
  });

  describe('formatPercent', () => {
    it('formats ratios as italian percent strings', () => {
      expect(normalizeSpaces(formatPercent(0.35))).toBe('35%');
      expect(normalizeSpaces(formatPercent(0.005))).toBe('0,5%');
    });
  });

  describe('formatItalianDate', () => {
    it('formats ISO strings with dd/mm/yyyy pattern', () => {
      expect(formatItalianDate('2026-05-24T10:00:00.000Z')).toBe('24/05/2026');
    });

    it('returns empty string for invalid input', () => {
      expect(formatItalianDate(null)).toBe('');
      expect(formatItalianDate('not-a-date')).toBe('');
    });
  });
});
