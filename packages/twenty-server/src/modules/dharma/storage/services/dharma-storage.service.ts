import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

import { VercelBlobStorageDriver } from 'src/modules/dharma/storage/drivers/vercel-blob.driver';
import { WebDavNasStorageDriver } from 'src/modules/dharma/storage/drivers/webdav-nas.driver';
import {
  DEFAULT_VERCEL_BLOB_MAX_BYTES,
  type DharmaStorageDriver,
  type DharmaStorageTier,
  type DharmaStorageUploadRequest,
  type DharmaStorageUploadResult,
} from 'src/modules/dharma/storage/types/dharma-storage.types';

@Injectable()
export class DharmaStorageService {
  private readonly logger = new Logger(DharmaStorageService.name);

  constructor(
    private readonly vercelBlobDriver: VercelBlobStorageDriver,
    private readonly webDavDriver: WebDavNasStorageDriver,
  ) {}

  async upload({
    workspaceId,
    request,
    forceTier,
  }: {
    workspaceId: string;
    request: DharmaStorageUploadRequest;
    forceTier?: DharmaStorageTier;
  }): Promise<DharmaStorageUploadResult> {
    const driver = this.pickDriver({ size: request.body.length, forceTier });

    if (!driver) {
      throw new ServiceUnavailableException(
        'No storage driver is configured — set BLOB_READ_WRITE_TOKEN or NAS_WEBDAV_* env vars',
      );
    }

    const enrichedRequest: DharmaStorageUploadRequest = {
      ...request,
      pathPrefix: [workspaceId, request.pathPrefix].filter(Boolean).join('/'),
    };

    const result = await driver.upload(enrichedRequest);

    this.logger.log(
      `Uploaded ${request.filename} (${result.size} bytes) → ${result.tier}`,
    );

    return result;
  }

  private pickDriver({
    size,
    forceTier,
  }: {
    size: number;
    forceTier?: DharmaStorageTier;
  }): DharmaStorageDriver | null {
    if (forceTier === 'VERCEL_BLOB' && this.vercelBlobDriver.isConfigured()) {
      return this.vercelBlobDriver;
    }

    if (forceTier === 'NAS_WEBDAV' && this.webDavDriver.isConfigured()) {
      return this.webDavDriver;
    }

    const threshold = Number(
      process.env.DHARMA_STORAGE_VERCEL_MAX_BYTES ??
        DEFAULT_VERCEL_BLOB_MAX_BYTES,
    );

    const fitsVercel = size <= threshold;

    if (fitsVercel && this.vercelBlobDriver.isConfigured()) {
      return this.vercelBlobDriver;
    }

    if (this.webDavDriver.isConfigured()) {
      return this.webDavDriver;
    }

    // Last resort: if NAS not configured but Vercel is, even oversized files go there
    if (this.vercelBlobDriver.isConfigured()) {
      this.logger.warn(
        `File of ${size} bytes exceeds threshold but NAS WebDAV not configured — falling back to Vercel Blob`,
      );

      return this.vercelBlobDriver;
    }

    return null;
  }
}
