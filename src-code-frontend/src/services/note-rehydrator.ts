import { ReviewContext, IPlatformAdapter } from '../adapters/base.adapter';
import { $activeNotes, buildNoteKey, LineNote } from '../stores/notes.store';
import { DiffTableInjector } from './diff-table-injector';
import { detectDeclaration } from './declaration-scanner';
import { extractFilePath } from './file-path-resolver';
import { globalStorageService } from './storage.service';
import '../components/diff/blast-badge';
import { AnchorBlastBadge } from '../components/diff/blast-badge';

export class NoteRehydrator {
  private observer: MutationObserver | null = null;
  private isProcessing = false;
  private pendingElements: Set<Element> = new Set();
  private context: ReviewContext;
  private adapter: IPlatformAdapter;

  constructor(adapter: IPlatformAdapter, context: ReviewContext) {
    this.adapter = adapter;
    this.context = context;
  }

  private scanDebounceTimer?: number;

  private handleMouseOver = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target) return;

    const lineEl = target.closest(
      '.diff-line-num, td.diff-line-num, .line_numbers, td.line_numbers, [data-line-number], [data-linenumber], .old_line, .new_line, td.blob-num'
    ) as HTMLElement | null;

    if (!lineEl) return;

    const row = (lineEl.closest('tr, .line_holder, .diff-tr') || lineEl.parentElement?.closest('tr')) as HTMLTableRowElement | null;
    if (!row || row.classList.contains('anchor-scratchpad-row')) return;

    const lineNumCell = (lineEl.closest('td') || lineEl) as HTMLElement;
    if (lineNumCell.querySelector('.anchor-pin-btn')) return;

    const numAttr =
      lineEl.getAttribute('data-line-number') ||
      lineEl.getAttribute('data-linenumber') ||
      lineEl.querySelector('[data-line-number]')?.getAttribute('data-line-number') ||
      lineEl.querySelector('[data-linenumber]')?.getAttribute('data-linenumber') ||
      lineEl.textContent?.trim();

    const lineNumber = parseInt(numAttr || '0', 10);
    if (!lineNumber || isNaN(lineNumber) || lineNumber <= 0) return;

    const filePath = extractFilePath(row);

    DiffTableInjector.injectPinButton(lineNumCell, row, this.context, filePath, lineNumber);
  };

  private handleClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target) return;

    // Check if clicked directly on line number
    const lineEl = target.closest(
      '.diff-line-num, td.diff-line-num, .line_numbers, td.line_numbers, [data-line-number], [data-linenumber], .old_line, .new_line, td.blob-num'
    ) as HTMLElement | null;

    if (!lineEl) return;
    if (target.closest('.anchor-scratchpad-row, anchor-scratchpad, .anchor-pin-btn')) return;

    const row = (lineEl.closest('tr, .line_holder, .diff-tr') || lineEl.parentElement?.closest('tr')) as HTMLTableRowElement | null;
    if (!row || row.classList.contains('anchor-scratchpad-row')) return;

    const lineNumCell = (lineEl.closest('td') || lineEl) as HTMLElement;

    const numAttr =
      lineEl.getAttribute('data-line-number') ||
      lineEl.getAttribute('data-linenumber') ||
      lineEl.querySelector('[data-line-number]')?.getAttribute('data-line-number') ||
      lineEl.querySelector('[data-linenumber]')?.getAttribute('data-linenumber') ||
      lineEl.textContent?.trim();

    const lineNumber = parseInt(numAttr || '0', 10);
    if (!lineNumber || isNaN(lineNumber) || lineNumber <= 0) return;

    const filePath = extractFilePath(row);

    // Ensure pin button exists
    DiffTableInjector.injectPinButton(lineNumCell, row, this.context, filePath, lineNumber);

    // Toggle scratchpad row
    DiffTableInjector.injectScratchpadRow(row, this.context, filePath, lineNumber);
  };

  public start(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('mouseover', this.handleMouseOver, true);
    document.addEventListener('click', this.handleClick, true);

    this.observer = new MutationObserver((mutations) => {
      let hasAddedNodes = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          hasAddedNodes = true;
          break;
        }
      }

      if (hasAddedNodes) {
        this.scheduleScan();
      }
    });

    // Observe body or main container
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Run initial scan of diff table
    this.scanFullDocument();

    // Multi-pass scans to reliably catch asynchronously loaded diffs
    window.setTimeout(() => this.scanFullDocument(), 600);
    window.setTimeout(() => this.scanFullDocument(), 1500);
    window.setTimeout(() => this.scanFullDocument(), 3000);
  }

  public stop(): void {
    if (typeof window !== 'undefined') {
      document.removeEventListener('mouseover', this.handleMouseOver, true);
      document.removeEventListener('click', this.handleClick, true);
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.scanDebounceTimer) {
      window.clearTimeout(this.scanDebounceTimer);
      this.scanDebounceTimer = undefined;
    }
    this.pendingElements.clear();
    this.isProcessing = false;
  }

  private scheduleScan(): void {
    if (this.scanDebounceTimer) {
      window.clearTimeout(this.scanDebounceTimer);
    }
    this.scanDebounceTimer = window.setTimeout(async () => {
      await this.scanFullDocument();
    }, 120);
  }

  public async scanFullDocument(): Promise<void> {
    const isGitHub = this.context.platform === 'github';

    // 1. Locate all line number cells directly across GitHub and GitLab
    const lineCells = Array.from(document.querySelectorAll<HTMLElement>(
      isGitHub
        ? 'td.blob-num, [data-line-number]'
        : '.diff-line-num, td.diff-line-num, [data-line-number], [data-linenumber], .line_numbers, td.line_numbers, .new_line, .old_line'
    ));

    const rowsSet = new Set<HTMLTableRowElement>();
    for (const cell of lineCells) {
      const row = (cell.closest('tr, .line_holder, .diff-tr') || cell.parentElement?.closest('tr')) as HTMLTableRowElement | null;
      if (row && !row.classList.contains('anchor-scratchpad-row')) {
        rowsSet.add(row);
      }
    }

    // 2. Also query standard row selectors as fallback
    const tableRows = Array.from(document.querySelectorAll<HTMLTableRowElement>(
      isGitHub
        ? 'tr.js-diff-line, tr[data-line-number]'
        : 'tr.line_holder, tr.diff-tr, diff-file tr, .diff-file tr, table.code tr, table.diff-table tr, .diff-content tr, tr[data-line-number]'
    ));
    for (const row of tableRows) {
      if (!row.classList.contains('anchor-scratchpad-row')) {
        rowsSet.add(row);
      }
    }

    const rows = Array.from(rowsSet);
    if (rows.length > 0) {
      console.log(`[PeerPilot] Processing ${rows.length} diff rows (from ${lineCells.length} line cells) on ${this.context.platform}...`);
      await this.processRowsChunked(rows);
    }
  }

  private async processPendingChunks(): Promise<void> {
    await this.scanFullDocument();
  }

  private async processRowsChunked(rows: HTMLTableRowElement[], chunkSize = 40): Promise<void> {
    const activeNotesMap = $activeNotes.get();

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      for (const row of chunk) {
        this.processSingleRow(row, activeNotesMap);
      }

      // Cooperative scheduling to yield to UI thread on 2,000+ line diffs
      if (i + chunkSize < rows.length) {
        if ('scheduler' in window && typeof (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler?.yield === 'function') {
          await (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield();
        } else {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    }
  }

  private processSingleRow(
    row: HTMLTableRowElement,
    activeNotesMap: ReturnType<typeof $activeNotes.get>
  ): void {
    // Skip if row is already an anchor scratchpad row
    if (row.classList.contains('anchor-scratchpad-row')) return;

    const isGitHub = this.context.platform === 'github';

    let lineNumCell: HTMLElement | null = null;
    let lineNumber = 0;
    let filePath = '';

    if (isGitHub) {
      lineNumCell = row.querySelector('td.blob-num[data-line-number]');
      if (!lineNumCell) {
        lineNumCell = row.querySelector('td.blob-num');
      }
      if (lineNumCell) {
        lineNumber = parseInt(lineNumCell.getAttribute('data-line-number') || lineNumCell.textContent?.trim() || '0', 10);
      }
    } else {
      // GitLab: Check for data-linenumber inside row first (covers <a> and <td>)
      const lineLinks = Array.from(row.querySelectorAll<HTMLElement>('[data-linenumber], [data-line-number]'));
      if (lineLinks.length > 0) {
        // In unified view, the last number is the new line (modified/added/context line)
        const target = lineLinks[lineLinks.length - 1];
        const num = parseInt(
          target.getAttribute('data-linenumber') || target.getAttribute('data-line-number') || target.textContent?.trim() || '0',
          10
        );
        if (num > 0) {
          lineNumber = num;
          lineNumCell = target.closest('td') || target;
        }
      }

      // Fallback: check td.diff-line-num, td.new_line, td.old_line
      if (!lineNumCell || lineNumber <= 0) {
        const candidateCells = Array.from(row.querySelectorAll<HTMLElement>('td.diff-line-num, td.new_line, td.old_line, td.line_numbers'));
        for (const c of candidateCells) {
          const num = parseInt(c.getAttribute('data-linenumber') || c.getAttribute('data-line-number') || c.textContent?.trim() || '0', 10);
          if (num > 0) {
            lineNumCell = c;
            lineNumber = num;
            break;
          }
        }
      }
    }

    filePath = extractFilePath(row);

    if (!lineNumCell || isNaN(lineNumber) || lineNumber <= 0) return;

    // Inject hover pin button
    DiffTableInjector.injectPinButton(lineNumCell, row, this.context, filePath, lineNumber);

    // Check if this line has an active note in storage
    const noteId = buildNoteKey(
      this.context.platform,
      this.context.projectPath,
      this.context.pullNumber || this.context.reviewId,
      filePath,
      lineNumber
    );

    let note = activeNotesMap[noteId];
    if (!note && filePath !== 'unknown_file') {
      const legacyNoteId = buildNoteKey(
        this.context.platform,
        this.context.projectPath,
        this.context.pullNumber || this.context.reviewId,
        'unknown_file',
        lineNumber
      );
      const legacyNote = activeNotesMap[legacyNoteId];
      if (legacyNote) {
        note = {
          ...legacyNote,
          id: noteId,
          filePath: filePath,
          updatedAt: Date.now(),
        };
        globalStorageService.deleteNote(legacyNoteId);
        globalStorageService.saveNoteImmediate(note);
      }
    }
    if (note) {
      // Rehydrate scratchpad row if not already injected
      const nextRow = row.nextElementSibling;
      if (!nextRow || !nextRow.classList.contains('anchor-scratchpad-row')) {
        DiffTableInjector.injectScratchpadRow(
          row,
          this.context,
          filePath,
          lineNumber,
          note.content
        );
      }
    }

    // Check for declaration signatures in added/modified lines
    const codeCell = isGitHub
      ? row.querySelector('.blob-code-inner, .blob-code')
      : row.querySelector('.line_content, .diff-line, td.code, td:last-child');

    if (codeCell && !codeCell.querySelector('anchor-blast-badge')) {
      const codeText = codeCell.textContent || '';
      const decl = detectDeclaration(codeText, filePath);
      if (decl) {
        let enclosingClass = decl.enclosingClass;
        if (!enclosingClass) {
          const holder = row.closest('diff-file, .diff-file, .file-holder, .file');
          if (holder) {
            const classMatch = holder.textContent?.match(/(?:class|interface|trait)\s+([A-Z][a-zA-Z0-9_]+)/);
            if (classMatch) {
              enclosingClass = classMatch[1];
            }
          }
        }

        console.log(`[PeerPilot] Blast Badge: detected ${decl.kind} "${decl.symbol}" (class: ${enclosingClass || 'none'}) on line ${lineNumber}`);
        const badge = document.createElement('anchor-blast-badge') as AnchorBlastBadge;
        badge.symbol = decl.symbol;
        badge.enclosingClass = enclosingClass || '';
        badge.projectPath = this.context.projectPath;
        badge.baseRef = this.context.baseRef;
        badge.platform = this.context.platform;
        badge.setAdapter(this.adapter);
        codeCell.appendChild(badge);
      }
    }
  }
}
