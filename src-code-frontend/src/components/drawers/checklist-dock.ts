import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { StoreController } from '../base/store-controller';
import { $activeNotes, LineNote } from '../../stores/notes.store';

@customElement('anchor-checklist-dock')
export class AnchorChecklistDock extends AnchorBaseElement {
  private notesStore = new StoreController(this, $activeNotes);

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483646;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      }
      .dock-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background-color: #24292f;
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        padding: 8px 14px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease;
        user-select: none;
      }
      .dock-pill:hover {
        background-color: #1f2328;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      }
      .badge-counter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: #0969da;
        color: #ffffff;
        border-radius: 10px;
        padding: 1px 7px;
        font-size: 11px;
        font-weight: 700;
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      .dock-icon {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }
    `
  ];

  private handleClick() {
    this.dispatchEvent(
      new CustomEvent('anchor-toggle-checklist', {
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const notesMap = this.notesStore.value || {};
    const notesCount = Object.keys(notesMap).length;

    return html`
      <button class="dock-pill" @click=${this.handleClick} title="Open Review Checklist">
        <svg class="dock-icon" viewBox="0 0 16 16">
          <path d="M2.5 1.75v11.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H2.75a.25.25 0 0 0-.25.25Zm-1.5 0C1 1.06 1.784.5 2.75.5h10.5c.966 0 1.75.56 1.75 1.25v11.5c0 .69-.784 1.25-1.75 1.25H2.75C1.784 14.5 1 13.94 1 13.25V1.75Zm3.75 2.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Zm0 3.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Zm0 3.5a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z"></path>
        </svg>
        <span>Anchored Notes</span>
        <span class="badge-counter">${notesCount}</span>
      </button>
    `;
  }
}
