const COMMON_KEYWORDS = new Set([
  // JavaScript / TypeScript
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return',
  'function', 'class', 'const', 'let', 'var', 'import', 'export', 'default', 'from',
  'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'instanceof',
  'this', 'super', 'extends', 'implements', 'interface', 'type', 'enum', 'true', 'false', 'null', 'undefined',
  // Python
  'def', 'elif', 'is', 'in', 'not', 'and', 'or', 'lambda', 'with', 'as', 'pass', 'yield',
  'global', 'nonlocal', 'assert', 'raise', 'except',
  // PHP
  'public', 'private', 'protected', 'static', 'echo', 'die', 'exit', 'use', 'namespace',
  'array', 'fn', 'match',
  // Go
  'func', 'package', 'struct', 'map', 'chan', 'go', 'select', 'defer',
]);

/**
 * Normalizes an identifier string extracted from diff text by stripping
 * language sigils, quotation marks, terminators, arrows, and whitespace.
 * Returns null if the token is empty, too short, or is a common keyword.
 */
export function sanitizeSymbol(raw: string): string | null {
  if (!raw) return null;

  // Strip leading & trailing sigils ($ in PHP, ->, ::, punctuation, quotes, parens, brackets)
  let cleaned = raw
    .replace(/^[\s$#@\->:();,."'`{}<>[\]]+|[\s$#@\->:();,."'`{}<>[\]]+$/g, '')
    .trim();

  // If there's an arrow or scope resolution inside, take the last segment (e.g. $this->getOrder -> getOrder)
  if (cleaned.includes('->')) {
    const parts = cleaned.split('->');
    cleaned = parts[parts.length - 1].trim();
  } else if (cleaned.includes('::')) {
    const parts = cleaned.split('::');
    cleaned = parts[parts.length - 1].trim();
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    cleaned = parts[parts.length - 1].trim();
  }

  // Final cleanup of any remaining parens
  cleaned = cleaned.replace(/[()]/g, '').trim();

  // Validate length and keyword collision
  if (cleaned.length < 2 || cleaned.length > 80) return null;
  if (/^\d+$/.test(cleaned)) return null; // Ignore pure numbers
  if (COMMON_KEYWORDS.has(cleaned.toLowerCase())) return null;

  return cleaned;
}
