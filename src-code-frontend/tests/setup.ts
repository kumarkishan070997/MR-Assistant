// Setup and polyfills for Happy-DOM environment in Vitest

if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
  // Polyfill Happy-DOM's Node.prototype.nodeName getter so DOMPurify can correctly
  // read element tag names without stripping allowed elements
  Object.defineProperty(Node.prototype, 'nodeName', {
    get() {
      if (this.nodeType === 1) {
        return this.tagName || this.localName?.toUpperCase() || '';
      }
      if (this.nodeType === 3) return '#text';
      if (this.nodeType === 8) return '#comment';
      if (this.nodeType === 9) return '#document';
      if (this.nodeType === 11) return '#document-fragment';
      return '';
    },
    configurable: true,
  });

  // Polyfill alert if not defined in test environment
  if (typeof (window as unknown as Record<string, unknown>).alert === 'undefined') {
    (window as unknown as Record<string, unknown>).alert = () => {};
  }
}
