import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const DHARMA_NOTIFICATION_PREFERENCE_OBJECT_SEED: ObjectMetadataSeed = {
  nameSingular: 'dharmaNotificationPreference',
  namePlural: 'dharmaNotificationPreferences',
  labelSingular: 'Notification Preference',
  labelPlural: 'Notification Preferences',
  icon: 'IconBellRinging',
  description:
    'Per-channel routing rules. Defines which kinds + tags reach which channels (email/push/telegram) and contact endpoints.',
};
