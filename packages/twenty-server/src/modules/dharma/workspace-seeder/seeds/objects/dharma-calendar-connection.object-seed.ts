import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const DHARMA_CALENDAR_CONNECTION_OBJECT_SEED: ObjectMetadataSeed = {
  nameSingular: 'dharmaCalendarConnection',
  namePlural: 'dharmaCalendarConnections',
  labelSingular: 'Calendar Connection',
  labelPlural: 'Calendar Connections',
  description: 'OAuth credentials for syncing a workspaceMember calendar.',
  icon: 'IconCalendar',
};
