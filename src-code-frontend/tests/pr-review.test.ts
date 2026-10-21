import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrReviewService } from '../src/services/pr-review.service';
import { defaultReviewProfile, ReviewProfileSettings } from '../src/stores/settings.store';

describe('PrReviewService', () => {
  describe('buildReviewPrompt', () => {
    it('strictly forbids formatting and minor lint complaints', () => {
      const profile: ReviewProfileSettings = {
        ...defaultReviewProfile,
        strictness: 'critical',
      };

      const { systemPrompt } = PrReviewService.buildReviewPrompt(profile, '+ const x = 1;');
      expect(systemPrompt).toContain('STRICT NON-GOALS');
      expect(systemPrompt).toContain('NEVER comment on formatting, indentation, whitespace');
      expect(systemPrompt).toContain('NEVER comment on casing conventions');
      expect(systemPrompt).toContain('NEVER make linter-level suggestions');
      expect(systemPrompt).toContain('STRICTNESS: CRITICAL ONLY');
    });

    it('includes user custom instructions when provided', () => {
      const profile: ReviewProfileSettings = {
        ...defaultReviewProfile,
        customInstructions: 'We use PostgreSQL 16 and Prisma. Watch for locking.',
      };

      const { systemPrompt } = PrReviewService.buildReviewPrompt(profile, '+ const x = 1;');
      expect(systemPrompt).toContain('USER CUSTOM PROJECT RULES & GUIDELINES:');
      expect(systemPrompt).toContain('We use PostgreSQL 16 and Prisma. Watch for locking.');
    });

    it('enforces SQL injection and N+1 query detection in focus areas', () => {
      const { systemPrompt } = PrReviewService.buildReviewPrompt(defaultReviewProfile, '+ const x = 1;');
      expect(systemPrompt).toContain('SQL Injection');
      expect(systemPrompt).toContain('N+1 queries');
      expect(systemPrompt).toContain('CONCURRENCY & RACE CONDITIONS');
    });
  });

  describe('parseReviewOutput', () => {
    it('parses structured critical findings with file, line, and suggestion', () => {
      const sampleAIOutput = `
Here is my review:

### [SEVERITY: CRITICAL] [CATEGORY: Security]
**File:** app/Controllers/UserController.php
**Line:** 42
**Issue:** SQL Injection vulnerability via direct parameter concatenation
**Why this matters:** Unsanitized user input is concatenated directly into the raw SQL string, permitting full database takeover.
**Fix:**
\`\`\`suggestion
$user = DB::select("SELECT * FROM users WHERE id = ?", [$userId]);
\`\`\`

### [SEVERITY: HIGH] [CATEGORY: Performance]
**File:** app/Services/ReportService.php
**Line:** 115
**Issue:** N+1 query executed inside order loop
**Why this matters:** Each iteration issues an independent SELECT query, collapsing database throughput at scale.
**Fix:**
\`\`\`suggestion
$orders = Order::with('items')->whereIn('id', $ids)->get();
\`\`\`
`;

      const result = PrReviewService.parseReviewOutput(sampleAIOutput);
      expect(result.findings).toHaveLength(2);

      const f1 = result.findings[0];
      expect(f1.severity).toBe('critical');
      expect(f1.category).toBe('security');
      expect(f1.filePath).toBe('app/Controllers/UserController.php');
      expect(f1.lineNumber).toBe(42);
      expect(f1.title).toContain('SQL Injection');
      expect(f1.suggestedFix).toContain('$user = DB::select');

      const f2 = result.findings[1];
      expect(f2.severity).toBe('high');
      expect(f2.category).toBe('performance');
      expect(f2.filePath).toBe('app/Services/ReportService.php');
      expect(f2.lineNumber).toBe(115);
      expect(f2.title).toContain('N+1 query');
      expect(f2.suggestedFix).toContain("with('items')");
    });

    it('parses line ranges without concatenating numbers (e.g. 19-28 becomes line 19 with label 19-28)', () => {
      const sampleWithRange = `
### [SEVERITY: MEDIUM] [CATEGORY: Robustness]
**File:** app/Console/Commands/FlagStaleOrders.php
**Line:** 19-28
**Issue:** is_stale flag is never reset
**Why this matters:** Orders remain flagged permanently.
**Fix:**
\`\`\`suggestion
$order->forceFill(['is_stale' => false])->save();
\`\`\`
`;
      const result = PrReviewService.parseReviewOutput(sampleWithRange);
      expect(result.findings).toHaveLength(1);
      const f = result.findings[0];
      expect(f.lineNumber).toBe(19);
      expect(f.lineLabel).toBe('19-28');
    });

    it('handles clean PRs with no issues correctly', () => {
      const sampleClean = `✅ **No critical security vulnerabilities, N+1 query patterns, or severe performance bottlenecks detected.** Verified safe input handling and proper eager loading.`;
      const result = PrReviewService.parseReviewOutput(sampleClean);
      expect(result.findings).toHaveLength(0);
      expect(result.summary).toContain('No critical security vulnerabilities');
    });
  });

  describe('collectDiffFromDOM', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('successfully extracts diff additions from a fresh MR with 0 -> 100644 file mode in GitLab', () => {
      const container = document.createElement('div');
      container.className = 'diff-file file-holder js-file';
      container.innerHTML = `
        <div class="file-header">
          <div class="file-header-content">
            <a class="file-title-name" href="#diff">app/Console/Commands/FlagStaleOrders.php</a>
            <span class="file-mode">0 -> 100644</span>
          </div>
        </div>
        <div class="diff-content">
          <table>
            <tr class="line_holder new">
              <td class="diff-line-num old_line diff-line-num-empty"></td>
              <td class="diff-line-num new_line" data-linenumber="18">18</td>
              <td class="line_content new"><span>class FlagStaleOrders extends Command</span></td>
            </tr>
            <tr class="line_holder new">
              <td class="diff-line-num old_line diff-line-num-empty"></td>
              <td class="diff-line-num new_line" data-linenumber="31">31</td>
              <td class="line_content new"><span>foreach ($staleOrders as $order) { $order->update(['status' => 'stale']); }</span></td>
            </tr>
          </table>
        </div>
      `;
      document.body.appendChild(container);

      const { diffText, fileCount } = PrReviewService.collectDiffFromDOM();
      expect(fileCount).toBe(1);
      expect(diffText).toContain('=== File: app/Console/Commands/FlagStaleOrders.php ===');
      expect(diffText).toContain('+ L18: class FlagStaleOrders extends Command');
      expect(diffText).toContain("+ L31: foreach ($staleOrders as $order) { $order->update(['status' => 'stale']); }");
    });
  });

  describe('collectDiff with raw diff fallback', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      vi.restoreAllMocks();
    });

    it('prefers canonical raw diff when fetch succeeds', async () => {
      const mockDiff = `diff --git a/app/Test.php b/app/Test.php\nnew file mode 100644\n--- /dev/null\n+++ b/app/Test.php\n@@ -0,0 +1,5 @@\n+<?php\n+echo "hello";`;
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        text: async () => mockDiff,
      } as Response);

      const result = await PrReviewService.collectDiff({
        platform: 'gitlab',
        host: 'https://gitlab.com',
        projectPath: 'group/project',
        pullNumber: '42',
        reviewId: '42',
        baseRef: 'main',
        headRef: 'feature',
      });

      expect(result.fileCount).toBe(1);
      expect(result.diffText).toContain('diff --git a/app/Test.php b/app/Test.php');
      expect(result.diffText).toContain('+echo "hello";');
    });

    it('falls back to DOM scraping when fetch returns 404 or fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const container = document.createElement('div');
      container.className = 'diff-file file-holder';
      container.innerHTML = `
        <div class="file-header"><a class="file-title-name">src/index.ts</a></div>
        <div class="diff-content">
          <table>
            <tr class="line_holder new">
              <td class="diff-line-num new_line" data-linenumber="1">1</td>
              <td class="line_content new">console.log("fallback");</td>
            </tr>
          </table>
        </div>
      `;
      document.body.appendChild(container);

      const result = await PrReviewService.collectDiff({
        platform: 'gitlab',
        host: 'https://gitlab.com',
        projectPath: 'group/project',
        pullNumber: '42',
        reviewId: '42',
        baseRef: 'main',
        headRef: 'feature',
      });

      expect(result.fileCount).toBe(1);
      expect(result.diffText).toContain('src/index.ts');
      expect(result.diffText).toContain('+ L1: console.log("fallback");');
    });
  });
});
