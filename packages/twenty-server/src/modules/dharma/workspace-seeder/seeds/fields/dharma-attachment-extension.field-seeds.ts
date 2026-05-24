import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_ATTACHMENT_EXTENSION_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'dharmaOwnerType',
    label: 'Owner Type',
    icon: 'IconCategory',
    options: [
      { label: 'Project', value: 'PROJECT', position: 0, color: 'blue' },
      { label: 'Quote', value: 'QUOTE', position: 1, color: 'purple' },
      { label: 'Income', value: 'INCOME', position: 2, color: 'green' },
      { label: 'Expense', value: 'EXPENSE', position: 3, color: 'orange' },
      { label: 'Contract', value: 'CONTRACT', position: 4, color: 'red' },
      { label: 'Receipt', value: 'RECEIPT', position: 5, color: 'yellow' },
      { label: 'Other', value: 'OTHER', position: 6, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'dharmaStorageTier',
    label: 'Storage Tier',
    icon: 'IconCloudUpload',
    options: [
      {
        label: 'Vercel Blob',
        value: 'VERCEL_BLOB',
        position: 0,
        color: 'blue',
      },
      {
        label: 'NAS WebDAV',
        value: 'NAS_WEBDAV',
        position: 1,
        color: 'purple',
      },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'dharmaExternalUrl',
    label: 'External URL',
    icon: 'IconLink',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'dharmaExternalId',
    label: 'External ID',
    icon: 'IconHash',
  },
];
