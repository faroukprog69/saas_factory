# @faroukprog69/storage

Simple S3-compatible storage client with presigned upload/download URLs, public URL support, and file deletion.

---

## Why This Exists

Many SaaS apps need file storage, but building a small client for S3 or S3-compatible providers often ends up scattered in services or API routes.

`@faroukprog69/storage` provides a **centralized, typed client** for:

- Generating unique storage keys
- Presigned upload URLs (direct browser uploads)
- Presigned download URLs (private files)
- Public URLs (CDN support)
- File deletion

No dependencies beyond AWS SDK v3 + `nanoid`. Works with any S3-compatible provider.

---

## Installation

```bash
pnpm add @faroukprog69/storage
# or
npm install @faroukprog69/storage
```

Peer dependencies:

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `nanoid`

---

## Quick Start

```ts
import { StorageClient } from "@faroukprog69/storage";

const storage = new StorageClient({
  endpoint: "https://s3.example.com",
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY!,
  secretAccessKey: process.env.AWS_SECRET_KEY!,
  bucket: "my-bucket",
  publicUrl: "https://cdn.example.com",
});

// Generate a unique key for a file
const key = storage.generateKey("photo.png", "uploads");

// Get a presigned upload URL (browser → S3)
const { url } = await storage.getUploadUrl(key, "image/png");

// Get a presigned download URL (for private files)
const downloadUrl = await storage.getDownloadUrl(key);

// Get a public URL if configured
const publicUrl = storage.getFileUrl(key);

// Delete a file
await storage.deleteFile(key);
```

---

## API Reference

### `new StorageClient(config: StorageConfig)`

Create a new client.

```ts
interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string; // optional CDN / public URL
}
```

---

### `generateKey(fileName: string, folder?: string): string`

Generates a unique key with optional folder.

```ts
const key = storage.generateKey("avatar.jpg", "users");
// e.g., "users/Ab12Cd34Ef56.jpg"
```

---

### `getUploadUrl(key: string, contentType: string, expiresIn?: number)`

Returns a presigned PUT URL for browser uploads.

```ts
const { url, key } = await storage.getUploadUrl(
  "uploads/avatar.jpg",
  "image/jpeg",
);
```

- `expiresIn` defaults to `3600` seconds (1 hour)

---

### `getDownloadUrl(key: string, expiresIn?: number)`

Returns a presigned GET URL for private files.

```ts
const downloadUrl = await storage.getDownloadUrl("uploads/avatar.jpg");
```

- `expiresIn` defaults to `3600` seconds

---

### `getFileUrl(key: string): string`

Returns a public URL for a file. Uses `publicUrl` if configured, otherwise a default S3 URL.

```ts
const publicUrl = storage.getFileUrl("uploads/avatar.jpg");
// e.g., "https://cdn.example.com/uploads/avatar.jpg"
```

---

### `deleteFile(key: string)`

Deletes a file from storage.

```ts
await storage.deleteFile("uploads/avatar.jpg");
```

---

## Example: Direct Browser Upload Flow

1. Client requests an upload URL:

```ts
const { url, key } = await storage.getUploadUrl("photo.png", "image/png");
```

2. Client uploads file:

```js
await fetch(url, {
  method: "PUT",
  headers: { "Content-Type": "image/png" },
  body: fileBlob,
});
```

3. File is stored and can be accessed via:

```ts
const publicUrl = storage.getFileUrl(key);
```

---

## Notes & Design Decisions

- **S3-compatible** — works with MinIO, DigitalOcean Spaces, or any AWS S3 endpoint.
- **Presigned URLs** — safe for direct browser uploads/downloads.
- **Public URL** — optional for CDN integration.
- **File keys** — generated with `nanoid` to avoid collisions.
- **Async API** — all network operations return Promises.

---

## Folder Structure

```
src/
├── index.ts      # re-export StorageClient
└── client.ts     # StorageClient class
```
