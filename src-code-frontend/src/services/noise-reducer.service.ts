/**
 * Noise Reducer Service
 * 
 * Automatically identifies and collapses low-signal files (lockfiles, generated schemas,
 * translation bundles, SVGs, test snapshots) in PR/MR diff views so reviewers can focus 100% on logic.
 */

export const NOISE_PATTERNS = [
  // Package manager lockfiles
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|composer\.lock|Cargo\.lock|Gemfile\.lock|go\.sum|poetry\.lock|mix\.lock)$/i,
  // Minified or bundle artifacts
  /\.(min\.js|min\.css|map)$/i,
  // Generated code & type definitions
  /(\.generated\.|\.generated\/|__generated__|\.d\.ts$|\.g\.dart$|\.pb\.go$|_pb2\.py$)/i,
  // Schema definitions
  /(^|\/)schema\.json$/i,
  // Test snapshots and mock fixtures
  /(\.snap|\.snapshot|__snapshots__|mock_data|fixtures\/.*\.json)$/i,
  // Asset icons and vector files
  /\.(svg|png|jpg|jpeg|gif|ico|webp)$/i,
  // Large translation & locale bundles
  /(^|\/)(locales|translations|i18n)\/.*\.json$/i,
];

/**
 * Checks whether a given file path is classified as a low-signal "noise" file.
 */
export function isNoiseFile(filePath?: string): boolean {
  if (!filePath) return false;
  const normalized = filePath.trim().replace(/\\/g, '/');
  return NOISE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export interface NoiseCollapseResult {
  collapsedCount: number;
  totalNoiseFiles: number;
  noiseFilePaths: string[];
}

/**
 * Collapses all noise files present in the current DOM.
 */
export function collapseNoiseFiles(doc: Document = document): NoiseCollapseResult {
  const noiseFilePaths: string[] = [];
  let collapsedCount = 0;

  // 1. GitHub diff containers
  const ghFiles = doc.querySelectorAll<HTMLElement>('div.file, div.js-file, div[data-file-path], div[data-tagsearch-path]');
  ghFiles.forEach((fileElem) => {
    const path =
      fileElem.getAttribute('data-file-path') ||
      fileElem.getAttribute('data-tagsearch-path') ||
      fileElem.querySelector('.file-header [data-path]')?.getAttribute('data-path') ||
      fileElem.querySelector('.file-info a.Link--primary')?.textContent?.trim() ||
      '';

    if (isNoiseFile(path)) {
      if (!noiseFilePaths.includes(path)) noiseFilePaths.push(path);

      // Check if file is currently expanded
      const toggleBtn = fileElem.querySelector<HTMLButtonElement>(
        'button.js-diff-toggle-button, button[aria-label*="Toggle diff"], button.js-details-target[aria-expanded]'
      );

      const isExpanded = toggleBtn
        ? toggleBtn.getAttribute('aria-expanded') !== 'false'
        : !fileElem.classList.contains('Details--on') && !fileElem.classList.contains('is-collapsed');

      if (isExpanded) {
        if (toggleBtn) {
          toggleBtn.click();
        } else {
          fileElem.classList.add('Details--on');
        }
        collapsedCount++;
      }
    }
  });

  // 2. GitLab diff containers
  const glFiles = doc.querySelectorAll<HTMLElement>('div.diff-file, div[data-path]');
  glFiles.forEach((fileElem) => {
    const path =
      fileElem.getAttribute('data-path') ||
      fileElem.querySelector('.file-title-name')?.textContent?.trim() ||
      '';

    if (isNoiseFile(path)) {
      if (!noiseFilePaths.includes(path)) noiseFilePaths.push(path);

      const isCollapsed = fileElem.classList.contains('is-collapsed') || fileElem.querySelector('.diff-content')?.classList.contains('gl-display-none');
      if (!isCollapsed) {
        const toggleBtn = fileElem.querySelector<HTMLButtonElement>('button.js-diff-toggle-btn, .diff-toggle-caret, .file-header-content');
        if (toggleBtn) {
          toggleBtn.click();
        } else {
          fileElem.classList.add('is-collapsed');
        }
        collapsedCount++;
      }
    }
  });

  return {
    collapsedCount,
    totalNoiseFiles: noiseFilePaths.length,
    noiseFilePaths,
  };
}
