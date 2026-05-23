import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_NOTIFICATION_PREFERENCE_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'channel',
    label: 'Channel',
    icon: 'IconBroadcast',
    options: [
      { label: 'Email', value: 'EMAIL', position: 0, color: 'blue' },
      { label: 'Web Push', value: 'WEB_PUSH', position: 1, color: 'purple' },
      { label: 'Telegram', value: 'TELEGRAM', position: 2, color: 'turquoise' },
    ],
  },
  {
    type: FieldMetadataType.BOOLEAN,
    name: 'enabled',
    label: 'Enabled',
    icon: 'IconToggleRight',
    defaultValue: true,
  },
  {
    type: FieldMetadataType.ARRAY,
    name: 'kinds',
    label: 'Kinds',
    icon: 'IconCategory',
  },
  {
    type: FieldMetadataType.ARRAY,
    name: 'mutedTags',
    label: 'Muted Tags',
    icon: 'IconVolumeOff',
  },
  {
    type: FieldMetadataType.NUMBER,
    name: 'minScore',
    label: 'Min Score',
    icon: 'IconStar',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'endpoint',
    label: 'Endpoint',
    icon: 'IconAddressBook',
  },
  {
    type: FieldMetadataType.RAW_JSON,
    name: 'config',
    label: 'Config',
    icon: 'IconBraces',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'quietHoursPolicy',
    label: 'Quiet Hours Policy',
    icon: 'IconMoon',
    options: [
      { label: 'Never', value: 'NEVER', position: 0, color: 'gray' },
      { label: 'Defer', value: 'DEFER', position: 1, color: 'yellow' },
      { label: 'Drop', value: 'DROP', position: 2, color: 'red' },
    ],
  },
];
