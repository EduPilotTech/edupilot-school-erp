// Sprint 4.8A — Storage abstraction. Application services (Sprint 4.8B) depend on this
// interface, never directly on `@supabase/supabase-js` or any other provider SDK — the same
// "repository owns the persistence detail, service owns the business logic" separation this
// codebase already applies to Prisma, applied here to file storage.
export interface UploadFileInput {
  bucket: string;
  key: string;
  file: Buffer | Blob | File;
  contentType: string;
}

export interface StorageService {
  // Returns the key actually stored at — normally identical to `input.key`, returned rather
  // than assumed so a future implementation (or a provider that rewrites keys) doesn't need an
  // interface change.
  upload(input: UploadFileInput): Promise<{ key: string }>;

  delete(bucket: string, key: string): Promise<void>;

  // A time-limited URL for downloading/previewing a file that isn't publicly accessible —
  // required since Student Documents/Photos are tenant-scoped, private data.
  signedUrl(bucket: string, key: string, expiresInSeconds?: number): Promise<string>;
}
