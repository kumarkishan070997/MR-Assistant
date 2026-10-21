import { atom } from 'nanostores';

export interface ReviewProgress {
  platform: string;
  projectPath: string;
  pullNumber: string;
  reviewedFiles: Record<string, boolean>;
  totalFiles: number;
}

const defaultProgress: ReviewProgress = {
  platform: '',
  projectPath: '',
  pullNumber: '',
  reviewedFiles: {},
  totalFiles: 0,
};

export const $reviewProgress = atom<ReviewProgress>(defaultProgress);

export function buildProgressKey(platform: string, projectPath: string, pullNumber: string): string {
  return `peerpilot:progress:${platform}:${projectPath}:${pullNumber}`;
}

export async function loadReviewProgress(
  platform: string,
  projectPath: string,
  pullNumber: string
): Promise<ReviewProgress> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    const fresh = { platform, projectPath, pullNumber, reviewedFiles: {}, totalFiles: 0 };
    $reviewProgress.set(fresh);
    return fresh;
  }

  const storageKey = buildProgressKey(platform, projectPath, pullNumber);
  const data = await chrome.storage.local.get(storageKey);
  const stored = data[storageKey] as ReviewProgress | undefined;

  const current = stored || {
    platform,
    projectPath,
    pullNumber,
    reviewedFiles: {},
    totalFiles: 0,
  };

  const reviewedCount = Object.values(current.reviewedFiles || {}).filter(Boolean).length;
  current.totalFiles = Math.max(current.totalFiles || 0, reviewedCount);

  $reviewProgress.set(current);
  return current;
}

export async function setFileReviewed(filePath: string, reviewed: boolean): Promise<void> {
  const current = $reviewProgress.get();
  if (!filePath || filePath === 'unknown_file') return;

  const nextFiles = {
    ...current.reviewedFiles,
    [filePath]: reviewed,
  };

  const reviewedCount = Object.values(nextFiles).filter(Boolean).length;
  const totalFiles = Math.max(current.totalFiles, reviewedCount);

  const updated: ReviewProgress = {
    ...current,
    reviewedFiles: nextFiles,
    totalFiles,
  };

  $reviewProgress.set(updated);

  if (typeof chrome !== 'undefined' && chrome.storage?.local && current.platform && current.projectPath) {
    const storageKey = buildProgressKey(current.platform, current.projectPath, current.pullNumber);
    await chrome.storage.local.set({ [storageKey]: updated });
  }
}

export async function toggleFileReviewed(filePath: string): Promise<boolean> {
  const current = $reviewProgress.get();
  const isReviewed = Boolean(current.reviewedFiles[filePath]);
  await setFileReviewed(filePath, !isReviewed);
  return !isReviewed;
}

export function updateTotalFilesCount(total: number): void {
  const current = $reviewProgress.get();
  const reviewedCount = Object.values(current.reviewedFiles || {}).filter(Boolean).length;
  const safeTotal = Math.max(current.totalFiles, total, reviewedCount);
  if (current.totalFiles !== safeTotal && safeTotal > 0) {
    const updated = { ...current, totalFiles: safeTotal };
    $reviewProgress.set(updated);

    if (typeof chrome !== 'undefined' && chrome.storage?.local && current.platform && current.projectPath) {
      const storageKey = buildProgressKey(current.platform, current.projectPath, current.pullNumber);
      chrome.storage.local.set({ [storageKey]: updated });
    }
  }
}
