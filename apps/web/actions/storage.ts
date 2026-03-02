"use server";

import { StorageClient } from "@faroukprog69/storage";

const storage = new StorageClient({
  endpoint: process.env.STORAGE_ENDPOINT!,
  region: "us-east-1",
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  bucket: process.env.STORAGE_BUCKET!,
  publicUrl: process.env.STORAGE_PUBLIC_URL,
});

export async function getUploadUrlAction(fileName: string, fileType: string) {
  try {
    const key = storage.generateKey(fileName, "uploads");
    const { url } = await storage.getUploadUrl(key, fileType);

    return { url, key };
  } catch (error) {
    console.error("Storage Action Error:", error);
    throw new Error("Failed to generate upload URL");
  }
}

export async function getDownloadUrlAction(key: string) {
  return await storage.getDownloadUrl(key);
}
