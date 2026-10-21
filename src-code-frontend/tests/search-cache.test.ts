import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchCacheService } from '../src/services/search-cache.service';
import { SymbolReferenceResult } from '../src/adapters/base.adapter';

describe('SearchCacheService', () => {
  let cache: SearchCacheService;

  beforeEach(() => {
    cache = new SearchCacheService();
  });

  const mockResult: SymbolReferenceResult = {
    symbol: 'getUserProfile',
    totalCount: 2,
    rateLimited: false,
    matches: [
      {
        filePath: 'src/services/user.service.ts',
        lineNumber: 42,
        codeSnippet: 'public getUserProfile(id: string): Promise<User> {',
        matchUrl: 'https://github.com/owner/repo/blob/main/src/services/user.service.ts#L42',
      },
      {
        filePath: 'src/controllers/auth.controller.ts',
        lineNumber: 19,
        codeSnippet: 'const user = await this.userService.getUserProfile(token.sub);',
        matchUrl: 'https://github.com/owner/repo/blob/main/src/controllers/auth.controller.ts#L19',
      },
    ],
  };

  it('builds canonical normalized cache keys', () => {
    const key1 = SearchCacheService.buildKey('github', 'owner/repo', 'main', 'getUserProfile');
    const key2 = SearchCacheService.buildKey('github', 'owner/repo', 'main', '  GETUSERPROFILE  ');
    expect(key1).toBe('github:owner/repo@main:getuserprofile');
    expect(key2).toBe('github:owner/repo@main:getuserprofile');
    expect(key1).toBe(key2);
  });

  it('stores and retrieves cache entries on cache hit', () => {
    const key = SearchCacheService.buildKey('github', 'owner/repo', 'main', 'getUserProfile');
    cache.set(key, mockResult);

    expect(cache.has(key)).toBe(true);
    expect(cache.size()).toBe(1);

    const cached = cache.get(key);
    expect(cached).not.toBeNull();
    expect(cached?.totalCount).toBe(2);
    expect(cached?.matches[0].filePath).toBe('src/services/user.service.ts');
  });

  it('returns null on cache miss', () => {
    const key = SearchCacheService.buildKey('github', 'owner/repo', 'main', 'nonExistentSymbol');
    expect(cache.get(key)).toBeNull();
    expect(cache.has(key)).toBe(false);
  });

  it('expires entries after TTL elapsed and evicts them', async () => {
    const key = SearchCacheService.buildKey('gitlab', 'group/project', 'master', 'authService');
    const shortTtlMs = 15;

    cache.set(key, mockResult, shortTtlMs);
    expect(cache.has(key)).toBe(true);

    // Sleep past TTL
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(cache.has(key)).toBe(false);
    expect(cache.get(key)).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('clears all cached entries when clear() is invoked', () => {
    const key1 = SearchCacheService.buildKey('github', 'owner/repo', 'main', 'sym1');
    const key2 = SearchCacheService.buildKey('github', 'owner/repo', 'main', 'sym2');

    cache.set(key1, mockResult);
    cache.set(key2, mockResult);
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get(key1)).toBeNull();
    expect(cache.get(key2)).toBeNull();
  });
});
