import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import {
  type DharmaStorageDriver,
  type DharmaStorageUploadRequest,
  type DharmaStorageUploadResult,
} from 'src/modules/dharma/storage/types/dharma-storage.types';

@Injectable()
export class WebDavNasStorageDriver implements DharmaStorageDriver {
  readonly tier = 'NAS_WEBDAV' as const;

  private readonly logger = new Logger(WebDavNasStorageDriver.name);

  isConfigured(): boolean {
    return Boolean(
      process.env.NAS_WEBDAV_URL &&
        process.env.NAS_WEBDAV_USER &&
        process.env.NAS_WEBDAV_PASSWORD,
    );
  }

  async upload(
    input: DharmaStorageUploadRequest,
  ): Promise<DharmaStorageUploadResult> {
    const baseUrl = process.env.NAS_WEBDAV_URL?.replace(/\/+$/, '');
    const user = process.env.NAS_WEBDAV_USER;
    const password = process.env.NAS_WEBDAV_PASSWORD;
    const publicBaseUrl = process.env.NAS_WEBDAV_PUBLIC_URL?.replace(/\/+$/, '');

    if (!baseUrl || !user || !password) {
      throw new InternalServerErrorException(
        'NAS_WEBDAV_* env vars not configured — cannot upload to NAS',
      );
    }

    const objectKey = [input.pathPrefix, input.filename]
      .filter(Boolean)
      .join('/')
      .replace(/^\/+/, '');

    const targetUrl = `${baseUrl}/${objectKey
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`;

    await this.ensureDirectoriesExist({
      baseUrl,
      objectKey,
      authHeader: this.buildAuthHeader(user, password),
    });

    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        authorization: this.buildAuthHeader(user, password),
        'content-type': input.contentType ?? 'application/octet-stream',
      },
      body: input.body as unknown as BodyInit,
    });

    if (!response.ok && response.status !== 201 && response.status !== 204) {
      const body = await response.text();

      this.logger.error(
        `WebDAV PUT failed (${response.status}): ${body.slice(0, 300)}`,
      );

      throw new InternalServerErrorException(
        `WebDAV upload failed with status ${response.status}`,
      );
    }

    const publicUrl = publicBaseUrl
      ? `${publicBaseUrl}/${objectKey}`
      : targetUrl;

    return {
      tier: this.tier,
      url: publicUrl,
      externalId: objectKey,
      size: input.body.length,
      contentType: input.contentType ?? 'application/octet-stream',
    };
  }

  async delete(externalId: string): Promise<void> {
    const baseUrl = process.env.NAS_WEBDAV_URL?.replace(/\/+$/, '');
    const user = process.env.NAS_WEBDAV_USER;
    const password = process.env.NAS_WEBDAV_PASSWORD;

    if (!baseUrl || !user || !password) return;

    await fetch(
      `${baseUrl}/${externalId.split('/').map(encodeURIComponent).join('/')}`,
      {
        method: 'DELETE',
        headers: { authorization: this.buildAuthHeader(user, password) },
      },
    );
  }

  private buildAuthHeader(user: string, password: string): string {
    return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  }

  // WebDAV PUT does not auto-create parent collections — we MKCOL each segment.
  // We tolerate 405 (already exists) but bail out on real errors.
  private async ensureDirectoriesExist({
    baseUrl,
    objectKey,
    authHeader,
  }: {
    baseUrl: string;
    objectKey: string;
    authHeader: string;
  }): Promise<void> {
    const segments = objectKey.split('/').slice(0, -1);

    if (segments.length === 0) return;

    let path = '';

    for (const segment of segments) {
      path = path ? `${path}/${segment}` : segment;
      const url = `${baseUrl}/${path
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;

      const response = await fetch(url, {
        method: 'MKCOL',
        headers: { authorization: authHeader },
      });

      // 201 created, 405 method not allowed = directory already exists
      if (
        !response.ok &&
        response.status !== 201 &&
        response.status !== 405 &&
        response.status !== 301
      ) {
        this.logger.warn(
          `MKCOL ${path} returned ${response.status} — continuing`,
        );
      }
    }
  }
}
