import {
  IPlatformAdapter,
  ReviewContext,
  DiffLineContext,
  SymbolReferenceResult,
} from './base.adapter';
import { extractFilePath } from '../services/file-path-resolver';

export class GitHubAdapter implements IPlatformAdapter {
  readonly platformId = 'github' as const;

  isCurrentHost(url: URL): boolean {
    return url.hostname === 'github.com' && /\/[^/]+\/[^/]+\/pull\/\d+/.test(url.pathname);
  }

  extractReviewContext(targetUrl?: URL): ReviewContext | null {
    const url = targetUrl || (typeof window !== 'undefined' ? new URL(window.location.href) : null);
    if (!url) return null;

    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return null;

    const [, owner, repo, prNumber] = match;
    const projectPath = `${owner}/${repo}`;

    // Read base and head branch from GitHub DOM if present in browser context
    let baseRef = 'main';
    let headRef = 'head';

    if (typeof document !== 'undefined') {
      const baseEl = document.querySelector('.base-ref, .commit-ref.base-ref, [data-base-branch]');
      if (baseEl) {
        baseRef = baseEl.getAttribute('data-base-branch') || baseEl.textContent?.trim() || 'main';
      }
      const headEl = document.querySelector('.head-ref, .commit-ref.head-ref, [data-head-branch]');
      if (headEl) {
        headRef = headEl.getAttribute('data-head-branch') || headEl.textContent?.trim() || 'head';
      }
    }

    return {
      platform: 'github',
      host: url.hostname,
      projectPath,
      reviewId: prNumber,
      pullNumber: prNumber,
      baseRef,
      headRef,
    };
  }

  observeNavigation(onNavigate: (ctx: ReviewContext) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleEvent = () => {
      const ctx = this.extractReviewContext();
      if (ctx) onNavigate(ctx);
    };

    window.addEventListener('turbo:render', handleEvent);
    window.addEventListener('turbo:load', handleEvent);
    window.addEventListener('pjax:end', handleEvent);
    window.addEventListener('popstate', handleEvent);

    return () => {
      window.removeEventListener('turbo:render', handleEvent);
      window.removeEventListener('turbo:load', handleEvent);
      window.removeEventListener('pjax:end', handleEvent);
      window.removeEventListener('popstate', handleEvent);
    };
  }

  getDiffContainer(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    return document.querySelector<HTMLElement>('#files, .js-diff-container, #diff-container');
  }

  scanDiffLines(container: HTMLElement): DiffLineContext[] {
    const results: DiffLineContext[] = [];
    const fileCards = container.querySelectorAll<HTMLElement>('.file, [data-file-type]');

    fileCards.forEach((card) => {
      const filePath = extractFilePath(card);

      const codeRows = card.querySelectorAll<HTMLTableRowElement>('tr.blob-code, tr:has(.blob-code)');

      codeRows.forEach((row) => {
        const lineNumEl = row.querySelector<HTMLElement>('td.blob-num');
        const codeInnerEl = row.querySelector<HTMLElement>('.blob-code-inner');
        if (!lineNumEl || !codeInnerEl) return;

        const lineNum = parseInt(lineNumEl.getAttribute('data-line-number') || lineNumEl.textContent || '0', 10);
        if (!lineNum) return;

        const isLeft = lineNumEl.classList.contains('blob-num-deletion');
        results.push({
          element: row,
          filePath,
          lineNumber: lineNum,
          diffSide: isLeft ? 'left' : 'right',
          codeContent: codeInnerEl.textContent || '',
        });
      });
    });

    return results;
  }

  injectScratchpadRow(line: DiffLineContext, component: HTMLElement): HTMLElement | null {
    const row = line.element as HTMLTableRowElement;
    if (!row || !row.parentNode) return null;

    // Check if row already injected
    const nextRow = row.nextElementSibling;
    if (nextRow?.classList.contains('anchor-scratchpad-row')) {
      return nextRow as HTMLElement;
    }

    const tr = document.createElement('tr');
    tr.className = 'anchor-scratchpad-row';
    tr.setAttribute('data-anchor-line', String(line.lineNumber));
    tr.setAttribute('data-anchor-side', line.diffSide);

    const td = document.createElement('td');
    td.colSpan = 100;
    td.className = 'anchor-scratchpad-cell p-0 m-0 border-0';
    td.appendChild(component);
    tr.appendChild(td);

    row.insertAdjacentElement('afterend', tr);
    return tr;
  }

  async triggerNativeComment(
    line: DiffLineContext,
    text: string,
    token?: string,
    ctx?: ReviewContext
  ): Promise<boolean> {
    const row = line.element;
    let submittedViaDom = false;

    if (row && typeof document !== 'undefined') {
      try {
        const commentBtn = row.querySelector<HTMLElement>('.js-add-line-comment, button[aria-label*="comment"]');
        if (commentBtn) {
          commentBtn.click();
        }

        const textarea = await new Promise<HTMLTextAreaElement | null>((resolve) => {
          let attempts = 0;
          const checkInterval = setInterval(() => {
            attempts++;
            const found =
              row.nextElementSibling?.querySelector<HTMLTextAreaElement>(
                'textarea.js-comment-field, textarea[name="comment[body]"]'
              ) || null;

            if (found || attempts > 20) {
              clearInterval(checkInterval);
              resolve(found);
            }
          }, 50);
        });

        if (textarea) {
          const prototypeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;
          if (prototypeSetter) {
            prototypeSetter.call(textarea, text);
          } else {
            textarea.value = text;
          }
          textarea.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          textarea.focus();

          await new Promise((r) => setTimeout(r, 150));

          const form = textarea.closest('form, .inline-comments') || textarea.parentElement;
          const submitBtn = form?.querySelector<HTMLButtonElement>(
            'button[name="single_comment"], button.btn-primary, button[data-disable-with="Adding comment…"], button[type="submit"]'
          );

          if (submitBtn) {
            if (submitBtn.disabled) {
              await new Promise((r) => setTimeout(r, 200));
            }
            if (!submitBtn.disabled) {
              submitBtn.click();
              submittedViaDom = true;
            }
          } else {
            submittedViaDom = true;
          }
        }
      } catch (err) {
        console.warn('[GitHubAdapter] DOM comment error:', err);
      }
    }

    if (submittedViaDom) {
      return true;
    }

    // Fallback to GitHub REST API if token & ctx are provided
    if (token && ctx) {
      try {
        const res = await fetch(`https://api.github.com/repos/${ctx.projectPath}/pulls/${ctx.pullNumber}/comments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: text,
            commit_id: ctx.headRef,
            path: line.filePath,
            line: line.lineNumber,
            side: line.diffSide === 'left' ? 'LEFT' : 'RIGHT',
          }),
        });

        if (res.ok) {
          return true;
        }

        // Fallback to issue comment
        const issueRes = await fetch(`https://api.github.com/repos/${ctx.projectPath}/issues/${ctx.pullNumber}/comments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: `> **[${line.filePath}:${line.lineNumber}]**\n\n${text}`,
          }),
        });

        if (issueRes.ok) {
          return true;
        }
      } catch (err) {
        console.error('[GitHubAdapter] API comment error:', err);
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    return false;
  }

  async verifyConnection(token: string): Promise<{ valid: boolean; rateLimitRemaining?: number; error?: string }> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('https://api.github.com/user', { headers });
      const rateLimitHeader = res.headers.get('x-ratelimit-remaining');
      const rateLimitRemaining = rateLimitHeader ? parseInt(rateLimitHeader, 10) : undefined;

      if (res.ok) {
        return { valid: true, rateLimitRemaining };
      }
      if (res.status === 401) {
        return { valid: false, error: 'Invalid or expired Personal Access Token' };
      }
      return { valid: false, rateLimitRemaining, error: `GitHub API error: ${res.statusText}` };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error connecting to GitHub';
      return { valid: false, error: message };
    }
  }

  async searchSymbolReferences(
    ctx: ReviewContext,
    symbol: string,
    token?: string,
    enclosingClass?: string
  ): Promise<SymbolReferenceResult> {
    try {
      const cleanSymbol = symbol.replace(/^[\s$#@\->]+|[\s();:,."'`{}]+$/g, '');
      const searchTerms = enclosingClass ? `${cleanSymbol} ${enclosingClass}` : cleanSymbol;
      const query = encodeURIComponent(`${searchTerms} repo:${ctx.projectPath}`);
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`https://api.github.com/search/code?q=${query}`, { headers });
      if (res.status === 403) {
        return { symbol: cleanSymbol, totalMatches: 0, matches: [], rateLimited: true };
      }
      if (!res.ok) {
        return { symbol: cleanSymbol, totalMatches: 0, matches: [] };
      }

      const data = await res.json();
      const rawItems = data.items || [];
      const filtered = enclosingClass
        ? rawItems.filter((item: { path: string; text_matches?: Array<{ fragment: string }> }) => {
            const pathMatches = item.path.toLowerCase().includes(enclosingClass.toLowerCase());
            const textMatches = item.text_matches?.some((m) => m.fragment.includes(enclosingClass));
            return pathMatches || textMatches;
          })
        : rawItems;

      const matches = filtered.map((item: { path: string; html_url: string; text_matches?: Array<{ fragment: string }> }) => ({
        filePath: item.path,
        lineNumber: 1,
        codeSnippet: item.text_matches?.[0]?.fragment || '',
        matchUrl: item.html_url || `https://github.com/${ctx.projectPath}/blob/${ctx.baseRef}/${item.path}`,
      }));

      return {
        symbol: cleanSymbol,
        totalMatches: matches.length,
        matches,
      };
    } catch (err) {
      console.error('[GitHubAdapter] searchSymbolReferences error:', err);
      return { symbol, totalMatches: 0, matches: [] };
    }
  }
}
