import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { StoreController } from '../base/store-controller';
import { $activeNotes } from '../../stores/notes.store';
import { $reviewProgress } from '../../stores/review-progress.store';

const STORAGE_KEY = 'peerpilot_dock_position';

@customElement('anchor-checklist-dock')
export class AnchorChecklistDock extends AnchorBaseElement {
  private notesStore = new StoreController(this, $activeNotes);
  private progressStore = new StoreController(this, $reviewProgress);

  @state() private isDragging = false;
  @state() private isBumping = false;
  private prevNotesCount = -1;
  private hasMoved = false;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;
  private currentPointerId: number | null = null;
  private onResizeBound = this.handleWindowResize.bind(this);

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
        touch-action: none;
      }
      .dock-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background-color: #0f172a;
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        padding: 7px 14px 7px 10px;
        border-radius: 24px;
        border: 1px solid #334155;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        cursor: grab;
        transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        user-select: none;
      }
      .dock-pill:hover {
        background-color: #1e293b;
        border-color: #475569;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      }
      .dock-pill.dragging {
        cursor: grabbing;
        transform: scale(1.02);
        background-color: #1e293b;
        border-color: #6366f1;
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55), 0 0 14px rgba(99, 102, 241, 0.4);
        opacity: 0.98;
      }
      .drag-grip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        margin-right: -2px;
        cursor: grab;
        transition: color 0.15s ease;
      }
      .dock-pill:hover .drag-grip {
        color: #94a3b8;
      }
      .dock-pill.dragging .drag-grip {
        color: #818cf8;
        cursor: grabbing;
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
      @keyframes badgePop {
        0% { transform: scale(1); }
        40% { transform: scale(1.3); }
        100% { transform: scale(1); }
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
        transition: transform 0.15s ease;
      }
      .badge-counter.bump {
        animation: badgePop 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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

  override connectedCallback() {
    super.connectedCallback();
    this.restorePosition();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResizeBound);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResizeBound);
    }
  }

  private restorePosition() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const clampedX = Math.max(8, Math.min(window.innerWidth - 120, parsed.x));
          const clampedY = Math.max(8, Math.min(window.innerHeight - 50, parsed.y));
          this.style.left = `${clampedX}px`;
          this.style.top = `${clampedY}px`;
          this.style.bottom = 'auto';
          this.style.right = 'auto';
          return;
        }
      }
    } catch {
      // Ignore JSON or localStorage error
    }

    // Default placement: bottom right
    this.style.bottom = '24px';
    this.style.right = '24px';
    this.style.left = 'auto';
    this.style.top = 'auto';
  }

  private handleWindowResize() {
    if (this.style.left && this.style.left !== 'auto') {
      const rect = this.getBoundingClientRect();
      const maxX = Math.max(8, window.innerWidth - rect.width - 8);
      const maxY = Math.max(8, window.innerHeight - rect.height - 8);
      const curX = parseFloat(this.style.left) || 8;
      const curY = parseFloat(this.style.top) || 8;
      const clampedX = Math.max(8, Math.min(maxX, curX));
      const clampedY = Math.max(8, Math.min(maxY, curY));
      this.style.left = `${clampedX}px`;
      this.style.top = `${clampedY}px`;
    }
  }

  private handlePointerDown(e: PointerEvent) {
    if (e.button !== 0) return;

    // Do not initiate drag if user clicked directly on the Review PR button
    const target = e.target as HTMLElement | null;
    if (target?.closest('.badge-ai-review')) {
      return;
    }

    this.startX = e.clientX;
    this.startY = e.clientY;
    this.hasMoved = false;

    const rect = this.getBoundingClientRect();
    this.initialLeft = rect.left;
    this.initialTop = rect.top;

    // Convert fixed positioning to left/top explicitly
    this.style.left = `${rect.left}px`;
    this.style.top = `${rect.top}px`;
    this.style.bottom = 'auto';
    this.style.right = 'auto';

    const pill = this.shadowRoot?.querySelector('.dock-pill') as HTMLElement | null;
    if (pill && typeof pill.setPointerCapture === 'function') {
      try {
        pill.setPointerCapture(e.pointerId);
        this.currentPointerId = e.pointerId;
      } catch {}
    }
  }

  private handlePointerMove(e: PointerEvent) {
    if (this.currentPointerId !== e.pointerId) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    if (!this.hasMoved && Math.hypot(dx, dy) > 3) {
      this.hasMoved = true;
      this.isDragging = true;
    }

    if (this.hasMoved) {
      const rect = this.getBoundingClientRect();
      const minX = 8;
      const maxX = Math.max(minX, window.innerWidth - rect.width - 8);
      const minY = 8;
      const maxY = Math.max(minY, window.innerHeight - rect.height - 8);

      const clampedX = Math.max(minX, Math.min(maxX, this.initialLeft + dx));
      const clampedY = Math.max(minY, Math.min(maxY, this.initialTop + dy));

      this.style.left = `${clampedX}px`;
      this.style.top = `${clampedY}px`;
    }
  }

  private handlePointerUp(e: PointerEvent) {
    if (this.currentPointerId === e.pointerId) {
      const pill = this.shadowRoot?.querySelector('.dock-pill') as HTMLElement | null;
      if (pill && typeof pill.releasePointerCapture === 'function') {
        try {
          pill.releasePointerCapture(e.pointerId);
        } catch {}
      }
      this.currentPointerId = null;

      if (this.hasMoved) {
        const curX = parseFloat(this.style.left);
        const curY = parseFloat(this.style.top);
        if (!isNaN(curX) && !isNaN(curY)) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: curX, y: curY }));
          } catch {}
        }
      }

      this.isDragging = false;
      // Clear hasMoved after microtask so click event doesn't trigger
      setTimeout(() => {
        this.hasMoved = false;
      }, 50);
    }
  }

  private handlePointerCancel(e: PointerEvent) {
    this.handlePointerUp(e);
  }

  private handleClick(e: MouseEvent) {
    if (this.hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

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

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleClick(e as unknown as MouseEvent);
    }
  }

  override render() {
    const notesMap = this.notesStore.value || {};
    const notesCount = Object.values(notesMap).filter(
      (n) => n && typeof n.content === 'string' && n.content.trim().length > 0
    ).length;

    if (this.prevNotesCount !== -1 && notesCount > this.prevNotesCount) {
      this.isBumping = true;
      setTimeout(() => {
        this.isBumping = false;
      }, 220);
    }
    this.prevNotesCount = notesCount;

    const progress = this.progressStore.value;
    const reviewedCount = Object.values(progress?.reviewedFiles || {}).filter(Boolean).length;
    const totalFiles = Math.max(progress?.totalFiles || 0, reviewedCount);
    const percent = totalFiles > 0 ? Math.min(100, Math.round((reviewedCount / totalFiles) * 100)) : 0;
    const isComplete = totalFiles > 0 && reviewedCount >= totalFiles;

    return html`
      <div
        class="dock-pill ${this.isDragging ? 'dragging' : ''}"
        role="button"
        tabindex="0"
        @pointerdown=${this.handlePointerDown}
        @pointermove=${this.handlePointerMove}
        @pointerup=${this.handlePointerUp}
        @pointercancel=${this.handlePointerCancel}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        title="Open PeerPilot Review Drawer (or drag to reposition)"
      >
        <!-- Drag Grip Indicator -->
        <span class="drag-grip" title="Drag to reposition dock">
          <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
            <circle cx="2" cy="2" r="1.2"/>
            <circle cx="6" cy="2" r="1.2"/>
            <circle cx="2" cy="6" r="1.2"/>
            <circle cx="6" cy="6" r="1.2"/>
            <circle cx="2" cy="10" r="1.2"/>
            <circle cx="6" cy="10" r="1.2"/>
          </svg>
        </span>

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
        <span class="badge-counter ${this.isBumping ? 'bump' : ''}" title="${notesCount} private anchored notes">${notesCount} notes</span>

        <div class="divider"></div>
        <span
          class="badge-ai-review"
          @click=${this.handleAiReviewClick}
          title="Run Critical AI Code Review on this PR/MR"
        >
          ⚡ Review PR
        </span>
      </div>
    `;
  }
}
