import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../src/components/drawers/checklist-drawer';
import '../src/components/diff/scratchpad-row';
import '../src/components/drawers/checklist-dock';
import { AnchorChecklistDrawer } from '../src/components/drawers/checklist-drawer';
import { AnchorScratchpad } from '../src/components/diff/scratchpad-row';
import { globalStorageService } from '../src/services/storage.service';
import * as noiseReducer from '../src/services/noise-reducer.service';

describe('Senior Reviewer Accelerators & Micro-Animations', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('AnchorChecklistDrawer Senior Reviewer Features', () => {
    it('executes handleCollapseNoise and triggers toast feedback', async () => {
      const drawer = document.createElement('anchor-checklist-drawer') as AnchorChecklistDrawer;
      document.body.appendChild(drawer);
      await drawer.updateComplete;

      const spy = vi.spyOn(noiseReducer, 'collapseNoiseFiles').mockReturnValue({
        collapsedCount: 5,
        totalNoiseFiles: 5,
        noiseFilePaths: ['package-lock.json', 'yarn.lock'],
      });

      drawer.handleCollapseNoise();

      expect(spy).toHaveBeenCalled();
      await drawer.updateComplete;

      // Check toast or message
      const toast = drawer.shadowRoot?.querySelector('.toast');
      expect(toast?.textContent).toContain('Collapsed 5 noise file(s)');
    });

    it('generates structured Executive PR Verdict markdown from review results', async () => {
      const drawer = document.createElement('anchor-checklist-drawer') as AnchorChecklistDrawer;
      document.body.appendChild(drawer);
      await drawer.updateComplete;

      // Mock navigator.clipboard
      let clipboardContent = '';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockImplementation((text: string) => {
            clipboardContent = text;
            return Promise.resolve();
          }),
        },
        configurable: true,
        writable: true,
      });

      // Provide mock reviewResult with critical finding
      (drawer as any).reviewResult = {
        summary: '2 finding(s) detected',
        totalFilesAnalyzed: 10,
        findings: [
          {
            id: 'f1',
            severity: 'critical',
            category: 'security',
            title: 'SQL Injection in User Lookup',
            description: 'Direct string concatenation in raw query.',
            filePath: 'app/Services/UserService.php',
            lineNumber: 42,
            suggestedFix: '$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");',
          },
          {
            id: 'f2',
            severity: 'medium',
            category: 'performance',
            title: 'Consider Index on user_id',
            description: 'Frequent join without index.',
            filePath: 'database/migrations/order.sql',
            lineNumber: 15,
          },
        ],
        rawText: '...',
        filesWithChanges: 10,
      };

      drawer.generatePrVerdict();

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(clipboardContent).toContain('PeerPilot Senior Review Verdict: Changes Requested (1 Blocker(s))');
      expect(clipboardContent).toContain('SQL Injection in User Lookup');
      expect(clipboardContent).toContain('Consider Index on user_id');
      expect(clipboardContent).toContain('UserService.php:42');
    });

    it('handles global Alt+D shortcut to toggle drawer', async () => {
      const drawer = document.createElement('anchor-checklist-drawer') as AnchorChecklistDrawer;
      document.body.appendChild(drawer);
      await drawer.updateComplete;

      expect(drawer.isOpen).toBe(false);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', altKey: true }));
      expect(drawer.isOpen).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', altKey: true }));
      expect(drawer.isOpen).toBe(false);
    });
  });

  describe('AnchorScratchpad Feedback Chips & Deletion Animation', () => {
    it('inserts senior reviewer feedback chips with appropriate note tag', async () => {
      const scratchpad = document.createElement('anchor-scratchpad') as AnchorScratchpad;
      scratchpad.noteId = 'test-note-1';
      scratchpad.filePath = 'src/test.ts';
      scratchpad.lineNumber = 10;
      document.body.appendChild(scratchpad);
      await scratchpad.updateComplete;

      scratchpad.insertFeedbackChip('⚠️ Missing Test Case', 'bug');

      expect((scratchpad as any).content).toContain('**[⚠️ Missing Test Case]**: ');
      expect((scratchpad as any).tag).toBe('bug');
    });

    it('applies deleting class to host for 180ms before deleting note', async () => {
      vi.useFakeTimers();
      const deleteSpy = vi.spyOn(globalStorageService, 'deleteNote').mockResolvedValue(undefined);
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const scratchpad = document.createElement('anchor-scratchpad') as AnchorScratchpad;
      scratchpad.noteId = 'test-note-animated-delete';
      document.body.appendChild(scratchpad);
      await scratchpad.updateComplete;

      const deleteBtn = scratchpad.shadowRoot?.querySelector('.action-btn.delete') as HTMLButtonElement;
      deleteBtn.click();

      // Immediately after clicking, deleting class is applied
      expect(scratchpad.classList.contains('deleting')).toBe(true);
      expect(deleteSpy).not.toHaveBeenCalled();

      // Fast-forward past 180ms animation
      vi.advanceTimersByTime(200);

      expect(deleteSpy).toHaveBeenCalledWith('test-note-animated-delete');
      vi.useRealTimers();
    });
  });
});
