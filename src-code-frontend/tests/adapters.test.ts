import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubAdapter } from '../src/adapters/github.adapter';
import { GitLabAdapter } from '../src/adapters/gitlab.adapter';

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;

  beforeEach(() => {
    adapter = new GitHubAdapter();
  });

  it('matches valid GitHub PR URLs and rejects other URLs', () => {
    expect(adapter.isCurrentHost(new URL('https://github.com/facebook/react/pull/1234'))).toBe(true);
    expect(adapter.isCurrentHost(new URL('https://github.com/facebook/react/pull/1234/files'))).toBe(true);
    expect(adapter.isCurrentHost(new URL('https://github.com/facebook/react/issues/1234'))).toBe(false);
    expect(adapter.isCurrentHost(new URL('https://gitlab.com/group/proj/-/merge_requests/1'))).toBe(false);
  });

  it('extracts review context from GitHub PR URLs', () => {
    const url = new URL('https://github.com/tailwindlabs/tailwindcss/pull/999/files');
    const ctx = adapter.extractReviewContext(url);

    expect(ctx).not.toBeNull();
    expect(ctx?.platform).toBe('github');
    expect(ctx?.projectPath).toBe('tailwindlabs/tailwindcss');
    expect(ctx?.reviewId).toBe('999');
    expect(ctx?.baseRef).toBe('main');
  });

  it('injects scratchpad row beneath target diff row', () => {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    tr.className = 'blob-code';
    tbody.appendChild(tr);
    table.appendChild(tbody);

    const dummyComponent = document.createElement('div');
    dummyComponent.textContent = 'Scratchpad';

    const injected = adapter.injectScratchpadRow(
      {
        element: tr,
        filePath: 'src/index.ts',
        lineNumber: 42,
        diffSide: 'right',
        codeContent: 'const a = 1;',
      },
      dummyComponent
    );

    expect(injected).not.toBeNull();
    expect(injected?.classList.contains('anchor-scratchpad-row')).toBe(true);
    expect(injected?.getAttribute('data-anchor-line')).toBe('42');
    expect(tr.nextElementSibling).toBe(injected);
  });
});

describe('GitLabAdapter', () => {
  let adapter: GitLabAdapter;

  beforeEach(() => {
    adapter = new GitLabAdapter();
  });

  it('matches GitLab SaaS and custom self-hosted domains', () => {
    const gitlabSaaS = new URL('https://gitlab.com/gitlab-org/gitlab/-/merge_requests/42');
    expect(adapter.isCurrentHost(gitlabSaaS)).toBe(true);

    const selfHosted = new URL('https://gitlab.internal-corp.net/team/project/-/merge_requests/10');
    expect(adapter.isCurrentHost(selfHosted, ['https://gitlab.internal-corp.net'])).toBe(true);

    const nonMatching = new URL('https://gitlab.unknown.net/team/project/-/merge_requests/10');
    expect(adapter.isCurrentHost(nonMatching)).toBe(false);
  });

  it('extracts nested sub-group review context from GitLab MR URLs', () => {
    const url = new URL('https://gitlab.com/enterprise/fintech/core-ledger/service/-/merge_requests/102/diffs');
    const ctx = adapter.extractReviewContext(url);

    expect(ctx).not.toBeNull();
    expect(ctx?.platform).toBe('gitlab');
    expect(ctx?.projectPath).toBe('enterprise/fintech/core-ledger/service');
    expect(ctx?.reviewId).toBe('102');
  });

  it('injects scratchpad row beneath target GitLab diff row', () => {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    tr.className = 'line_holder';
    tbody.appendChild(tr);
    table.appendChild(tbody);

    const dummyComponent = document.createElement('div');
    dummyComponent.textContent = 'GitLab Note';

    const injected = adapter.injectScratchpadRow(
      {
        element: tr,
        filePath: 'app/service.rb',
        lineNumber: 88,
        diffSide: 'left',
        codeContent: 'def execute',
      },
      dummyComponent
    );

    expect(injected).not.toBeNull();
    expect(injected?.classList.contains('anchor-scratchpad-row')).toBe(true);
    expect(injected?.getAttribute('data-anchor-line')).toBe('88');
  });

  it('filters out generic method name collisions from unrelated files during search', async () => {
    // Diff file 1: FlagStaleOrders.php (the definition file)
    const file1 = document.createElement('div');
    file1.className = 'diff-file file-holder';
    file1.setAttribute('data-blob-path', 'app/Console/Commands/FlagStaleOrders.php');
    file1.innerHTML = `
      <div class="line_holder"><div class="line_content">public function handle()</div></div>
    `;

    // Diff file 2: Unrelated SendInvoiceEmail.php that also has handle() but does NOT reference FlagStaleOrders
    const file2 = document.createElement('div');
    file2.className = 'diff-file file-holder';
    file2.setAttribute('data-blob-path', 'app/Jobs/SendInvoiceEmail.php');
    file2.innerHTML = `
      <div class="line_holder"><div class="line_content">public function handle()</div></div>
    `;

    // Diff file 3: Kernel.php that DOES reference FlagStaleOrders
    const file3 = document.createElement('div');
    file3.className = 'diff-file file-holder';
    file3.setAttribute('data-blob-path', 'app/Console/Kernel.php');
    file3.innerHTML = `
      <div class="line_holder"><div class="line_content">$schedule->command(FlagStaleOrders::class)->daily();</div></div>
      <div class="line_holder"><div class="line_content">FlagStaleOrders::handle();</div></div>
    `;

    document.body.appendChild(file1);
    document.body.appendChild(file2);
    document.body.appendChild(file3);

    const ctx = {
      platform: 'gitlab' as const,
      host: 'https://gitlab.com',
      projectPath: 'my-group/my-project',
      reviewId: '1',
      pullNumber: '1',
      baseRef: 'main',
      headRef: 'feature',
    };

    const result = await adapter.searchSymbolReferences(ctx, 'handle', undefined, 'FlagStaleOrders');

    // Only file3 (Kernel.php) should match; file2 (SendInvoiceEmail) should be excluded
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].filePath).toBe('app/Console/Kernel.php');
    expect(result.matches.some((m) => m.filePath.includes('SendInvoiceEmail'))).toBe(false);

    file1.remove();
    file2.remove();
    file3.remove();
  });
});
