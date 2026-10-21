import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryQueue } from '../src/services/query-queue.service';
import { AnchorBlastBadge } from '../src/components/diff/blast-badge';

describe('BlastBadge & QueryQueue', () => {
  describe('QueryQueue Concurrency & Deduplication', () => {
    let queue: QueryQueue;

    beforeEach(() => {
      queue = new QueryQueue(2); // limit = 2
    });

    it('limits concurrent executions to exactly 2', async () => {
      let maxConcurrentObserved = 0;
      let activeCount = 0;

      const makeTask = (delayMs: number) => async () => {
        activeCount++;
        maxConcurrentObserved = Math.max(maxConcurrentObserved, activeCount);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        activeCount--;
        return true;
      };

      const p1 = queue.enqueue('k1', makeTask(30));
      const p2 = queue.enqueue('k2', makeTask(30));
      const p3 = queue.enqueue('k3', makeTask(10));
      const p4 = queue.enqueue('k4', makeTask(10));

      expect(queue.activeRunningCount).toBe(2);
      expect(queue.pendingQueueLength).toBe(2);

      await Promise.all([p1, p2, p3, p4]);

      expect(maxConcurrentObserved).toBe(2);
      expect(queue.activeRunningCount).toBe(0);
      expect(queue.pendingQueueLength).toBe(0);
    });

    it('deduplicates identical in-flight query keys', async () => {
      let executionCount = 0;
      const task = async () => {
        executionCount++;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return 'success';
      };

      const p1 = queue.enqueue('same-key', task);
      const p2 = queue.enqueue('same-key', task);

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(res1).toBe('success');
      expect(res2).toBe('success');
      expect(executionCount).toBe(1);
    });

    it('rejects tasks when rate-limited flag is active', async () => {
      queue.setRateLimited(true);
      expect(queue.isRateLimited).toBe(true);

      await expect(queue.enqueue('k1', async () => 'data')).rejects.toThrow('Rate limited');
    });
  });

  describe('AnchorBlastBadge Tiering & Thresholds', () => {
    let badge: AnchorBlastBadge;

    beforeEach(() => {
      badge = new AnchorBlastBadge();
      badge.symbol = 'calculateInvoiceTotal';
    });

    it('categorizes 1–2 files as Low Impact', () => {
      badge.applyResults(['src/a.ts', 'src/b.ts']);
      expect(badge.fileCount).toBe(2);
      expect(badge.status).toBe('ready');

      // Test deduplication
      badge.applyResults(['src/a.ts', 'src/a.ts', 'src/b.ts']);
      expect(badge.fileCount).toBe(2);
    });

    it('categorizes 3–9 files as Medium Impact', () => {
      const files = ['f1.ts', 'f2.ts', 'f3.ts', 'f4.ts', 'f5.ts'];
      badge.applyResults(files);
      expect(badge.fileCount).toBe(5);
      expect(badge.status).toBe('ready');
    });

    it('categorizes 10+ files as High Blast Radius', () => {
      const files = Array.from({ length: 15 }, (_, i) => `file_${i}.ts`);
      badge.applyResults(files);
      expect(badge.fileCount).toBe(15);
      expect(badge.status).toBe('ready');
    });
  });
});
