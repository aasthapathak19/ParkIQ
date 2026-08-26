import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { IStorageAdapter } from './StorageAbstraction';
import { logger } from '../../config/logger';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'evidence');

export class LocalStorageAdapter implements IStorageAdapter {
  constructor() {
    // Ensure upload directory exists at startup
    fs.mkdir(UPLOAD_DIR, { recursive: true }).catch((err) =>
      logger.warn({ err }, 'Could not create evidence upload directory'),
    );
  }

  async save(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const ext = path.extname(filename) || this.extFromMime(mimeType);
    const key = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, key);
    await fs.writeFile(filePath, buffer);
    logger.debug({ key }, 'Evidence file saved (local storage)');
    return key;
  }

  /**
   * For local storage, we return a server-relative path that is served
   * only through an authenticated admin endpoint — NOT a public URL.
   * In production (S3), this would be a real presigned URL.
   */
  async getSignedUrl(key: string, _expirySeconds = 300): Promise<string> {
    // Return an internal API path; the admin evidence route enforces auth
    return `/api/v1/admin/evidence/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, key);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      logger.warn({ key, err }, 'Could not delete evidence file');
    }
  }

  async readFile(key: string): Promise<Buffer> {
    const filePath = path.join(UPLOAD_DIR, key);
    return fs.readFile(filePath);
  }

  private extFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[mimeType] ?? '.bin';
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
