import { type EventBridgeEvent } from 'aws-lambda';

export type SesEventBridgePayload = EventBridgeEvent<
  string,
  Record<string, unknown>
>;

export type SesConfigSetNotification = {
  eventType?: string;
  notificationType?: string;
  mail?: { messageId?: string; tags?: Record<string, string[]> };
  bounce?: { bounceType?: string; bounceSubType?: string };
  complaint?: { complaintFeedbackType?: string };
};
