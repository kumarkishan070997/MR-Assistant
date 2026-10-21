import { SymbolReferenceResult } from '../adapters/base.adapter';

export interface CacheEntry {
  data: SymbolReferenceResult;
  timestamp: number;
  ttlMs: number;
}

export class SearchCacheService {
  private cache = new Map<string, CacheEntry>();
  private defaultTtlMs = 15 * 60 * 1000; // 15 minutes

  public static buildKey(
    platform: string,
    projectPath: string,
    ref: string,
    symbol: string,
    enclosingClass?: string
  ): string {
    const scope = enclosingClass ? `${enclosingClass.trim().toLowerCase()}::` : '';
    return `${platform}:${projectPath}@${ref}:${scope}${symbol.trim().toLowerCase()}`;
  }

  public get(key: string): SymbolReferenceResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public set(key: string, data: SymbolReferenceResult, ttlMs = this.defaultTtlMs): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const globalSearchCache = new SearchCacheService();
