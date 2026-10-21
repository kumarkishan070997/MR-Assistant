import { loadSettings, saveSettings, $settings } from '../../stores/settings.store';
import { GitHubAdapter } from '../../adapters/github.adapter';
import { GitLabAdapter } from '../../adapters/gitlab.adapter';
import { AIService } from '../../services/ai/ai.service';

document.addEventListener('DOMContentLoaded', async () => {
  const ghTokenInput = document.getElementById('gh-token') as HTMLInputElement;
  const glUrlInput = document.getElementById('gl-url') as HTMLInputElement;
  const glTokenInput = document.getElementById('gl-token') as HTMLInputElement;
  const autoBlastCheckbox = document.getElementById('auto-blast') as HTMLInputElement;

  const aiEnabledCheckbox = document.getElementById('ai-enabled') as HTMLInputElement;
  const aiProviderSelect = document.getElementById('ai-provider') as HTMLSelectElement;
  const aiKeyInput = document.getElementById('ai-key') as HTMLInputElement;
  const aiModelInput = document.getElementById('ai-model') as HTMLInputElement;
  const aiEndpointInput = document.getElementById('ai-endpoint') as HTMLInputElement;
  const aiCustomGroup = document.getElementById('ai-custom-group') as HTMLDivElement;

  const ghTestBtn = document.getElementById('gh-test-btn') as HTMLButtonElement;
  const glTestBtn = document.getElementById('gl-test-btn') as HTMLButtonElement;
  const aiTestBtn = document.getElementById('ai-test-btn') as HTMLButtonElement;
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;

  const revStrictnessSelect = document.getElementById('rev-strictness') as HTMLSelectElement;
  const revSecCheckbox = document.getElementById('rev-sec') as HTMLInputElement;
  const revPerfCheckbox = document.getElementById('rev-perf') as HTMLInputElement;
  const revConcurCheckbox = document.getElementById('rev-concur') as HTMLInputElement;
  const revErrCheckbox = document.getElementById('rev-err') as HTMLInputElement;
  const revArchCheckbox = document.getElementById('rev-arch') as HTMLInputElement;
  const revCustomInstructions = document.getElementById('rev-custom-instructions') as HTMLTextAreaElement;

  const ghStatus = document.getElementById('gh-status') as HTMLSpanElement;
  const glStatus = document.getElementById('gl-status') as HTMLSpanElement;
  const aiStatus = document.getElementById('ai-status') as HTMLSpanElement;
  const ghRateBadge = document.getElementById('gh-rate-badge') as HTMLSpanElement;
  const saveMsg = document.getElementById('save-msg') as HTMLDivElement;

  const githubAdapter = new GitHubAdapter();
  const gitlabAdapter = new GitLabAdapter();

  // Load existing settings
  const settings = await loadSettings();
  ghTokenInput.value = settings.github.pat || '';
  glUrlInput.value = settings.gitlab.base_url || 'https://gitlab.com';
  glTokenInput.value = settings.gitlab.pat || '';
  autoBlastCheckbox.checked = settings.general.auto_blast_radius;

  if (settings.ai) {
    aiEnabledCheckbox.checked = settings.ai.enabled || false;
    aiProviderSelect.value = settings.ai.provider || 'gemini';
    aiKeyInput.value = settings.ai.apiKey || '';
    aiModelInput.value = settings.ai.model || '';
    aiEndpointInput.value = settings.ai.customEndpoint || '';
    if (settings.ai.provider === 'custom') {
      aiCustomGroup.classList.remove('hidden');
    }
  }

  if (settings.review) {
    if (revStrictnessSelect) revStrictnessSelect.value = settings.review.strictness || 'critical';
    if (revSecCheckbox) revSecCheckbox.checked = settings.review.focusAreas.security;
    if (revPerfCheckbox) revPerfCheckbox.checked = settings.review.focusAreas.performance;
    if (revConcurCheckbox) revConcurCheckbox.checked = settings.review.focusAreas.concurrency;
    if (revErrCheckbox) revErrCheckbox.checked = settings.review.focusAreas.errorHandling;
    if (revArchCheckbox) revArchCheckbox.checked = settings.review.focusAreas.architecture;
    if (revCustomInstructions) revCustomInstructions.value = settings.review.customInstructions || '';
  }

  aiProviderSelect.addEventListener('change', () => {
    const prov = aiProviderSelect.value;
    if (prov === 'custom') {
      aiCustomGroup.classList.remove('hidden');
      aiModelInput.placeholder = 'llama3 / mistral';
    } else {
      aiCustomGroup.classList.add('hidden');
      if (prov === 'gemini') aiModelInput.placeholder = 'gemini-2.5-flash';
      if (prov === 'openai') aiModelInput.placeholder = 'gpt-4o-mini';
      if (prov === 'anthropic') aiModelInput.placeholder = 'claude-3-5-sonnet-20241022';
    }
  });

  if (settings.github.rate_limit_remaining !== undefined) {
    ghRateBadge.textContent = `${settings.github.rate_limit_remaining} calls left`;
    ghRateBadge.classList.remove('hidden');
  }

  // GitHub Test Connection
  ghTestBtn.addEventListener('click', async () => {
    const token = ghTokenInput.value.trim();
    ghStatus.textContent = 'Testing...';
    ghStatus.className = 'text-xs text-slate-500 font-medium';
    ghTestBtn.disabled = true;

    const res = await githubAdapter.verifyConnection(token);
    ghTestBtn.disabled = false;

    if (res.valid) {
      ghStatus.textContent = 'Connected';
      ghStatus.className = 'text-xs text-emerald-600 font-semibold';
      if (res.rateLimitRemaining !== undefined) {
        ghRateBadge.textContent = `${res.rateLimitRemaining} calls left`;
        ghRateBadge.classList.remove('hidden');
        await saveSettings({
          github: { ...$settings.get().github, rate_limit_remaining: res.rateLimitRemaining },
        });
      }
    } else {
      ghStatus.textContent = res.error || 'Connection Failed';
      ghStatus.className = 'text-xs text-rose-600 font-medium';
    }
  });

  // GitLab Test Connection
  glTestBtn.addEventListener('click', async () => {
    let baseUrl = glUrlInput.value.trim() || 'https://gitlab.com';
    try {
      baseUrl = new URL(baseUrl).origin;
      glUrlInput.value = baseUrl;
    } catch {
      glStatus.textContent = 'Invalid URL format';
      glStatus.className = 'text-xs text-rose-600 font-medium';
      return;
    }

    const token = glTokenInput.value.trim();
    glStatus.textContent = 'Testing...';
    glStatus.className = 'text-xs text-slate-500 font-medium';
    glTestBtn.disabled = true;

    // Check dynamic host permissions if self-hosted
    if (baseUrl !== 'https://gitlab.com' && typeof chrome !== 'undefined' && chrome.permissions?.request) {
      try {
        const originPattern = `${baseUrl}/*`;
        const granted = await chrome.permissions.request({ origins: [originPattern] });
        if (!granted) {
          glStatus.textContent = 'Host permission rejected';
          glStatus.className = 'text-xs text-rose-600 font-medium';
          glTestBtn.disabled = false;
          return;
        }
      } catch (err) {
        console.warn('[Popup] Host permission prompt error:', err);
      }
    }

    const res = await gitlabAdapter.verifyConnection(token, baseUrl);
    glTestBtn.disabled = false;

    if (res.valid) {
      glStatus.textContent = 'Connected';
      glStatus.className = 'text-xs text-emerald-600 font-semibold';
    } else {
      glStatus.textContent = res.error || 'Connection Failed';
      glStatus.className = 'text-xs text-rose-600 font-medium';
    }
  });

  // AI Copilot Test Connection
  aiTestBtn.addEventListener('click', async () => {
    const provider = aiProviderSelect.value as any;
    const apiKey = aiKeyInput.value.trim();
    const model = aiModelInput.value.trim();
    const customEndpoint = aiEndpointInput.value.trim();

    aiStatus.textContent = 'Testing...';
    aiStatus.className = 'text-xs text-slate-500 font-medium';
    aiTestBtn.disabled = true;

    const res = await AIService.testConnection({
      enabled: true,
      provider,
      apiKey,
      model,
      customEndpoint,
    });
    aiTestBtn.disabled = false;

    if (res.valid) {
      aiStatus.textContent = 'Connected';
      aiStatus.className = 'text-xs text-emerald-600 font-semibold';
    } else {
      aiStatus.textContent = res.error || 'Connection Failed';
      aiStatus.className = 'text-xs text-rose-600 font-medium';
    }
  });

  // Save Preferences
  saveBtn.addEventListener('click', async () => {
    let cleanGlUrl = glUrlInput.value.trim() || 'https://gitlab.com';
    try {
      cleanGlUrl = new URL(cleanGlUrl).origin;
    } catch {
      cleanGlUrl = 'https://gitlab.com';
    }

    const currentCustomHosts = $settings.get().gitlab.custom_hosts || [];
    const updatedCustomHosts =
      cleanGlUrl !== 'https://gitlab.com' && !currentCustomHosts.includes(cleanGlUrl)
        ? [...currentCustomHosts, cleanGlUrl]
        : currentCustomHosts;

    await saveSettings({
      github: {
        pat: ghTokenInput.value.trim(),
        rate_limit_remaining: $settings.get().github.rate_limit_remaining,
      },
      gitlab: {
        pat: glTokenInput.value.trim(),
        base_url: cleanGlUrl,
        custom_hosts: updatedCustomHosts,
      },
      ai: {
        enabled: aiEnabledCheckbox.checked,
        provider: aiProviderSelect.value as any,
        apiKey: aiKeyInput.value.trim(),
        model: aiModelInput.value.trim(),
        customEndpoint: aiEndpointInput.value.trim(),
      },
      review: {
        strictness: (revStrictnessSelect?.value as any) || 'critical',
        ignoreFormatting: true,
        focusAreas: {
          security: revSecCheckbox?.checked ?? true,
          performance: revPerfCheckbox?.checked ?? true,
          concurrency: revConcurCheckbox?.checked ?? true,
          errorHandling: revErrCheckbox?.checked ?? true,
          architecture: revArchCheckbox?.checked ?? true,
        },
        customInstructions: revCustomInstructions?.value.trim() || '',
      },
      general: {
        auto_blast_radius: autoBlastCheckbox.checked,
        theme_mode: 'auto',
      },
    });

    saveMsg.classList.remove('hidden');
    setTimeout(() => {
      saveMsg.classList.add('hidden');
    }, 2000);
  });
});
