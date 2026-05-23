import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_QUOTE_LINE_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    name: 'description',
    label: 'Description',
    icon: 'IconFileText',
  },
  {
    type: FieldMetadataType.NUMBER,
    name: 'quantity',
    label: 'Quantity',
    icon: 'IconStack',
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'unitPrice',
    label: 'Unit Price',
    icon: 'IconCurrencyEuro',
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'lineTotal',
    label: 'Total',
    icon: 'IconSum',
  },
];
