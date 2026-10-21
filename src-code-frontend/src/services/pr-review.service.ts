import { AISettings, ReviewProfileSettings, $settings, loadSettings } from '../stores/settings.store';
import { AIService, AIStreamCallback } from './ai/ai.service';
import { ReviewContext } from '../adapters/base.adapter';
import { extractFilePath } from './file-path-resolver';

export interface PrReviewFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  category: 'security' | 'performance' | 'concurrency' | 'robustness' | 'architecture';
  filePath: string;
  lineNumber?: number;
  lineLabel?: string;
  title: string;
  description: string;
  suggestedFix?: string;
}

export interface PrReviewResult {
  success: boolean;
  rawText: string;
  findings: PrReviewFinding[];
  summary: string;
  totalFilesAnalyzed: number;
  error?: string;
}

const IGNORED_EXTENSIONS = [
  '.lock',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.map',
  '.min.js',
  '.min.css',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'composer.lock',
  'Gemfile.lock',
  'go.sum',
  'Cargo.lock',
];

export class PrReviewService {
  /**
   * Attempts to fetch the canonical unified diff directly from GitLab/GitHub MR URL.
   */
  public static async fetchRawDiff(context: ReviewContext | null): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const urlsToTry: string[] = [];
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    // 1. Derive from current URL pathname if on GitLab MR or GitHub PR
    const gitlabMatch = pathname.match(/^(.+?\/(?:-\/)?merge_requests\/\d+)/);
    if (gitlabMatch) {
      urlsToTry.push(`${origin}${gitlabMatch[1]}.diff`);
      urlsToTry.push(`${origin}${gitlabMatch[1]}.patch`);
    }

    const githubMatch = pathname.match(/^(\/[^/]+\/[^/]+\/pull\/\d+)/);
    if (githubMatch) {
      urlsToTry.push(`https://github.com${githubMatch[1]}.diff`);
      urlsToTry.push(`https://github.com${githubMatch[1]}.patch`);
    }

    // 2. Derive from ReviewContext if provided
    if (context && context.projectPath && context.pullNumber) {
      if (context.platform === 'gitlab') {
        urlsToTry.push(`${origin}/${context.projectPath}/-/merge_requests/${context.pullNumber}.diff`);
        urlsToTry.push(`${origin}/${context.projectPath}/merge_requests/${context.pullNumber}.diff`);
      } else if (context.platform === 'github') {
        urlsToTry.push(`https://github.com/${context.projectPath}/pull/${context.pullNumber}.diff`);
      }
    }

    const uniqueUrls = Array.from(new Set(urlsToTry));

    for (const diffUrl of uniqueUrls) {
      try {
        const resp = await fetch(diffUrl, {
          credentials: 'include',
          headers: {
            Accept: 'text/plain, application/vnd.github.v3.diff, */*',
          },
        });
        if (resp.ok) {
          const text = await resp.text();
          if (
            text &&
            (text.includes('diff --git') ||
              text.includes('--- ') ||
              text.includes('+++ ') ||
              text.includes('@@ '))
          ) {
            console.log(`[PrReviewService] Fetched canonical diff from ${diffUrl} (${text.length} chars)`);
            return text;
          }
        }
      } catch (err) {
        console.warn(`[PrReviewService] Could not fetch ${diffUrl}:`, err);
      }
    }

    return null;
  }

  /**
   * Scrapes modified code diffs directly from the current GitLab/GitHub DOM.
   */
  public static collectDiffFromDOM(): { diffText: string; fileCount: number } {
    if (typeof document === 'undefined') {
      return { diffText: '', fileCount: 0 };
    }

    const rawContainers = Array.from(
      document.querySelectorAll<HTMLElement>(
        'diff-file, .diff-file, .file-holder, .file[data-file-type], .file.js-file, [data-blob-path], .diff-file-holder, .file, [data-qa-selector="diff_file"], [data-qa-selector="file_holder"]'
      )
    );

    if (rawContainers.length === 0) {
      return { diffText: '', fileCount: 0 };
    }

    // Deduplicate nested containers so parent containers aren't processed twice
    const fileContainers = rawContainers.filter((container, i) => {
      return !rawContainers.some((other, j) => i !== j && other.contains(container));
    });

    const fileDiffs: string[] = [];
    let validFiles = 0;

    for (const container of fileContainers) {
      let filePath = extractFilePath(container);

      // Fallback: extract from container header text or link if resolver returned unknown
      if (!filePath || filePath === 'unknown_file') {
        const headerEl = container.querySelector(
          '.file-header, .file-title, .diff-file-header, .file-info, .file-title-name, [data-qa-selector="file_name_link"]'
        );
        const headerContent = headerEl?.textContent || container.textContent?.substring(0, 300) || '';
        const match = headerContent.match(
          /(?:[a-zA-Z0-9_.-]+\/)+[a-zA-Z0-9_.-]+\.(?:[a-zA-Z]{1,8}|blade\.php)|[a-zA-Z0-9_.-]+\.[a-zA-Z]{1,8}/i
        );
        if (match) {
          filePath = match[0].trim();
        } else {
          filePath = `file_${validFiles + 1}`;
        }
      }

      // Skip non-code / lock / media files
      const lower = filePath.toLowerCase();
      if (IGNORED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
        continue;
      }

      // Check if this container is a brand new file (e.g. "0 -> 100644" or ".new-file" or "new file mode")
      const headerText =
        container.querySelector('.file-header, .file-title, .diff-file-header, .file-info, .file-title-name')?.textContent ||
        container.textContent?.substring(0, 400) ||
        '';
      const isEntirelyNewFile =
        container.classList.contains('new-file') ||
        container.getAttribute('data-diff-type') === 'new' ||
        headerText.includes('0 ->') ||
        headerText.includes('new file');

      const diffLines: string[] = [];

      // Query any line rows inside container
      const rows = Array.from(
        container.querySelectorAll<HTMLElement>(
          'tr.line_holder, .line_holder, tr.diff-tr, .diff-tr, tr.diff-grid-row, .diff-grid-row, tr:has(.line_content), tr:has(.line-content), tr:has(.blob-code), .diff-line-row, tr'
        )
      );

      for (const row of rows) {
        // Skip scratchpad notes or discussion rows
        if (
          row.classList.contains('anchor-scratchpad-row') ||
          row.classList.contains('notes_holder') ||
          row.classList.contains('discussion')
        ) {
          continue;
        }

        // Determine if row is addition or deletion
        const isAddition =
          isEntirelyNewFile ||
          row.classList.contains('new') ||
          row.classList.contains('new_line') ||
          row.classList.contains('addition') ||
          row.classList.contains('is-addition') ||
          row.classList.contains('blob-code-addition') ||
          Boolean(
            row.querySelector(
              '.new, .new_line, .blob-code-addition, td.new_line, td.diff-line-num.new, .is-addition'
            )
          );

        const isDeletion =
          !isEntirelyNewFile &&
          (row.classList.contains('old') ||
            row.classList.contains('old_line') ||
            row.classList.contains('deletion') ||
            row.classList.contains('is-deletion') ||
            row.classList.contains('blob-code-deletion') ||
            Boolean(
              row.querySelector(
                '.old, .old_line, .blob-code-deletion, td.old_line, td.diff-line-num.old, .is-deletion'
              )
            ));

        if (!isAddition && !isDeletion) {
          continue;
        }

        // Code content cell
        const codeEl =
          (isAddition
            ? row.querySelector<HTMLElement>('.line_content.new, .line_content.addition, .blob-code-addition')
            : null) ||
          (isDeletion
            ? row.querySelector<HTMLElement>('.line_content.old, .line_content.deletion, .blob-code-deletion')
            : null) ||
          row.querySelector<HTMLElement>(
            '.line_content, .line-content, .blob-code-inner, .blob-code, td.code, .diff-line, span.line, pre, code'
          ) ||
          (row.children.length > 0 ? (row.children[row.children.length - 1] as HTMLElement) : null);

        if (!codeEl) continue;
        const rawCode = codeEl.textContent?.trimEnd() || '';
        if (!rawCode && !isDeletion) continue;

        // Line number
        const lineNumEl = isAddition
          ? row.querySelector<HTMLElement>(
              'td.diff-line-num.new_line, td.diff-line-num.new, td.new_line, td.blob-num-addition, td.blob-num[data-line-number], [data-linenumber], [data-line-number]'
            )
          : isDeletion
          ? row.querySelector<HTMLElement>(
              'td.diff-line-num.old_line, td.diff-line-num.old, td.old_line, td.blob-num-deletion'
            )
          : row.querySelector<HTMLElement>(
              'td.diff-line-num.new_line, td.diff-line-num.new, td.new_line, td.blob-num-addition, [data-linenumber], [data-line-number], .diff-line-num, td.blob-num'
            );
        const lineNum =
          lineNumEl?.getAttribute('data-linenumber') ||
          lineNumEl?.getAttribute('data-line-number') ||
          lineNumEl?.textContent?.replace(/[^0-9]/g, '') ||
          '';

        const prefix = isAddition ? '+' : '-';
        diffLines.push(`${prefix} ${lineNum ? `L${lineNum}: ` : ''}${rawCode}`);
      }

      // Fallback 1: search for any addition or deletion line elements directly inside container
      if (diffLines.length === 0) {
        const additionEls = Array.from(
          container.querySelectorAll<HTMLElement>(
            '.line_content, .line-content, .blob-code-addition, .diff-line.new, .is-addition'
          )
        );
        additionEls.forEach((el, lineIdx) => {
          const text = el.textContent?.trimEnd() || '';
          if (text) {
            diffLines.push(`+ L${lineIdx + 1}: ${text}`);
          }
        });
      }

      // Fallback 2: if brand new file and still 0 lines, extract code block from pre/code
      if (diffLines.length === 0 && isEntirelyNewFile) {
        const codeBlock = container.querySelector<HTMLElement>('pre, code, .diff-table, table');
        if (codeBlock) {
          const lines = (codeBlock.textContent || '').split('\n');
          lines.forEach((line, lIdx) => {
            const trimmed = line.trimEnd();
            if (trimmed) {
              diffLines.push(`+ L${lIdx + 1}: ${trimmed}`);
            }
          });
        }
      }

      if (diffLines.length > 0) {
        validFiles++;
        fileDiffs.push(`=== File: ${filePath} ===\n${diffLines.join('\n')}`);
      }
    }

    let combined = fileDiffs.join('\n\n');
    // Safety cap at ~45k characters to fit within context limits
    if (combined.length > 45000) {
      combined = combined.substring(0, 45000) + '\n\n...[Diff truncated for review context size]...';
    }

    return { diffText: combined, fileCount: validFiles };
  }

  /**
   * Collects diff via canonical raw URL fallback or DOM scraping.
   */
  public static async collectDiff(
    context: ReviewContext | null
  ): Promise<{ diffText: string; fileCount: number }> {
    // 1. Try raw canonical diff URL first (best fidelity, not limited by virtual DOM pagination)
    const rawDiff = await this.fetchRawDiff(context);
    if (rawDiff) {
      const fileCount = (rawDiff.match(/^diff --git/gm) || []).length || 1;
      let trimmed = rawDiff;
      if (trimmed.length > 45000) {
        trimmed = trimmed.substring(0, 45000) + '\n\n...[Diff truncated for review context size]...';
      }
      return { diffText: trimmed, fileCount };
    }

    // 2. Fallback to DOM scraping if fetchRawDiff fails or is restricted
    const domResult = this.collectDiffFromDOM();
    if (domResult.diffText && domResult.fileCount > 0) {
      return domResult;
    }

    return { diffText: '', fileCount: 0 };
  }

  /**
   * Builds the rigorous critical reviewer prompt honoring user-configured persona & strictness.
   */
  public static buildReviewPrompt(
    profile: ReviewProfileSettings,
    diffText: string,
    context?: ReviewContext | null
  ): { systemPrompt: string; userPrompt: string } {
    const focusPoints: string[] = [];

    if (profile.focusAreas.security) {
      focusPoints.push(
        '- SECURITY & VULNERABILITIES: Detect SQL Injection (raw query string interpolation, unescaped input in SQL), XSS (unescaped user content in HTML/DOM), CSRF, SSRF, IDOR / unauthorized object access, hardcoded secrets/API keys, path traversal, command injection.'
      );
    }
    if (profile.focusAreas.performance) {
      focusPoints.push(
        '- DATABASE & N+1 PERFORMANCE: Detect N+1 queries (database/ORM query executed inside a loop), missing indexes on foreign keys / search filters, unbounded database queries lacking LIMIT or pagination, quadratic loops O(N^2), memory leaks, unclosed connections or streams.'
      );
    }
    if (profile.focusAreas.concurrency) {
      focusPoints.push(
        '- CONCURRENCY & RACE CONDITIONS: Detect shared mutable state without proper locking/synchronization, non-atomic check-then-act, missing database transaction rollbacks, potential deadlocks.'
      );
    }
    if (profile.focusAreas.errorHandling) {
      focusPoints.push(
        '- ERROR HANDLING & RESOURCE LEAKS: Detect silently swallowed exceptions (empty catch blocks), unhandled promise rejections, lack of fallback handling for critical external network calls, connection pool starvation.'
      );
    }
    if (profile.focusAreas.architecture) {
      focusPoints.push(
        '- BUSINESS LOGIC & BOUNDARY CONDITIONS: Detect edge case flaws, off-by-one errors, state inconsistencies, broken domain invariants.'
      );
    }

    let strictnessDirective = '';
    if (profile.strictness === 'critical') {
      strictnessDirective =
        'STRICTNESS: CRITICAL ONLY. Report strictly severe blockers, exploitable security holes, data corruption hazards, or catastrophic performance bottlenecks. Do not report minor suggestions or warnings.';
    } else if (profile.strictness === 'high') {
      strictnessDirective =
        'STRICTNESS: HIGH & CRITICAL. Report major security risks, N+1 query patterns, serious performance bottlenecks, and significant error handling flaws.';
    } else {
      strictnessDirective =
        'STRICTNESS: COMPREHENSIVE. Report critical, high, and medium technical risks, but strictly adhere to the non-goals below.';
    }

    const customInstructions = profile.customInstructions?.trim()
      ? `\nUSER CUSTOM PROJECT RULES & GUIDELINES:\n${profile.customInstructions.trim()}\n`
      : '';

    const systemPrompt = `You are a Principal Staff Security & Systems Engineer conducting a critical, high-signal Pull Request review.

MISSION:
Your job is to identify high-impact issues that could lead to security exploits, production outages, database performance collapses, or data loss.

${strictnessDirective}

CRITICAL FOCUS AREAS:
${focusPoints.join('\n')}
${customInstructions}

STRICT NON-GOALS (ZERO TOLERANCE - DO NOT REPORT ANY OF THESE):
1. NEVER comment on formatting, indentation, whitespace, semicolons, or line length.
2. NEVER comment on casing conventions (e.g., camelCase vs snake_case) unless it breaks an external contract or creates an active bug.
3. NEVER make linter-level suggestions or subjective code style opinions.
4. NEVER output empty praise, conversational pleasantries, or superficial remarks.

OUTPUT FORMAT:
If and only if critical or high-risk issues are found, format each finding exactly using this structure:

### [SEVERITY: CRITICAL|HIGH|MEDIUM] [CATEGORY: Security|Performance|Concurrency|Robustness|Architecture]
**File:** <filePath>
**Line:** <lineNumber>
**Issue:** <Concise single-sentence summary of the flaw>
**Why this matters:** <Explanation of exploit vector, query explosion, or failure mechanism>
**Fix:**
\`\`\`suggestion
<Precise, production-ready replacement code snippet or correction>
\`\`\`

If NO critical issues or vulnerabilities are found, respond with:
"✅ **No critical security vulnerabilities, N+1 query patterns, or severe performance bottlenecks detected.**" followed by a 1-2 sentence high-level summary confirming the assessed components.`;

    const userPrompt = `Review the following Pull Request diff changes according to the rules above:

${diffText}
`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Parses the structured markdown output from the AI into individual review findings.
   */
  public static parseReviewOutput(rawText: string): { findings: PrReviewFinding[]; summary: string } {
    const findings: PrReviewFinding[] = [];
    const blockRegex =
      /###\s*\[SEVERITY:\s*(CRITICAL|HIGH|MEDIUM)\]\s*\[CATEGORY:\s*([^\]]+)\]\s*\n\*\*File:\*\*\s*([^\n]+)\s*\n\*\*Line:\*\*\s*([^\n]+)\s*\n\*\*Issue:\*\*\s*([^\n]+)\s*\n\*\*Why this matters:\*\*\s*([\s\S]*?)(?=\n\*\*Fix:\*\*|\n###|$)/gi;

    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = blockRegex.exec(rawText)) !== null) {
      idx++;
      const severity = match[1].toLowerCase() as 'critical' | 'high' | 'medium';
      const categoryRaw = match[2].toLowerCase().trim();
      let category: PrReviewFinding['category'] = 'robustness';
      if (categoryRaw.includes('sec')) category = 'security';
      else if (categoryRaw.includes('perf') || categoryRaw.includes('n+1')) category = 'performance';
      else if (categoryRaw.includes('concur') || categoryRaw.includes('race')) category = 'concurrency';
      else if (categoryRaw.includes('arch') || categoryRaw.includes('logic')) category = 'architecture';

      const filePath = match[3].trim().replace(/^`|`$/g, '');
      const rawLineStr = match[4].trim();
      const firstNumMatch = rawLineStr.match(/\d+/);
      const lineNumber = firstNumMatch ? parseInt(firstNumMatch[0], 10) : undefined;
      const cleanRange = rawLineStr.replace(/[^0-9\-–.,]/g, '').trim();
      const lineLabel = cleanRange || (lineNumber ? `${lineNumber}` : undefined);
      const title = match[5].trim();
      const description = match[6].trim();

      // Look for suggestion code snippet following this block
      const subChunk = rawText.substring(match.index);
      const fixMatch = subChunk.match(/\*\*Fix:\*\*\s*\n```(?:suggestion)?\s*\n([\s\S]*?)\n```/i);
      const suggestedFix = fixMatch ? fixMatch[1].trim() : undefined;

      findings.push({
        id: `finding-${idx}-${Date.now()}`,
        severity,
        category,
        filePath,
        lineNumber,
        lineLabel,
        title,
        description,
        suggestedFix,
      });
    }

    // Determine high-level summary
    let summary = '';
    if (findings.length === 0) {
      summary = rawText.includes('✅')
        ? rawText.trim()
        : '✅ No critical security vulnerabilities, N+1 queries, or severe performance bottlenecks detected.';
    } else {
      const criticalCount = findings.filter((f) => f.severity === 'critical').length;
      const highCount = findings.filter((f) => f.severity === 'high').length;
      summary = `Found ${findings.length} issue${findings.length === 1 ? '' : 's'} (${criticalCount} Critical, ${highCount} High priority).`;
    }

    return { findings, summary };
  }

  /**
   * Executes the full on-demand PR review cycle with streaming updates.
   */
  public static async runReview(
    context: ReviewContext | null,
    onChunk?: AIStreamCallback
  ): Promise<PrReviewResult> {
    await loadSettings();
    const settings = $settings.get();

    if (!settings.ai.enabled && !settings.ai.apiKey && settings.ai.provider !== 'custom') {
      return {
        success: false,
        rawText: '',
        findings: [],
        summary: '',
        totalFilesAnalyzed: 0,
        error:
          'AI Copilot is not configured. Please open the PeerPilot extension popup to add your API key (Gemini, OpenAI, Anthropic, or Ollama).',
      };
    }

    const { diffText, fileCount } = await this.collectDiff(context);
    if (!diffText || fileCount === 0) {
      return {
        success: false,
        rawText: '',
        findings: [],
        summary: '',
        totalFilesAnalyzed: 0,
        error:
          'No diff lines found on the current page. Please ensure you are viewing the "Files changed" or "Changes" tab of this PR/MR.',
      };
    }

    const { systemPrompt, userPrompt } = this.buildReviewPrompt(settings.review, diffText, context);

    const response = await AIService.generateResponse(
      settings.ai,
      systemPrompt,
      userPrompt,
      onChunk
    );

    if (!response.success) {
      return {
        success: false,
        rawText: '',
        findings: [],
        summary: '',
        totalFilesAnalyzed: fileCount,
        error: response.error || 'AI review generation failed',
      };
    }

    const { findings, summary } = this.parseReviewOutput(response.text);

    return {
      success: true,
      rawText: response.text,
      findings,
      summary,
      totalFilesAnalyzed: fileCount,
    };
  }
}
