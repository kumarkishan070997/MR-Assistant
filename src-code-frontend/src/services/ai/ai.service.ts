import { AISettings } from '../../stores/settings.store';

export type AIAction = 'explain' | 'spot_bugs' | 'suggest_fix' | 'unit_test' | 'polish_note';

export interface AICallContext {
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  enclosingClass?: string;
  userDraft?: string;
}

export interface AIResponse {
  success: boolean;
  text: string;
  error?: string;
}

export class AIService {
  /**
   * Tests connection to the chosen AI provider with the provided API key.
   */
  public static async testConnection(settings: AISettings): Promise<{ valid: boolean; error?: string }> {
    if (!settings.apiKey && settings.provider !== 'custom') {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const res = await this.generateResponse(
        settings,
        'Respond with only the single word: Connected.',
        'Ping'
      );
      if (res.success) {
        return { valid: true };
      }
      return { valid: false, error: res.error || 'Connection test failed' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network error';
      return { valid: false, error: msg };
    }
  }

  /**
   * Generates AI assistance for a specific code review action.
   */
  public static async executeAction(
    settings: AISettings,
    action: AIAction,
    context: AICallContext
  ): Promise<AIResponse> {
    if (!settings.enabled && !settings.apiKey) {
      return {
        success: false,
        text: '',
        error: 'AI Copilot is not configured. Please add your API key in extension settings.',
      };
    }

    const { systemPrompt, userPrompt } = this.buildPrompt(action, context);
    return this.generateResponse(settings, systemPrompt, userPrompt);
  }

  /**
   * Builds action-specific system and user prompts.
   */
  public static buildPrompt(
    action: AIAction,
    context: AICallContext
  ): { systemPrompt: string; userPrompt: string } {
    const classContext = context.enclosingClass ? `Class: ${context.enclosingClass}\n` : '';
    const baseCode = `File: ${context.filePath}:${context.lineNumber}\n${classContext}\`\`\`\n${context.codeSnippet}\n\`\`\``;

    switch (action) {
      case 'explain':
        return {
          systemPrompt:
            'You are an expert code reviewer. Explain the provided code concisely in 2-3 sentences. Highlight purpose and non-obvious logic.',
          userPrompt: `Please explain this code:\n\n${baseCode}`,
        };

      case 'spot_bugs':
        return {
          systemPrompt:
            'You are a senior security and software engineer. Review the code for bugs, race conditions, null references, security risks, or unhandled errors. Keep points concise and prioritized.',
          userPrompt: `Spot potential bugs or issues in this code snippet:\n\n${baseCode}`,
        };

      case 'suggest_fix':
        return {
          systemPrompt:
            'You are an expert code reviewer. Provide an improved, robust version of the code snippet. Wrap the recommended replacement strictly inside a ```suggestion\n...\n``` block, followed by a 1-2 sentence explanation.',
          userPrompt: `Suggest a cleaner, safer fix for this code:\n\n${baseCode}`,
        };

      case 'unit_test':
        return {
          systemPrompt:
            'You are an expert testing engineer. Generate a concise, high-value unit test for the given code snippet. Follow idiomatic testing patterns for the language.',
          userPrompt: `Write a unit test for this code:\n\n${baseCode}`,
        };

      case 'polish_note':
        return {
          systemPrompt:
            'You are a friendly, constructive code review coach. Transform the draft reviewer note into empathetic, clear, actionable feedback. Preserve the original critique while making it collaborative.',
          userPrompt: `Context code:\n${baseCode}\n\nDraft reviewer note:\n"${context.userDraft || ''}"\n\nRewrite as constructive code review feedback:`,
        };
    }
  }

  /**
   * Dispatches the prompt to the configured provider (Gemini, OpenAI, Anthropic, Custom).
   */
  public static async generateResponse(
    settings: AISettings,
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIResponse> {
    switch (settings.provider) {
      case 'gemini':
        return this.callGemini(settings, systemPrompt, userPrompt);
      case 'openai':
        return this.callOpenAI(settings, systemPrompt, userPrompt);
      case 'anthropic':
        return this.callAnthropic(settings, systemPrompt, userPrompt);
      case 'custom':
        return this.callCustom(settings, systemPrompt, userPrompt);
      default:
        return { success: false, text: '', error: `Unsupported provider: ${settings.provider}` };
    }
  }

  private static async callGemini(
    settings: AISettings,
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIResponse> {
    try {
      const model = settings.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          text: '',
          error: errJson.error?.message || `Gemini API error (${res.status})`,
        };
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      return { success: true, text };
    } catch (err: unknown) {
      return { success: false, text: '', error: err instanceof Error ? err.message : 'Gemini request failed' };
    }
  }

  private static async callOpenAI(
    settings: AISettings,
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIResponse> {
    try {
      const model = settings.model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          text: '',
          error: errJson.error?.message || `OpenAI API error (${res.status})`,
        };
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() || '';
      return { success: true, text };
    } catch (err: unknown) {
      return { success: false, text: '', error: err instanceof Error ? err.message : 'OpenAI request failed' };
    }
  }

  private static async callAnthropic(
    settings: AISettings,
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIResponse> {
    try {
      const model = settings.model || 'claude-3-5-sonnet-20241022';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          text: '',
          error: errJson.error?.message || `Anthropic API error (${res.status})`,
        };
      }

      const data = await res.json();
      const text = data.content?.[0]?.text?.trim() || '';
      return { success: true, text };
    } catch (err: unknown) {
      return { success: false, text: '', error: err instanceof Error ? err.message : 'Anthropic request failed' };
    }
  }

  private static async callCustom(
    settings: AISettings,
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIResponse> {
    try {
      const endpoint = (settings.customEndpoint || 'http://localhost:11434/v1').replace(/\/+$/, '');
      const url = `${endpoint}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (settings.apiKey) {
        headers.Authorization = `Bearer ${settings.apiKey}`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: settings.model || 'llama3',
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          text: '',
          error: errJson.error?.message || `Custom API error (${res.status})`,
        };
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() || '';
      return { success: true, text };
    } catch (err: unknown) {
      return { success: false, text: '', error: err instanceof Error ? err.message : 'Custom API request failed' };
    }
  }
}
