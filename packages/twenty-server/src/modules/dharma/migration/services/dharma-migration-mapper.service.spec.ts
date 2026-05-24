import { Test, type TestingModule } from '@nestjs/testing';

import {
  BielleAccountingRow,
  BielleContactRow,
  BielleOrganizationRow,
  BielleProjectRow,
} from 'src/modules/dharma/migration/types/dharma-migration.types';

import { DharmaMigrationMapperService } from './dharma-migration-mapper.service';

describe('DharmaMigrationMapperService', () => {
  let service: DharmaMigrationMapperService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [DharmaMigrationMapperService],
    }).compile();
    service = moduleRef.get(DharmaMigrationMapperService);
  });

  describe('splitFullName', () => {
    it('splits two-word name', () => {
      expect(service.splitFullName('Mario Rossi')).toEqual({
        firstName: 'Mario',
        lastName: 'Rossi',
      });
    });

    it('uses full string as firstName for single word', () => {
      expect(service.splitFullName('Mario')).toEqual({
        firstName: 'Mario',
        lastName: '',
      });
    });

    it('joins multi-token last name', () => {
      expect(service.splitFullName('Maria De La Rosa')).toEqual({
        firstName: 'Maria',
        lastName: 'De La Rosa',
      });
    });

    it('handles empty', () => {
      expect(service.splitFullName('')).toEqual({
        firstName: '',
        lastName: '',
      });
    });
  });

  describe('contactTypeToEntityKind', () => {
    it.each([
      ['CLIENTE', 'CLIENT'],
      ['COLLABORATORE', 'COLLABORATOR'],
      ['FORNITORE', 'SUPPLIER'],
      ['STRATEGICO', 'PARTNER'],
    ] as const)('maps %s → %s', (input, expected) => {
      expect(service.contactTypeToEntityKind(input)).toBe(expected);
    });
  });

  describe('contactStatusToPriority', () => {
    it.each([
      ['ATTIVO', 'HIGH'],
      ['PROSPECT', 'MEDIUM'],
      ['IN_STALLO', 'MEDIUM'],
      ['INATTIVO', 'LOW'],
      ['IRRECUPERABILE', 'LOW'],
    ] as const)('maps %s → %s', (input, expected) => {
      expect(service.contactStatusToPriority(input)).toBe(expected);
    });
  });

  describe('projectStatusToDharma', () => {
    it.each([
      ['ATTIVO', 'ACTIVE'],
      ['IN_PAUSA', 'PAUSED'],
      ['COMPLETATO', 'COMPLETED'],
      ['ARCHIVIATO', 'CANCELLED'],
    ] as const)('maps %s → %s', (input, expected) => {
      expect(service.projectStatusToDharma(input)).toBe(expected);
    });
  });

  describe('decimalToMicros', () => {
    it('converts string decimal', () => {
      expect(service.decimalToMicros('100.50')).toBe(100_500_000);
    });
    it('converts number', () => {
      expect(service.decimalToMicros(42)).toBe(42_000_000);
    });
    it('handles null', () => {
      expect(service.decimalToMicros(null)).toBe(0);
    });
    it('handles NaN', () => {
      expect(service.decimalToMicros('abc')).toBe(0);
    });
  });

  describe('expenseCategoryFromLabel', () => {
    it.each([
      ['Software', 'TOOLS'],
      ['Office supplies', 'OFFICE'],
      ['Trasferta cliente', 'TRAVEL'],
      ['Collaboratore freelance', 'COLLABORATOR'],
      ['Marketing campaign', 'MARKETING'],
      ['Random thing', 'OTHER'],
      [null, 'OTHER'],
    ] as const)('maps %s → %s', (input, expected) => {
      expect(service.expenseCategoryFromLabel(input as never)).toBe(expected);
    });
  });

  describe('mapOrganization', () => {
    it('maps base fields + legacy id', () => {
      const row: BielleOrganizationRow = {
        id: 'org_123',
        name: 'Acme SRL',
        company: null,
        type: 'CLIENTE',
        status: 'ATTIVO',
        vatNumber: 'IT01234567890',
        notes: null,
      };
      expect(service.mapOrganization(row)).toEqual({
        dharmaLegacyId: 'org_123',
        name: 'Acme SRL',
        vatCode: 'IT01234567890',
        dharmaEntityType: 'CLIENT',
      });
    });
  });

  describe('mapContact', () => {
    it('maps name + email + phone with defaults', () => {
      const row: BielleContactRow = {
        id: 'c_1',
        name: 'Mario Rossi',
        company: null,
        email: 'mario@example.com',
        phone: '3331234567',
        type: 'COLLABORATORE',
        status: 'ATTIVO',
        vatNumber: null,
        notes: 'Dev senior',
      };
      const out = service.mapContact(row);
      expect(out.dharmaLegacyId).toBe('c_1');
      expect(out.name).toEqual({ firstName: 'Mario', lastName: 'Rossi' });
      expect(out.emails.primaryEmail).toBe('mario@example.com');
      expect(out.phones.primaryPhoneNumber).toBe('3331234567');
      expect(out.phones.primaryPhoneCountryCode).toBe('IT');
      expect(out.dharmaEntityType).toBe('COLLABORATOR');
      expect(out.dharmaPriority).toBe('HIGH');
    });
  });

  describe('mapProject', () => {
    it('formats dates as YYYY-MM-DD, micros budget, FK', () => {
      const row: BielleProjectRow = {
        id: 'p_1',
        name: 'Site relaunch',
        status: 'ATTIVO',
        clientOrganizationId: 'org_123',
        clientContactId: null,
        budget: '1500.00',
        startDate: new Date('2026-01-15T10:00:00Z'),
        endDate: new Date('2026-03-30T10:00:00Z'),
        notes: 'Phase 1',
        tags: [],
      };
      const out = service.mapProject(row, 'company_uuid');
      expect(out.dharmaLegacyId).toBe('p_1');
      expect(out.projectStatus).toBe('ACTIVE');
      expect(out.startDate).toBe('2026-01-15');
      expect(out.endDate).toBe('2026-03-30');
      expect(out.totalBudget.amountMicros).toBe(1_500_000_000);
      expect(out.totalBudget.currencyCode).toBe('EUR');
      expect(out.clientId).toBe('company_uuid');
    });
  });

  describe('mapIncome', () => {
    it('produces INVOICED income with invoice number and no splitConfig override', () => {
      const row: BielleAccountingRow = {
        id: 'a_1',
        type: 'ENTRATA_FATTURA',
        status: 'INCASSATO',
        description: 'Project milestone',
        grossAmount: '1000.00',
        taxPct: '0',
        beautifulLifePct: '0',
        isCustomSplit: false,
        date: new Date('2026-04-01T00:00:00Z'),
        paidAt: new Date('2026-04-10T00:00:00Z'),
        category: null,
        serviceTag: 'INV-2026-001',
        notes: null,
        projectId: 'p_1',
        contactId: null,
      };
      const out = service.mapIncome(row, 'proj_uuid');
      expect(out.dharmaLegacyId).toBe('a_1');
      expect(out.incomeType).toBe('INVOICED');
      expect(out.receivedAt).toBe('2026-04-10');
      expect(out.invoiceNumber).toBe('INV-2026-001');
      expect(out.splitConfig).toBeNull();
      expect(out.grossAmount.amountMicros).toBe(1_000_000_000);
      expect(out.projectId).toBe('proj_uuid');
    });

    it('passes through custom split percentages', () => {
      const row: BielleAccountingRow = {
        id: 'a_2',
        type: 'ENTRATA_CONTANTI',
        status: 'INCASSATO',
        description: 'Cash gig',
        grossAmount: '500.00',
        taxPct: '10',
        beautifulLifePct: '40',
        isCustomSplit: true,
        date: new Date('2026-04-15T00:00:00Z'),
        paidAt: null,
        category: null,
        serviceTag: null,
        notes: null,
        projectId: null,
        contactId: null,
      };
      const out = service.mapIncome(row, null);
      expect(out.incomeType).toBe('CASH');
      expect(out.invoiceNumber).toBeNull();
      expect(out.splitConfig).toEqual({
        taxPercent: 10,
        blPercent: 40,
        personalPercent: 50,
      });
      expect(out.receivedAt).toBe('2026-04-15');
    });

    it('throws on non-income type', () => {
      const row: BielleAccountingRow = {
        id: 'a_x',
        type: 'USCITA',
        status: 'PAGATO',
        description: '',
        grossAmount: '0',
        taxPct: '0',
        beautifulLifePct: '0',
        isCustomSplit: false,
        date: new Date(),
        paidAt: null,
        category: null,
        serviceTag: null,
        notes: null,
        projectId: null,
        contactId: null,
      };
      expect(() => service.mapIncome(row, null)).toThrow();
    });
  });

  describe('mapExpense', () => {
    it('maps USCITA → expense with category from label', () => {
      const row: BielleAccountingRow = {
        id: 'a_3',
        type: 'USCITA_CARTA',
        status: 'PAGATO',
        description: 'Figma annual',
        grossAmount: '150.00',
        taxPct: '0',
        beautifulLifePct: '0',
        isCustomSplit: false,
        date: new Date('2026-04-20T00:00:00Z'),
        paidAt: new Date('2026-04-20T00:00:00Z'),
        category: 'Software',
        serviceTag: null,
        notes: null,
        projectId: null,
        contactId: null,
      };
      const out = service.mapExpense(row, null);
      expect(out.expenseCategory).toBe('TOOLS');
      expect(out.amount.amountMicros).toBe(150_000_000);
      expect(out.paidAt).toBe('2026-04-20');
      expect(out.dharmaLegacyId).toBe('a_3');
    });

    it('throws on non-expense type', () => {
      const row: BielleAccountingRow = {
        id: 'a_y',
        type: 'ENTRATA_FATTURA',
        status: 'INCASSATO',
        description: '',
        grossAmount: '0',
        taxPct: '0',
        beautifulLifePct: '0',
        isCustomSplit: false,
        date: new Date(),
        paidAt: null,
        category: null,
        serviceTag: null,
        notes: null,
        projectId: null,
        contactId: null,
      };
      expect(() => service.mapExpense(row, null)).toThrow();
    });
  });
});
