import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../src/services/storage.service';
import { buildNoteKey, $activeNotes, LineNote } from '../src/stores/notes.store';

describe('StorageService & Notes Store', () => {
  let service: StorageService;
  let mockStorage: Record<string, unknown> = {};

  beforeEach(() => {
    vi.useFakeTimers();
    mockStorage = {};

    // Mock global chrome.storage.local
    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
            const key = keys[0];
            callback({ [key]: mockStorage[key] || {} });
          }),
          set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
            Object.assign(mockStorage, items);
            if (callback) callback();
          }),
        },
      },
    } as unknown as typeof chrome;

    service = new StorageService();
    $activeNotes.set({});
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('buildNoteKey', () => {
    it('creates canonical storage keys across GitHub and GitLab paths', () => {
      const ghKey = buildNoteKey('github', 'facebook/react', '100', 'packages/react/src/index.js', 42);
      expect(ghKey).toBe('github_facebook_react_100_packages_react_src_index.js_42');

      const glKey = buildNoteKey('gitlab', 'gitlab-org/subgroup/deep/repo', '999', 'lib/api/v4/users.rb', 15);
      expect(glKey).toBe('gitlab_gitlab-org_subgroup_deep_repo_999_lib_api_v4_users.rb_15');
    });
  });

  describe('Debounced Persistence (300ms Window)', () => {
    it('batches rapid keystroke updates and writes to chrome.storage.local exactly once after 300ms idle', async () => {
      const noteId = buildNoteKey('github', 'owner/repo', '1', 'file.ts', 10);
      const baseNote: LineNote = {
        id: noteId,
        platform: 'github',
        projectPath: 'owner/repo',
        pullNumber: '1',
        filePath: 'file.ts',
        lineNumber: 10,
        content: 'Draft 1',
        isCollapsed: false,
        createdAt: 1000,
        updatedAt: 1000,
      };

      // Keystroke 1: "Draft 1"
      service.saveNoteDebounced({ ...baseNote, content: 'Draft 1' });
      // In-memory store updates immediately for snappy UI
      expect($activeNotes.get()[noteId].content).toBe('Draft 1');
      expect(chrome.storage.local.set).not.toHaveBeenCalled();

      // 100ms later, Keystroke 2: "Draft 2"
      vi.advanceTimersByTime(100);
      service.saveNoteDebounced({ ...baseNote, content: 'Draft 2' });
      expect($activeNotes.get()[noteId].content).toBe('Draft 2');
      expect(chrome.storage.local.set).not.toHaveBeenCalled();

      // 100ms later, Keystroke 3: "Draft 3"
      vi.advanceTimersByTime(100);
      service.saveNoteDebounced({ ...baseNote, content: 'Draft 3' });
      expect($activeNotes.get()[noteId].content).toBe('Draft 3');
      expect(chrome.storage.local.set).not.toHaveBeenCalled();

      // Advance by full 300ms idle window
      vi.advanceTimersByTime(300);

      // Verify chrome.storage.local.set was called exactly once with the latest content
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
      const stored = mockStorage['review_sessions'] as Record<string, LineNote>;
      expect(stored[noteId].content).toBe('Draft 3');
    });
  });

  describe('Delete Note', () => {
    it('removes the note from in-memory atom and storage', async () => {
      const noteId = buildNoteKey('github', 'owner/repo', '1', 'file.ts', 10);
      const note: LineNote = {
        id: noteId,
        platform: 'github',
        projectPath: 'owner/repo',
        pullNumber: '1',
        filePath: 'file.ts',
        lineNumber: 10,
        content: 'To be deleted',
        isCollapsed: false,
        createdAt: 1000,
        updatedAt: 1000,
      };

      await service.saveNoteImmediate(note);
      expect($activeNotes.get()[noteId]).toBeDefined();

      await service.deleteNote(noteId);
      expect($activeNotes.get()[noteId]).toBeUndefined();
      const stored = mockStorage['review_sessions'] as Record<string, LineNote>;
      expect(stored[noteId]).toBeUndefined();
    });
  });

  describe('loadNotesForReview', () => {
    it('filters notes belonging exclusively to current review session', async () => {
      const note1 = {
        id: buildNoteKey('github', 'owner/repo', '1', 'f1.ts', 1),
        platform: 'github' as const,
        projectPath: 'owner/repo',
        pullNumber: '1',
        filePath: 'f1.ts',
        lineNumber: 1,
        content: 'PR 1 note',
        isCollapsed: false,
        createdAt: 1,
        updatedAt: 1,
      };
      const note2 = {
        id: buildNoteKey('github', 'owner/repo', '2', 'f2.ts', 1),
        platform: 'github' as const,
        projectPath: 'owner/repo',
        pullNumber: '2',
        filePath: 'f2.ts',
        lineNumber: 1,
        content: 'PR 2 note',
        isCollapsed: false,
        createdAt: 2,
        updatedAt: 2,
      };

      mockStorage['review_sessions'] = {
        [note1.id]: note1,
        [note2.id]: note2,
      };

      const result = await service.loadNotesForReview('github', 'owner/repo', '1');
      expect(Object.keys(result)).toHaveLength(1);
      expect(result[note1.id]).toBeDefined();
      expect(result[note2.id]).toBeUndefined();
      expect($activeNotes.get()[note1.id]).toBeDefined();
    });

    it('ignores empty or whitespace-only notes from storage', async () => {
      const emptyNote = {
        id: buildNoteKey('github', 'owner/repo', '1', 'empty.ts', 5),
        platform: 'github' as const,
        projectPath: 'owner/repo',
        pullNumber: '1',
        filePath: 'empty.ts',
        lineNumber: 5,
        content: '   ',
        isCollapsed: false,
        createdAt: 1,
        updatedAt: 1,
      };

      mockStorage['review_sessions'] = {
        [emptyNote.id]: emptyNote,
      };

      const result = await service.loadNotesForReview('github', 'owner/repo', '1');
      expect(Object.keys(result)).toHaveLength(0);
      expect($activeNotes.get()[emptyNote.id]).toBeUndefined();
    });
  });

  describe('Empty note prevention', () => {
    it('deletes note if saveNoteImmediate is called with empty or whitespace content', async () => {
      const noteId = buildNoteKey('github', 'owner/repo', '1', 'file.ts', 10);
      const note: LineNote = {
        id: noteId,
        platform: 'github',
        projectPath: 'owner/repo',
        pullNumber: '1',
        filePath: 'file.ts',
        lineNumber: 10,
        content: '   ',
        isCollapsed: false,
        createdAt: 1000,
        updatedAt: 1000,
      };

      await service.saveNoteImmediate(note);
      expect($activeNotes.get()[noteId]).toBeUndefined();
      const stored = mockStorage['review_sessions'] as Record<string, LineNote> | undefined;
      expect(stored?.[noteId]).toBeUndefined();
    });
  });
});
