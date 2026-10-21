import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAdapter } from '../src/adapters/github.adapter';
import { GitLabAdapter } from '../src/adapters/gitlab.adapter';
import { DiffLineContext } from '../src/adapters/base.adapter';
import { LineNote, $activeNotes } from '../src/stores/notes.store';
import { AnchorChecklistDrawer } from '../src/components/drawers/checklist-drawer';

describe('Comment Promotion & Checklist Grouping', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    $activeNotes.set({});
  });

  describe('groupNotesByFile', () => {
    it('correctly clusters notes by their filePath', () => {
      const drawer = new AnchorChecklistDrawer();
      const notes: LineNote[] = [
        {
          id: 'n1',
          platform: 'github',
          projectPath: 'org/repo',
          pullNumber: '1',
          filePath: 'src/app.ts',
          lineNumber: 10,
          content: 'Note 1',
          isCollapsed: false,
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'n2',
          platform: 'github',
          projectPath: 'org/repo',
          pullNumber: '1',
          filePath: 'src/utils.ts',
          lineNumber: 25,
          content: 'Note 2',
          isCollapsed: false,
          createdAt: 2,
          updatedAt: 2,
        },
        {
          id: 'n3',
          platform: 'github',
          projectPath: 'org/repo',
          pullNumber: '1',
          filePath: 'src/app.ts',
          lineNumber: 42,
          content: 'Note 3',
          isCollapsed: false,
          createdAt: 3,
          updatedAt: 3,
        },
      ];

      const grouped = drawer.groupNotesByFile(notes);
      expect(Object.keys(grouped)).toEqual(['src/app.ts', 'src/utils.ts']);
      expect(grouped['src/app.ts']).toHaveLength(2);
      expect(grouped['src/utils.ts']).toHaveLength(1);
    });
  });

  describe('GitHubAdapter.triggerNativeComment', () => {
    it('locates .js-add-line-comment, clicks it, and populates the injected textarea', async () => {
      const adapter = new GitHubAdapter();

      // Mock GitHub DOM structure
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.className = 'blob-code';

      const commentBtn = document.createElement('button');
      commentBtn.className = 'js-add-line-comment';
      let buttonClicked = false;
      commentBtn.addEventListener('click', () => {
        buttonClicked = true;
        // Simulate GitHub injecting the inline comment form row
        const inlineFormRow = document.createElement('tr');
        inlineFormRow.className = 'inline-comments';
        const textarea = document.createElement('textarea');
        textarea.className = 'js-comment-field';
        inlineFormRow.appendChild(textarea);
        row.after(inlineFormRow);
      });

      row.appendChild(commentBtn);
      tbody.appendChild(row);
      table.appendChild(tbody);
      document.body.appendChild(table);

      const lineCtx: DiffLineContext = {
        element: row,
        filePath: 'src/test.ts',
        lineNumber: 15,
        diffSide: 'right',
        codeContent: 'const a = 1;',
      };

      const commentText = 'Please extract this constant into config.';
      const success = await adapter.triggerNativeComment(lineCtx, commentText);

      expect(buttonClicked).toBe(true);
      expect(success).toBe(true);

      const injectedTextarea = document.querySelector<HTMLTextAreaElement>('textarea.js-comment-field');
      expect(injectedTextarea).not.toBeNull();
      expect(injectedTextarea?.value).toBe(commentText);
    });

    it('returns false if native comment button is missing from line row', async () => {
      const adapter = new GitHubAdapter();
      const row = document.createElement('tr');

      const lineCtx: DiffLineContext = {
        element: row,
        filePath: 'src/test.ts',
        lineNumber: 15,
        diffSide: 'right',
        codeContent: '',
      };

      const success = await adapter.triggerNativeComment(lineCtx, 'Test comment');
      expect(success).toBe(false);
    });
  });

  describe('GitLabAdapter.triggerNativeComment', () => {
    it('locates .js-add-diff-note-button, clicks it, and populates the note-textarea', async () => {
      const adapter = new GitLabAdapter();

      // Mock GitLab DOM structure
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.className = 'line_holder';

      const noteBtn = document.createElement('button');
      noteBtn.className = 'js-add-diff-note-button';
      let buttonClicked = false;
      noteBtn.addEventListener('click', () => {
        buttonClicked = true;
        // Simulate GitLab injecting the diff discussion form
        const discussionRow = document.createElement('tr');
        discussionRow.className = 'notes_holder';
        const textarea = document.createElement('textarea');
        textarea.className = 'note-textarea';
        discussionRow.appendChild(textarea);
        row.after(discussionRow);
      });

      row.appendChild(noteBtn);
      tbody.appendChild(row);
      table.appendChild(tbody);
      document.body.appendChild(table);

      const lineCtx: DiffLineContext = {
        element: row,
        filePath: 'app/models/user.rb',
        lineNumber: 88,
        diffSide: 'right',
        codeContent: 'def full_name',
      };

      const commentText = 'Consider memoizing this helper method.';
      const success = await adapter.triggerNativeComment(lineCtx, commentText);

      expect(buttonClicked).toBe(true);
      expect(success).toBe(true);

      const injectedTextarea = document.querySelector<HTMLTextAreaElement>('textarea.note-textarea');
      expect(injectedTextarea).not.toBeNull();
      expect(injectedTextarea?.value).toBe(commentText);
    });

    it('clicks submit button if present in the comment form', async () => {
      const adapter = new GitLabAdapter();

      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.className = 'line_holder';

      const noteBtn = document.createElement('button');
      noteBtn.setAttribute('data-testid', 'add-comment-icon');

      let submitClicked = false;
      noteBtn.addEventListener('click', () => {
        const discussionRow = document.createElement('tr');
        discussionRow.className = 'notes_holder';

        const form = document.createElement('form');
        form.className = 'new-note';

        const textarea = document.createElement('textarea');
        textarea.setAttribute('data-testid', 'comment-textarea');

        const submitBtn = document.createElement('button');
        submitBtn.setAttribute('data-testid', 'comment-now-button');
        submitBtn.addEventListener('click', (e) => {
          e.preventDefault();
          submitClicked = true;
        });

        form.appendChild(textarea);
        form.appendChild(submitBtn);
        discussionRow.appendChild(form);
        row.after(discussionRow);
      });

      row.appendChild(noteBtn);
      tbody.appendChild(row);
      table.appendChild(tbody);
      document.body.appendChild(table);

      const lineCtx: DiffLineContext = {
        element: row,
        filePath: 'app/models/user.rb',
        lineNumber: 90,
        diffSide: 'right',
        codeContent: 'def email',
      };

      const success = await adapter.triggerNativeComment(lineCtx, 'Add validation');
      expect(success).toBe(true);
      expect(submitClicked).toBe(true);
    });

    it('calls postDiffDiscussionApi fallback when DOM button is missing and token is provided', async () => {
      const adapter = new GitLabAdapter();
      const row = document.createElement('tr');

      const lineCtx: DiffLineContext = {
        element: row,
        filePath: 'app/models/user.rb',
        lineNumber: 100,
        diffSide: 'right',
        codeContent: '',
      };

      const ctx = {
        platform: 'gitlab' as const,
        host: 'https://gitlab.com',
        projectPath: 'my-group/my-project',
        reviewId: '1',
        pullNumber: '1',
        baseRef: 'main',
        headRef: 'feature',
      };

      const apiSpy = vi.spyOn(adapter, 'postDiffDiscussionApi').mockResolvedValue(true);

      const success = await adapter.triggerNativeComment(lineCtx, 'Fallback comment', 'glpat-xyz', ctx);
      expect(success).toBe(true);
      expect(apiSpy).toHaveBeenCalledWith(ctx, 'app/models/user.rb', 100, 'Fallback comment', 'glpat-xyz', 'right');
    });
  });
});
