import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { StoreController } from '../base/store-controller';
import { $activeNotes, LineNote, NoteTag, buildNoteKey } from '../../stores/notes.store';
import { globalStorageService } from '../../services/storage.service';
import { renderSanitizedMarkdown } from '../../services/markdown.service';
import { IPlatformAdapter, ReviewContext, DiffLineContext } from '../../adapters/base.adapter';
import { DiffTableInjector } from '../../services/diff-table-injector';
import { extractFilePath } from '../../services/file-path-resolver';
import { $settings, loadSettings, saveSettings } from '../../stores/settings.store';
import { $reviewProgress } from '../../stores/review-progress.store';
import { PrReviewService, PrReviewFinding, PrReviewResult } from '../../services/pr-review.service';

@customElement('anchor-checklist-drawer')
export class AnchorChecklistDrawer extends AnchorBaseElement {
  @property({ type: Boolean }) isOpen = false;
  @property({ type: Object }) context: ReviewContext | null = null;
  @property({ type: Object }) adapter: IPlatformAdapter | null = null;
  @property({ type: String }) activeTab: 'notes' | 'ai-review' = 'notes';

  @state() private copyToastMessage = '';
  @state() private promotingNoteId: string | null = null;
  @state() private activeTagFilter: 'all' | NoteTag = 'all';

  @state() private isReviewing = false;
  @state() private reviewStatusMessage = '';
  @state() private reviewResult: PrReviewResult | null = null;
  @state() private showConfigPanel = false;
  @state() private pinnedFindingIds = new Set<string>();
  @state() private postingFindingId: string | null = null;
  @state() private postedFindingIds = new Set<string>();
  @state() private copiedSnippetFindingId: string | null = null;

  private notesStore = new StoreController(this, $activeNotes);
  private progressStore = new StoreController(this, $reviewProgress);
  private healingNotes = new Set<string>();

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 99998;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background-color: rgba(15, 23, 42, 0.4);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        backdrop-filter: blur(1px);
      }
      .backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }
      .panel {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 460px;
        max-width: 92vw;
        background-color: #ffffff;
        color: #0f172a;
        box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
        border-left: 1px solid #e2e8f0;
        transform: translateX(100%);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        pointer-events: auto;
      }
      .panel.open {
        transform: translateX(0);
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e2e8f0;
        background-color: #ffffff;
      }
      .title {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .count-badge {
        font-size: 11px;
        font-weight: 600;
        background-color: #f1f5f9;
        color: #0f172a;
        padding: 1px 7px;
        border-radius: 10px;
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .btn-header {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 500;
        border-radius: 5px;
        border: 1px solid #e2e8f0;
        background-color: #ffffff;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-header:hover {
        background-color: #f8fafc;
        color: #0f172a;
        border-color: #cbd5e1;
      }
      .close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      .close-btn:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }
      .summary-bar {
        padding: 6px 16px;
        background-color: #f8fafc;
        border-bottom: 1px solid #f1f5f9;
        font-size: 11px;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 14px 16px;
      }
      .toast {
        position: fixed;
        bottom: 80px;
        right: 32px;
        background-color: #0f172a;
        color: #ffffff;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        z-index: 100000;
        animation: fadeIn 0.2s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .file-group {
        margin-bottom: 14px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        background-color: #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
      }
      .file-header {
        padding: 7px 12px;
        background-color: #f8fafc;
        font-size: 11px;
        font-weight: 600;
        font-family: ui-monospace, SFMono-Regular, monospace;
        color: #0284c7;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .note-card {
        padding: 10px 12px;
        border-bottom: 1px solid #f1f5f9;
        background-color: #ffffff;
        transition: background-color 0.15s ease;
      }
      .note-card:last-child {
        border-bottom: none;
      }
      .note-card:hover {
        background-color: #fafbfc;
      }
      .note-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      .line-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 11px;
        font-weight: 600;
        background-color: #e0f2fe;
        color: #0369a1;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .line-pill:hover {
        background-color: #bae6fd;
      }
      .promoted-badge {
        font-size: 10px;
        color: #15803d;
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 500;
      }
      .note-body {
        font-size: 12px;
        line-height: 1.5;
        color: #334155;
        margin: 5px 0;
        background-color: #f8fafc;
        padding: 7px 9px;
        border-radius: 5px;
        border: 1px solid #e2e8f0;
        max-height: 180px;
        overflow-y: auto;
      }
      .note-body pre {
        background-color: #edf2f7;
        padding: 6px 8px;
        border-radius: 4px;
        overflow-x: auto;
      }
      .note-actions {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 6px;
      }
      .btn-action {
        font-size: 11px;
        font-weight: 500;
        padding: 2px 7px;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-action:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }
      .btn-action.promote {
        color: #0369a1;
        background-color: #f0f9ff;
        border-color: #bae6fd;
      }
      .btn-action.promote:hover {
        background-color: #e0f2fe;
      }
      .btn-action.delete {
        color: #94a3b8;
      }
      .btn-action.delete:hover {
        color: #dc2626;
        border-color: #fecaca;
        background-color: #fef2f2;
      }
      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: #64748b;
      }
      .empty-icon {
        width: 36px;
        height: 36px;
        margin: 0 auto 10px;
        color: #94a3b8;
      }
      .filter-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background-color: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        overflow-x: auto;
      }
      .chip {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid #cbd5e1;
        background-color: #ffffff;
        color: #475569;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;
      }
      .chip:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }
      .chip.active {
        background-color: #0f172a;
        color: #ffffff;
        border-color: #0f172a;
        font-weight: 600;
      }
      .tag-badge {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 600;
      }
      .tag-badge.blocker { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
      .tag-badge.bug { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
      .tag-badge.suggestion { background-color: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
      .tag-badge.question { background-color: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff; }
      .tag-badge.nitpick { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
      .tag-badge.praise { background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

      .top-tab-bar {
        display: flex;
        align-items: center;
        background-color: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 4px 16px 0;
        gap: 6px;
      }
      .top-tab {
        padding: 7px 14px;
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .top-tab:hover {
        color: #0f172a;
      }
      .top-tab.active {
        color: #7c3aed;
        border-bottom-color: #7c3aed;
        background: #ffffff;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
      }
      .top-tab-count {
        background-color: #f1f5f9;
        color: #475569;
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 700;
      }
      .top-tab.active .top-tab-count {
        background-color: #ede9fe;
        color: #6d28d9;
      }
      .btn-run-review {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        margin-top: 10px;
        padding: 9px 16px;
        background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
        transition: opacity 0.15s ease, transform 0.15s ease;
      }
      .btn-run-review:hover {
        opacity: 0.95;
        transform: translateY(-1px);
      }
      .btn-run-review:disabled {
        opacity: 0.65;
        cursor: not-allowed;
        transform: none;
      }
      .finding-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .finding-card.critical { border-left: 4px solid #ef4444; }
      .finding-card.high { border-left: 4px solid #f59e0b; }
      .finding-card.medium { border-left: 4px solid #3b82f6; }
      .finding-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
      }
      .badge-crit { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
      .badge-high { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
      .badge-med { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
      .badge-cat { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
      .finding-title {
        font-size: 12px;
        font-weight: 700;
        color: #0f172a;
      }
      .finding-desc {
        font-size: 11px;
        color: #334155;
        line-height: 1.45;
      }
      .finding-fix-container {
        margin-top: 6px;
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .finding-fix-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px 10px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
      }
      .finding-fix-title {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #94a3b8;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .btn-copy-fix {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 4px;
        background: #334155;
        color: #e2e8f0;
        border: none;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .btn-copy-fix:hover {
        background: #475569;
      }
      .finding-fix-pre {
        margin: 0;
        padding: 8px 10px;
        font-family: ui-monospace, SFMono-Regular, "Cascadia Code", Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        line-height: 1.5;
        color: #38bdf8;
        background: #0f172a;
        overflow-x: auto;
        white-space: pre;
        tab-size: 2;
        max-height: 180px;
        scrollbar-width: thin;
        scrollbar-color: #334155 #0f172a;
      }
      .finding-fix-pre::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .finding-fix-pre::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 3px;
      }
      .finding-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
      }
      .btn-post-comment {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 9px;
        border-radius: 5px;
        background: #6366f1;
        color: #ffffff;
        border: none;
        cursor: pointer;
        transition: opacity 0.15s ease, background-color 0.15s ease;
      }
      .btn-post-comment:hover { opacity: 0.9; }
      .btn-post-comment:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
      .btn-post-comment.posted {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #10b981;
        cursor: default;
      }
      .btn-pin {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 9px;
        border-radius: 5px;
        background: #0284c7;
        color: #ffffff;
        border: none;
        cursor: pointer;
        transition: opacity 0.15s ease;
      }
      .btn-pin:hover { opacity: 0.9; }
      .btn-pin.pinned {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #10b981;
        cursor: default;
      }
      .clean-banner {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        color: #065f46;
      }
    `
  ];

  public open() {
    this.isOpen = true;
  }

  public close() {
    this.isOpen = false;
  }

  public toggle() {
    this.isOpen = !this.isOpen;
  }

  private showToast(msg: string) {
    this.copyToastMessage = msg;
    setTimeout(() => {
      this.copyToastMessage = '';
    }, 2000);
  }

  public findRowForLine(filePath: string, lineNumber: number): HTMLTableRowElement | null {
    if (typeof document === 'undefined') return null;

    const isGitHub = this.context?.platform === 'github';
    const cleanTarget = filePath ? filePath.trim().replace(/^\.?\//, '') : '';
    const targetBase = cleanTarget ? cleanTarget.split('/').pop() || cleanTarget : '';

    const containers = Array.from(
      document.querySelectorAll<HTMLElement>(
        isGitHub
          ? '.file, [data-file-type]'
          : 'diff-file, .diff-file, [data-blob-path], .file-holder, .file, [data-qa-selector="diff_file"], [data-qa-selector="file_holder"]'
      )
    );

    let targetContainer: HTMLElement | null = null;
    for (const c of containers) {
      const detected = extractFilePath(c);
      const blobPath = c.getAttribute('data-blob-path') || c.getAttribute('data-path') || '';
      if (
        (cleanTarget && (detected === cleanTarget || detected.endsWith('/' + cleanTarget) || cleanTarget.endsWith('/' + detected))) ||
        (cleanTarget && (blobPath === cleanTarget || blobPath.endsWith('/' + cleanTarget))) ||
        (targetBase && detected.split('/').pop() === targetBase && detected !== 'unknown_file')
      ) {
        targetContainer = c;
        break;
      }
    }

    if (!targetContainer && containers.length > 0 && !cleanTarget) {
      targetContainer = containers[0];
    }

    if (!targetContainer) return null;

    let cell = targetContainer.querySelector<HTMLElement>(
      isGitHub
        ? `td.blob-num[data-line-number="${lineNumber}"]`
        : `[data-linenumber="${lineNumber}"], [data-line-number="${lineNumber}"], td.diff-line-num[data-linenumber="${lineNumber}"]`
    );

    if (!cell) {
      const lineNumEls = Array.from(
        targetContainer.querySelectorAll<HTMLElement>(
          '.diff-line-num, td.new_line, td.diff-line-num.new_line, td.blob-num'
        )
      );
      cell = lineNumEls.find((el) => el.textContent?.trim() === String(lineNumber)) || null;
    }

    if (cell) {
      return (cell.closest('tr, .line_holder, .diff-tr, .diff-grid-row') || cell.parentElement?.closest('tr')) as HTMLTableRowElement | null;
    }

    return null;
  }

  private scrollToLine(filePath: string, lineNumber: number) {
    if (typeof document === 'undefined') return;

    const isGitHub = this.context?.platform === 'github';
    const cleanTarget = filePath ? filePath.trim().replace(/^\.?\//, '') : '';
    const targetBase = cleanTarget ? cleanTarget.split('/').pop() || cleanTarget : '';

    const containers = Array.from(
      document.querySelectorAll<HTMLElement>(
        isGitHub
          ? '.file, [data-file-type]'
          : 'diff-file, .diff-file, [data-blob-path], .file-holder, .file, [data-qa-selector="diff_file"], [data-qa-selector="file_holder"]'
      )
    );

    let targetContainer: HTMLElement | null = null;
    for (const c of containers) {
      const detected = extractFilePath(c);
      const blobPath = c.getAttribute('data-blob-path') || c.getAttribute('data-path') || '';
      if (
        (cleanTarget && (detected === cleanTarget || detected.endsWith('/' + cleanTarget) || cleanTarget.endsWith('/' + detected))) ||
        (cleanTarget && (blobPath === cleanTarget || blobPath.endsWith('/' + cleanTarget))) ||
        (targetBase && detected.split('/').pop() === targetBase && detected !== 'unknown_file')
      ) {
        targetContainer = c;
        break;
      }
    }

    if (targetContainer) {
      // Expand file container if collapsed
      const isCollapsed = targetContainer.classList.contains('collapsed') || targetContainer.classList.contains('open') === false;
      if (isCollapsed) {
        const toggleBtn = targetContainer.querySelector<HTMLElement>('.file-header, .file-title, [data-qa-selector="file_title"], .diff-file-header');
        toggleBtn?.click();
      }

      // Try locating line row inside this container
      let cell = targetContainer.querySelector<HTMLElement>(
        isGitHub
          ? `td.blob-num[data-line-number="${lineNumber}"]`
          : `[data-linenumber="${lineNumber}"], [data-line-number="${lineNumber}"], td.diff-line-num[data-linenumber="${lineNumber}"]`
      );

      if (!cell) {
        const lineNumEls = Array.from(
          targetContainer.querySelectorAll<HTMLElement>(
            '.diff-line-num, td.new_line, td.diff-line-num.new_line, td.blob-num'
          )
        );
        cell = lineNumEls.find((el) => el.textContent?.trim() === String(lineNumber)) || null;
      }

      const targetRow = cell ? ((cell.closest('tr, .line_holder, .diff-tr, .diff-grid-row') || cell.parentElement?.closest('tr')) as HTMLTableRowElement | null) : null;

      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const originalBg = targetRow.style.backgroundColor;
        targetRow.style.backgroundColor = 'rgba(2, 132, 199, 0.2)';
        targetRow.style.transition = 'background-color 0.3s ease';
        setTimeout(() => {
          targetRow.style.backgroundColor = originalBg;
        }, 1600);

        const nextRow = targetRow.nextElementSibling;
        if (nextRow?.classList.contains('anchor-scratchpad-row')) {
          (nextRow as HTMLElement).style.display = 'table-row';
        }
        this.showToast(`Jumped to ${targetBase} (L${lineNumber})`);
      } else {
        targetContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.showToast(`Jumped to ${targetBase} (L${lineNumber})`);
      }
      return;
    }

    // Fallback: If container not in DOM due to virtual scroll, try clicking in file tree
    const treeItem = document.querySelector<HTMLElement>(
      `.diff-tree-list [title*="${targetBase}"], [data-qa-selector="file_row"] [title*="${targetBase}"], [data-targets="diff-layout.fileTreeItems"] a[title*="${targetBase}"], .tree-list-holder [title*="${targetBase}"]`
    );
    if (treeItem) {
      treeItem.click();
      this.showToast(`Loading ${targetBase}...`);
      setTimeout(() => {
        this.scrollToLine(filePath, lineNumber);
      }, 700);
      return;
    }

    this.showToast(`File ${targetBase || filePath} not found on page`);
  }

  private async handlePostFindingComment(finding: PrReviewFinding) {
    if (!this.adapter || !this.context) {
      this.showToast('Adapter not ready');
      return;
    }

    this.postingFindingId = finding.id;

    await loadSettings();
    const settings = $settings.get();
    const token = this.context.platform === 'github' ? settings.github.pat : settings.gitlab.pat;

    const lineNum = finding.lineNumber || 1;
    const targetRow = this.findRowForLine(finding.filePath, lineNum);

    const lineCtx: DiffLineContext = {
      element: targetRow || (document.createElement('tr') as HTMLTableRowElement),
      filePath: finding.filePath,
      lineNumber: lineNum,
      diffSide: 'right',
      codeContent: '',
    };

    const codeSnippet = finding.suggestedFix ? `\n\n\`\`\`suggestion\n${finding.suggestedFix}\n\`\`\`` : '';
    const commentMarkdown = `**[${finding.severity.toUpperCase()}] ${finding.category.toUpperCase()}: ${finding.title}**\n\n${finding.description}${codeSnippet}`;

    try {
      const success = await this.adapter.triggerNativeComment(lineCtx, commentMarkdown, token, this.context);
      if (success) {
        this.postedFindingIds = new Set([...this.postedFindingIds, finding.id]);
        this.showToast('✓ Comment posted to PR/MR!');

        // Also save as promoted note so it shows in Notes tab
        const noteId = buildNoteKey(
          this.context.platform,
          this.context.projectPath,
          this.context.pullNumber,
          finding.filePath,
          lineNum
        );
        const notePayload: LineNote = {
          id: noteId,
          platform: this.context.platform,
          projectPath: this.context.projectPath,
          pullNumber: this.context.pullNumber,
          filePath: finding.filePath,
          lineNumber: lineNum,
          content: commentMarkdown,
          isCollapsed: false,
          promoted: true,
          tag: finding.severity === 'critical' ? 'blocker' : 'bug',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await globalStorageService.saveNoteImmediate(notePayload);
        this.pinnedFindingIds = new Set([...this.pinnedFindingIds, finding.id]);
      } else {
        await navigator.clipboard.writeText(commentMarkdown);
        this.showToast('Could not post directly. Comment copied to clipboard!');
      }
    } catch (err) {
      await navigator.clipboard.writeText(commentMarkdown);
      this.showToast('Error posting comment. Comment copied to clipboard!');
    } finally {
      this.postingFindingId = null;
    }
  }

  private copyFixSnippet(findingId: string, fixText: string) {
    navigator.clipboard.writeText(fixText).then(() => {
      this.copiedSnippetFindingId = findingId;
      setTimeout(() => {
        if (this.copiedSnippetFindingId === findingId) {
          this.copiedSnippetFindingId = null;
        }
      }, 1800);
      this.showToast('Copied fix snippet to clipboard!');
    });
  }

  private async handlePromote(note: LineNote) {
    if (!this.adapter || !this.context) {
      this.showToast('Adapter not ready');
      return;
    }

    this.promotingNoteId = note.id;

    await loadSettings();
    const settings = $settings.get();
    const token = this.context.platform === 'github' ? settings.github.pat : settings.gitlab.pat;

    const targetRow = this.findRowForLine(note.filePath, note.lineNumber);
    const effectivePath = (note.filePath && note.filePath !== 'unknown_file') ? note.filePath : (targetRow ? extractFilePath(targetRow) : 'unknown_file');

    const lineCtx: DiffLineContext = {
      element: targetRow || (document.createElement('tr') as HTMLTableRowElement),
      filePath: effectivePath,
      lineNumber: note.lineNumber,
      diffSide: 'right',
      codeContent: '',
    };

    try {
      const success = await this.adapter.triggerNativeComment(lineCtx, note.content, token, this.context);
      if (success) {
        const updatedNote = { ...note, filePath: effectivePath, promoted: true, updatedAt: Date.now() };
        await globalStorageService.saveNoteImmediate(updatedNote);
        window.dispatchEvent(new CustomEvent('anchor-note-promoted', { detail: { noteId: note.id } }));
        this.showToast('✓ Comment submitted to Git!');
      } else {
        this.showToast('Could not submit comment to Git. Note saved and copied to clipboard.');
      }
    } catch (err) {
      this.showToast('Error promoting note to Git');
    } finally {
      this.promotingNoteId = null;
    }
  }

  private async handleDelete(noteId: string) {
    if (confirm('Delete this private note?')) {
      await globalStorageService.deleteNote(noteId);
      const row = document.querySelector(`tr.anchor-scratchpad-row[data-note-id="${noteId}"]`);
      row?.remove();
      this.showToast('Note deleted');
    }
  }

  private copyNoteMarkdown(note: LineNote) {
    const text = `**File:** \`${note.filePath}\` (Line ${note.lineNumber})\n\n${note.content}`;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copied note to clipboard!');
    });
  }

  private exportAllMarkdown(notes: LineNote[]) {
    if (notes.length === 0) return;

    let md = `# Review Notes Summary — ${this.context?.projectPath || 'Review'} (#${this.context?.pullNumber || ''})\n\n`;

    const grouped = this.groupNotesByFile(notes);
    for (const [file, fileNotes] of Object.entries(grouped)) {
      md += `### \`${file}\`\n\n`;
      fileNotes.forEach((n) => {
        md += `- **Line ${n.lineNumber}:**\n\n${n.content.replace(/^/gm, '  ')}\n\n`;
      });
    }

    navigator.clipboard.writeText(md).then(() => {
      this.showToast('Exported all notes to clipboard!');
    });
  }

  private async healNoteFilePath(oldNote: LineNote, newFilePath: string) {
    if (!oldNote || oldNote.filePath === newFilePath || this.healingNotes.has(oldNote.id)) return;
    this.healingNotes.add(oldNote.id);

    try {
      const newId = buildNoteKey(
        oldNote.platform,
        oldNote.projectPath,
        oldNote.pullNumber,
        newFilePath,
        oldNote.lineNumber
      );
      const updatedNote: LineNote = {
        ...oldNote,
        id: newId,
        filePath: newFilePath,
        updatedAt: Date.now(),
      };
      await globalStorageService.deleteNote(oldNote.id);
      await globalStorageService.saveNoteImmediate(updatedNote);

      if (typeof document !== 'undefined') {
        const row = document.querySelector(`tr.anchor-scratchpad-row[data-note-id="${oldNote.id}"]`);
        if (row) {
          row.setAttribute('data-note-id', newId);
          const scratchpad = row.querySelector('anchor-scratchpad') as any;
          if (scratchpad) {
            scratchpad.noteId = newId;
            scratchpad.filePath = newFilePath;
          }
        }
      }
    } catch (err) {
      console.warn('[ChecklistDrawer] Error auto-healing note path:', err);
    }
  }

  public groupNotesByFile(notes: LineNote[]): Record<string, LineNote[]> {
    return notes.reduce((acc, note) => {
      let resolvedPath = note.filePath;
      if ((!resolvedPath || resolvedPath === 'unknown_file') && typeof document !== 'undefined') {
        const lineEl = document.querySelector(
          `[data-linenumber="${note.lineNumber}"], [data-line-number="${note.lineNumber}"]`
        );
        const row = (lineEl?.closest('tr, .line_holder, .diff-tr') || lineEl) as HTMLElement | null;
        if (row) {
          const detected = extractFilePath(row);
          if (detected && detected !== 'unknown_file') {
            resolvedPath = detected;
            this.healNoteFilePath(note, detected);
          }
        }
      }

      acc[resolvedPath] = acc[resolvedPath] || [];
      acc[resolvedPath].push(resolvedPath !== note.filePath ? { ...note, filePath: resolvedPath } : note);
      return acc;
    }, {} as Record<string, LineNote[]>);
  }

  private async handleRunAiReview() {
    if (this.isReviewing) return;
    this.isReviewing = true;
    this.reviewStatusMessage = 'Scraping modified diffs...';

    try {
      const res = await PrReviewService.runReview(this.context, (_chunk, _acc) => {
        this.reviewStatusMessage = 'Analyzing for SQLi, N+1 queries & security risks...';
      });

      if (!res.success) {
        alert(res.error || 'Failed to complete review');
      } else {
        this.reviewResult = res;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown review error';
      alert(msg);
    } finally {
      this.isReviewing = false;
      this.reviewStatusMessage = '';
    }
  }

  private async handlePinFinding(finding: PrReviewFinding) {
    if (!this.context) {
      this.showToast('Context not available');
      return;
    }

    const noteId = buildNoteKey(
      this.context.platform,
      this.context.projectPath,
      this.context.pullNumber,
      finding.filePath,
      finding.lineNumber || 1
    );

    const codeBlock = finding.suggestedFix ? `\n\n\`\`\`suggestion\n${finding.suggestedFix}\n\`\`\`` : '';
    const noteContent = `**[${finding.severity.toUpperCase()}] ${finding.category.toUpperCase()}: ${finding.title}**\n\n${finding.description}${codeBlock}`;

    const notePayload: LineNote = {
      id: noteId,
      platform: this.context.platform,
      projectPath: this.context.projectPath,
      pullNumber: this.context.pullNumber,
      filePath: finding.filePath,
      lineNumber: finding.lineNumber || 1,
      content: noteContent,
      isCollapsed: false,
      tag: finding.severity === 'critical' ? 'blocker' : 'bug',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await globalStorageService.saveNoteImmediate(notePayload);
    this.pinnedFindingIds = new Set([...this.pinnedFindingIds, finding.id]);
    this.showToast(`📌 Pinned note to L${finding.lineNumber || 1}!`);

    if (finding.lineNumber) {
      this.scrollToLine(finding.filePath, finding.lineNumber);
    }
  }

  private copyReportMarkdown(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Review report copied to clipboard!');
    });
  }

  private async handleUpdateStrictness(val: string) {
    const current = $settings.get().review;
    await saveSettings({
      review: {
        ...current,
        strictness: val as any,
      },
    });
    this.showToast(`Strictness set to: ${val}`);
  }

  private async handleUpdateInstructions(val: string) {
    const current = $settings.get().review;
    await saveSettings({
      review: {
        ...current,
        customInstructions: val.trim(),
      },
    });
    this.showToast('Saved custom instructions');
  }

  override render() {
    const notesMap = this.notesStore.value || {};
    const allNotes = Object.values(notesMap).filter(
      (n) => n && typeof n.content === 'string' && n.content.trim().length > 0
    );
    const filteredNotes =
      this.activeTagFilter === 'all'
        ? allNotes
        : allNotes.filter((n) => n.tag === this.activeTagFilter);
    const grouped = this.groupNotesByFile(filteredNotes);
    const fileCount = Object.keys(grouped).length;

    const progress = this.progressStore.value;
    const reviewedCount = Object.values(progress?.reviewedFiles || {}).filter(Boolean).length;
    const totalFiles = Math.max(progress?.totalFiles || 0, reviewedCount);
    const percent = totalFiles > 0 ? Math.min(100, Math.round((reviewedCount / totalFiles) * 100)) : 0;

    return html`
      <div class="backdrop ${this.isOpen ? 'open' : ''}" @click=${this.close}></div>
      <div class="panel ${this.isOpen ? 'open' : ''}">
        <div class="header">
          <div class="title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 128 128" fill="none" style="width: 18px; height: 18px; display: inline-block;">
              <circle cx="64" cy="28" r="14" stroke="#38bdf8" stroke-width="6"/>
              <path d="M64 20 Q64 28 72 28 Q64 28 64 36 Q64 28 56 28 Q64 28 64 20 Z" fill="#38bdf8"/>
              <line x1="64" y1="42" x2="64" y2="94" stroke="#06b6d4" stroke-width="8" stroke-linecap="round"/>
              <path d="M44 52 L26 66 L44 80" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M84 52 L102 66 L84 80" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20 84 C20 106 108 106 108 84" stroke="#6366f1" stroke-width="8" stroke-linecap="round"/>
            </svg>
            <span>PeerPilot Review</span>
          </div>

          <div class="header-actions">
            ${this.activeTab === 'notes' && allNotes.length > 0
              ? html`
                  <button type="button" class="btn-header" @click=${() => this.exportAllMarkdown(allNotes)} title="Copy review summary as Markdown">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
                      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                    </svg>
                    <span>Export</span>
                  </button>
                `
              : html``}

            <button type="button" class="close-btn" @click=${this.close} title="Close drawer">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
              </svg>
            </button>
          </div>
        </div>

        ${totalFiles > 0
          ? html`
              <div class="progress-section" style="padding: 8px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #475569;">
                  <span><b>Files Reviewed:</b> ${reviewedCount} of ${totalFiles}</span>
                  <span style="font-weight: 600; color: ${percent === 100 ? '#10b981' : '#0284c7'};">${percent}%</span>
                </div>
                <div style="width: 100%; height: 6px; background-color: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                  <div style="width: ${percent}%; height: 100%; background: ${percent === 100 ? '#10b981' : '#0284c7'}; transition: width 0.3s ease;"></div>
                </div>
              </div>
            `
          : html``}

        <div class="top-tab-bar">
          <button
            type="button"
            class="top-tab ${this.activeTab === 'notes' ? 'active' : ''}"
            @click=${() => (this.activeTab = 'notes')}
          >
            <span>📝 Notes</span>
            <span class="top-tab-count">${allNotes.length}</span>
          </button>
          <button
            type="button"
            class="top-tab ${this.activeTab === 'ai-review' ? 'active' : ''}"
            @click=${() => (this.activeTab = 'ai-review')}
          >
            <span>⚡ Critical AI Review</span>
            ${this.reviewResult?.findings.length
              ? html`<span class="top-tab-count">${this.reviewResult.findings.length}</span>`
              : html``}
          </button>
        </div>

        ${this.activeTab === 'notes'
          ? html`
              ${allNotes.length > 0
                ? html`
                    <div class="summary-bar">
                      <span>${allNotes.length} ${allNotes.length === 1 ? 'note' : 'notes'} across ${fileCount} ${fileCount === 1 ? 'file' : 'files'}</span>
                      <span>Private & local</span>
                    </div>

                    <div class="filter-bar">
                      <button
                        type="button"
                        class="chip ${this.activeTagFilter === 'all' ? 'active' : ''}"
                        @click=${() => (this.activeTagFilter = 'all')}
                      >
                        All (${allNotes.length})
                      </button>
                      ${(['blocker', 'bug', 'suggestion', 'question', 'nitpick', 'praise'] as NoteTag[]).map((t) => {
                        const count = allNotes.filter((n) => n.tag === t).length;
                        if (count === 0 && this.activeTagFilter !== t) return html``;
                        const labels: Record<NoteTag, string> = {
                          blocker: '🚨 Blocker',
                          bug: '🐛 Bug',
                          suggestion: '💡 Suggestion',
                          question: '❓ Question',
                          nitpick: '📝 Nitpick',
                          praise: '👏 Praise',
                        };
                        return html`
                          <button
                            type="button"
                            class="chip ${this.activeTagFilter === t ? 'active' : ''}"
                            @click=${() => (this.activeTagFilter = t)}
                          >
                            ${labels[t]} (${count})
                          </button>
                        `;
                      })}
                    </div>
                  `
                : html``}

              <div class="content">
                ${filteredNotes.length === 0
                  ? html`
                      <div class="empty-state">
                        <svg class="empty-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.13 3.13c.015.44-.087 1.05-.543 1.506a.5.5 0 0 1-.707 0L5.353 8.283 1.939 11.7a.5.5 0 0 1-.707 0l-.708-.707a.5.5 0 0 1 0-.708L3.938 6.87 1.408 4.34a.5.5 0 0 1 0-.707c.456-.456 1.066-.558 1.506-.543l3.13-3.13C6.023.085 6.005.027 6.005 0c0-.43.108-1.024.588-1.504a.5.5 0 0 1 .707 0l2.528 2.226z"/>
                        </svg>
                        <div class="font-semibold text-sm text-slate-700">No notes match this filter</div>
                        <div class="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                          Try switching filters or click "All" to view all drafted notes.
                        </div>
                      </div>
                    `
                  : Object.entries(grouped).map(
                      ([file, fileNotes]) => html`
                        <div class="file-group">
                          <div class="file-header">
                            <span class="truncate" title="${file}">📄 ${file}</span>
                            <span class="text-[10px] text-slate-500 font-sans font-normal ml-2 flex-shrink-0">
                              ${fileNotes.length} ${fileNotes.length === 1 ? 'note' : 'notes'}
                            </span>
                          </div>

                          ${fileNotes.map(
                            (note) => html`
                              <div class="note-card">
                                <div class="note-top">
                                  <div style="display: inline-flex; align-items: center; gap: 6px;">
                                    <span class="line-pill" @click=${() => this.scrollToLine(note.filePath, note.lineNumber)}>
                                      L${note.lineNumber}
                                      <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"></path>
                                      </svg>
                                    </span>

                                    ${note.tag
                                      ? html`<span class="tag-badge ${note.tag}">${note.tag.toUpperCase()}</span>`
                                      : html``}
                                  </div>

                                  ${note.promoted
                                    ? html`<span class="promoted-badge">✓ Commented</span>`
                                    : html``}
                                </div>

                                <div class="note-body">
                                  ${unsafeHTML(renderSanitizedMarkdown(note.content))}
                                </div>

                                <div class="note-actions">
                                  <button
                                    type="button"
                                    class="btn-action"
                                    @click=${() => this.scrollToLine(note.filePath, note.lineNumber)}
                                  >
                                    Jump
                                  </button>
                                  <button
                                    type="button"
                                    class="btn-action"
                                    @click=${() => this.copyNoteMarkdown(note)}
                                  >
                                    Copy
                                  </button>
                                  <button
                                    type="button"
                                    class="btn-action promote"
                                    ?disabled=${this.promotingNoteId === note.id}
                                    @click=${() => this.handlePromote(note)}
                                  >
                                    ${this.promotingNoteId === note.id ? 'Promoting...' : '💬 Promote'}
                                  </button>
                                  <button
                                    type="button"
                                    class="btn-action delete"
                                    @click=${() => this.handleDelete(note.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            `
                          )}
                        </div>
                      `
                    )}
              </div>
            `
          : html`
              <!-- Critical AI Review Tab -->
              <div class="content" style="padding: 14px 16px;">
                <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 1px solid #ddd6fe; border-radius: 8px; padding: 12px 14px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 13px; font-weight: 700; color: #5b21b6; display: flex; align-items: center; gap: 6px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"/>
                      </svg>
                      Critical Reviewer Persona
                    </span>
                    <button
                      type="button"
                      style="font-size: 11px; background: transparent; border: none; color: #6d28d9; cursor: pointer; text-decoration: underline;"
                      @click=${() => (this.showConfigPanel = !this.showConfigPanel)}
                    >
                      ⚙️ ${this.showConfigPanel ? 'Hide Persona' : 'Persona & Rules'}
                    </button>
                  </div>

                  <p style="font-size: 11px; color: #6d28d9; margin: 0; line-height: 1.4;">
                    Rigorous analysis for SQL injection, N+1 queries, race conditions, memory leaks, and vulnerabilities. Spacing & linter style ignored.
                  </p>

                  ${this.showConfigPanel
                    ? html`
                        <div style="margin-top: 10px; background: #ffffff; border: 1px solid #ddd6fe; border-radius: 6px; padding: 10px 12px; font-size: 11px;">
                          <div style="font-weight: 700; margin-bottom: 6px; color: #334155;">Configure Review Persona:</div>
                          
                          <div style="margin-bottom: 6px;">
                            <label style="font-size: 10px; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Strictness:</label>
                            <select
                              id="drawer-strictness"
                              style="width: 100%; font-size: 11px; padding: 3px 6px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc;"
                              @change=${(e: Event) => this.handleUpdateStrictness((e.target as HTMLSelectElement).value)}
                            >
                              <option value="critical" ?selected=${$settings.get().review?.strictness === 'critical'}>🚨 Critical Only (Blockers, exploits, data loss)</option>
                              <option value="high" ?selected=${$settings.get().review?.strictness === 'high'}>⚠️ High & Critical (Security, N+1, severe bugs)</option>
                              <option value="comprehensive" ?selected=${$settings.get().review?.strictness === 'comprehensive'}>🔍 Comprehensive (All technical risks)</option>
                            </select>
                          </div>

                          <div style="margin-bottom: 6px;">
                            <label style="font-size: 10px; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Custom Guidelines / Architecture Notes:</label>
                            <textarea
                              id="drawer-custom-instructions"
                              rows="2"
                              style="width: 100%; font-size: 11px; font-family: monospace; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; box-sizing: border-box; resize: none;"
                              placeholder="e.g. We use PostgreSQL 16. Watch for table locks in migrations."
                              .value=${$settings.get().review?.customInstructions || ''}
                              @change=${(e: Event) => this.handleUpdateInstructions((e.target as HTMLTextAreaElement).value)}
                            ></textarea>
                          </div>
                        </div>
                      `
                    : html``}

                  <button
                    type="button"
                    class="btn-run-review"
                    ?disabled=${this.isReviewing}
                    @click=${this.handleRunAiReview}
                  >
                    ${this.isReviewing
                      ? html`
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                            <path d="M12 2a10 10 0 0 1 10 10"></path>
                          </svg>
                          <span>${this.reviewStatusMessage || 'Analyzing PR Diffs...'}</span>
                        `
                      : html`
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"/>
                          </svg>
                          <span>${this.reviewResult ? 'Re-run Critical AI Review' : '⚡ Run Critical AI Review'}</span>
                        `}
                  </button>
                </div>

                <!-- Review Output Results -->
                ${this.reviewResult
                  ? html`
                      <div style="display: flex; align-items: center; justify-content: space-between; margin: 12px 0 8px;">
                        <span style="font-size: 12px; font-weight: 700; color: #1e293b;">
                          ${this.reviewResult.summary}
                        </span>
                        ${this.reviewResult.rawText
                          ? html`
                              <button
                                type="button"
                                class="btn-header"
                                @click=${() => this.copyReportMarkdown(this.reviewResult!.rawText)}
                                title="Copy full review as Markdown"
                              >
                                Copy Report
                              </button>
                            `
                          : html``}
                      </div>

                      ${this.reviewResult.findings.length === 0
                        ? html`
                            <div class="clean-banner">
                              <div style="font-size: 24px; margin-bottom: 4px;">🛡️</div>
                              <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">Clean Bill of Health</div>
                              <div style="font-size: 11px; opacity: 0.9; max-width: 320px; margin: 0 auto; line-height: 1.4;">
                                ${this.reviewResult.summary}
                              </div>
                            </div>
                          `
                        : this.reviewResult.findings.map(
                            (finding) => html`
                              <div class="finding-card ${finding.severity}">
                                <div class="finding-top">
                                  <div style="display: inline-flex; align-items: center; gap: 5px;">
                                    <span class="${finding.severity === 'critical' ? 'badge-crit' : finding.severity === 'high' ? 'badge-high' : 'badge-med'}">
                                      ${finding.severity.toUpperCase()}
                                    </span>
                                    <span class="badge-cat">${finding.category.toUpperCase()}</span>
                                  </div>

                                  ${finding.lineNumber
                                    ? html`
                                        <span
                                          class="line-pill"
                                          @click=${() => this.scrollToLine(finding.filePath, finding.lineNumber!)}
                                          title="Jump to line in diff"
                                        >
                                          L${finding.lineLabel || finding.lineNumber}
                                        </span>
                                      `
                                    : html``}
                                </div>

                                <div style="font-size: 11px; font-family: ui-monospace, SFMono-Regular, monospace; color: #0284c7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                  📄 ${finding.filePath}
                                </div>

                                <div class="finding-title">${finding.title}</div>
                                <div class="finding-desc">${finding.description}</div>

                                ${finding.suggestedFix
                                  ? html`
                                      <div class="finding-fix-container">
                                        <div class="finding-fix-header">
                                          <div class="finding-fix-title">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                              <polyline points="16 18 22 12 16 6"></polyline>
                                              <polyline points="8 6 2 12 8 18"></polyline>
                                            </svg>
                                            <span>Suggested Fix</span>
                                          </div>
                                          <button
                                            type="button"
                                            class="btn-copy-fix"
                                            @click=${() => this.copyFixSnippet(finding.id, finding.suggestedFix!)}
                                            title="Copy fix snippet"
                                          >
                                            ${this.copiedSnippetFindingId === finding.id
                                              ? html`<span>✓ Copied</span>`
                                              : html`
                                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                  </svg>
                                                  <span>Copy</span>
                                                `}
                                          </button>
                                        </div>
                                        <pre class="finding-fix-pre"><code>${finding.suggestedFix}</code></pre>
                                      </div>
                                    `
                                  : html``}

                                <div class="finding-actions">
                                  <button
                                    type="button"
                                    class="btn-post-comment ${this.postedFindingIds.has(finding.id) ? 'posted' : ''}"
                                    ?disabled=${this.postingFindingId === finding.id || this.postedFindingIds.has(finding.id)}
                                    @click=${() => this.handlePostFindingComment(finding)}
                                    title="Post finding directly as native Git comment"
                                  >
                                    ${this.postingFindingId === finding.id
                                      ? html`
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                                            <path d="M12 2a10 10 0 0 1 10 10"></path>
                                          </svg>
                                          <span>Posting...</span>
                                        `
                                      : this.postedFindingIds.has(finding.id)
                                      ? html`✓ Commented on Git`
                                      : html`
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                          </svg>
                                          <span>💬 Post as PR Comment</span>
                                        `}
                                  </button>

                                  <button
                                    type="button"
                                    class="btn-pin ${this.pinnedFindingIds.has(finding.id) ? 'pinned' : ''}"
                                    ?disabled=${this.pinnedFindingIds.has(finding.id)}
                                    @click=${() => this.handlePinFinding(finding)}
                                  >
                                    ${this.pinnedFindingIds.has(finding.id) ? '✓ Pinned to Diff' : '📌 Pin as Note'}
                                  </button>

                                  ${finding.lineNumber
                                    ? html`
                                        <button
                                          type="button"
                                          class="btn-action"
                                          @click=${() => this.scrollToLine(finding.filePath, finding.lineNumber!)}
                                        >
                                          Jump to Line
                                        </button>
                                      `
                                    : html``}
                                </div>
                              </div>
                            `
                          )}
                    `
                  : html`
                      <div class="empty-state" style="padding: 32px 16px;">
                        <div style="font-size: 28px; margin-bottom: 8px;">⚡</div>
                        <div style="font-weight: 700; font-size: 13px; color: #334155; margin-bottom: 4px;">
                          On-Demand Critical AI Review
                        </div>
                        <div style="font-size: 11px; color: #64748b; max-width: 280px; margin: 0 auto; line-height: 1.4;">
                          Click the button above when you are ready for a critical staff-level review. Zero auto-triggering. Minor formatting and linter styles are ignored.
                        </div>
                      </div>
                    `}
              </div>
            `}
      </div>

      ${this.copyToastMessage ? html`<div class="toast">${this.copyToastMessage}</div>` : html``}
    `;
  }
}
