export type EmailingDomainEmailContent = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string[];
};

export type EmailingDomainSendEmailInput = EmailingDomainEmailContent & {
  workspaceId: string;
  domain: string;
  from: string;
};

export type EmailingDomainSendEmailResult = {
  messageId: string;
};
