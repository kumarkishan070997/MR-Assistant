import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { SymbolReferenceResult, SymbolReferenceMatch } from '../../adapters/base.adapter';

@customElement('anchor-results-drawer')
export class AnchorResultsDrawer extends AnchorBaseElement {
  @property({ type: Boolean }) isOpen = false;
  @property({ type: String }) symbol = '';
  @property({ type: String }) baseRef = 'main';
  @property({ type: String }) projectPath = '';
  @property({ type: Boolean }) loading = false;
  @property({ type: Object }) results: SymbolReferenceResult | null = null;
  @property({ type: String }) errorMessage = '';

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 99998;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.35);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
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
        width: 440px;
        max-width: 90vw;
        background-color: #ffffff;
        color: #1f2328;
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
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
        padding: 14px 16px;
        border-bottom: 1px solid #d0d7de;
        background-color: #f6f8fa;
      }
      .title {
        font-size: 14px;
        font-weight: 600;
        color: #1f2328;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .subtitle {
        font-size: 11px;
        color: #656d76;
        font-family: ui-monospace, SFMono-Regular, monospace;
        margin-top: 2px;
      }
      .close-btn {
        background: transparent;
        border: none;
        color: #656d76;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .close-btn:hover {
        background-color: #e5e8ec;
        color: #1f2328;
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      .file-group {
        margin-bottom: 16px;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        overflow: hidden;
      }
      .file-header {
        padding: 6px 12px;
        background-color: #f6f8fa;
        font-size: 12px;
        font-weight: 600;
        font-family: ui-monospace, SFMono-Regular, monospace;
        color: #0969da;
        border-bottom: 1px solid #d0d7de;
        word-break: break-all;
      }
      .match-row {
        padding: 8px 12px;
        border-bottom: 1px solid #eef0f2;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .match-row:last-child {
        border-bottom: none;
      }
      .match-row:hover {
        background-color: #f3f6f9;
      }
      .line-snippet {
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 11px;
        background-color: #f8fafc;
        padding: 4px 6px;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
        color: #334155;
        white-space: pre-wrap;
        word-break: break-all;
        margin-top: 4px;
      }
      .highlight {
        background-color: #ffdf5d;
        color: #1f2328;
        font-weight: 600;
        border-radius: 2px;
        padding: 0 2px;
      }
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #656d76;
      }
      .error-banner {
        background-color: #ffebe9;
        color: #cf222e;
        border: 1px solid #ff8182;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 12px;
      }
      .shimmer {
        height: 48px;
        background: linear-gradient(90deg, #f0f3f6 25%, #e1e6eb 50%, #f0f3f6 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 6px;
        margin-bottom: 12px;
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `
  ];

  public open(symbol: string, projectPath: string, baseRef: string) {
    this.symbol = symbol;
    this.projectPath = projectPath;
    this.baseRef = baseRef;
    this.isOpen = true;
  }

  public close() {
    this.isOpen = false;
  }

  private handleMatchClick(match: SymbolReferenceMatch) {
    if (match.matchUrl) {
      window.open(match.matchUrl, '_blank');
    }
  }

  private renderHighlightedSnippet(snippet: string, term: string) {
    if (!term || !snippet) return html`${snippet}`;

    const parts = snippet.split(new RegExp(`(${term})`, 'gi'));
    return html`${parts.map((part) =>
      part.toLowerCase() === term.toLowerCase()
        ? html`<span class="highlight">${part}</span>`
        : html`${part}`
    )}`;
  }

  override render() {
    const matchesByFile = (this.results?.matches || []).reduce((acc, m) => {
      acc[m.filePath] = acc[m.filePath] || [];
      acc[m.filePath].push(m);
      return acc;
    }, {} as Record<string, SymbolReferenceMatch[]>);

    return html`
      <div class="backdrop ${this.isOpen ? 'open' : ''}" @click=${this.close}></div>
      <div class="panel ${this.isOpen ? 'open' : ''}">
        <div class="header">
          <div>
            <div class="title">
              <span>References for</span>
              <span class="highlight font-mono">${this.symbol}</span>
            </div>
            <div class="subtitle">Base: ${this.baseRef} (${this.projectPath})</div>
          </div>
          <button class="close-btn" @click=${this.close} title="Close drawer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
            </svg>
          </button>
        </div>

        <div class="content">
          ${this.errorMessage
            ? html`<div class="error-banner">${this.errorMessage}</div>`
            : html``}

          ${this.loading
            ? html`
                <div class="shimmer"></div>
                <div class="shimmer"></div>
                <div class="shimmer"></div>
              `
            : this.results?.rateLimited
            ? html`
                <div class="error-banner">
                  Search API rate limit reached. Please wait a moment or configure an authenticated Personal Access Token in extension settings.
                </div>
              `
            : Object.keys(matchesByFile).length === 0 && !this.loading
            ? html`
                <div class="empty-state">
                  <div class="text-sm font-semibold">No external references found</div>
                  <div class="text-xs mt-1">This symbol is not referenced elsewhere in branch <code>${this.baseRef}</code>.</div>
                </div>
              `
            : Object.entries(matchesByFile).map(
                ([file, matches]) => html`
                  <div class="file-group">
                    <div class="file-header">${file} (${matches.length})</div>
                    ${matches.map(
                      (m) => html`
                        <div class="match-row" @click=${() => this.handleMatchClick(m)}>
                          <div class="text-[11px] text-slate-500 font-mono">Line ${m.lineNumber}</div>
                          <div class="line-snippet">
                            ${this.renderHighlightedSnippet(m.codeSnippet, this.symbol)}
                          </div>
                        </div>
                      `
                    )}
                  </div>
                `
              )}
        </div>
      </div>
    `;
  }
}
