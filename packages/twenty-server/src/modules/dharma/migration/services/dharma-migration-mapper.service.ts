import { Injectable } from '@nestjs/common';

import {
  BielleAccountingRow,
  BielleAccountingType,
  BielleContactRow,
  BielleContactStatus,
  BielleContactType,
  BielleOrganizationRow,
  BielleProjectRow,
  BielleProjectStatus,
  DharmaEntityKind,
  DharmaExpenseCategory,
  DharmaIncomeType,
  DharmaPriority,
  DharmaProjectStatus,
} from 'src/modules/dharma/migration/types/dharma-migration.types';

const EUR_MICROS_FACTOR = 1_000_000;
const DEFAULT_CURRENCY_CODE = 'EUR';
const DEFAULT_PHONE_COUNTRY = 'IT';
const DEFAULT_PHONE_CALLING = '+39';

@Injectable()
export class DharmaMigrationMapperService {
  splitFullName(name: string): { firstName: string; lastName: string } {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return { firstName: '', lastName: '' };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  contactTypeToEntityKind(type: BielleContactType): DharmaEntityKind {
    switch (type) {
      case 'CLIENTE':
        return 'CLIENT';
      case 'COLLABORATORE':
        return 'COLLABORATOR';
      case 'FORNITORE':
        return 'SUPPLIER';
      case 'STRATEGICO':
        return 'PARTNER';
      default:
        return 'OTHER';
    }
  }

  contactTypeToCompanyKind(
    type: BielleContactType,
  ): Exclude<DharmaEntityKind, 'COLLABORATOR'> {
    switch (type) {
      case 'CLIENTE':
        return 'CLIENT';
      case 'FORNITORE':
        return 'SUPPLIER';
      case 'STRATEGICO':
        return 'PARTNER';
      default:
        return 'OTHER';
    }
  }

  contactStatusToPriority(status: BielleContactStatus): DharmaPriority {
    switch (status) {
      case 'ATTIVO':
        return 'HIGH';
      case 'PROSPECT':
      case 'IN_STALLO':
        return 'MEDIUM';
      case 'INATTIVO':
      case 'IRRECUPERABILE':
      default:
        return 'LOW';
    }
  }

  projectStatusToDharma(status: BielleProjectStatus): DharmaProjectStatus {
    switch (status) {
      case 'ATTIVO':
        return 'ACTIVE';
      case 'IN_PAUSA':
        return 'PAUSED';
      case 'COMPLETATO':
        return 'COMPLETED';
      case 'ARCHIVIATO':
        return 'CANCELLED';
      default:
        return 'DRAFT';
    }
  }

  accountingTypeToIncomeType(
    type: BielleAccountingType,
  ): DharmaIncomeType | null {
    switch (type) {
      case 'ENTRATA_FATTURA':
        return 'INVOICED';
      case 'ENTRATA_CONTANTI':
        return 'CASH';
      default:
        return null;
    }
  }

  isIncomeType(type: BielleAccountingType): boolean {
    return type === 'ENTRATA_FATTURA' || type === 'ENTRATA_CONTANTI';
  }

  isExpenseType(type: BielleAccountingType): boolean {
    return (
      type === 'USCITA' || type === 'USCITA_CONTANTI' || type === 'USCITA_CARTA'
    );
  }

  expenseCategoryFromLabel(label: string | null): DharmaExpenseCategory {
    if (!label) return 'OTHER';
    const normalized = label.toLowerCase();
    if (normalized.includes('tool') || normalized.includes('software'))
      return 'TOOLS';
    if (normalized.includes('office') || normalized.includes('ufficio'))
      return 'OFFICE';
    if (
      normalized.includes('travel') ||
      normalized.includes('viaggio') ||
      normalized.includes('trasferta')
    )
      return 'TRAVEL';
    if (
      normalized.includes('collab') ||
      normalized.includes('freelance') ||
      normalized.includes('fornit')
    )
      return 'COLLABORATOR';
    if (
      normalized.includes('market') ||
      normalized.includes('ads') ||
      normalized.includes('promo')
    )
      return 'MARKETING';
    return 'OTHER';
  }

  decimalToMicros(value: string | number | null): number {
    if (value === null || value === undefined) return 0;
    const asNumber = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(asNumber)) return 0;
    return Math.round(asNumber * EUR_MICROS_FACTOR);
  }

  toCurrencyValue(value: string | number | null) {
    return {
      amountMicros: this.decimalToMicros(value),
      currencyCode: DEFAULT_CURRENCY_CODE,
    };
  }

  mapOrganization(row: BielleOrganizationRow) {
    return {
      dharmaLegacyId: row.id,
      name: row.name,
      vatCode: row.vatNumber ?? null,
      dharmaEntityType: this.contactTypeToCompanyKind(row.type),
    };
  }

  mapContact(row: BielleContactRow) {
    const { firstName, lastName } = this.splitFullName(row.name);
    return {
      dharmaLegacyId: row.id,
      name: { firstName, lastName },
      emails: row.email
        ? { primaryEmail: row.email, additionalEmails: null }
        : { primaryEmail: '', additionalEmails: null },
      phones: row.phone
        ? {
            primaryPhoneNumber: row.phone,
            primaryPhoneCountryCode: DEFAULT_PHONE_COUNTRY,
            primaryPhoneCallingCode: DEFAULT_PHONE_CALLING,
            additionalPhones: null,
          }
        : {
            primaryPhoneNumber: '',
            primaryPhoneCountryCode: '',
            primaryPhoneCallingCode: '',
            additionalPhones: null,
          },
      jobTitle: row.notes ?? null,
      dharmaEntityType: this.contactTypeToEntityKind(row.type),
      dharmaPriority: this.contactStatusToPriority(row.status),
    };
  }

  mapProject(row: BielleProjectRow, companyId: string | null) {
    return {
      dharmaLegacyId: row.id,
      name: row.name,
      projectStatus: this.projectStatusToDharma(row.status),
      projectType: 'OTHER' as const,
      startDate: row.startDate
        ? row.startDate.toISOString().slice(0, 10)
        : null,
      endDate: row.endDate ? row.endDate.toISOString().slice(0, 10) : null,
      totalBudget: row.budget
        ? this.toCurrencyValue(row.budget)
        : { amountMicros: 0, currencyCode: DEFAULT_CURRENCY_CODE },
      notes: row.notes ?? null,
      clientId: companyId,
    };
  }

  mapIncome(row: BielleAccountingRow, projectId: string | null) {
    const incomeType = this.accountingTypeToIncomeType(row.type);
    if (!incomeType) {
      throw new Error(`Not an income row: ${row.id} (${row.type})`);
    }

    const tax = Number(row.taxPct);
    const bl = Number(row.beautifulLifePct);
    const splitConfig = row.isCustomSplit
      ? {
          taxPercent: Number.isFinite(tax) ? tax : 0,
          blPercent: Number.isFinite(bl) ? bl : 0,
          personalPercent: Math.max(
            0,
            100 -
              (Number.isFinite(tax) ? tax : 0) -
              (Number.isFinite(bl) ? bl : 0),
          ),
        }
      : null;

    return {
      dharmaLegacyId: row.id,
      description: row.description,
      grossAmount: this.toCurrencyValue(row.grossAmount),
      incomeType,
      receivedAt: (row.paidAt ?? row.date).toISOString().slice(0, 10),
      invoiceNumber:
        incomeType === 'INVOICED' ? (row.serviceTag ?? null) : null,
      splitConfig,
      projectId,
    };
  }

  mapExpense(row: BielleAccountingRow, projectId: string | null) {
    if (!this.isExpenseType(row.type)) {
      throw new Error(`Not an expense row: ${row.id} (${row.type})`);
    }

    return {
      dharmaLegacyId: row.id,
      description: row.description,
      amount: this.toCurrencyValue(row.grossAmount),
      expenseCategory: this.expenseCategoryFromLabel(row.category),
      paidAt: (row.paidAt ?? row.date).toISOString().slice(0, 10),
      receiptUrl: null,
      projectId,
    };
  }
}
