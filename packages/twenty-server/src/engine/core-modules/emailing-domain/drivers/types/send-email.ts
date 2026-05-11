export type EmailingDomainSendEmailInput = {
  workspaceId: string;
  domain: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string[];
};

export type EmailingDomainSendEmailResult = {
  messageId: string;
};
