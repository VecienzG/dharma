import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const DHARMA_PROJECT_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'projectType',
    label: 'Type',
    icon: 'IconTag',
    options: [
      { label: 'Web Dev', value: 'WEB_DEV', position: 0, color: 'blue' },
      { label: 'Software', value: 'SOFTWARE', position: 1, color: 'purple' },
      {
        label: 'Social Video',
        value: 'SOCIAL_VIDEO',
        position: 2,
        color: 'pink',
      },
      { label: 'Print', value: 'PRINT', position: 3, color: 'yellow' },
      { label: 'Photo', value: 'PHOTO', position: 4, color: 'green' },
      { label: 'Video', value: 'VIDEO', position: 5, color: 'red' },
      { label: 'Branding', value: 'BRANDING', position: 6, color: 'orange' },
      {
        label: 'Consulting',
        value: 'CONSULTING',
        position: 7,
        color: 'turquoise',
      },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'projectStatus',
    label: 'Status',
    icon: 'IconProgress',
    options: [
      { label: 'Draft', value: 'DRAFT', position: 0, color: 'gray' },
      { label: 'Active', value: 'ACTIVE', position: 1, color: 'green' },
      { label: 'Paused', value: 'PAUSED', position: 2, color: 'yellow' },
      {
        label: 'Completed',
        value: 'COMPLETED',
        position: 3,
        color: 'turquoise',
      },
      { label: 'Cancelled', value: 'CANCELLED', position: 4, color: 'red' },
    ],
  },
  {
    type: FieldMetadataType.DATE,
    name: 'startDate',
    label: 'Start Date',
    icon: 'IconCalendar',
  },
  {
    type: FieldMetadataType.DATE,
    name: 'endDate',
    label: 'End Date',
    icon: 'IconCalendarDue',
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'totalBudget',
    label: 'Total Budget',
    icon: 'IconCurrencyEuro',
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'notes',
    label: 'Notes',
    icon: 'IconNotes',
  },
];
