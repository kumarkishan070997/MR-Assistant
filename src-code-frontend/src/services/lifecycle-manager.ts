import { IPlatformAdapter, ReviewContext } from '../adapters/base.adapter';
import { GitHubAdapter } from '../adapters/github.adapter';
import { GitLabAdapter } from '../adapters/gitlab.adapter';

export type NavigationCallback = (adapter: IPlatformAdapter, context: ReviewContext) => void;

export class PageLifecycleManager {
  private adapters: IPlatformAdapter[] = [];
  private activeAdapter: IPlatformAdapter | null = null;
  private activeContext: ReviewContext | null = null;
  private cleanupNavigation?: () => void;
  private navigationCallbacks: NavigationCallback[] = [];

  constructor(customGitLabHosts: string[] = []) {
    this.adapters = [new GitHubAdapter(), new GitLabAdapter()];
    this.detectAndMount(customGitLabHosts);
  }

  public onNavigate(callback: NavigationCallback): () => void {
    this.navigationCallbacks.push(callback);
    // If context is already active, notify immediately
    if (this.activeAdapter && this.activeContext) {
      callback(this.activeAdapter, this.activeContext);
    }
    return () => {
      this.navigationCallbacks = this.navigationCallbacks.filter((cb) => cb !== callback);
    };
  }

  public detectAndMount(customGitLabHosts: string[] = []): boolean {
    if (typeof window === 'undefined') return false;

    const currentUrl = new URL(window.location.href);
    const matched = this.adapters.find((adapter) =>
      adapter.isCurrentHost(currentUrl, customGitLabHosts)
    );

    if (matched) {
      this.activeAdapter = matched;
      this.activeContext = matched.extractReviewContext(currentUrl);

      // Setup navigation listeners
      this.cleanupNavigation?.();
      this.cleanupNavigation = matched.observeNavigation((newCtx) => {
        this.activeContext = newCtx;
        this.notify(matched, newCtx);
      });

      if (this.activeContext) {
        this.notify(matched, this.activeContext);
      }
      return true;
    }

    return false;
  }

  private notify(adapter: IPlatformAdapter, context: ReviewContext) {
    this.navigationCallbacks.forEach((cb) => cb(adapter, context));
  }

  public getActive(): { adapter: IPlatformAdapter; context: ReviewContext } | null {
    if (this.activeAdapter && this.activeContext) {
      return { adapter: this.activeAdapter, context: this.activeContext };
    }
    return null;
  }

  public dispose() {
    this.cleanupNavigation?.();
    this.cleanupNavigation = undefined;
    this.navigationCallbacks = [];
    this.activeAdapter = null;
    this.activeContext = null;
  }
}
