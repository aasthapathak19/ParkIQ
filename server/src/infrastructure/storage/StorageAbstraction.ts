/**
 * StorageAbstraction — Interface for evidence file storage.
 *
 * Phase 3 uses LocalStorageAdapter by default.
 * Replace with S3Adapter by setting STORAGE_PROVIDER=s3 in env.
 *
 * IMPORTANT: Evidence file keys must NEVER appear in public API responses.
 * They are admin-only internal references.
 */
export interface IStorageAdapter {
  /**
   * Save a file buffer and return a unique storage key.
   * The key is what gets stored in evidenceRefs — not a public URL.
   */
  save(buffer: Buffer, filename: string, mimeType: string): Promise<string>;

  /**
   * Generate a short-lived signed read URL for admin access only.
   * Keys should never be returned raw to any non-admin consumer.
   */
  getSignedUrl(key: string, expirySeconds?: number): Promise<string>;

  /**
   * Delete a stored file.
   */
  delete(key: string): Promise<void>;
}
