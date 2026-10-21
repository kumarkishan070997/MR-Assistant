import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { AIAction } from '../../services/ai/ai.service';

@customElement('anchor-symbol-trigger')
export class AnchorSymbolTrigger extends AnchorBaseElement {
  @property({ type: String }) symbol = '';
  @property({ type: String }) selectedText = '';
  @property({ type: Number }) lineNumber = 0;
  @property({ type: String }) filePath = '';
  @property({ type: Number }) x = 0;
  @property({ type: Number }) y = 0;
  @property({ type: Boolean }) visible = false;

  public targetRow: HTMLTableRowElement | null = null;
  @state() private showAiMenu = false;

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .floating-toolbar {
        display: inline-flex;
        align-items: center;
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 7px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
        padding: 3px 4px;
        gap: 3px;
        animation: anchorFadeIn 0.12s ease-out;
      }
      @keyframes anchorFadeIn {
        from {
          opacity: 0;
          transform: translateY(3px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .toolbar-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 500;
        padding: 3px 8px;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        background: transparent;
        color: #e2e8f0;
        transition: all 0.15s ease;
        white-space: nowrap;
        user-select: none;
      }
      .toolbar-btn:hover {
        background-color: #1e293b;
        color: #ffffff;
      }
      .toolbar-btn.find-btn {
        background-color: #0284c7;
        color: #ffffff;
        font-weight: 600;
      }
      .toolbar-btn.find-btn:hover {
        background-color: #0369a1;
      }
      .toolbar-btn.ai-btn {
        background-color: #7c3aed;
        color: #ffffff;
        font-weight: 600;
      }
      .toolbar-btn.ai-btn:hover {
        background-color: #6d28d9;
      }
      .toolbar-btn.suggestion-btn {
        background-color: #312e81;
        color: #c7d2fe;
      }
      .toolbar-btn.suggestion-btn:hover {
        background-color: #3730a3;
        color: #ffffff;
      }
      .toolbar-btn.note-btn {
        color: #cbd5e1;
      }
      .toolbar-btn.note-btn:hover {
        background-color: #1e293b;
        color: #ffffff;
      }
      .toolbar-btn svg {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }
      .ai-menu-wrapper {
        position: relative;
        display: inline-block;
      }
      .ai-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 5px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 6px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
        z-index: 2147483647;
        min-width: 180px;
        padding: 4px;
      }
      .ai-dropdown-item {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        padding: 6px 8px;
        font-size: 11px;
        text-align: left;
        background: none;
        border: none;
        border-radius: 4px;
        color: #e2e8f0;
        cursor: pointer;
        transition: background 0.12s ease;
      }
      .ai-dropdown-item:hover {
        background-color: #7c3aed;
        color: #ffffff;
      }
    `
  ];

  override connectedCallback() {
    super.connectedCallback();
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => {
        if (this.showAiMenu) this.showAiMenu = false;
      });
    }
  }

  private handleFindClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent('anchor-symbol-lookup', {
        bubbles: true,
        composed: true,
        detail: { symbol: this.symbol },
      })
    );
  }

  private toggleAiMenu(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.showAiMenu = !this.showAiMenu;
  }

  private handleAiAction(action: AIAction, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.showAiMenu = false;
    this.dispatchEvent(
      new CustomEvent('anchor-trigger-ai', {
        bubbles: true,
        composed: true,
        detail: {
          action,
          selectedText: this.selectedText,
          lineNumber: this.lineNumber,
          filePath: this.filePath,
          targetRow: this.targetRow,
        },
      })
    );
  }

  private handleSuggestionClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent('anchor-trigger-suggestion', {
        bubbles: true,
        composed: true,
        detail: {
          selectedText: this.selectedText,
          lineNumber: this.lineNumber,
          filePath: this.filePath,
          targetRow: this.targetRow,
        },
      })
    );
  }

  private handleNoteClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent('anchor-trigger-note', {
        bubbles: true,
        composed: true,
        detail: {
          selectedText: this.selectedText,
          lineNumber: this.lineNumber,
          filePath: this.filePath,
          targetRow: this.targetRow,
        },
      })
    );
  }

  override render() {
    if (!this.visible) return html``;

    return html`
      <div style="position: fixed; left: ${this.x}px; top: ${this.y}px; z-index: 2147483647;">
        <div class="floating-toolbar">
          ${this.symbol
            ? html`
                <button
                  type="button"
                  class="toolbar-btn find-btn"
                  @click=${this.handleFindClick}
                  title="Find references for ${this.symbol}"
                >
                  <svg viewBox="0 0 16 16">
                    <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path>
                  </svg>
                  <span>Find: <b>${this.symbol}</b></span>
                </button>
              `
            : html``}

          <div class="ai-menu-wrapper">
            <button
              type="button"
              class="toolbar-btn ai-btn"
              @click=${this.toggleAiMenu}
              title="Ask AI about selected code"
            >
              <span>✨ Ask AI ▾</span>
            </button>
            ${this.showAiMenu
              ? html`
                  <div class="ai-dropdown" @click=${(e: MouseEvent) => e.stopPropagation()}>
                    <button type="button" class="ai-dropdown-item" @click=${(e: MouseEvent) => this.handleAiAction('spot_bugs', e)}>
                      🐛 Spot Bugs & Issues
                    </button>
                    <button type="button" class="ai-dropdown-item" @click=${(e: MouseEvent) => this.handleAiAction('suggest_fix', e)}>
                      ✨ Suggest Fix (Code)
                    </button>
                    <button type="button" class="ai-dropdown-item" @click=${(e: MouseEvent) => this.handleAiAction('explain', e)}>
                      🔍 Explain This Code
                    </button>
                    <button type="button" class="ai-dropdown-item" @click=${(e: MouseEvent) => this.handleAiAction('unit_test', e)}>
                      🧪 Generate Unit Test
                    </button>
                  </div>
                `
              : html``}
          </div>

          <button
            type="button"
            class="toolbar-btn suggestion-btn"
            @click=${this.handleSuggestionClick}
            title="Create code suggestion on this line"
          >
            💡 Suggestion
          </button>

          <button
            type="button"
            class="toolbar-btn note-btn"
            @click=${this.handleNoteClick}
            title="Add private line note"
          >
            📝 Note
          </button>
        </div>
      </div>
    `;
  }
}
