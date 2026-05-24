import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_PERSON_EXTENSION_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'dharmaEntityType',
    label: 'Entity Type',
    icon: 'IconUsersGroup',
    options: [
      { label: 'Client', value: 'CLIENT', position: 0, color: 'blue' },
      {
        label: 'Collaborator',
        value: 'COLLABORATOR',
        position: 1,
        color: 'purple',
      },
      { label: 'Supplier', value: 'SUPPLIER', position: 2, color: 'orange' },
      { label: 'Partner', value: 'PARTNER', position: 3, color: 'green' },
      { label: 'Other', value: 'OTHER', position: 4, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'dharmaPriority',
    label: 'Priority',
    icon: 'IconFlag',
    options: [
      { label: 'High', value: 'HIGH', position: 0, color: 'red' },
      { label: 'Medium', value: 'MEDIUM', position: 1, color: 'yellow' },
      { label: 'Low', value: 'LOW', position: 2, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'dharmaLegacyId',
    label: 'Legacy ID',
    icon: 'IconDatabaseImport',
  },
];
