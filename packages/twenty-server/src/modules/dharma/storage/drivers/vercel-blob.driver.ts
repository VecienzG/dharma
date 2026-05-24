import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import {
  type DharmaStorageDriver,
  type DharmaStorageUploadRequest,
  type DharmaStorageUploadResult,
} from 'src/modules/dharma/storage/types/dharma-storage.types';

const VERCEL_BLOB_ENDPOINT = 'https://blob.vercel-storage.com';

@Injectable()
export class VercelBlobStorageDriver implements DharmaStorageDriver {
  readonly tier = 'VERCEL_BLOB' as const;

  private readonly logger = new Logger(VercelBlobStorageDriver.name);

  isConfigured(): boolean {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  }

  async upload(
    input: DharmaStorageUploadRequest,
  ): Promise<DharmaStorageUploadResult> {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new InternalServerErrorException(
        'BLOB_READ_WRITE_TOKEN not configured — cannot upload to Vercel Blob',
      );
    }

    const objectKey = [input.pathPrefix, input.filename]
      .filter(Boolean)
      .join('/')
      .replace(/^\/+/, '');

    const url = `${VERCEL_BLOB_ENDPOINT}/${encodeURIComponent(objectKey)}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': input.contentType ?? 'application/octet-stream',
        'x-content-type': input.contentType ?? 'application/octet-stream',
      },
      body: input.body as unknown as BodyInit,
    });

    if (!response.ok) {
      const body = await response.text();

      this.logger.error(
        `Vercel Blob upload failed (${response.status}): ${body}`,
      );

      throw new InternalServerErrorException(
        `Vercel Blob upload failed with status ${response.status}`,
      );
    }

    const json = (await response.json()) as {
      url?: string;
      pathname?: string;
      contentType?: string;
      contentDisposition?: string;
    };

    return {
      tier: this.tier,
      url: json.url ?? url,
      externalId: json.pathname ?? objectKey,
      size: input.body.length,
      contentType:
        json.contentType ?? input.contentType ?? 'application/octet-stream',
    };
  }

  async delete(externalId: string): Promise<void> {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return;
    }

    await fetch(`${VERCEL_BLOB_ENDPOINT}/${encodeURIComponent(externalId)}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
  }
}
