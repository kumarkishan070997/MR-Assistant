import {
  IPlatformAdapter,
  ReviewContext,
  DiffLineContext,
  SymbolReferenceResult,
} from './base.adapter';
import { extractFilePath } from '../services/file-path-resolver';

export class GitLabAdapter implements IPlatformAdapter {
  readonly platformId = 'gitlab' as const;

  isCurrentHost(url: URL, customHosts: string[] = []): boolean {
    const isExplicitHost =
      url.hostname === 'gitlab.com' ||
      customHosts.some((h) => {
        try {
          return new URL(h).hostname === url.hostname;
        } catch {
          return false;
        }
      });

    return isExplicitHost && /\/(?:-\/)?merge_requests\/\d+/.test(url.pathname);
  }

  extractReviewContext(targetUrl?: URL): ReviewContext | null {
    const url = targetUrl || (typeof window !== 'undefined' ? new URL(window.location.href) : null);
    if (!url) return null;

    const match = url.pathname.match(/^(.+?)\/(?:-\/)?merge_requests\/(\d+)/);
    if (!match) return null;

    let projectPath = match[1];
    if (projectPath.startsWith('/')) projectPath = projectPath.slice(1);
    const reviewId = match[2];

    let baseRef = 'main';
    let headRef = 'head';

    if (typeof document !== 'undefined') {
      const baseEl = document.querySelector('.mr-source-target .target-branch, [data-target-branch], .target-branch');
      if (baseEl) {
        baseRef = baseEl.getAttribute('data-target-branch') || baseEl.textContent?.trim() || 'main';
      }
      const headEl = document.querySelector('.mr-source-target .source-branch, [data-source-branch], .source-branch');
      if (headEl) {
        headRef = headEl.getAttribute('data-source-branch') || headEl.textContent?.trim() || 'head';
      }
    }

    return {
      platform: 'gitlab',
      host: url.origin,
      projectPath,
      reviewId,
      pullNumber: reviewId,
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

    window.addEventListener('page:rendered', handleEvent);
    window.addEventListener('page:receive', handleEvent);
    window.addEventListener('popstate', handleEvent);

    return () => {
      window.removeEventListener('page:rendered', handleEvent);
      window.removeEventListener('page:receive', handleEvent);
      window.removeEventListener('popstate', handleEvent);
    };
  }

  getDiffContainer(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    return document.querySelector<HTMLElement>('#diffs, .diffs, .diff-files-holder, .files, .diffs-tab, [data-qa-selector="diffs_tab"]') || document.body;
  }

  scanDiffLines(container: HTMLElement): DiffLineContext[] {
    const results: DiffLineContext[] = [];
    const fileHolders = container.querySelectorAll<HTMLElement>('.diff-file, [data-blob-path], .file-holder');

    fileHolders.forEach((holder) => {
      const filePath = extractFilePath(holder);

      const lineHolders = holder.querySelectorAll<HTMLTableRowElement>('tr.line_holder, tr:has(.line_content)');

      lineHolders.forEach((row) => {
        const lineNumEl = row.querySelector<HTMLElement>('td.diff-line-num');
        const codeContentEl = row.querySelector<HTMLElement>('.line_content');
        if (!lineNumEl || !codeContentEl) return;

        const lineNum = parseInt(lineNumEl.getAttribute('data-linenumber') || lineNumEl.textContent || '0', 10);
        if (!lineNum) return;

        const isOld = lineNumEl.classList.contains('old');
        results.push({
          element: row,
          filePath,
          lineNumber: lineNum,
          diffSide: isOld ? 'left' : 'right',
          codeContent: codeContentEl.textContent || '',
        });
      });
    });

    return results;
  }

  injectScratchpadRow(line: DiffLineContext, component: HTMLElement): HTMLElement | null {
    const row = line.element as HTMLTableRowElement;
    if (!row || !row.parentNode) return null;

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

  private diffRefsCache: Map<string, { base_sha: string; start_sha: string; head_sha: string }> = new Map();

  async getDiffRefs(
    ctx: ReviewContext,
    token?: string
  ): Promise<{ base_sha: string; start_sha: string; head_sha: string } | null> {
    if (this.diffRefsCache.has(ctx.reviewId)) {
      return this.diffRefsCache.get(ctx.reviewId)!;
    }

    if (typeof document !== 'undefined') {
      const baseEl = document.querySelector('[data-base-sha]');
      const headEl = document.querySelector('[data-head-sha]');
      const startEl = document.querySelector('[data-start-sha]');
      if (baseEl && headEl) {
        const refs = {
          base_sha: baseEl.getAttribute('data-base-sha') || '',
          start_sha: startEl?.getAttribute('data-start-sha') || baseEl.getAttribute('data-base-sha') || '',
          head_sha: headEl.getAttribute('data-head-sha') || '',
        };
        if (refs.base_sha && refs.head_sha) {
          this.diffRefsCache.set(ctx.reviewId, refs);
          return refs;
        }
      }
    }

    if (token) {
      try {
        const cleanBase = ctx.host.replace(/\/+$/, '');
        const encodedPath = encodeURIComponent(ctx.projectPath);
        const res = await fetch(`${cleanBase}/api/v4/projects/${encodedPath}/merge_requests/${ctx.reviewId}`, {
          headers: { 'PRIVATE-TOKEN': token },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.diff_refs) {
            this.diffRefsCache.set(ctx.reviewId, data.diff_refs);
            return data.diff_refs;
          }
        }
      } catch (err) {
        console.warn('[GitLabAdapter] Failed to fetch diff_refs:', err);
      }
    }

    return null;
  }

  async postDiffDiscussionApi(
    ctx: ReviewContext,
    filePath: string,
    lineNumber: number,
    text: string,
    token: string,
    diffSide: 'left' | 'right' = 'right'
  ): Promise<boolean> {
    try {
      const cleanBase = ctx.host.replace(/\/+$/, '');
      const encodedPath = encodeURIComponent(ctx.projectPath);
      const diffRefs = await this.getDiffRefs(ctx, token);
      const endpoint = `${cleanBase}/api/v4/projects/${encodedPath}/merge_requests/${ctx.reviewId}/discussions`;

      if (diffRefs?.base_sha && diffRefs?.head_sha) {
        const bodyPayload: Record<string, unknown> = {
          body: text,
          position: {
            position_type: 'text',
            base_sha: diffRefs.base_sha,
            start_sha: diffRefs.start_sha || diffRefs.base_sha,
            head_sha: diffRefs.head_sha,
            old_path: filePath,
            new_path: filePath,
            ...(diffSide === 'left' ? { old_line: lineNumber } : { new_line: lineNumber }),
          },
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'PRIVATE-TOKEN': token,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          return true;
        }
      }

      // Fallback: create MR discussion referencing the file & line
      const fallbackRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PRIVATE-TOKEN': token,
        },
        body: JSON.stringify({
          body: `> **[${filePath}:${lineNumber}]**\n\n${text}`,
        }),
      });

      return fallbackRes.ok;
    } catch (err) {
      console.error('[GitLabAdapter] postDiffDiscussionApi error:', err);
      return false;
    }
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
        const lineCell =
          row.querySelector<HTMLElement>('.diff-line-num, .line_numbers, td.old_line, td.new_line') ||
          row;

        // Trigger hover on line number cell and row
        lineCell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        lineCell.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

        let noteBtn = row.querySelector<HTMLElement>(
          'button[data-testid="add-comment-icon"], button[data-testid="diff-comment-button"], [data-testid="add-diff-note-button"], button[data-qa-selector="diff_comment_button"], .js-add-diff-note-button, button.add-diff-note-button, .diff-line-num button, .line-actions button, button[aria-label*="comment" i], button[title*="comment" i]'
        );

        if (!noteBtn) {
          noteBtn = lineCell.querySelector<HTMLElement>('button') || null;
        }

        if (noteBtn) {
          noteBtn.click();
        }

        // Wait for injected discussion form / textarea
        const textarea = await new Promise<HTMLTextAreaElement | null>((resolve) => {
          let attempts = 0;
          const checkInterval = setInterval(() => {
            attempts++;

            let foundTextarea: HTMLTextAreaElement | null = null;
            let sibling = row.nextElementSibling;
            while (sibling) {
              if (sibling.classList.contains('anchor-scratchpad-row')) {
                sibling = sibling.nextElementSibling;
                continue;
              }
              const found = sibling.querySelector<HTMLTextAreaElement>(
                'textarea[data-testid="comment-textarea"], textarea[data-testid="reply-comment-field"], textarea.note-textarea, textarea.js-gfm-input, textarea[data-qa-selector="note_text_field"], textarea'
              );
              if (found) {
                foundTextarea = found;
                break;
              }
              if (sibling.classList.contains('line_holder') || sibling.classList.contains('diff-tr')) {
                break;
              }
              sibling = sibling.nextElementSibling;
            }

            if (!foundTextarea) {
              const tbody = row.closest('tbody') || row.parentElement;
              foundTextarea = tbody?.querySelector<HTMLTextAreaElement>(
                'tr.notes_holder textarea, tr.discussion-form-container textarea, .diff-discussion textarea, .notes-content textarea'
              ) || null;
            }

            if (foundTextarea || attempts > 20) {
              clearInterval(checkInterval);
              resolve(foundTextarea);
            }
          }, 50);
        });

        if (textarea) {
          // Set value via prototype setter for Vue v-model compatibility
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
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Wait a tick for Vue reactivity to enable submit button
          await new Promise((r) => setTimeout(r, 150));

          const form =
            textarea.closest('form, .new-note, .diff-discussion, .discussion-form, .notes-content, .js-vue-discussion-form') ||
            textarea.parentElement;

          const submitBtn = form?.querySelector<HTMLButtonElement | HTMLInputElement>(
            'button[data-testid="comment-now-button"], button[data-testid="comment-button"], button[data-qa-selector="comment_now_button"], button.btn-confirm, button.js-comment-button, button[type="submit"], input[type="submit"]'
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
            // Textarea populated and ready
            submittedViaDom = true;
          }
        }
      } catch (err) {
        console.warn('[GitLabAdapter] DOM comment trigger warning:', err);
      }
    }

    if (submittedViaDom) {
      return true;
    }

    // Fallback to GitLab Discussions REST API if token & context are provided
    if (token && ctx) {
      const apiSuccess = await this.postDiffDiscussionApi(
        ctx,
        line.filePath,
        line.lineNumber,
        text,
        token,
        line.diffSide
      );
      if (apiSuccess) {
        return true;
      }
    }

    // Safety fallback: Copy text to clipboard so user never loses work
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    return false;
  }

  async verifyConnection(token: string, baseUrl = 'https://gitlab.com'): Promise<{ valid: boolean; rateLimitRemaining?: number; error?: string }> {
    try {
      const cleanBase = baseUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = {};
      if (token) {
        headers['PRIVATE-TOKEN'] = token;
      }

      const res = await fetch(`${cleanBase}/api/v4/version`, { headers });
      const rateLimitHeader = res.headers.get('RateLimit-Remaining');
      const rateLimitRemaining = rateLimitHeader ? parseInt(rateLimitHeader, 10) : undefined;

      if (res.ok) {
        return { valid: true, rateLimitRemaining };
      }
      if (res.status === 401) {
        return { valid: false, error: 'Invalid or expired GitLab Private Token' };
      }
      return { valid: false, rateLimitRemaining, error: `GitLab API error: ${res.statusText}` };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error connecting to GitLab';
      return { valid: false, error: message };
    }
  }

  async searchSymbolReferences(
    ctx: ReviewContext,
    symbol: string,
    token?: string,
    enclosingClass?: string
  ): Promise<SymbolReferenceResult> {
    const cleanSymbol = symbol.replace(/^[\s$#@\->]+|[\s();:,."'`{}]+$/g, '');
    const cleanBase = ctx.host.replace(/\/+$/, '');
    const matchesMap = new Map<string, SymbolReferenceMatch>();

    // Common generic methods that should NEVER count as references unless qualified by class
    const genericMethods = new Set([
      'handle', 'run', 'execute', 'boot', 'register', 'up', 'down', 'render', 'mount',
      'index', 'show', 'create', 'store', 'edit', 'update', 'destroy',
      '__construct', '__invoke', '__tostring', 'setup', 'teardown', 'init', 'build'
    ]);
    const isGenericMethod = genericMethods.has(cleanSymbol.toLowerCase());

    // 1. Scan loaded MR diff files in the DOM (instant local match across all review files)
    if (typeof document !== 'undefined') {
      try {
        const fileContainers = document.querySelectorAll<HTMLElement>(
          'diff-file, .diff-file, [data-blob-path], .file-holder, [data-qa-selector="diff_file"]'
        );

        const escaped = cleanSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const symbolRegex = new RegExp(`\\b${escaped}\\b`);
        const classRegex = enclosingClass ? new RegExp(`\\b${enclosingClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`) : null;

        fileContainers.forEach((holder) => {
          const filePath = extractFilePath(holder);
          const holderText = holder.textContent || '';

          // If looking for a method of an enclosing class (or generic method name):
          // Other files that don't mention the enclosing class must NOT be counted as references
          if (enclosingClass) {
            const isSourceFile = filePath.toLowerCase().includes(enclosingClass.toLowerCase());
            if (!isSourceFile && classRegex && !classRegex.test(holderText)) {
              return; // Skip unrelated files that have no reference to the class
            }
          } else if (isGenericMethod) {
            return;
          }

          let rows = holder.querySelectorAll<HTMLElement>('tr, .line_holder, .diff-tr');
          if (rows.length === 0) {
            rows = holder.querySelectorAll<HTMLElement>('.line_content, .line, td.code, .diff-line');
          }
          rows.forEach((r) => {
            const codeCell = r.matches?.('.line_content, .line, td.code, .diff-line')
              ? r
              : r.querySelector<HTMLElement>('.line_content, .line, td.code, .diff-line');
            const codeText = codeCell?.textContent || r.textContent || '';
            if (symbolRegex.test(codeText)) {
              // Ignore declaration lines themselves
              if (/(?:function|def)\s+[a-zA-Z0-9_]+\s*\(|class\s+[a-zA-Z0-9_]+/i.test(codeText) && codeText.includes(cleanSymbol)) {
                return;
              }

              const numAttr =
                r.querySelector('[data-line-number]')?.getAttribute('data-line-number') ||
                r.querySelector('[data-linenumber]')?.getAttribute('data-linenumber') ||
                r.querySelector('.diff-line-num')?.textContent?.trim() ||
                '1';
              const lineNum = parseInt(numAttr, 10) || 1;
              const key = `${filePath}:${lineNum}`;
              if (!matchesMap.has(key)) {
                matchesMap.set(key, {
                  filePath,
                  lineNumber: lineNum,
                  codeSnippet: codeText.trim(),
                  matchUrl: `${cleanBase}/${ctx.projectPath}/-/blob/${ctx.headRef || ctx.baseRef}/${filePath}#L${lineNum}`,
                });
              }
            }
          });
        });
      } catch (err) {
        console.warn('[GitLabAdapter] In-MR search warning:', err);
      }
    }

    // 2. Query GitLab Search API for base branch occurrences
    let apiErrorMessage: string | undefined;
    let rateLimited = false;

    try {
      const encodedProjectId = encodeURIComponent(ctx.projectPath);
      const url = `${cleanBase}/api/v4/projects/${encodedProjectId}/search?scope=blobs&search=${encodeURIComponent(
        cleanSymbol
      )}&ref=${encodeURIComponent(ctx.baseRef)}`;

      const headers: Record<string, string> = {};
      if (token) {
        headers['PRIVATE-TOKEN'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      if (res.status === 429) {
        rateLimited = true;
      } else if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.warn(`[GitLabAdapter] Search API error (${res.status}):`, errorText);
        if (res.status === 401) {
          apiErrorMessage = 'GitLab token unauthorized or expired. Please check settings.';
        } else if (res.status === 400) {
          apiErrorMessage = `Instance search requires Advanced Search (Elasticsearch) on branch ${ctx.baseRef}.`;
        }
      } else {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((item: { filename: string; startline: number; data: string }) => {
            // Filter by enclosingClass if present to avoid generic method collisions
            if (enclosingClass) {
              const fileOrSnippetMatchesClass =
                item.filename.toLowerCase().includes(enclosingClass.toLowerCase()) ||
                item.data.includes(enclosingClass);
              if (!fileOrSnippetMatchesClass) {
                return;
              }
            } else if (isGenericMethod) {
              return;
            }

            const key = `${item.filename}:${item.startline || 1}`;
            matchesMap.set(key, {
              filePath: item.filename,
              lineNumber: item.startline || 1,
              codeSnippet: item.data || '',
              matchUrl: `${cleanBase}/${ctx.projectPath}/-/blob/${ctx.baseRef}/${item.filename}#L${item.startline || 1}`,
            });
          });
        }
      }
    } catch (err) {
      console.warn('[GitLabAdapter] Search API network error:', err);
    }

    const matches = Array.from(matchesMap.values());
    return {
      symbol: cleanSymbol,
      totalMatches: matches.length,
      matches,
      rateLimited,
      errorMessage: matches.length === 0 ? apiErrorMessage : undefined,
    };
  }
}
