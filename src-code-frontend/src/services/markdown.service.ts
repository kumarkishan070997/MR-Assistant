import { marked } from 'marked';
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'b', 'i', 'em', 'strong', 'code', 'pre',
  'ul', 'ol', 'li', 'p', 'br', 'a',
  'blockquote', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'del', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'title', 'class'];

function getPurify(): { sanitize: typeof DOMPurify.sanitize } {
  if (typeof DOMPurify === 'function') {
    return (DOMPurify as unknown as (win: unknown) => { sanitize: typeof DOMPurify.sanitize })(
      typeof window !== 'undefined' ? window : {}
    );
  }
  return DOMPurify;
}

/**
 * Parses markdown into HTML and sanitizes it using DOMPurify with strict
 * tag and attribute whitelisting, preventing XSS and dangerous URI schemes.
 */
export function renderSanitizedMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown || !rawMarkdown.trim()) {
    return '';
  }

  // Synchronously parse markdown to HTML
  const rawHtml = marked.parse(rawMarkdown, { async: false }) as string;
  // Sanitize HTML with DOMPurify
  const purify = getPurify();

  const sanitized = purify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
  });

  return sanitized;
}
