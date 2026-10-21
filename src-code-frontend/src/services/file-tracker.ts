import { extractFilePath } from './file-path-resolver';
import {
  $reviewProgress,
  setFileReviewed,
  toggleFileReviewed,
  updateTotalFilesCount,
} from '../stores/review-progress.store';

export class FileTrackerService {
  private static observer: MutationObserver | null = null;
  private static scanTimer: number | undefined;
  private static discoveredFiles = new Set<string>();

  public static start(): void {
    if (typeof window === 'undefined') return;

    // Seed discovered files with any existing reviewed files
    const existing = $reviewProgress.get().reviewedFiles;
    for (const path of Object.keys(existing)) {
      if (existing[path]) {
        this.discoveredFiles.add(path);
      }
    }

    this.scanAndDecorate();

    if (!this.observer) {
      this.observer = new MutationObserver(() => {
        if (this.scanTimer) window.clearTimeout(this.scanTimer);
        this.scanTimer = window.setTimeout(() => this.scanAndDecorate(), 200);
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Subscribe to store updates to update button visuals
    $reviewProgress.subscribe((state) => {
      this.syncAllButtonStates(state.reviewedFiles);
    });
  }

  public static stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.scanTimer) {
      window.clearTimeout(this.scanTimer);
      this.scanTimer = undefined;
    }
    this.discoveredFiles.clear();
  }

  private static parseBadgeCount(): number {
    if (typeof document === 'undefined') return 0;
    const selectors = [
      '#files_tab_counter',
      '[data-tab-item="files-tab"] .Counter',
      'a[href$="/files"] .Counter',
      'a[data-action="diffs"] .badge',
      'a#diffs-tab .badge',
      '[data-qa-selector="diffs_tab"] .badge',
      '.diffs-tab .badge',
      '[data-testid="page-heading"] .badge',
      'a[href*="/diffs"] .badge',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent?.trim().replace(/[^0-9]/g, '') || '';
        const parsed = parseInt(text, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    return 0;
  }

  public static scanAndDecorate(): void {
    // 1. Scan tree items if present
    const treeElements = document.querySelectorAll(
      '.diff-tree-list [title], [data-qa-selector="file_tree"] [title], .file-tree-list [title], [data-targets="diff-layout.fileTreeItems"] [title]'
    );
    for (const el of Array.from(treeElements)) {
      const title = el.getAttribute('title')?.trim();
      if (title && !title.includes(' ') && (title.includes('/') || title.includes('.'))) {
        this.discoveredFiles.add(title.replace(/^\.?\//, ''));
      }
    }

    const fileContainers = Array.from(
      document.querySelectorAll<HTMLElement>(
        'diff-file, .diff-file, .file-holder, .file[data-file-type], .file.js-file'
      )
    );

    for (const container of fileContainers) {
      const filePath = extractFilePath(container);
      if (filePath && filePath !== 'unknown_file') {
        this.discoveredFiles.add(filePath);
      }
    }

    const tabCount = this.parseBadgeCount();
    const treeFileRows = document.querySelectorAll(
      '.diff-tree-list .file-row, .diff-tree-list [data-qa-selector="file_row"], .tree-list-holder .file-row, [data-targets="diff-layout.fileTreeItems"] li'
    ).length;
    const reviewedCount = Object.values($reviewProgress.get().reviewedFiles || {}).filter(Boolean).length;

    const bestTotal = Math.max(
      tabCount,
      treeFileRows,
      this.discoveredFiles.size,
      fileContainers.length,
      reviewedCount,
      $reviewProgress.get().totalFiles
    );

    if (bestTotal > 0) {
      updateTotalFilesCount(bestTotal);
    }

    if (fileContainers.length === 0) return;

    const reviewedFiles = $reviewProgress.get().reviewedFiles;

    for (const container of fileContainers) {
      const filePath = extractFilePath(container);
      if (!filePath || filePath === 'unknown_file') continue;

      // Find suitable header actions container
      const header = container.querySelector<HTMLElement>(
        '.file-actions, .file-header-content, .diff-file-header, .file-header, .file-title'
      );
      if (!header) continue;

      if (header.querySelector('.peerpilot-review-btn')) {
        continue;
      }

      const isReviewed = Boolean(reviewedFiles[filePath]);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `peerpilot-review-btn ${isReviewed ? 'reviewed' : ''}`;
      btn.setAttribute('data-file-path', filePath);
      btn.title = isReviewed ? 'Mark file as unreviewed' : 'Mark file as reviewed';
      btn.innerHTML = `
        <svg class="check-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
        </svg>
        <span>${isReviewed ? 'Reviewed' : 'Review'}</span>
      `;

      btn.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 6px;
        border: 1px solid ${isReviewed ? '#10b981' : '#cbd5e1'};
        background-color: ${isReviewed ? '#ecfdf5' : '#ffffff'};
        color: ${isReviewed ? '#059669' : '#475569'};
        cursor: pointer;
        transition: all 0.15s ease;
        margin-right: 8px;
        vertical-align: middle;
        user-select: none;
      `;

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const nextState = await toggleFileReviewed(filePath);
        btn.classList.toggle('reviewed', nextState);
        btn.style.borderColor = nextState ? '#10b981' : '#cbd5e1';
        btn.style.backgroundColor = nextState ? '#ecfdf5' : '#ffffff';
        btn.style.color = nextState ? '#059669' : '#475569';
        btn.querySelector('span')!.textContent = nextState ? 'Reviewed' : 'Review';
      });

      // Insert at the beginning of header actions or end of header
      if (header.firstChild) {
        header.insertBefore(btn, header.firstChild);
      } else {
        header.appendChild(btn);
      }
    }
  }

  private static syncAllButtonStates(reviewedFiles: Record<string, boolean>): void {
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('.peerpilot-review-btn'));
    for (const btn of buttons) {
      const filePath = btn.getAttribute('data-file-path');
      if (!filePath) continue;
      const isReviewed = Boolean(reviewedFiles[filePath]);

      btn.classList.toggle('reviewed', isReviewed);
      btn.style.borderColor = isReviewed ? '#10b981' : '#cbd5e1';
      btn.style.backgroundColor = isReviewed ? '#ecfdf5' : '#ffffff';
      btn.style.color = isReviewed ? '#059669' : '#475569';
      btn.querySelector('span')!.textContent = isReviewed ? 'Reviewed' : 'Review';
    }
  }
}
