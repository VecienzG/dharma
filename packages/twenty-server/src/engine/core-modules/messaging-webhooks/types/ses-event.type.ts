export type SesEventBridgeDetailType =
  | 'Sending Status Enabled'
  | 'Sending Status Disabled'
  | 'Advisor Recommendation Status Open'
  | 'Advisor Recommendation Status Closed';

export type SesConfigSetNotificationType =
  | 'Send'
  | 'Delivery'
  | 'Bounce'
  | 'Complaint'
  | 'Reject'
  | 'Open'
  | 'Click'
  | 'Rendering Failure'
  | 'DeliveryDelay'
  | 'Subscription';

export type SesEventBridgePayload = {
  source?: string;
  'detail-type'?: SesEventBridgeDetailType | string;
  detail?: Record<string, unknown>;
  resources?: string[];
  time?: string;
};

export type SesConfigSetNotification = {
  eventType?: SesConfigSetNotificationType | string;
  notificationType?: SesConfigSetNotificationType | string;
  mail?: { messageId?: string; tags?: Record<string, string[]> };
  bounce?: { bounceType?: string; bounceSubType?: string };
  complaint?: { complaintFeedbackType?: string };
};
