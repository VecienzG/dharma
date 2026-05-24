import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_COLLABORATOR_PAYOUT_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.CURRENCY,
    name: 'feeAmount',
    label: 'Fee Amount',
    icon: 'IconCurrencyEuro',
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
      { label: 'Pending', value: 'PENDING', position: 0, color: 'yellow' },
      { label: 'Paid', value: 'PAID', position: 1, color: 'green' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'notes',
    label: 'Notes',
    icon: 'IconNotes',
  },
];
