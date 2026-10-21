import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  $reviewProgress,
  loadReviewProgress,
  setFileReviewed,
  toggleFileReviewed,
  updateTotalFilesCount,
  buildProgressKey,
} from '../src/stores/review-progress.store';

describe('ReviewProgress Store', () => {
  beforeEach(() => {
    $reviewProgress.set({
      platform: 'gitlab',
      projectPath: 'org/repo',
      pullNumber: '42',
      reviewedFiles: {},
      totalFiles: 0,
    });
  });

  it('builds canonical storage keys', () => {
    const key = buildProgressKey('github', 'owner/repo', '12');
    expect(key).toBe('peerpilot:progress:github:owner/repo:12');
  });

  it('updates file reviewed status correctly', async () => {
    await setFileReviewed('app/Services/OrderService.php', true);
    let state = $reviewProgress.get();
    expect(state.reviewedFiles['app/Services/OrderService.php']).toBe(true);

    const toggled = await toggleFileReviewed('app/Services/OrderService.php');
    expect(toggled).toBe(false);
    state = $reviewProgress.get();
    expect(state.reviewedFiles['app/Services/OrderService.php']).toBe(false);
  });

  it('updates total file count', () => {
    updateTotalFilesCount(15);
    expect($reviewProgress.get().totalFiles).toBe(15);
  });

  it('prevents totalFiles from shrinking below reviewedCount during virtual scrolling', async () => {
    // Suppose 6 files are reviewed
    await setFileReviewed('file1.ts', true);
    await setFileReviewed('file2.ts', true);
    await setFileReviewed('file3.ts', true);
    await setFileReviewed('file4.ts', true);
    await setFileReviewed('file5.ts', true);
    await setFileReviewed('file6.ts', true);

    expect($reviewProgress.get().totalFiles).toBe(6);

    // Virtual scroll reduces DOM containers to 4
    updateTotalFilesCount(4);

    // totalFiles must NOT drop to 4!
    expect($reviewProgress.get().totalFiles).toBe(6);

    // If new files appear in the diff, totalFiles can grow
    updateTotalFilesCount(8);
    expect($reviewProgress.get().totalFiles).toBe(8);

    // Scrolling again (containers drop to 3)
    updateTotalFilesCount(3);
    // Preserves maximum known count (8)
    expect($reviewProgress.get().totalFiles).toBe(8);
  });
});
