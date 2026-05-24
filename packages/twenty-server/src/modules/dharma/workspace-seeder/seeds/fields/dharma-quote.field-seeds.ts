import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_QUOTE_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.NUMBER,
    name: 'quoteNumber',
    label: 'Quote Number',
    icon: 'IconHash',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'quoteStatus',
    label: 'Status',
    icon: 'IconProgress',
    options: [
      { label: 'Draft', value: 'DRAFT', position: 0, color: 'gray' },
      { label: 'Sent', value: 'SENT', position: 1, color: 'blue' },
      { label: 'Accepted', value: 'ACCEPTED', position: 2, color: 'green' },
      { label: 'Rejected', value: 'REJECTED', position: 3, color: 'red' },
      { label: 'Expired', value: 'EXPIRED', position: 4, color: 'yellow' },
    ],
  },
  {
    type: FieldMetadataType.DATE,
    name: 'validUntil',
    label: 'Valid Until',
    icon: 'IconCalendarDue',
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'totalAmount',
    label: 'Total Amount',
    icon: 'IconCurrencyEuro',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'notes',
    label: 'Notes',
    icon: 'IconNotes',
  },
];
