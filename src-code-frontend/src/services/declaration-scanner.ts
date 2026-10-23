export type SupportedLanguage =
  | 'php'
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'java'
  | 'csharp'
  | 'rust'
  | 'ruby'
  | 'kotlin'
  | 'swift'
  | 'cpp'
  | 'generic';

export interface DeclarationMatch {
  symbol: string;
  kind: 'function' | 'class' | 'struct' | 'variable';
  language: SupportedLanguage;
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
export function inferLanguage(filePath?: string): SupportedLanguage {
  if (!filePath) return 'generic';
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.php')) return 'php';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'javascript';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.go')) return 'go';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.cs')) return 'csharp';
  if (lower.endsWith('.rs')) return 'rust';
  if (lower.endsWith('.rb')) return 'ruby';
  if (lower.endsWith('.kt') || lower.endsWith('.kts')) return 'kotlin';
  if (lower.endsWith('.swift')) return 'swift';
  if (
    lower.endsWith('.cpp') ||
    lower.endsWith('.cc') ||
    lower.endsWith('.cxx') ||
    lower.endsWith('.c') ||
    lower.endsWith('.h') ||
    lower.endsWith('.hpp')
  ) {
    return 'cpp';
  }
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
 * PHP, TypeScript/JavaScript, Python, Go, Java, C#, Rust, Ruby, Kotlin, Swift, and C/C++.
 */
export function detectDeclaration(rawLine: string, filePath?: string): DeclarationMatch | null {
  const line = cleanDiffLine(rawLine);
  if (!line) return null;

  const lang = inferLanguage(filePath);
  const inferredClass = extractClassNameFromPath(filePath);

  // 1. PHP Checks
  if (lang === 'php' || lang === 'generic') {
    const phpFunc = line.match(/(?:public\s+|protected\s+|private\s+|static\s+)*function\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*\(/i);
    if (phpFunc && phpFunc[1]) {
      return { symbol: phpFunc[1], kind: 'function', language: 'php', enclosingClass: inferredClass };
    }
    const phpClass = line.match(/(?:abstract\s+|final\s+|readonly\s+)?(?:class|interface|trait)\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/i);
    if (phpClass && phpClass[1]) {
      return { symbol: phpClass[1], kind: 'class', language: 'php', enclosingClass: phpClass[1] };
    }
  }

  // 2. TypeScript & JavaScript Checks
  if (lang === 'typescript' || lang === 'javascript' || lang === 'generic') {
    const jsFunc = line.match(/(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[(<]/);
    if (jsFunc && jsFunc[1]) {
      return { symbol: jsFunc[1], kind: 'function', language: lang === 'typescript' ? 'typescript' : 'javascript', enclosingClass: inferredClass };
    }
    const arrowFunc = line.match(/(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);
    if (arrowFunc && arrowFunc[1]) {
      return { symbol: arrowFunc[1], kind: 'function', language: lang === 'typescript' ? 'typescript' : 'javascript', enclosingClass: inferredClass };
    }
    const jsClass = line.match(/(?:export\s+(?:default\s+)?)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (jsClass && jsClass[1]) {
      return { symbol: jsClass[1], kind: 'class', language: lang === 'typescript' ? 'typescript' : 'javascript', enclosingClass: jsClass[1] };
    }
  }

  // 3. Python Checks
  if (lang === 'python' || lang === 'generic') {
    const pyDef = line.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (pyDef && pyDef[1]) {
      return { symbol: pyDef[1], kind: 'function', language: 'python', enclosingClass: inferredClass };
    }
    const pyClass = line.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[:(]/);
    if (pyClass && pyClass[1]) {
      return { symbol: pyClass[1], kind: 'class', language: 'python', enclosingClass: pyClass[1] };
    }
  }

  // 4. Go Checks
  if (lang === 'go' || lang === 'generic') {
    const goFunc = line.match(/^func\s+(?:\([^)]*\)\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (goFunc && goFunc[1]) {
      return { symbol: goFunc[1], kind: 'function', language: 'go', enclosingClass: inferredClass };
    }
    const goStruct = line.match(/^type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+struct/);
    if (goStruct && goStruct[1]) {
      return { symbol: goStruct[1], kind: 'struct', language: 'go', enclosingClass: goStruct[1] };
    }
  }

  // 5. Java & C# Checks
  if (lang === 'java' || lang === 'csharp' || lang === 'generic') {
    const jClass = line.match(/(?:public|protected|private|abstract|final|static|sealed)?\s*(?:class|interface|record|enum|struct)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (jClass && jClass[1]) {
      return { symbol: jClass[1], kind: 'class', language: lang === 'csharp' ? 'csharp' : 'java', enclosingClass: jClass[1] };
    }
    const jMethod = line.match(/(?:public|protected|private|static|final|async|override|virtual)\s+[\w<>[\],\s]+\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (jMethod && jMethod[1] && !['if', 'for', 'while', 'switch', 'catch'].includes(jMethod[1])) {
      return { symbol: jMethod[1], kind: 'function', language: lang === 'csharp' ? 'csharp' : 'java', enclosingClass: inferredClass };
    }
  }

  // 6. Rust Checks
  if (lang === 'rust' || lang === 'generic') {
    const rsFn = line.match(/(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[<(]/);
    if (rsFn && rsFn[1]) {
      return { symbol: rsFn[1], kind: 'function', language: 'rust', enclosingClass: inferredClass };
    }
    const rsType = line.match(/(?:pub(?:\([^)]*\))?\s+)?(?:struct|enum|trait|union)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (rsType && rsType[1]) {
      return { symbol: rsType[1], kind: 'struct', language: 'rust', enclosingClass: rsType[1] };
    }
  }

  // 7. Ruby Checks
  if (lang === 'ruby' || lang === 'generic') {
    const rbDef = line.match(/^def\s+(?:self\.)?([a-zA-Z_][a-zA-Z0-9_]*[!?=]?)/);
    if (rbDef && rbDef[1]) {
      return { symbol: rbDef[1], kind: 'function', language: 'ruby', enclosingClass: inferredClass };
    }
    const rbClass = line.match(/^(?:class|module)\s+([a-zA-Z_][a-zA-Z0-9_]*(?:::[a-zA-Z_][a-zA-Z0-9_]*)*)/);
    if (rbClass && rbClass[1]) {
      const cls = rbClass[1].split('::').pop() || rbClass[1];
      return { symbol: cls, kind: 'class', language: 'ruby', enclosingClass: cls };
    }
  }

  // 8. Kotlin Checks
  if (lang === 'kotlin' || lang === 'generic') {
    const ktFun = line.match(/(?:(?:public|private|protected|internal|override|suspend|inline)\s+)*fun\s+(?:<[^>]+>\s+)?(?:[a-zA-Z0-9_]+\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (ktFun && ktFun[1]) {
      return { symbol: ktFun[1], kind: 'function', language: 'kotlin', enclosingClass: inferredClass };
    }
    const ktClass = line.match(/(?:data\s+|sealed\s+|enum\s+)?(?:class|interface|object)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (ktClass && ktClass[1]) {
      return { symbol: ktClass[1], kind: 'class', language: 'kotlin', enclosingClass: ktClass[1] };
    }
  }

  // 9. Swift Checks
  if (lang === 'swift' || lang === 'generic') {
    const swiftFunc = line.match(/(?:(?:public|private|fileprivate|internal|open|static|override)\s+)*func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[<(]/);
    if (swiftFunc && swiftFunc[1]) {
      return { symbol: swiftFunc[1], kind: 'function', language: 'swift', enclosingClass: inferredClass };
    }
    const swiftClass = line.match(/(?:class|struct|protocol|enum|actor)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (swiftClass && swiftClass[1]) {
      return { symbol: swiftClass[1], kind: 'class', language: 'swift', enclosingClass: swiftClass[1] };
    }
  }

  // 10. C / C++ Checks
  if (lang === 'cpp' || lang === 'generic') {
    const cppClass = line.match(/(?:class|struct)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::|{|\n|$)/);
    if (cppClass && cppClass[1]) {
      return { symbol: cppClass[1], kind: 'class', language: 'cpp', enclosingClass: cppClass[1] };
    }
    const cppMethod = line.match(/(?:([a-zA-Z_][a-zA-Z0-9_]*)::)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*(?:const)?\s*(?:override)?\s*[{;]?$/);
    if (cppMethod && cppMethod[2] && !['if', 'for', 'while', 'switch', 'catch', 'return'].includes(cppMethod[2])) {
      return { symbol: cppMethod[2], kind: 'function', language: 'cpp', enclosingClass: cppMethod[1] || inferredClass };
    }
  }

  return null;
}
