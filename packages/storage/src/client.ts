// packages/storage/src/client.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
}

export class StorageClient {
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;
  }

  /**
   * Generate a unique storage key for a file, optionally in a folder
   */
  generateKey(fileName: string, folder?: string): string {
    const extension = fileName.split(".").pop() ?? "";
    const id = nanoid(12);
    return folder ? `${folder}/${id}.${extension}` : `${id}.${extension}`;
  }

  /**
   * Generate a presigned URL for uploading a file
   */
  async getUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, key };
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Get the public URL for a file, if publicUrl is configured
   */
  getFileUrl(key: string): string {
    if (this.publicUrl) {
      const baseUrl = this.publicUrl.endsWith("/")
        ? this.publicUrl.slice(0, -1)
        : this.publicUrl;
      return `${baseUrl}/${key}`;
    }
    // Fallback: default S3-style URL (may not be accessible publicly)
    return `https://${this.bucket}.s3.${this.client.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await this.client.send(command);
  }
}
