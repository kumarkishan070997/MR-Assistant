import { html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';
import '../diff/symbol-trigger';
import { AnchorSymbolTrigger } from '../diff/symbol-trigger';
import '../drawers/results-drawer';
import { AnchorResultsDrawer } from '../drawers/results-drawer';
import '../drawers/checklist-dock';
import '../drawers/checklist-drawer';
import { AnchorChecklistDrawer } from '../drawers/checklist-drawer';
import { IPlatformAdapter, ReviewContext, DiffLineContext } from '../../adapters/base.adapter';
import { globalSearchCache, SearchCacheService } from '../../services/search-cache.service';
import { globalStorageService } from '../../services/storage.service';
import { $settings, loadSettings } from '../../stores/settings.store';
import { $activeNotes } from '../../stores/notes.store';
import { extractFilePath } from '../../services/file-path-resolver';
import { DiffTableInjector } from '../../services/diff-table-injector';
import { AnchorScratchpad } from '../diff/scratchpad-row';
import { AIAction } from '../../services/ai/ai.service';

@customElement('anchor-overlay-root')
export class AnchorOverlayRoot extends AnchorBaseElement {
  @query('anchor-symbol-trigger') triggerEl!: AnchorSymbolTrigger;
  @query('anchor-results-drawer') drawerEl!: AnchorResultsDrawer;
  @query('anchor-checklist-drawer') checklistDrawerEl!: AnchorChecklistDrawer;

  private adapter: IPlatformAdapter | null = null;
  private context: ReviewContext | null = null;

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        display: contents;
        pointer-events: none;
      }
    `
  ];

  public setAdapterAndContext(adapter: IPlatformAdapter, context: ReviewContext) {
    this.adapter = adapter;
    this.context = context;
    if (this.checklistDrawerEl) {
      this.checklistDrawerEl.adapter = adapter;
      this.checklistDrawerEl.context = context;
    }
  }

  public showTrigger(
    param: string | { symbol?: string; selectedText?: string; x: number; y: number; lineNumber?: number; filePath?: string; targetRow?: HTMLTableRowElement | null },
    legacyX?: number,
    legacyY?: number
  ) {
    const trigger = this.triggerEl || (this.shadowRoot?.querySelector('anchor-symbol-trigger') as AnchorSymbolTrigger | null);
    if (!trigger) {
      return;
    }
    if (typeof param === 'string') {
      trigger.symbol = param;
      trigger.selectedText = '';
      trigger.x = legacyX || 0;
      trigger.y = legacyY || 0;
      trigger.lineNumber = 0;
      trigger.filePath = '';
      trigger.targetRow = null;
    } else {
      trigger.symbol = param.symbol || '';
      trigger.selectedText = param.selectedText || '';
      trigger.x = param.x;
      trigger.y = param.y;
      trigger.lineNumber = param.lineNumber || 0;
      trigger.filePath = param.filePath || '';
      trigger.targetRow = param.targetRow || null;
    }
    trigger.visible = true;
    if (typeof trigger.requestUpdate === 'function') {
      trigger.requestUpdate();
    }
  }

  public hideTrigger() {
    const trigger = this.triggerEl || (this.shadowRoot?.querySelector('anchor-symbol-trigger') as AnchorSymbolTrigger | null);
    if (trigger) {
      trigger.visible = false;
      if (typeof trigger.requestUpdate === 'function') {
        trigger.requestUpdate();
      }
    }
  }

  public async performLookup(symbol: string, enclosingClass?: string) {
    if (!this.drawerEl || !this.adapter || !this.context) return;

    this.hideTrigger();
    this.drawerEl.open(symbol, this.context.projectPath, this.context.baseRef);
    this.drawerEl.loading = true;
    this.drawerEl.errorMessage = '';
    this.drawerEl.results = null;

    const cacheKey = SearchCacheService.buildKey(
      this.context.platform,
      this.context.projectPath,
      this.context.baseRef,
      symbol,
      enclosingClass
    );

    // Check in-memory cache first
    const cached = globalSearchCache.get(cacheKey);
    if (cached) {
      this.drawerEl.results = cached;
      if (cached.errorMessage) {
        this.drawerEl.errorMessage = cached.errorMessage;
      }
      this.drawerEl.loading = false;
      return;
    }

    // Refresh settings before lookup
    await loadSettings();
    const settings = $settings.get();
    const token =
      this.context.platform === 'github' ? settings.github.pat : settings.gitlab.pat;

    try {
      const results = await this.adapter.searchSymbolReferences(this.context, symbol, token, enclosingClass);
      if (!results.rateLimited) {
        globalSearchCache.set(cacheKey, results);
      }
      this.drawerEl.results = results;
      if (results.errorMessage) {
        this.drawerEl.errorMessage = results.errorMessage;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error querying symbol references';
      this.drawerEl.errorMessage = message;
    } finally {
      this.drawerEl.loading = false;
    }
  }

  override firstUpdated() {
    this.addEventListener('anchor-symbol-lookup', ((e: CustomEvent<{ symbol: string; enclosingClass?: string }>) => {
      this.performLookup(e.detail.symbol, e.detail.enclosingClass);
    }) as EventListener);

    this.addEventListener('anchor-toggle-checklist', () => {
      this.checklistDrawerEl?.toggle();
    });

    const handlePromoteEvent = async (e: Event) => {
      if (!this.adapter || !this.context) return;
      const { noteId, content, filePath, lineNumber, targetRow: providedTargetRow } = (e as CustomEvent).detail;

      await loadSettings();
      const settings = $settings.get();
      const token =
        this.context.platform === 'github' ? settings.github.pat : settings.gitlab.pat;

      const isGitHub = this.context.platform === 'github';
      let targetRow: HTMLTableRowElement | null = providedTargetRow || null;

      // Scope search to matching file container first
      if (!targetRow && filePath && filePath !== 'unknown_file') {
        const fileContainers = Array.from(
          document.querySelectorAll<HTMLElement>(
            isGitHub
              ? '.file, [data-file-type]'
              : 'diff-file, .diff-file, [data-blob-path], .file-holder'
          )
        );

        for (const container of fileContainers) {
          const detected = extractFilePath(container);
          if (detected === filePath || container.getAttribute('data-blob-path') === filePath) {
            const cell = container.querySelector(
              isGitHub
                ? `td.blob-num[data-line-number="${lineNumber}"]`
                : `[data-linenumber="${lineNumber}"], [data-line-number="${lineNumber}"]`
            );
            if (cell) {
              targetRow = (cell.closest('tr, .line_holder, .diff-tr') || cell.parentElement?.closest('tr')) as HTMLTableRowElement | null;
              break;
            }
          }
        }
      }

      // Fallback search
      if (!targetRow) {
        if (isGitHub) {
          const cell = document.querySelector(`td.blob-num[data-line-number="${lineNumber}"]`);
          targetRow = cell?.closest('tr') as HTMLTableRowElement | null;
        } else {
          const cell = document.querySelector(`[data-linenumber="${lineNumber}"], [data-line-number="${lineNumber}"]`);
          targetRow = (cell?.closest('tr, .line_holder, .diff-tr') || cell?.parentElement?.closest('tr')) as HTMLTableRowElement | null;
        }
      }

      const lineCtx: DiffLineContext = {
        element: targetRow || (document.createElement('tr') as HTMLTableRowElement),
        filePath,
        lineNumber,
        diffSide: 'right',
        codeContent: '',
      };

      const success = await this.adapter.triggerNativeComment(lineCtx, content, token, this.context);
      if (success) {
        const note = $activeNotes.get()[noteId];
        if (note) {
          await globalStorageService.saveNoteImmediate({
            ...note,
            promoted: true,
            updatedAt: Date.now(),
          });
        }
        window.dispatchEvent(new CustomEvent('anchor-note-promoted', { detail: { noteId } }));
      } else {
        window.dispatchEvent(new CustomEvent('anchor-note-promote-failed', { detail: { noteId } }));
      }
    };

    window.addEventListener('anchor-promote-note', handlePromoteEvent as EventListener);
    this.addEventListener('anchor-promote-note', handlePromoteEvent as EventListener);

    this.addEventListener('anchor-trigger-suggestion', ((e: CustomEvent) => {
      const { selectedText, lineNumber, filePath, targetRow: providedRow } = e.detail;
      const row = providedRow || this.findRowForLine(filePath, lineNumber);
      if (!row || !this.context) return;
      this.hideTrigger();

      const scratchpadRow = DiffTableInjector.injectScratchpadRow(
        row,
        this.context,
        filePath,
        lineNumber
      );
      scratchpadRow.style.display = 'table-row';
      const scratchpad = scratchpadRow.querySelector('anchor-scratchpad') as AnchorScratchpad | null;
      if (scratchpad) {
        scratchpad.insertSuggestion(selectedText);
      }
    }) as EventListener);

    this.addEventListener('anchor-trigger-note', ((e: CustomEvent) => {
      const { selectedText, lineNumber, filePath, targetRow: providedRow } = e.detail;
      const row = providedRow || this.findRowForLine(filePath, lineNumber);
      if (!row || !this.context) return;
      this.hideTrigger();

      const scratchpadRow = DiffTableInjector.injectScratchpadRow(
        row,
        this.context,
        filePath,
        lineNumber
      );
      scratchpadRow.style.display = 'table-row';
      const scratchpad = scratchpadRow.querySelector('anchor-scratchpad') as AnchorScratchpad | null;
      if (scratchpad && selectedText) {
        scratchpad.appendQuote(selectedText);
      }
    }) as EventListener);

    this.addEventListener('anchor-trigger-ai', (async (e: CustomEvent) => {
      const { action, selectedText, lineNumber, filePath, targetRow: providedRow } = e.detail;
      const row = providedRow || this.findRowForLine(filePath, lineNumber);
      if (!row || !this.context) return;
      this.hideTrigger();

      const scratchpadRow = DiffTableInjector.injectScratchpadRow(
        row,
        this.context,
        filePath,
        lineNumber
      );
      scratchpadRow.style.display = 'table-row';
      const scratchpad = scratchpadRow.querySelector('anchor-scratchpad') as AnchorScratchpad | null;
      if (scratchpad) {
        await scratchpad.executeAiAction(action, selectedText);
      }
    }) as unknown as EventListener);
  }

  public findRowForLine(filePath: string, lineNumber: number): HTMLTableRowElement | null {
    if (!lineNumber) return null;
    const isGitHub = this.context?.platform === 'github';

    if (filePath && filePath !== 'unknown_file') {
      const fileContainers = Array.from(
        document.querySelectorAll<HTMLElement>(
          isGitHub
            ? '.file, [data-file-type]'
            : 'diff-file, .diff-file, [data-blob-path], .file-holder'
        )
      );

      for (const container of fileContainers) {
        const detected = extractFilePath(container);
        if (detected === filePath || container.getAttribute('data-blob-path') === filePath) {
          const cell = container.querySelector(
            isGitHub
              ? `td.blob-num[data-line-number="${lineNumber}"]`
              : `[data-linenumber="${lineNumber}"], [data-line-number="${lineNumber}"]`
          );
          if (cell) {
            return (cell.closest('tr, .line_holder, .diff-tr') || cell.parentElement?.closest('tr')) as HTMLTableRowElement | null;
          }
        }
      }
    }

    if (isGitHub) {
      const cell = document.querySelector(`td.blob-num[data-line-number="${lineNumber}"]`);
      return cell?.closest('tr') as HTMLTableRowElement | null;
    } else {
      const cell = document.querySelector(`[data-linenumber="${lineNumber}"], [data-line-number="${lineNumber}"]`);
      return (cell?.closest('tr, .line_holder, .diff-tr') || cell?.parentElement?.closest('tr')) as HTMLTableRowElement | null;
    }
  }

  override render() {
    return html`
      <anchor-symbol-trigger></anchor-symbol-trigger>
      <anchor-results-drawer></anchor-results-drawer>
      <anchor-checklist-dock></anchor-checklist-dock>
      <anchor-checklist-drawer
        .adapter=${this.adapter}
        .context=${this.context}
      ></anchor-checklist-drawer>
    `;
  }
}
