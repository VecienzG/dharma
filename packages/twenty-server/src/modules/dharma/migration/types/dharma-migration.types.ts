// Source row shapes from BielleCRM v1 (Prisma snake-case → camelCase fields via SELECT alias)

export type BielleContactRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  type: BielleContactType;
  status: BielleContactStatus;
  vatNumber: string | null;
  notes: string | null;
};

export type BielleOrganizationRow = {
  id: string;
  name: string;
  company: string | null;
  type: BielleContactType;
  status: BielleContactStatus;
  vatNumber: string | null;
  notes: string | null;
};

export type BielleProjectRow = {
  id: string;
  name: string;
  status: BielleProjectStatus;
  clientOrganizationId: string | null;
  clientContactId: string | null;
  budget: string | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  tags: string[] | null;
};

export type BielleAccountingRow = {
  id: string;
  type: BielleAccountingType;
  status: BielleAccountingStatus;
  description: string;
  grossAmount: string;
  taxPct: string;
  beautifulLifePct: string;
  isCustomSplit: boolean;
  date: Date;
  paidAt: Date | null;
  category: string | null;
  serviceTag: string | null;
  notes: string | null;
  projectId: string | null;
  contactId: string | null;
};

export type BielleContactType =
  | 'CLIENTE'
  | 'COLLABORATORE'
  | 'FORNITORE'
  | 'STRATEGICO';

export type BielleContactStatus =
  | 'PROSPECT'
  | 'ATTIVO'
  | 'INATTIVO'
  | 'IRRECUPERABILE'
  | 'IN_STALLO';

export type BielleProjectStatus =
  | 'ATTIVO'
  | 'IN_PAUSA'
  | 'COMPLETATO'
  | 'ARCHIVIATO';

export type BielleAccountingType =
  | 'ENTRATA_FATTURA'
  | 'ENTRATA_CONTANTI'
  | 'USCITA'
  | 'USCITA_CONTANTI'
  | 'USCITA_CARTA';

export type BielleAccountingStatus =
  | 'PREVENTIVO_ACCETTATO'
  | 'LAVORO_FINITO'
  | 'FATTURA_EMESSA'
  | 'INCASSATO'
  | 'PERSO'
  | 'DA_PAGARE'
  | 'PAGATO';

export type DharmaEntityKind =
  | 'CLIENT'
  | 'COLLABORATOR'
  | 'SUPPLIER'
  | 'PARTNER'
  | 'OTHER';

export type DharmaPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type DharmaProjectStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type DharmaExpenseCategory =
  | 'TOOLS'
  | 'OFFICE'
  | 'TRAVEL'
  | 'COLLABORATOR'
  | 'MARKETING'
  | 'OTHER';

export type DharmaIncomeType = 'INVOICED' | 'CASH';

export type DharmaMigrationStats = {
  entity: string;
  read: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
};

export type DharmaMigrationOptions = {
  workspaceId: string;
  sourceUrl: string;
  dryRun: boolean;
  batchSize: number;
  entities: DharmaMigrationEntity[];
  since: Date | null;
};

export type DharmaMigrationEntity =
  | 'company'
  | 'person'
  | 'project'
  | 'income'
  | 'expense';
