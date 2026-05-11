import { Injectable, Logger } from '@nestjs/common';

import type SnsPayloadValidator from 'sns-payload-validator';
import { isDefined } from 'twenty-shared/utils';

import { AWS_SES_RESOURCE_NAME_PREFIX } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/constants/aws-ses-resource-name-prefix.constant';
import {
  type SesConfigSetNotification,
  type SesEventBridgePayload,
} from 'src/engine/core-modules/messaging-webhooks/types/ses-event.type';

type SnsPayload = SnsPayloadValidator.SnsPayload;

const TENANT_ARN_RESOURCE_PREFIX_PATTERN = /tenant\/([^/]+)$/;
const WORKSPACE_ID_FROM_TENANT_PATTERN = new RegExp(
  `^${AWS_SES_RESOURCE_NAME_PREFIX}-(.+)$`,
);

@Injectable()
export class SesEventHandlerService {
  private readonly logger = new Logger(SesEventHandlerService.name);

  async dispatch(payload: SnsPayload): Promise<void> {
    const message = this.parseMessage(payload.Message);

    if (!isDefined(message)) {
      this.logger.warn(
        `Could not parse SES event payload ${payload.MessageId}`,
      );

      return;
    }

    if (this.isEventBridgeShape(message)) {
      this.handleEventBridge(message);

      return;
    }

    this.handleConfigSetNotification(message as SesConfigSetNotification);
  }

  private parseMessage(
    raw: string,
  ): SesEventBridgePayload | SesConfigSetNotification | null {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private isEventBridgeShape(
    message: SesEventBridgePayload | SesConfigSetNotification,
  ): message is SesEventBridgePayload {
    return (
      'detail-type' in message && message.source?.startsWith('aws.ses') === true
    );
  }

  private handleEventBridge(payload: SesEventBridgePayload): void {
    const workspaceId = this.extractWorkspaceIdFromResources(payload.resources);
    const detailType = payload['detail-type'];

    if (detailType === 'Sending Status Disabled') {
      this.logger.warn(
        `SES tenant sending paused for workspace ${workspaceId ?? '?'} (resources=${payload.resources?.join(',')})`,
      );

      return;
    }

    if (detailType === 'Sending Status Enabled') {
      this.logger.log(
        `SES tenant sending re-enabled for workspace ${workspaceId ?? '?'}`,
      );

      return;
    }

    if (
      detailType === 'Advisor Recommendation Status Open' ||
      detailType === 'Advisor Recommendation Status Closed'
    ) {
      this.logger.log(
        `SES reputation finding ${detailType} for workspace ${workspaceId ?? '?'}: ${JSON.stringify(payload.detail ?? {})}`,
      );

      return;
    }

    this.logger.log(`Unhandled SES EventBridge detail-type: ${detailType}`);
  }

  private handleConfigSetNotification(
    notification: SesConfigSetNotification,
  ): void {
    const eventType = notification.eventType ?? notification.notificationType;
    const workspaceId = notification.mail?.tags?.workspace?.[0];
    const messageId = notification.mail?.messageId;

    if (eventType === 'Bounce') {
      this.logger.warn(
        `SES Bounce (${notification.bounce?.bounceType}/${notification.bounce?.bounceSubType}) for workspace ${workspaceId ?? '?'} message ${messageId ?? '?'}`,
      );

      return;
    }

    if (eventType === 'Complaint') {
      this.logger.warn(
        `SES Complaint (${notification.complaint?.complaintFeedbackType}) for workspace ${workspaceId ?? '?'} message ${messageId ?? '?'}`,
      );

      return;
    }

    this.logger.log(
      `SES config-set notification ${eventType} for workspace ${workspaceId ?? '?'} message ${messageId ?? '?'}`,
    );
  }

  private extractWorkspaceIdFromResources(
    resources: string[] | undefined,
  ): string | null {
    if (!isDefined(resources)) {
      return null;
    }

    for (const resource of resources) {
      const tenantMatch = resource.match(TENANT_ARN_RESOURCE_PREFIX_PATTERN);

      if (!isDefined(tenantMatch)) {
        continue;
      }

      const workspaceMatch = tenantMatch[1].match(
        WORKSPACE_ID_FROM_TENANT_PATTERN,
      );

      if (isDefined(workspaceMatch)) {
        return workspaceMatch[1];
      }
    }

    return null;
  }
}
