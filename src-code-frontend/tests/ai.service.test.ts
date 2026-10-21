import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService, AIAction, AICallContext } from '../src/services/ai/ai.service';
import { AISettings } from '../src/stores/settings.store';

describe('AIService', () => {
  const dummyContext: AICallContext = {
    filePath: 'app/Http/Controllers/OrderController.php',
    lineNumber: 42,
    codeSnippet: 'public function processOrder(Order $order) { $order->pay(); }',
    enclosingClass: 'OrderController',
    userDraft: 'needs null check',
  };

  const geminiSettings: AISettings = {
    enabled: true,
    provider: 'gemini',
    apiKey: 'test-gemini-key',
    model: 'gemini-2.5-flash',
  };

  const openaiSettings: AISettings = {
    enabled: true,
    provider: 'openai',
    apiKey: 'test-openai-key',
    model: 'gpt-4o-mini',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildPrompt', () => {
    it('creates appropriate prompt for explain action', () => {
      const { systemPrompt, userPrompt } = AIService.buildPrompt('explain', dummyContext);
      expect(systemPrompt.toLowerCase()).toContain('explain');
      expect(userPrompt).toContain('OrderController.php:42');
      expect(userPrompt).toContain('public function processOrder');
    });

    it('creates appropriate prompt for spot_bugs action', () => {
      const { systemPrompt, userPrompt } = AIService.buildPrompt('spot_bugs', dummyContext);
      expect(systemPrompt).toContain('bugs');
      expect(userPrompt).toContain('OrderController');
    });

    it('creates appropriate prompt for suggest_fix action requesting suggestion block', () => {
      const { systemPrompt } = AIService.buildPrompt('suggest_fix', dummyContext);
      expect(systemPrompt).toContain('suggestion');
    });

    it('creates appropriate prompt for polish_note including draft note', () => {
      const { userPrompt } = AIService.buildPrompt('polish_note', dummyContext);
      expect(userPrompt).toContain('needs null check');
    });
  });

  describe('executeAction with Gemini', () => {
    it('successfully calls Gemini endpoint and extracts response text', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'This method processes payment directly without state validation.' }],
              },
            },
          ],
        }),
      } as unknown as Response);

      const res = await AIService.executeAction(geminiSettings, 'explain', dummyContext);

      expect(res.success).toBe(true);
      expect(res.text).toContain('processes payment directly');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('handles Gemini API error gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'API key not valid' },
        }),
      } as unknown as Response);

      const res = await AIService.executeAction(geminiSettings, 'explain', dummyContext);
      expect(res.success).toBe(false);
      expect(res.error).toBe('API key not valid');
    });
  });

  describe('executeAction with OpenAI', () => {
    it('successfully calls OpenAI endpoint and extracts message content', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: 'Consider verifying $order->isPaid() before calling pay().' },
            },
          ],
        }),
      } as unknown as Response);

      const res = await AIService.executeAction(openaiSettings, 'spot_bugs', dummyContext);

      expect(res.success).toBe(true);
      expect(res.text).toContain('verifying $order->isPaid()');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openai-key',
          }),
        })
      );
    });
  });

  describe('testConnection', () => {
    it('returns valid: false if apiKey is missing', async () => {
      const res = await AIService.testConnection({ ...geminiSettings, apiKey: '' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('API key is required');
    });

    it('returns valid: true when ping succeeds', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Connected' }] } }],
        }),
      } as unknown as Response);

      const res = await AIService.testConnection(geminiSettings);
      expect(res.valid).toBe(true);
    });
  });
});
