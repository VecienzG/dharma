import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_AI_MEMORY_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'kind',
    label: 'Kind',
    icon: 'IconCategory',
    options: [
      { label: 'Fact', value: 'FACT', position: 0, color: 'blue' },
      { label: 'Rule', value: 'RULE', position: 1, color: 'purple' },
      { label: 'Preference', value: 'PREFERENCE', position: 2, color: 'green' },
      { label: 'Pattern', value: 'PATTERN', position: 3, color: 'orange' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'content',
    label: 'Content',
    icon: 'IconBlockquote',
  },
  {
    type: FieldMetadataType.ARRAY,
    name: 'tags',
    label: 'Tags',
    icon: 'IconTags',
  },
  {
    type: FieldMetadataType.NUMBER,
    name: 'score',
    label: 'Score',
    icon: 'IconStar',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'lastUsedAt',
    label: 'Last Used At',
    icon: 'IconClock',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'source',
    label: 'Source',
    icon: 'IconSource',
    options: [
      {
        label: 'User Feedback',
        value: 'USER_FEEDBACK',
        position: 0,
        color: 'green',
      },
      { label: 'Manual', value: 'MANUAL', position: 1, color: 'blue' },
      { label: 'Inferred', value: 'INFERRED', position: 2, color: 'gray' },
    ],
  },
];
