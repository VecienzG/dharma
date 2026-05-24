export type DharmaStorageTier = 'VERCEL_BLOB' | 'NAS_WEBDAV';

export type DharmaStorageUploadRequest = {
  filename: string;
  // Raw bytes
  body: Buffer | Uint8Array;
  // Optional MIME type — falls back to application/octet-stream
  contentType?: string;
  // Optional logical path/prefix inside the bucket/share
  pathPrefix?: string;
};

export type DharmaStorageUploadResult = {
  tier: DharmaStorageTier;
  // Public or signed URL where the resource can be retrieved
  url: string;
  // Provider-specific identifier (key in Vercel Blob, full WebDAV path on NAS)
  externalId: string;
  size: number;
  contentType: string;
};

export interface DharmaStorageDriver {
  readonly tier: DharmaStorageTier;
  isConfigured(): boolean;
  upload(input: DharmaStorageUploadRequest): Promise<DharmaStorageUploadResult>;
  delete?(externalId: string): Promise<void>;
}

// Files larger than this threshold go to NAS WebDAV, smaller to Vercel Blob.
// Vercel Blob has its own ~500MB limit but cold-storage of bulky assets is cheaper on the NAS.
export const DEFAULT_VERCEL_BLOB_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
