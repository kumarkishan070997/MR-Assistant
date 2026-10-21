import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { StoreController } from '../base/store-controller';
import { $activeNotes, LineNote, buildNoteKey } from '../../stores/notes.store';
import { globalStorageService } from '../../services/storage.service';
import { renderSanitizedMarkdown } from '../../services/markdown.service';
import { IPlatformAdapter, ReviewContext, DiffLineContext } from '../../adapters/base.adapter';
import { DiffTableInjector } from '../../services/diff-table-injector';
import { extractFilePath } from '../../services/file-path-resolver';
import { $settings, loadSettings } from '../../stores/settings.store';

@customElement('anchor-checklist-drawer')
export class AnchorChecklistDrawer extends AnchorBaseElement {
  @property({ type: Boolean }) isOpen = false;
  @property({ type: Object }) context: ReviewContext | null = null;
  @property({ type: Object }) adapter: IPlatformAdapter | null = null;

  @state() private copyToastMessage = '';
  @state() private promotingNoteId: string | null = null;

  private notesStore = new StoreController(this, $activeNotes);
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

  private scrollToLine(filePath: string, lineNumber: number) {
    if (typeof document === 'undefined') return;

    const isGitHub = this.context?.platform === 'github';
    let targetRow: HTMLTableRowElement | null = null;

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
            targetRow = (cell.closest('tr, .line_holder, .diff-tr') || cell.parentElement?.closest('tr')) as HTMLTableRowElement | null;
            break;
          }
        }
      }
    }

    if (!targetRow) {
      if (isGitHub) {
        const cell = document.querySelector(`td.blob-num[data-line-number="${lineNumber}"]`);
        targetRow = cell?.closest('tr') as HTMLTableRowElement | null;
      } else {
        const cell = document.querySelector(`[data-linenumber="${lineNumber}"], [data-line-number="${lineNumber}"]`);
        targetRow = (cell?.closest('tr, .line_holder, .diff-tr') || cell?.parentElement?.closest('tr')) as HTMLTableRowElement | null;
      }
    }

    if (targetRow) {
      const fileCard = targetRow.closest('.file, .diff-file, .file-holder');
      if (fileCard?.classList.contains('open') === false) {
        fileCard.querySelector<HTMLElement>('.file-header, .file-title')?.click();
      }

      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const originalBg = targetRow.style.backgroundColor;
      targetRow.style.backgroundColor = 'rgba(2, 132, 199, 0.15)';
      setTimeout(() => {
        targetRow.style.backgroundColor = originalBg;
      }, 1200);

      const nextRow = targetRow.nextElementSibling;
      if (nextRow?.classList.contains('anchor-scratchpad-row')) {
        (nextRow as HTMLElement).style.display = 'table-row';
      }
    } else {
      this.showToast(`Line ${lineNumber} not currently rendered in DOM`);
    }
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

    const isGitHub = this.context.platform === 'github';
    let targetRow: HTMLTableRowElement | null = null;

    if (note.filePath && note.filePath !== 'unknown_file') {
      const fileContainers = Array.from(
        document.querySelectorAll<HTMLElement>(
          isGitHub
            ? '.file, [data-file-type]'
            : 'diff-file, .diff-file, [data-blob-path], .file-holder'
        )
      );

      for (const container of fileContainers) {
        const detected = extractFilePath(container);
        if (detected === note.filePath || container.getAttribute('data-blob-path') === note.filePath) {
          const cell = container.querySelector(
            isGitHub
              ? `td.blob-num[data-line-number="${note.lineNumber}"]`
              : `[data-linenumber="${note.lineNumber}"], [data-line-number="${note.lineNumber}"]`
          );
          if (cell) {
            targetRow = (cell.closest('tr, .line_holder, .diff-tr') || cell.parentElement?.closest('tr')) as HTMLTableRowElement | null;
            break;
          }
        }
      }
    }

    if (!targetRow) {
      if (isGitHub) {
        const cell = document.querySelector(`td.blob-num[data-line-number="${note.lineNumber}"]`);
        targetRow = cell?.closest('tr') as HTMLTableRowElement | null;
      } else {
        const cell = document.querySelector(`[data-linenumber="${note.lineNumber}"], [data-line-number="${note.lineNumber}"]`);
        targetRow = (cell?.closest('tr, .line_holder, .diff-tr') || cell?.parentElement?.closest('tr')) as HTMLTableRowElement | null;
      }
    }

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

  override render() {
    const notesMap = this.notesStore.value || {};
    const notesList = Object.values(notesMap);
    const grouped = this.groupNotesByFile(notesList);
    const fileCount = Object.keys(grouped).length;

    return html`
      <div class="backdrop ${this.isOpen ? 'open' : ''}" @click=${this.close}></div>
      <div class="panel ${this.isOpen ? 'open' : ''}">
        <div class="header">
          <div class="title">
            <span>Review Checklist</span>
            <span class="count-badge">${notesList.length}</span>
          </div>

          <div class="header-actions">
            ${notesList.length > 0
              ? html`
                  <button type="button" class="btn-header" @click=${() => this.exportAllMarkdown(notesList)} title="Copy review summary as Markdown">
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

        ${notesList.length > 0
          ? html`
              <div class="summary-bar">
                <span>${notesList.length} ${notesList.length === 1 ? 'note' : 'notes'} across ${fileCount} ${fileCount === 1 ? 'file' : 'files'}</span>
                <span>Private & local</span>
              </div>
            `
          : html``}

        <div class="content">
          ${notesList.length === 0
            ? html`
                <div class="empty-state">
                  <svg class="empty-icon" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.13 3.13c.015.44-.087 1.05-.543 1.506a.5.5 0 0 1-.707 0L5.353 8.283 1.939 11.7a.5.5 0 0 1-.707 0l-.708-.707a.5.5 0 0 1 0-.708L3.938 6.87 1.408 4.34a.5.5 0 0 1 0-.707c.456-.456 1.066-.558 1.506-.543l3.13-3.13C6.023.085 6.005.027 6.005 0c0-.43.108-1.024.588-1.504a.5.5 0 0 1 .707 0l2.528 2.226z"/>
                  </svg>
                  <div class="font-semibold text-sm text-slate-700">No private notes yet</div>
                  <div class="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                    Hover over any diff line number and click the 📌 pin icon to draft private inline review notes.
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
                            <span class="line-pill" @click=${() => this.scrollToLine(note.filePath, note.lineNumber)}>
                              L${note.lineNumber}
                              <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"></path>
                              </svg>
                            </span>

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
      </div>

      ${this.copyToastMessage ? html`<div class="toast">${this.copyToastMessage}</div>` : html``}
    `;
  }
}
