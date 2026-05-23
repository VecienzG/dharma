import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const DHARMA_NOTIFICATION_OBJECT_SEED: ObjectMetadataSeed = {
  nameSingular: 'dharmaNotification',
  namePlural: 'dharmaNotifications',
  labelSingular: 'Notification',
  labelPlural: 'Notifications',
  icon: 'IconBell',
  description:
    'Outbound notification dispatched via Resend, Web Push, or Telegram. Tracks status per channel.',
};
