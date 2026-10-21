import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';
import { globalSearchCache, SearchCacheService } from '../../services/search-cache.service';
import { globalQueryQueue } from '../../services/query-queue.service';
import { IPlatformAdapter, ReviewContext } from '../../adapters/base.adapter';
import { $settings } from '../../stores/settings.store';

@customElement('anchor-blast-badge')
export class AnchorBlastBadge extends AnchorBaseElement {
  @property({ type: String }) symbol = '';
  @property({ type: String }) enclosingClass = '';
  @property({ type: String }) projectPath = '';
  @property({ type: String }) baseRef = 'main';
  @property({ type: String }) platform: 'github' | 'gitlab' = 'github';
  @property({ type: String }) status: 'idle' | 'scanning' | 'ready' | 'error' | 'rate-limited' = 'idle';
  @property({ type: Number }) fileCount = 0;
  @property({ type: Array }) matchedFiles: string[] = [];

  @state() private showTooltip = false;
  private adapter: IPlatformAdapter | null = null;
  private intersectionObserver?: IntersectionObserver;

  static override styles = [
    AnchorBaseElement.styles,
    css`
      :host {
        display: inline-flex;
        position: relative;
        vertical-align: middle;
        margin-left: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 11px;
        line-height: 1;
        cursor: pointer;
        user-select: none;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 7px;
        border-radius: 10px;
        font-weight: 500;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .badge:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
      .badge.low {
        background-color: #f6f8fa;
        color: #57606a;
        border: 1px solid #d0d7de;
      }
      .badge.medium {
        background-color: #fff8c5;
        color: #9a6700;
        border: 1px solid #d4a72c;
      }
      .badge.high {
        background-color: #ffebe9;
        color: #cf222e;
        border: 1px solid #ff8182;
        font-weight: 600;
      }
      .badge.scanning {
        background-color: #f6f8fa;
        color: #656d76;
        border: 1px dashed #d0d7de;
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      .badge.rate-limited {
        background-color: #f6f8fa;
        color: #9a6700;
        border: 1px solid #d4a72c;
      }
      .tooltip {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background-color: #1f2328;
        color: #ffffff;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        line-height: 1.4;
        white-space: nowrap;
        pointer-events: none;
        z-index: 100000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tooltip-file {
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 10px;
        color: #b6e3ff;
      }
    `
  ];

  public setAdapter(adapter: IPlatformAdapter) {
    this.adapter = adapter;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setupViewportObserver();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }

  private setupViewportObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      this.triggerScan();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          this.intersectionObserver?.disconnect();
          this.intersectionObserver = undefined;
          this.triggerScan();
        }
      },
      { rootMargin: '200px' }
    );

    this.intersectionObserver.observe(this);
  }

  public async triggerScan() {
    if (!this.symbol || this.status === 'scanning' || this.status === 'ready') return;

    const cacheKey = SearchCacheService.buildKey(
      this.platform,
      this.projectPath,
      this.baseRef,
      this.symbol,
      this.enclosingClass
    );

    // Check session cache first
    const cached = globalSearchCache.get(cacheKey);
    if (cached) {
      this.applyResults(cached.matches.map((m) => m.filePath));
      return;
    }

    if (!this.adapter) {
      return;
    }

    this.status = 'scanning';

    try {
      const settings = $settings.get();
      const token = this.platform === 'github' ? settings.github.pat : settings.gitlab.pat;

      const reviewCtx: ReviewContext = {
        platform: this.platform,
        host: window.location.origin,
        projectPath: this.projectPath,
        reviewId: '1',
        pullNumber: '1',
        baseRef: this.baseRef,
        headRef: 'head',
      };

      const result = await globalQueryQueue.enqueue(cacheKey, async () => {
        return this.adapter!.searchSymbolReferences(reviewCtx, this.symbol, token, this.enclosingClass);
      });

      if (result.rateLimited) {
        this.status = 'rate-limited';
        globalQueryQueue.setRateLimited(true);
      } else {
        globalSearchCache.set(cacheKey, result);
        this.applyResults(result.matches.map((m) => m.filePath));
      }
    } catch {
      this.status = 'error';
    }
  }

  public applyResults(filePaths: string[]) {
    // Deduplicate file paths
    const uniqueFiles = Array.from(new Set(filePaths));
    this.fileCount = uniqueFiles.length;
    this.matchedFiles = uniqueFiles;
    this.status = 'ready';
  }

  private handleClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent('anchor-symbol-lookup', {
        bubbles: true,
        composed: true,
        detail: { symbol: this.symbol, enclosingClass: this.enclosingClass },
      })
    );
  }

  override render() {
    if (this.status === 'idle') {
      return html`<span class="badge low opacity-60">Scanning...</span>`;
    }

    if (this.status === 'scanning') {
      return html`<span class="badge scanning">Scanning...</span>`;
    }

    if (this.status === 'rate-limited') {
      return html`
        <span class="badge rate-limited" title="API Rate Limit reached. Click to view search details.">
          ⚠️ Rate limited
        </span>
      `;
    }

    if (this.status === 'error') {
      return html`<span class="badge low">Lookup error</span>`;
    }

    // Determine color tier
    let tierClass = 'low';
    let label = `Used in ${this.fileCount} ${this.fileCount === 1 ? 'file' : 'files'}`;

    if (this.fileCount >= 10) {
      tierClass = 'high';
      label = `Used in ${this.fileCount} files - High Blast Radius`;
    } else if (this.fileCount >= 3) {
      tierClass = 'medium';
    }

    return html`
      <div
        class="badge ${tierClass}"
        @click=${this.handleClick}
        @mouseenter=${() => (this.showTooltip = true)}
        @mouseleave=${() => (this.showTooltip = false)}
        title="Click to view all call sites on ${this.baseRef}"
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z"></path>
        </svg>
        <span>${label}</span>
      </div>

      ${this.showTooltip && this.matchedFiles.length > 0
        ? html`
            <div class="tooltip">
              <div class="font-semibold mb-1">Referenced in ${this.fileCount} files:</div>
              ${this.matchedFiles.slice(0, 5).map(
                (f) => html`<div class="tooltip-file">• ${f}</div>`
              )}
              ${this.matchedFiles.length > 5
                ? html`<div class="text-[9px] text-slate-400 mt-1">...and ${this.matchedFiles.length - 5} more files</div>`
                : html``}
            </div>
          `
        : html``}
    `;
  }
}
