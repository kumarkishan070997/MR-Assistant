import { describe, it, expect } from 'vitest';
import { renderSanitizedMarkdown } from '../src/services/markdown.service';

describe('renderSanitizedMarkdown (Marked + DOMPurify)', () => {
  describe('Valid Markdown Rendering', () => {
    it('renders basic formatting: bold, italic, headings', () => {
      const input = '# Header 1\n\n**Bold text** and *italic text*';
      const output = renderSanitizedMarkdown(input);

      expect(output).toContain('<h1>Header 1</h1>');
      expect(output).toContain('<strong>Bold text</strong>');
      expect(output).toContain('<em>italic text</em>');
    });

    it('renders unordered and ordered lists', () => {
      const input = '- Item A\n- Item B\n\n1. First\n2. Second';
      const output = renderSanitizedMarkdown(input);

      expect(output).toContain('<ul>');
      expect(output).toContain('<li>Item A</li>');
      expect(output).toContain('<ol>');
      expect(output).toContain('<li>First</li>');
    });

    it('renders fenced code blocks and inline code', () => {
      const input = 'Check `fooBar()`:\n\n```ts\nconst x = 42;\n```';
      const output = renderSanitizedMarkdown(input);

      expect(output).toContain('<code>fooBar()</code>');
      expect(output).toContain('<pre>');
      expect(output).toContain('const x = 42;');
    });
  });

  describe('XSS Defense and Malicious Input Neutralization', () => {
    it('completely strips script tags', () => {
      const malicious = 'Normal note\n\n<script>alert("hacked")</script>';
      const output = renderSanitizedMarkdown(malicious);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert("hacked")');
      expect(output).toContain('Normal note');
    });

    it('strips inline event handlers (onerror, onload, onclick)', () => {
      const malicious = '<img src="invalid-image.jpg" onerror="alert(document.cookie)">';
      const output = renderSanitizedMarkdown(malicious);

      expect(output).not.toContain('onerror');
      expect(output).not.toContain('alert');
    });

    it('neutralizes javascript: URI schemes in links', () => {
      const malicious = '[Malicious Link](javascript:alert("pwned"))';
      const output = renderSanitizedMarkdown(malicious);

      expect(output).not.toContain('javascript:');
      expect(output).not.toContain('alert("pwned")');
    });

    it('strips dangerous embedded iframe elements', () => {
      const malicious = '<iframe src="about:blank"></iframe>';
      const output = renderSanitizedMarkdown(malicious);
      expect(output).not.toContain('<iframe');
    });

    it('strips dangerous embedded embed elements', () => {
      const malicious = '<embed src="malware.swf">';
      const output = renderSanitizedMarkdown(malicious);
      expect(output).not.toContain('<embed');
    });

    it('strips dangerous embedded object elements', () => {
      const malicious = '<object data="exploit.pdf"></object>';
      const output = renderSanitizedMarkdown(malicious);
      expect(output).not.toContain('<object');
    });
  });

  describe('Edge Cases', () => {
    it('returns empty string for empty or whitespace-only inputs', () => {
      expect(renderSanitizedMarkdown('')).toBe('');
      expect(renderSanitizedMarkdown('   \n  \t ')).toBe('');
    });
  });
});
