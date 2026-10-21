export interface DeclarationMatch {
  symbol: string;
  kind: 'function' | 'class' | 'struct' | 'variable';
  language: 'php' | 'typescript' | 'javascript' | 'python' | 'go' | 'generic';
  enclosingClass?: string;
}

/**
 * Extracts candidate class or module name from a file path based on standard conventions (PascalCase basename).
 */
export function extractClassNameFromPath(filePath?: string): string | undefined {
  if (!filePath) return undefined;
  const basename = filePath.split('/').pop()?.replace(/\.[^.]+$/, '');
  if (basename && /^[A-Z][a-zA-Z0-9_]+$/.test(basename)) {
    return basename;
  }
  return undefined;
}

/**
 * Determines file language from file path extension.
 */
export function inferLanguage(filePath?: string): 'php' | 'typescript' | 'javascript' | 'python' | 'go' | 'generic' {
  if (!filePath) return 'generic';
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.php')) return 'php';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'javascript';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.go')) return 'go';
  return 'generic';
}

/**
 * Strips diff prefixes (+, -) and leading/trailing whitespace.
 * Returns null if the line is empty or is a pure comment.
 */
function cleanDiffLine(rawLine: string): string | null {
  if (!rawLine) return null;

  // Strip diff marker at beginning
  let line = rawLine.replace(/^[+\- ]/, '').trim();
  if (!line) return null;

  // Ignore lines that start with comment markers
  if (
    line.startsWith('//') ||
    line.startsWith('#') ||
    line.startsWith('/*') ||
    line.startsWith('*')
  ) {
    return null;
  }

  // Strip trailing single-line comments
  line = line.replace(/\/\/.*$/, '').replace(/#.*$/, '').trim();
  return line || null;
}

/**
 * Scans a single diff line for modified declaration signatures across
 * PHP, TypeScript/JavaScript, Python, and Go.
 */
export function detectDeclaration(rawLine: string, filePath?: string): DeclarationMatch | null {
  const line = cleanDiffLine(rawLine);
  if (!line) return null;

  const lang = inferLanguage(filePath);

  const inferredClass = extractClassNameFromPath(filePath);

  // 1. PHP Checks
  if (lang === 'php' || lang === 'generic') {
    // PHP function / method
    const phpFunc = line.match(/(?:public\s+|protected\s+|private\s+|static\s+)*function\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*\(/i);
    if (phpFunc && phpFunc[1]) {
      return { symbol: phpFunc[1], kind: 'function', language: 'php', enclosingClass: inferredClass };
    }
    // PHP class / interface / trait
    const phpClass = line.match(/(?:abstract\s+|final\s+|readonly\s+)?(?:class|interface|trait)\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/i);
    if (phpClass && phpClass[1]) {
      return { symbol: phpClass[1], kind: 'class', language: 'php', enclosingClass: phpClass[1] };
    }
  }

  // 2. TypeScript & JavaScript Checks
  if (lang === 'typescript' || lang === 'javascript' || lang === 'generic') {
    // export async function / function
    const jsFunc = line.match(/(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[(<]/);
    if (jsFunc && jsFunc[1]) {
      return { symbol: jsFunc[1], kind: 'function', language: lang === 'typescript' ? 'typescript' : 'javascript', enclosingClass: inferredClass };
    }
    // Arrow function: const myFunc = (args) => ... or async (...) => ...
    const arrowFunc = line.match(/(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);
    if (arrowFunc && arrowFunc[1]) {
      return { symbol: arrowFunc[1], kind: 'function', language: lang === 'typescript' ? 'typescript' : 'javascript', enclosingClass: inferredClass };
    }
    // Class
    const jsClass = line.match(/(?:export\s+(?:default\s+)?)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (jsClass && jsClass[1]) {
      return { symbol: jsClass[1], kind: 'class', language: lang === 'typescript' ? 'typescript' : 'javascript', enclosingClass: jsClass[1] };
    }
  }

  // 3. Python Checks
  if (lang === 'python' || lang === 'generic') {
    // def func_name(
    const pyDef = line.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (pyDef && pyDef[1]) {
      return { symbol: pyDef[1], kind: 'function', language: 'python', enclosingClass: inferredClass };
    }
    // class ClassName: or class ClassName(Base):
    const pyClass = line.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[:(]/);
    if (pyClass && pyClass[1]) {
      return { symbol: pyClass[1], kind: 'class', language: 'python', enclosingClass: pyClass[1] };
    }
  }

  // 4. Go Checks
  if (lang === 'go' || lang === 'generic') {
    // func (r *Receiver) Method( or func Standalone(
    const goFunc = line.match(/^func\s+(?:\([^)]*\)\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (goFunc && goFunc[1]) {
      return { symbol: goFunc[1], kind: 'function', language: 'go', enclosingClass: inferredClass };
    }
    // type StructName struct
    const goStruct = line.match(/^type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+struct/);
    if (goStruct && goStruct[1]) {
      return { symbol: goStruct[1], kind: 'struct', language: 'go', enclosingClass: goStruct[1] };
    }
  }

  return null;
}
