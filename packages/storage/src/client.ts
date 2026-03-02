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

  generateKey(fileName: string, folder?: string): string {
    const extension = fileName.split(".").pop();
    const id = nanoid(12);
    const key = folder ? `${folder}/${id}.${extension}` : `${id}.${extension}`;
    return key;
  }

  /**
   * إنشاء رابط موقع للرفع (Presigned Put URL)
   * يستخدم لإرسال الملف مباشرة من المتصفح إلى السحابة
   */
  async getUploadUrl(key: string, contentType: string, expiresIn = 3600) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, key };
  }

  /**
   * إنشاء رابط موقع للقراءة (Presigned Get URL)
   * مفيد للملفات الخاصة التي لا تريد جعلها عامة للجميع
   */
  async getDownloadUrl(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * الحصول على الرابط العام للملف
   * إذا كان لديك Public URL (CDN)، سيقوم بدمجه مع الكي
   */
  getFileUrl(key: string): string {
    if (this.publicUrl) {
      const baseUrl = this.publicUrl.endsWith("/")
        ? this.publicUrl.slice(0, -1)
        : this.publicUrl;
      return `${baseUrl}/${key}`;
    }
    // إذا لم يوجد رابط عام، نستخدم الرابط الافتراضي للمزود
    return `${this.bucket}.${key}`;
  }

  /**
   * حذف ملف من السحابة
   */
  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await this.client.send(command);
  }
}
