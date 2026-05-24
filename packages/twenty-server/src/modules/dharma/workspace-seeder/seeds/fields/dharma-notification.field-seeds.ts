import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_NOTIFICATION_FIELD_SEEDS: FieldMetadataSeed[] = [
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
    type: FieldMetadataType.SELECT,
    name: 'kind',
    label: 'Kind',
    icon: 'IconCategory',
    options: [
      {
        label: 'AI Suggestion',
        value: 'AI_SUGGESTION',
        position: 0,
        color: 'yellow',
      },
      { label: 'Task Due', value: 'TASK_DUE', position: 1, color: 'red' },
      { label: 'Payment', value: 'PAYMENT', position: 2, color: 'green' },
      { label: 'Followup', value: 'FOLLOWUP', position: 3, color: 'orange' },
      { label: 'System', value: 'SYSTEM', position: 4, color: 'gray' },
      { label: 'Test', value: 'TEST', position: 5, color: 'blue' },
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
    type: FieldMetadataType.ARRAY,
    name: 'tags',
    label: 'Tags',
    icon: 'IconTags',
  },
  {
    type: FieldMetadataType.RAW_JSON,
    name: 'payload',
    label: 'Payload',
    icon: 'IconBraces',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'recipient',
    label: 'Recipient',
    icon: 'IconUser',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'status',
    label: 'Status',
    icon: 'IconProgressCheck',
    options: [
      { label: 'Pending', value: 'PENDING', position: 0, color: 'gray' },
      { label: 'Sent', value: 'SENT', position: 1, color: 'green' },
      { label: 'Failed', value: 'FAILED', position: 2, color: 'red' },
      { label: 'Skipped', value: 'SKIPPED', position: 3, color: 'yellow' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'errorMessage',
    label: 'Error',
    icon: 'IconAlertTriangle',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'providerMessageId',
    label: 'Provider Message ID',
    icon: 'IconBarcode',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'scheduledAt',
    label: 'Scheduled At',
    icon: 'IconCalendarTime',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'sentAt',
    label: 'Sent At',
    icon: 'IconSend',
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'sourceKind',
    label: 'Source',
    icon: 'IconLayersIntersect',
    options: [
      { label: 'AI Orchestrator', value: 'AI', position: 0, color: 'purple' },
      { label: 'System', value: 'SYSTEM', position: 1, color: 'gray' },
      { label: 'Manual', value: 'MANUAL', position: 2, color: 'blue' },
    ],
  },
  {
    type: FieldMetadataType.UUID,
    name: 'sourceRecordId',
    label: 'Source Record ID',
    icon: 'IconId',
  },
];
