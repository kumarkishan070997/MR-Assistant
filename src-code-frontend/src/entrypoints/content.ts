import '@webcomponents/custom-elements';
import 'lit/polyfill-support.js';
import '../components/overlay/overlay-root';
import '../components/diff/symbol-trigger';
import '../components/drawers/results-drawer';
import '../components/drawers/checklist-dock';
import '../components/drawers/checklist-drawer';
import '../components/diff/scratchpad-row';
import '../components/diff/blast-badge';
import { defineContentScript } from 'wxt/sandbox';
import { PageLifecycleManager } from '../services/lifecycle-manager';
import { sanitizeSymbol } from '../services/symbol-sanitizer';
import { loadSettings, $settings } from '../stores/settings.store';
import { globalStorageService } from '../services/storage.service';
import { NoteRehydrator } from '../services/note-rehydrator';
import { AnchorOverlayRoot } from '../components/overlay/overlay-root';
import { extractFilePath } from '../services/file-path-resolver';
import { FileTrackerService } from '../services/file-tracker';
import { loadReviewProgress } from '../stores/review-progress.store';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  async main() {
    // Only run on Pull Request and Merge Request pages
    const isPR = /\/pull\/\d+/.test(window.location.pathname);
    const isMR = /\/(?:-\/)?merge_requests\/\d+/.test(window.location.pathname);
    if (!isPR && !isMR) {
      return;
    }

    console.log('[PeerPilot] Content script activated on PR/MR:', window.location.href);

    // Load user settings from chrome.storage
    await loadSettings();
    const settings = $settings.get();
    const customGitLabHosts = [
      ...(settings.gitlab?.custom_hosts || []),
      settings.gitlab?.base_url,
      window.location.origin,
    ].filter(Boolean) as string[];

    // Initialize lifecycle manager for host and SPA navigation detection
    const lifecycle = new PageLifecycleManager(customGitLabHosts);

    let overlayRoot = document.querySelector('anchor-overlay-root') as AnchorOverlayRoot | null;
    if (!overlayRoot) {
      overlayRoot = document.createElement('anchor-overlay-root') as AnchorOverlayRoot;
      document.body.appendChild(overlayRoot);
    }

    let currentRehydrator: NoteRehydrator | null = null;

    lifecycle.onNavigate(async (adapter, context) => {
      console.log(`[PeerPilot] Active on ${context.platform}: ${context.projectPath} (#${context.pullNumber})`);
      overlayRoot?.setAdapterAndContext(adapter, context);

      // Load session notes from storage for this PR/MR
      await globalStorageService.loadNotesForReview(context.platform, context.projectPath, context.pullNumber);

      // Load review progress from storage
      await loadReviewProgress(context.platform, context.projectPath, context.pullNumber);

      // Start file tracker for review check-offs
      FileTrackerService.start();

      // Restart note rehydrator for the active view
      currentRehydrator?.stop();
      currentRehydrator = new NoteRehydrator(adapter, context);
      currentRehydrator.start();
    });

    const isExcludedNode = (node: Node | null): boolean => {
      if (!node) return true;
      const el = node instanceof Element ? node : node.parentElement;
      if (!el) return true;

      return Boolean(
        el.closest(
          'input, textarea, select, [contenteditable="true"], anchor-overlay-root, anchor-scratchpad, anchor-results-drawer, anchor-checklist-drawer, anchor-symbol-trigger'
        )
      );
    };

    const handleSelection = () => {
      if (!overlayRoot) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        overlayRoot.hideTrigger();
        return;
      }

      const anchorNode = selection.anchorNode;
      if (isExcludedNode(anchorNode)) {
        overlayRoot.hideTrigger();
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 1) {
        overlayRoot.hideTrigger();
        return;
      }

      const range = selection.getRangeAt(0);
      const containerNode = range.commonAncestorContainer;
      const containerEl = containerNode instanceof Element ? containerNode : containerNode.parentElement;

      // Verify selection is within a diff container or diff table
      const diffContainer = containerEl?.closest(
        'table.diff-table, table.code, diff-file, .diff-file, .file-holder, .file, .diff-content, [data-blob-path], .js-diff-line, tr.line_holder, tr.diff-tr'
      );
      if (!diffContainer) {
        overlayRoot.hideTrigger();
        return;
      }

      const targetRow = (containerEl?.closest('tr, .line_holder, .diff-tr') || containerEl?.parentElement?.closest('tr')) as HTMLTableRowElement | null;

      let lineNumber = 0;
      let filePath = '';

      if (targetRow) {
        filePath = extractFilePath(targetRow);

        const lineLinks = Array.from(targetRow.querySelectorAll<HTMLElement>('[data-linenumber], [data-line-number]'));
        if (lineLinks.length > 0) {
          const target = lineLinks[lineLinks.length - 1];
          lineNumber = parseInt(
            target.getAttribute('data-linenumber') || target.getAttribute('data-line-number') || target.textContent?.trim() || '0',
            10
          );
        }
        if (lineNumber <= 0) {
          const numCell = targetRow.querySelector<HTMLElement>('td.blob-num, td.diff-line-num, td.new_line, td.old_line, td.line_numbers, .diff-line-num');
          if (numCell) {
            lineNumber = parseInt(
              numCell.getAttribute('data-line-number') || numCell.getAttribute('data-linenumber') || numCell.textContent?.trim() || '0',
              10
            );
          }
        }
      }

      if ((!filePath || filePath === 'unknown_file') && containerEl) {
        filePath = extractFilePath(containerEl);
      }

      const sanitized = sanitizeSymbol(selectedText);

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        overlayRoot.hideTrigger();
        return;
      }

      // Position toolbar neatly above selection, bounded within viewport
      const y = rect.top >= 42 ? rect.top - 36 : rect.bottom + 8;
      const x = Math.max(12, Math.min(rect.left, window.innerWidth - 380));

      overlayRoot.showTrigger({
        symbol: sanitized || '',
        selectedText,
        x,
        y,
        lineNumber,
        filePath,
        targetRow,
      });
    };

    // Use capture phase so listeners trigger before host or third-party extensions stop propagation
    document.addEventListener('mouseup', () => {
      setTimeout(handleSelection, 20);
    }, true);

    document.addEventListener('selectionchange', () => {
      setTimeout(handleSelection, 50);
    });

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        overlayRoot?.hideTrigger();
      } else if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
        setTimeout(handleSelection, 20);
      }
    }, true);
  },
});
