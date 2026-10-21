import { describe, it, expect } from 'vitest';
import { sanitizeSymbol } from '../src/services/symbol-sanitizer';

describe('sanitizeSymbol', () => {
  describe('JavaScript & TypeScript Identifiers', () => {
    it('extracts clean variable and function names', () => {
      expect(sanitizeSymbol('getOrderList')).toBe('getOrderList');
      expect(sanitizeSymbol('  isProcessingOrder  ')).toBe('isProcessingOrder');
      expect(sanitizeSymbol('UserProfileDTO')).toBe('UserProfileDTO');
    });

    it('strips parentheses and punctuation around function calls', () => {
      expect(sanitizeSymbol('fetchUserProfile()')).toBe('fetchUserProfile');
      expect(sanitizeSymbol('("configKey")')).toBe('configKey');
      expect(sanitizeSymbol('{ payload }')).toBe('payload');
    });

    it('extracts property or method from dotted access chains', () => {
      expect(sanitizeSymbol('this.userRepository.findUser')).toBe('findUser');
      expect(sanitizeSymbol('window.location.reload')).toBe('reload');
    });

    it('discards common JS/TS language keywords', () => {
      expect(sanitizeSymbol('const')).toBeNull();
      expect(sanitizeSymbol('function')).toBeNull();
      expect(sanitizeSymbol('class')).toBeNull();
      expect(sanitizeSymbol('return')).toBeNull();
      expect(sanitizeSymbol('async')).toBeNull();
      expect(sanitizeSymbol('await')).toBeNull();
      expect(sanitizeSymbol('import')).toBeNull();
      expect(sanitizeSymbol('true')).toBeNull();
      expect(sanitizeSymbol('null')).toBeNull();
      expect(sanitizeSymbol('undefined')).toBeNull();
    });
  });

  describe('PHP Identifiers', () => {
    it('strips leading dollar sign from variable names', () => {
      expect(sanitizeSymbol('$orderId')).toBe('orderId');
      expect(sanitizeSymbol('  $customerRecord  ')).toBe('customerRecord');
    });

    it('extracts method or property from arrow access', () => {
      expect(sanitizeSymbol('$this->orderService')).toBe('orderService');
      expect(sanitizeSymbol('$order->calculateTotal()')).toBe('calculateTotal');
    });

    it('extracts method from static scope resolution', () => {
      expect(sanitizeSymbol('OrderFactory::createFromRequest')).toBe('createFromRequest');
    });

    it('discards common PHP keywords', () => {
      expect(sanitizeSymbol('public')).toBeNull();
      expect(sanitizeSymbol('private')).toBeNull();
      expect(sanitizeSymbol('namespace')).toBeNull();
      expect(sanitizeSymbol('echo')).toBeNull();
    });
  });

  describe('Python & Go Identifiers', () => {
    it('extracts Python identifiers and discards Python keywords', () => {
      expect(sanitizeSymbol('calculate_tax_breakdown')).toBe('calculate_tax_breakdown');
      expect(sanitizeSymbol('def')).toBeNull();
      expect(sanitizeSymbol('lambda')).toBeNull();
      expect(sanitizeSymbol('yield')).toBeNull();
      expect(sanitizeSymbol('pass')).toBeNull();
    });

    it('extracts Go identifiers and discards Go keywords', () => {
      expect(sanitizeSymbol('ProcessBatchQueue')).toBe('ProcessBatchQueue');
      expect(sanitizeSymbol('func')).toBeNull();
      expect(sanitizeSymbol('defer')).toBeNull();
      expect(sanitizeSymbol('chan')).toBeNull();
      expect(sanitizeSymbol('select')).toBeNull();
    });
  });

  describe('Edge Cases and Guardrails', () => {
    it('returns null for empty strings or purely whitespace', () => {
      expect(sanitizeSymbol('')).toBeNull();
      expect(sanitizeSymbol('   ')).toBeNull();
    });

    it('returns null for purely numeric tokens', () => {
      expect(sanitizeSymbol('12345')).toBeNull();
      expect(sanitizeSymbol('0')).toBeNull();
    });

    it('returns null for single-character tokens', () => {
      expect(sanitizeSymbol('a')).toBeNull();
      expect(sanitizeSymbol('$i')).toBeNull(); // stripped to 'i' -> length 1
    });

    it('returns null for overly long tokens exceeding 80 characters', () => {
      const veryLong = 'A'.repeat(81);
      expect(sanitizeSymbol(veryLong)).toBeNull();
    });

    it('returns null when stripped token consists solely of operators or syntax brackets', () => {
      expect(sanitizeSymbol('->')).toBeNull();
      expect(sanitizeSymbol('::')).toBeNull();
      expect(sanitizeSymbol('()')).toBeNull();
      expect(sanitizeSymbol('[]')).toBeNull();
      expect(sanitizeSymbol('{}')).toBeNull();
    });
  });
});
