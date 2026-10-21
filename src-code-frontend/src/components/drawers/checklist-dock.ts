import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { StoreController } from '../base/store-controller';
import { $activeNotes } from '../../stores/notes.store';
import { $reviewProgress } from '../../stores/review-progress.store';

@customElement('anchor-checklist-dock')
export class AnchorChecklistDock extends AnchorBaseElement {
  private notesStore = new StoreController(this, $activeNotes);
  private progressStore = new StoreController(this, $reviewProgress);

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483646;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .dock-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background-color: #0f172a;
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        padding: 7px 14px;
        border-radius: 24px;
        border: 1px solid #334155;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease;
        user-select: none;
      }
      .dock-pill:hover {
        background-color: #1e293b;
        border-color: #475569;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }
      .brand-title {
        font-weight: 700;
        letter-spacing: -0.01em;
        color: #f8fafc;
      }
      .brand-icon {
        width: 16px;
        height: 16px;
      }
      .progress-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background-color: #1e293b;
        color: #38bdf8;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 2px 7px;
        font-size: 11px;
        font-weight: 600;
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      .progress-badge.complete {
        background-color: #064e3b;
        color: #34d399;
        border-color: #059669;
      }
      .badge-counter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: #0284c7;
        color: #ffffff;
        border-radius: 10px;
        padding: 1px 7px;
        font-size: 11px;
        font-weight: 700;
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      .badge-ai-review {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
        color: #ffffff;
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .badge-ai-review:hover {
        transform: scale(1.04);
        box-shadow: 0 0 10px rgba(124, 58, 237, 0.4);
      }
      .divider {
        width: 1px;
        height: 14px;
        background-color: #334155;
      }
    `
  ];

  private handleClick() {
    this.dispatchEvent(
      new CustomEvent('anchor-toggle-checklist', {
        bubbles: true,
        composed: true,
        detail: { initialTab: 'notes' },
      })
    );
  }

  private handleAiReviewClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent('anchor-toggle-checklist', {
        bubbles: true,
        composed: true,
        detail: { initialTab: 'ai-review' },
      })
    );
  }

  override render() {
    const notesMap = this.notesStore.value || {};
    const notesCount = Object.values(notesMap).filter(
      (n) => n && typeof n.content === 'string' && n.content.trim().length > 0
    ).length;

    const progress = this.progressStore.value;
    const reviewedCount = Object.values(progress?.reviewedFiles || {}).filter(Boolean).length;
    const totalFiles = Math.max(progress?.totalFiles || 0, reviewedCount);
    const percent = totalFiles > 0 ? Math.min(100, Math.round((reviewedCount / totalFiles) * 100)) : 0;
    const isComplete = totalFiles > 0 && reviewedCount >= totalFiles;

    return html`
      <button class="dock-pill" @click=${this.handleClick} title="Open PeerPilot Review Drawer">
        <!-- SVG Brand Emblem -->
        <svg class="brand-icon" viewBox="0 0 128 128" fill="none">
          <circle cx="64" cy="28" r="14" stroke="#38bdf8" stroke-width="6"/>
          <path d="M64 20 Q64 28 72 28 Q64 28 64 36 Q64 28 56 28 Q64 28 64 20 Z" fill="#38bdf8"/>
          <line x1="64" y1="42" x2="64" y2="94" stroke="#06b6d4" stroke-width="8" stroke-linecap="round"/>
          <path d="M44 52 L26 66 L44 80" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M84 52 L102 66 L84 80" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M20 84 C20 106 108 106 108 84" stroke="#6366f1" stroke-width="8" stroke-linecap="round"/>
        </svg>

        <span class="brand-title">PeerPilot</span>

        ${totalFiles > 0
          ? html`
              <div class="divider"></div>
              <span class="progress-badge ${isComplete ? 'complete' : ''}" title="${reviewedCount} of ${totalFiles} files marked reviewed (${percent}%)">
                ${isComplete ? '✓' : ''} ${reviewedCount}/${totalFiles} (${percent}%)
              </span>
            `
          : html``}

        <div class="divider"></div>
        <span class="badge-counter" title="${notesCount} private anchored notes">${notesCount} notes</span>

        <div class="divider"></div>
        <span
          class="badge-ai-review"
          @click=${this.handleAiReviewClick}
          title="Run Critical AI Code Review on this PR/MR"
        >
          ⚡ Review PR
        </span>
      </button>
    `;
  }
}
