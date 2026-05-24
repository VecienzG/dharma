import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_INCOME_ENTRY_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    name: 'description',
    label: 'Description',
    icon: 'IconFileText',
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'grossAmount',
    label: 'Gross Amount',
    icon: 'IconCurrencyEuro',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'incomeType',
    label: 'Type',
    icon: 'IconTag',
    options: [
      {
        label: 'Invoiced',
        value: 'INVOICED',
        position: 0,
        color: 'blue',
      },
      {
        label: 'Cash',
        value: 'CASH',
        position: 1,
        color: 'green',
      },
    ],
  },
  {
    type: FieldMetadataType.DATE,
    name: 'receivedAt',
    label: 'Received At',
    icon: 'IconCalendarCheck',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'invoiceNumber',
    label: 'Invoice Number',
    icon: 'IconFileInvoice',
  },
  // Cassetti split — computed or manually overridden
  {
    type: FieldMetadataType.CURRENCY,
    name: 'taxAmount',
    label: 'Tax (35%)',
    icon: 'IconReceiptTax',
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'beautifulLifeAmount',
    label: 'Beautiful Life (30%)',
    icon: 'IconBuildingStore',
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'personalAmount',
    label: 'Personal',
    icon: 'IconUser',
  },
  // Override config stored as JSON for edge cases (CASH entries, custom splits)
  {
    type: FieldMetadataType.RAW_JSON,
    name: 'splitConfig',
    label: 'Split Config',
    icon: 'IconAdjustments',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'dharmaLegacyId',
    label: 'Legacy ID',
    icon: 'IconDatabaseImport',
  },
];
