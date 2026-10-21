/**
 * Resolves relative repository file paths from DOM diff elements across
 * GitLab (SaaS, Self-Hosted CE/EE, Rapid Diffs) and GitHub.
 */
export function extractFilePath(el: Element | null): string {
  if (!el) return 'unknown_file';

  // Strategy 1: Find closest file container element (excluding inner content/table wrappers)
  const container =
    el.closest(
      'diff-file, .diff-file, .file-holder, [data-blob-path], [data-path], [data-file-path], .file, [data-qa-selector="diff_file"], [data-qa-selector="file_holder"]'
    ) ||
    el.closest('.diff-content, .diff-viewer')?.parentElement?.closest(
      'diff-file, .diff-file, .file-holder, [data-blob-path], [data-path], [data-file-path], .file'
    ) ||
    null;

  const attrList = [
    'data-path',
    'data-blob-path',
    'data-file-path',
    'data-new-path',
    'data-old-path',
    'data-qa-file-path',
    'title',
    'data-original-title',
  ];

  // Regex to extract valid file paths from text, stripping chevrons, icons, commit mode changes (e.g. "0 -> 100644"), and stats
  const filePathRegex =
    /(?:[a-zA-Z0-9_.-]+\/)+[a-zA-Z0-9_.-]+\.(?:[a-zA-Z]{1,8}|blade\.php)(?![a-zA-Z0-9])|[a-zA-Z0-9_.-]+\.[a-zA-Z]{1,8}(?![a-zA-Z0-9])|Dockerfile|Makefile|LICENSE/i;

  // 1. Check data attributes on container and el first (pure, unpolluted data)
  const elementsForAttrs = [container, el];
  for (const item of elementsForAttrs) {
    if (!item) continue;
    for (const attr of attrList) {
      const val = item.getAttribute(attr)?.trim();
      if (val && val !== 'unknown_file' && !val.includes(' ') && val.length > 2) {
        const match = val.match(filePathRegex);
        if (match) return match[0].replace(/^\.?\//, '');
        if (val.includes('.') || val.includes('/')) return val.replace(/^\.?\//, '');
      }
    }
  }

  // 2. Check specific header and link elements inside container
  if (container) {
    const specificHeaderElements = Array.from(
      container.querySelectorAll(
        'a[data-qa-selector="file_name_link"], .file-path-name, span.file-file-path a, .file-file-path, a.file-title-name, .file-title-name, .diff-file-title, .file-header-content a, .file-header a, .file-title a, .file-info a, .file-header strong, .file-title strong, .file-header [title], .file-title [title]'
      )
    );

    for (const headerEl of specificHeaderElements) {
      // Check attributes of header first
      for (const attr of attrList) {
        const val = headerEl.getAttribute(attr)?.trim();
        if (val && val !== 'unknown_file') {
          const match = val.match(filePathRegex);
          if (match) return match[0].replace(/^\.?\//, '');
        }
      }
      // Check text of specific header element
      const text = headerEl.textContent?.trim();
      if (text) {
        const match = text.match(filePathRegex);
        if (match) return match[0].replace(/^\.?\//, '');
      }
    }

    // Check .file-header element itself
    const fileHeader = container.querySelector('.file-header, .file-title, .diff-file-header');
    if (fileHeader) {
      const text = fileHeader.textContent?.trim();
      if (text) {
        const match = text.match(filePathRegex);
        if (match) return match[0].replace(/^\.?\//, '');
      }
    }
  }

  // 3. Check ancestor hierarchy up to 20 levels
  let walker = el.parentElement;
  let depth = 0;
  while (walker && walker !== document.body && walker !== document.documentElement && depth < 20) {
    for (const attr of attrList) {
      const val = walker.getAttribute(attr)?.trim();
      if (val && val !== 'unknown_file') {
        const match = val.match(filePathRegex);
        if (match) return match[0].replace(/^\.?\//, '');
      }
    }
    const header = walker.querySelector(
      '.file-header a, .file-title-name, .file-path-name, a[data-qa-selector="file_name_link"], .diff-file-title'
    );
    if (header) {
      const text = header.textContent?.trim();
      if (text) {
        const match = text.match(filePathRegex);
        if (match) return match[0].replace(/^\.?\//, '');
      }
    }
    walker = walker.parentElement;
    depth++;
  }

  // 4. Check active file in GitLab tree navigation
  if (typeof document !== 'undefined') {
    const activeTreeFile = document.querySelector(
      '.diff-tree-list .active [title], .file-row.active [title], [data-qa-selector="file_row"].active, .tree-item.active [title]'
    );
    const activeTitle = activeTreeFile?.getAttribute('title')?.trim();
    if (activeTitle) {
      const match = activeTitle.match(filePathRegex);
      if (match) return match[0].replace(/^\.?\//, '');
    }
  }

  return 'unknown_file';
}
