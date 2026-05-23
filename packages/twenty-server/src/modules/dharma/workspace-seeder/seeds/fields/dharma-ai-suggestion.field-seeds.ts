import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_AI_SUGGESTION_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'kind',
    label: 'Kind',
    icon: 'IconCategory',
    options: [
      { label: 'Task Priority', value: 'TASK_PRIORITY', position: 0, color: 'red' },
      { label: 'Follow Up', value: 'FOLLOWUP', position: 1, color: 'yellow' },
      { label: 'Payment Alert', value: 'PAYMENT', position: 2, color: 'orange' },
      { label: 'Revenue Alert', value: 'REVENUE_ALERT', position: 3, color: 'green' },
      { label: 'Insight', value: 'INSIGHT', position: 4, color: 'blue' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'title',
    label: 'Title',
    icon: 'IconHeading',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'body',
    label: 'Body',
    icon: 'IconAlignLeft',
  },
  {
    type: FieldMetadataType.RAW_JSON,
    name: 'payload',
    label: 'Payload',
    icon: 'IconBraces',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'status',
    label: 'Status',
    icon: 'IconProgressCheck',
    options: [
      { label: 'Pending', value: 'PENDING', position: 0, color: 'gray' },
      { label: 'Accepted', value: 'ACCEPTED', position: 1, color: 'green' },
      { label: 'Rejected', value: 'REJECTED', position: 2, color: 'red' },
      { label: 'Dismissed', value: 'DISMISSED', position: 3, color: 'yellow' },
    ],
  },
  {
    type: FieldMetadataType.NUMBER,
    name: 'score',
    label: 'Score',
    icon: 'IconStar',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'source',
    label: 'Source Layer',
    icon: 'IconLayersIntersect',
    options: [
      { label: 'Rules', value: 'RULES', position: 0, color: 'purple' },
      { label: 'LLM', value: 'LLM', position: 1, color: 'blue' },
      { label: 'Hybrid', value: 'HYBRID', position: 2, color: 'turquoise' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'modelUsed',
    label: 'Model',
    icon: 'IconRobot',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'generatedAt',
    label: 'Generated At',
    icon: 'IconClock',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'resolvedAt',
    label: 'Resolved At',
    icon: 'IconCalendarCheck',
  },
];
