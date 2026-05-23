import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_COMPANY_EXTENSION_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    name: 'vatCode',
    label: 'VAT Code',
    icon: 'IconId',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'dharmaEntityType',
    label: 'Entity Type',
    icon: 'IconBuildingSkyscraper',
    options: [
      { label: 'Client', value: 'CLIENT', position: 0, color: 'blue' },
      { label: 'Supplier', value: 'SUPPLIER', position: 1, color: 'orange' },
      { label: 'Partner', value: 'PARTNER', position: 2, color: 'green' },
      { label: 'Other', value: 'OTHER', position: 3, color: 'gray' },
    ],
  },
];
