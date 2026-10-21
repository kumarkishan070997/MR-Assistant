export interface QueueItem<T> {
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export class QueryQueue {
  private concurrencyLimit = 2;
  private activeCount = 0;
  private queue: Array<() => void> = [];
  private rateLimited = false;
  private inFlightMap = new Map<string, Promise<unknown>>();

  constructor(concurrencyLimit = 2) {
    this.concurrencyLimit = concurrencyLimit;
  }

  public get isRateLimited(): boolean {
    return this.rateLimited;
  }

  public setRateLimited(val: boolean): void {
    this.rateLimited = val;
  }

  public get activeRunningCount(): number {
    return this.activeCount;
  }

  public get pendingQueueLength(): number {
    return this.queue.length;
  }

  public enqueue<T>(dedupKey: string, task: () => Promise<T>): Promise<T> {
    // If deduplication key matches an in-flight request, reuse that promise
    if (this.inFlightMap.has(dedupKey)) {
      return this.inFlightMap.get(dedupKey) as Promise<T>;
    }

    const promise = new Promise<T>((resolve, reject) => {
      const execute = async () => {
        if (this.rateLimited) {
          this.inFlightMap.delete(dedupKey);
          reject(new Error('Rate limited'));
          return;
        }

        this.activeCount++;
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.activeCount--;
          this.inFlightMap.delete(dedupKey);
          this.next();
        }
      };

      if (this.activeCount < this.concurrencyLimit) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });

    this.inFlightMap.set(dedupKey, promise);
    return promise;
  }

  private next(): void {
    if (this.queue.length > 0 && this.activeCount < this.concurrencyLimit) {
      const nextTask = this.queue.shift();
      if (nextTask) nextTask();
    }
  }

  public clear(): void {
    this.queue = [];
    this.inFlightMap.clear();
    this.activeCount = 0;
  }
}

export const globalQueryQueue = new QueryQueue(2);
