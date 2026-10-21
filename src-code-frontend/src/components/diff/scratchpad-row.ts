import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { renderSanitizedMarkdown } from '../../services/markdown.service';
import { globalStorageService } from '../../services/storage.service';
import { LineNote, $activeNotes } from '../../stores/notes.store';
import { extractFilePath } from '../../services/file-path-resolver';

@customElement('anchor-scratchpad')
export class AnchorScratchpad extends AnchorBaseElement {
  @property({ type: String }) noteId = '';
  @property({ type: String }) platform: 'github' | 'gitlab' = 'github';
  @property({ type: String }) projectPath = '';
  @property({ type: String }) pullNumber = '';
  @property({ type: String }) filePath = '';
  @property({ type: Number }) lineNumber = 0;
  @property({ type: String }) initialContent = '';
  @property({ type: Boolean }) isCollapsed = false;

  @state() private content = '';
  @state() private activeTab: 'write' | 'preview' | 'split' = 'write';
  @state() private saveStatus: 'idle' | 'saving' | 'saved' = 'idle';
  @state() private isPromoting = false;
  @state() private isPromoted = false;
  private savedTimeout?: ReturnType<typeof setTimeout>;

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        display: block;
        margin: 6px 12px;
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        overflow: hidden;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 12px;
        background-color: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-size: 12px;
        gap: 8px;
      }
      .title-group {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .pin-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #0369a1;
        background-color: #e0f2fe;
        padding: 2px 7px;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }
      .file-name {
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 11px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 220px;
      }
      .save-status {
        font-size: 11px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }
      .save-status.saved {
        color: #16a34a;
        font-weight: 500;
      }
      .save-status.saving {
        color: #d97706;
      }
      .controls {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .tab-group {
        display: inline-flex;
        background-color: #e2e8f0;
        padding: 2px;
        border-radius: 6px;
        gap: 2px;
      }
      .tab-btn {
        background: transparent;
        border: none;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        color: #64748b;
        transition: all 0.15s ease;
      }
      .tab-btn:hover {
        color: #0f172a;
      }
      .tab-btn.active {
        background-color: #ffffff;
        color: #0f172a;
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      .action-btn {
        background: transparent;
        border: 1px solid #e2e8f0;
        border-radius: 5px;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        color: #475569;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      }
      .action-btn:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }
      .action-btn.promote {
        color: #0369a1;
        background-color: #f0f9ff;
        border-color: #bae6fd;
      }
      .action-btn.promote:hover {
        background-color: #e0f2fe;
      }
      .action-btn.promoted {
        color: #15803d;
        background-color: #f0fdf4;
        border-color: #bbf7d0;
        cursor: default;
      }
      .action-btn.delete {
        color: #94a3b8;
      }
      .action-btn.delete:hover {
        color: #dc2626;
        border-color: #fecaca;
        background-color: #fef2f2;
      }
      .body-container {
        padding: 8px 12px 10px;
      }
      .editor-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .editor-grid.single {
        grid-template-columns: 1fr;
      }
      textarea {
        width: 100%;
        min-height: 80px;
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 12px;
        line-height: 1.5;
        resize: vertical;
        box-sizing: border-box;
        background-color: #ffffff;
        color: #0f172a;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      textarea:focus {
        outline: none;
        border-color: #0284c7;
        box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.12);
      }
      .preview-box {
        min-height: 80px;
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background-color: #f8fafc;
        font-size: 12px;
        line-height: 1.5;
        color: #334155;
        overflow-y: auto;
        box-sizing: border-box;
        max-height: 220px;
      }
      .preview-box pre {
        background-color: #edf2f7;
        padding: 6px 8px;
        border-radius: 4px;
        overflow-x: auto;
      }
      .preview-box code {
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 11px;
      }
      .preview-empty {
        color: #94a3b8;
        font-style: italic;
      }
      .collapsed-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 12px;
        background-color: #ffffff;
        font-size: 11px;
        color: #475569;
        cursor: pointer;
      }
      .collapsed-bar:hover {
        background-color: #f8fafc;
      }
    `
  ];

  override connectedCallback() {
    super.connectedCallback();
    if (!this.filePath || this.filePath === 'unknown_file') {
      const resolved = extractFilePath(this);
      if (resolved && resolved !== 'unknown_file') {
        this.filePath = resolved;
      }
    }
    if (!this.content && this.initialContent) {
      this.content = this.initialContent;
    } else if (!this.content && this.noteId) {
      const stored = $activeNotes.get()[this.noteId];
      if (stored) {
        this.content = stored.content;
        this.isCollapsed = stored.isCollapsed;
        this.isPromoted = Boolean(stored.promoted);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('anchor-note-promoted', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.noteId === this.noteId) {
          this.isPromoting = false;
          this.isPromoted = true;
        }
      });
      window.addEventListener('anchor-note-promote-failed', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.noteId === this.noteId) {
          this.isPromoting = false;
          alert('Could not submit comment to Git. The drafted note has been saved and copied to your clipboard.');
        }
      });
    }
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.content = target.value;
    this.saveStatus = 'saving';

    const notePayload: LineNote = {
      id: this.noteId,
      platform: this.platform,
      projectPath: this.projectPath,
      pullNumber: this.pullNumber,
      filePath: this.filePath,
      lineNumber: this.lineNumber,
      content: this.content,
      isCollapsed: this.isCollapsed,
      promoted: this.isPromoted,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    globalStorageService.saveNoteDebounced(notePayload, 300).then(() => {
      this.saveStatus = 'saved';
      if (this.savedTimeout) clearTimeout(this.savedTimeout);
      this.savedTimeout = setTimeout(() => {
        this.saveStatus = 'idle';
      }, 1500);
    });
  }

  private setTab(tab: 'write' | 'preview' | 'split', e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.activeTab = tab;
  }

  private toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    const note = $activeNotes.get()[this.noteId];
    if (note) {
      globalStorageService.saveNoteImmediate({
        ...note,
        isCollapsed: this.isCollapsed,
        updatedAt: Date.now(),
      });
    }
  }

  private handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this private note?')) {
      globalStorageService.deleteNote(this.noteId);
      this.dispatchEvent(
        new CustomEvent('anchor-delete-note', {
          bubbles: true,
          composed: true,
          detail: { noteId: this.noteId },
        })
      );
    }
  }

  private handlePromote(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.content.trim()) return;

    this.isPromoting = true;

    const scratchpadRow = this.closest('tr.anchor-scratchpad-row');
    const targetRow = (scratchpadRow?.previousElementSibling as HTMLTableRowElement | null) || null;

    const detail = {
      noteId: this.noteId,
      content: this.content,
      filePath: this.filePath,
      lineNumber: this.lineNumber,
      targetRow,
    };

    window.dispatchEvent(new CustomEvent('anchor-promote-note', { detail }));
    this.dispatchEvent(new CustomEvent('anchor-promote-note', { bubbles: true, composed: true, detail }));

    // Safety timeout in case no native modal responds
    setTimeout(() => {
      if (this.isPromoting) {
        this.isPromoting = false;
      }
    }, 4500);
  }

  override render() {
    if (this.isCollapsed) {
      return html`
        <div class="collapsed-bar" @click=${this.toggleCollapse}>
          <div class="flex items-center gap-2">
            <span class="pin-badge">L${this.lineNumber}</span>
            <span>${this.content.split('\n')[0].substring(0, 48) || 'Private line note'}...</span>
          </div>
          <button type="button" class="action-btn" title="Expand note">Expand</button>
        </div>
      `;
    }

    const renderedHtml = renderSanitizedMarkdown(this.content);

    return html`
      <div class="header">
        <div class="title-group">
          <span class="pin-badge">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.13 3.13c.015.44-.087 1.05-.543 1.506a.5.5 0 0 1-.707 0L5.353 8.283 1.939 11.7a.5.5 0 0 1-.707 0l-.708-.707a.5.5 0 0 1 0-.708L3.938 6.87 1.408 4.34a.5.5 0 0 1 0-.707c.456-.456 1.066-.558 1.506-.543l3.13-3.13C6.023.085 6.005.027 6.005 0c0-.43.108-1.024.588-1.504a.5.5 0 0 1 .707 0l2.528 2.226z"/>
            </svg>
            L${this.lineNumber}
          </span>
          <span class="file-name" title="${this.filePath}">
            ${this.filePath.split('/').pop()}
          </span>
          <div class="save-status ${this.saveStatus}">
            ${this.saveStatus === 'saving'
              ? html`<span>Saving...</span>`
              : this.saveStatus === 'saved'
              ? html`<span>✓ Saved</span>`
              : html``}
          </div>
        </div>

        <div class="controls">
          <div class="tab-group">
            <button
              type="button"
              class="tab-btn ${this.activeTab === 'write' ? 'active' : ''}"
              @click=${(e: MouseEvent) => this.setTab('write', e)}
            >Write</button>
            <button
              type="button"
              class="tab-btn ${this.activeTab === 'preview' ? 'active' : ''}"
              @click=${(e: MouseEvent) => this.setTab('preview', e)}
            >Preview</button>
            <button
              type="button"
              class="tab-btn ${this.activeTab === 'split' ? 'active' : ''}"
              @click=${(e: MouseEvent) => this.setTab('split', e)}
            >Split</button>
          </div>

          ${this.isPromoted
            ? html`
                <button type="button" class="action-btn promoted" title="Note transferred to native review comment">
                  ✓ Commented
                </button>
              `
            : html`
                <button
                  type="button"
                  class="action-btn promote"
                  ?disabled=${this.isPromoting}
                  @click=${this.handlePromote}
                  title="Transfer note into GitLab/GitHub native review comment"
                >
                  ${this.isPromoting ? 'Promoting...' : '💬 Promote'}
                </button>
              `}

          <button type="button" class="action-btn delete" @click=${this.handleDelete} title="Delete note">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a1.75 1.75 0 0 0 1.744 1.475h4.2a1.75 1.75 0 0 0 1.744-1.475l.66-6.6a.75.75 0 0 0-1.492-.15l-.66 6.6a.25.25 0 0 1-.249.21h-4.2a.25.25 0 0 1-.249-.21l-.66-6.6a.75.75 0 0 0-1.498.15Z"></path>
            </svg>
          </button>
          <button type="button" class="action-btn" @click=${this.toggleCollapse} title="Collapse note">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 6.47a.75.75 0 0 1 1.06 0L8 9.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-3.75 3.75a.75.75 0 0 1-1.06 0L3.72 7.53a.75.75 0 0 1 0-1.06Z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="body-container">
        <div class="editor-grid ${this.activeTab !== 'split' ? 'single' : ''}">
          ${this.activeTab === 'write' || this.activeTab === 'split'
            ? html`
                <textarea
                  placeholder="Private review note (Markdown supported)..."
                  .value=${this.content}
                  @input=${this.handleInput}
                ></textarea>
              `
            : html``}

          ${this.activeTab === 'preview' || this.activeTab === 'split'
            ? html`
                <div class="preview-box">
                  ${renderedHtml
                    ? unsafeHTML(renderedHtml)
                    : html`<span class="preview-empty">Markdown preview will appear here...</span>`}
                </div>
              `
            : html``}
        </div>
      </div>
    `;
  }
}
