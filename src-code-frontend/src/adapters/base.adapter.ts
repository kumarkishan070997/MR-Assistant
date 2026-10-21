export interface ReviewContext {
  platform: 'github' | 'gitlab';
  host: string;
  projectPath: string; // e.g. "owner/repo" or "group/subgroup/project"
  reviewId: string;    // Pull request number or Merge request IID
  pullNumber: string;  // Unified review / PR / MR ID
  baseRef: string;     // Target branch (e.g. "main")
  headRef: string;     // Source branch
}

export interface DiffLineContext {
  element: HTMLElement;
  filePath: string;
  lineNumber: number;
  diffSide: 'left' | 'right';
  codeContent: string;
}

export interface SymbolReferenceMatch {
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  matchUrl: string;
}

export interface SymbolReferenceResult {
  symbol: string;
  totalMatches: number;
  matches: SymbolReferenceMatch[];
  rateLimited?: boolean;
  errorMessage?: string;
}

export interface IPlatformAdapter {
  readonly platformId: 'github' | 'gitlab';

  // Host & Context Detection
  isCurrentHost(url: URL, customHosts: string[]): boolean;
  extractReviewContext(url?: URL): ReviewContext | null;
  observeNavigation(onNavigate: (ctx: ReviewContext) => void): () => void;

  // DOM Layout & Selectors
  getDiffContainer(): HTMLElement | null;
  scanDiffLines(container: HTMLElement): DiffLineContext[];
  injectScratchpadRow(line: DiffLineContext, component: HTMLElement): HTMLElement | null;
  triggerNativeComment(
    line: DiffLineContext,
    text: string,
    token?: string,
    ctx?: ReviewContext
  ): Promise<boolean>;

  // API Calls
  searchSymbolReferences(
    ctx: ReviewContext,
    symbol: string,
    token?: string,
    enclosingClass?: string
  ): Promise<SymbolReferenceResult>;

  verifyConnection(token: string, baseUrl?: string): Promise<{ valid: boolean; rateLimitRemaining?: number; error?: string }>;
}
