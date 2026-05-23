import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_INCOME_ADVANCE_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.CURRENCY,
    name: 'amount',
    label: 'Amount',
    icon: 'IconCurrencyEuro',
  },
  {
    type: FieldMetadataType.DATE,
    name: 'requestedAt',
    label: 'Requested At',
    icon: 'IconCalendar',
  },
  {
    type: FieldMetadataType.DATE,
    name: 'paidAt',
    label: 'Paid At',
    icon: 'IconCalendarCheck',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'status',
    label: 'Status',
    icon: 'IconProgressCheck',
    options: [
      { label: 'Requested', value: 'REQUESTED', position: 0, color: 'yellow' },
      { label: 'Paid', value: 'PAID', position: 1, color: 'green' },
      { label: 'Cancelled', value: 'CANCELLED', position: 2, color: 'red' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'notes',
    label: 'Notes',
    icon: 'IconNotes',
  },
];
