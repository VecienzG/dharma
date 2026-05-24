import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_EXPENSE_ENTRY_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    name: 'description',
    label: 'Description',
    icon: 'IconFileText',
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'amount',
    label: 'Amount',
    icon: 'IconCurrencyEuro',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'expenseCategory',
    label: 'Category',
    icon: 'IconTag',
    options: [
      { label: 'Tools & Software', value: 'TOOLS', position: 0, color: 'blue' },
      { label: 'Office', value: 'OFFICE', position: 1, color: 'gray' },
      { label: 'Travel', value: 'TRAVEL', position: 2, color: 'green' },
      {
        label: 'Collaborator',
        value: 'COLLABORATOR',
        position: 3,
        color: 'purple',
      },
      { label: 'Marketing', value: 'MARKETING', position: 4, color: 'pink' },
      { label: 'Other', value: 'OTHER', position: 5, color: 'yellow' },
    ],
  },
  {
    type: FieldMetadataType.DATE,
    name: 'paidAt',
    label: 'Paid At',
    icon: 'IconCalendarCheck',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'receiptUrl',
    label: 'Receipt',
    icon: 'IconReceipt',
  },
];
