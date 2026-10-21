import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { SymbolReferenceResult, SymbolReferenceMatch } from '../../adapters/base.adapter';

@customElement('anchor-peek-card')
export class AnchorPeekCard extends AnchorBaseElement {
  @property({ type: String }) symbol = '';
  @property({ type: String }) enclosingClass = '';
  @property({ type: Number }) x = 0;
  @property({ type: Number }) y = 0;
  @property({ type: Boolean }) visible = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) errorMessage = '';
  @property({ type: Object }) results: SymbolReferenceResult | null = null;

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        position: fixed;
        z-index: 2147483647;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .peek-card {
        position: fixed;
        width: 480px;
        max-width: 90vw;
        max-height: 380px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: peekFadeIn 0.15s ease-out;
      }
      @keyframes peekFadeIn {
        from { opacity: 0; transform: translateY(4px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .peek-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background-color: #0f172a;
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        border-bottom: 1px solid #334155;
      }
      .peek-title {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .peek-symbol {
        font-family: ui-monospace, SFMono-Regular, monospace;
        color: #38bdf8;
      }
      .peek-close {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 14px;
        padding: 2px 4px;
        line-height: 1;
        border-radius: 4px;
      }
      .peek-close:hover {
        color: #ffffff;
        background-color: #334155;
      }
      .peek-body {
        padding: 8px;
        overflow-y: auto;
        flex: 1;
        font-size: 12px;
        background-color: #f8fafc;
      }
      .match-item {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 6px;
        padding: 8px;
        transition: border-color 0.15s ease;
      }
      .match-item:hover {
        border-color: #0284c7;
      }
      .match-file {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 11px;
        color: #0369a1;
        margin-bottom: 4px;
      }
      .match-snippet {
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 11px;
        background-color: #f1f5f9;
        padding: 4px 6px;
        border-radius: 4px;
        color: #0f172a;
        white-space: pre-wrap;
        word-break: break-all;
      }
      .loading-state, .empty-state {
        padding: 24px;
        text-align: center;
        color: #64748b;
        font-size: 12px;
      }
      .open-drawer-btn {
        font-size: 11px;
        color: #0284c7;
        background: none;
        border: none;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
      }
    `
  ];

  public close() {
    this.visible = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.visible) {
          this.close();
        }
      });
    }
  }

  override render() {
    if (!this.visible) return html``;

    const matches = this.results?.matches || [];

    return html`
      <div class="peek-card" style="left: ${this.x}px; top: ${this.y}px;">
        <div class="peek-header">
          <div class="peek-title">
            <span>👁 In-Diff Peek:</span>
            <span class="peek-symbol">${this.symbol}</span>
            ${this.results
              ? html`<span style="opacity: 0.7; font-size: 11px;">(${matches.length} references)</span>`
              : html``}
          </div>
          <button type="button" class="peek-close" @click=${this.close} title="Close (Esc)">✕</button>
        </div>

        <div class="peek-body">
          ${this.loading
            ? html`<div class="loading-state">🔍 Searching codebase references...</div>`
            : this.errorMessage
            ? html`<div class="empty-state" style="color: #dc2626;">${this.errorMessage}</div>`
            : matches.length === 0
            ? html`
                <div class="empty-state">
                  No other usages found in repository base branch.
                </div>
              `
            : html`
                ${matches.map(
                  (m) => html`
                    <div class="match-item">
                      <div class="match-file">
                        <span>${m.filePath}:${m.lineNumber}</span>
                        ${m.matchUrl
                          ? html`
                              <a href="${m.matchUrl}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: none;">
                                Open ↗
                              </a>
                            `
                          : html``}
                      </div>
                      <div class="match-snippet">${m.codeSnippet}</div>
                    </div>
                  `
                )}
              `}
        </div>
      </div>
    `;
  }
}
