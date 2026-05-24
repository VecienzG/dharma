import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_CALENDAR_CONNECTION_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'provider',
    label: 'Provider',
    icon: 'IconBrandGoogle',
    options: [
      { label: 'Google', value: 'GOOGLE', position: 0, color: 'blue' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'googleEmail',
    label: 'Google Email',
    icon: 'IconMail',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'accessToken',
    label: 'Access Token',
    icon: 'IconKey',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'refreshToken',
    label: 'Refresh Token',
    icon: 'IconRefresh',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'expiresAt',
    label: 'Expires At',
    icon: 'IconClock',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'scope',
    label: 'Scope',
    icon: 'IconListCheck',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'lastSyncedAt',
    label: 'Last Synced At',
    icon: 'IconClockHour4',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'syncToken',
    label: 'Sync Token',
    icon: 'IconHash',
  },
];
