import { StorageDriver, StorageContext, StorageOptions } from "@/types/Storage";
import { encrypt, decrypt } from "@/utils/encryption";

/**
 * Universal Storage - provides a unified interface for encrypted storage operations
 * that works in both client and SSR contexts.
 * 
 * Uses a StorageDriver to abstract the underlying storage mechanism and
 * handles encryption/decryption automatically.
 */
export class UniversalStorage {
  private cachedContext: StorageContext | null = null;

  constructor(
    private driver: StorageDriver,
    private appKey: string,
    private contextGetter?: () => StorageContext | Promise<StorageContext> | null
  ) {}

  /**
   * Gets and decrypts a value from storage.
   */
  async getDecrypted(key: string): Promise<string | null> {
    const context = await this.getContext();
    const encrypted = await this.driver.get(key, context);
    
    if (!encrypted) {
      return null;
    }

    try {
      return await decrypt(encrypted, this.appKey);
    } catch (error) {
      console.warn(`Failed to decrypt value for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Encrypts and stores a value in storage.
   */
  async setEncrypted(
    key: string,
    value: string,
    options?: StorageOptions
  ): Promise<void> {
    const context = await this.getContext();
    const encrypted = await encrypt(value, this.appKey);
    await this.driver.set(key, encrypted, options, context);
  }

  /**
   * Removes an encrypted value from storage.
   */
  async removeEncrypted(key: string, options?: StorageOptions): Promise<void> {
    const context = await this.getContext();
    await this.driver.remove(key, options, context);
  }

  /**
   * Gets the SSR context, caching it per instance.
   * Each request creates a new instance, so caching is safe.
   */
  private async getContext(): Promise<StorageContext | null> {
    if (!this.cachedContext && this.contextGetter) {
      const context = await this.contextGetter();
      this.cachedContext = context || null;
    }
    return this.cachedContext;
  }
}

