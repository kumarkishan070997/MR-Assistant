import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';

@customElement('anchor-symbol-trigger')
export class AnchorSymbolTrigger extends AnchorBaseElement {
  @property({ type: String }) symbol = '';
  @property({ type: Number }) x = 0;
  @property({ type: Number }) y = 0;
  @property({ type: Boolean }) visible = false;

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
        pointer-events: auto;
      }
      .trigger-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background-color: #0969da;
        color: #ffffff;
        font-size: 11px;
        font-weight: 500;
        font-family: inherit;
        padding: 3px 8px;
        border-radius: 6px;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        transition: transform 0.15s ease, background-color 0.15s ease;
      }
      .trigger-btn:hover {
        background-color: #0854b0;
        transform: translateY(-1px);
      }
      .trigger-btn svg {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }
    `
  ];

  private handleClick(e: MouseEvent) {
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

  override render() {
    if (!this.visible || !this.symbol) return html``;

    return html`
      <div style="position: fixed; left: ${this.x}px; top: ${this.y}px; z-index: 2147483647;">
        <button
          class="trigger-btn"
          @mousedown=${this.handleClick}
          @click=${this.handleClick}
          title="Find references for ${this.symbol}"
        >
          <svg viewBox="0 0 16 16">
            <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path>
          </svg>
          <span>Find: <b>${this.symbol}</b></span>
        </button>
      </div>
    `;
  }
}
