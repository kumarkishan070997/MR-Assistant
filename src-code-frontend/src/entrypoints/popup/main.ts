import { loadSettings, saveSettings, $settings } from '../../stores/settings.store';
import { GitHubAdapter } from '../../adapters/github.adapter';
import { GitLabAdapter } from '../../adapters/gitlab.adapter';

document.addEventListener('DOMContentLoaded', async () => {
  const ghTokenInput = document.getElementById('gh-token') as HTMLInputElement;
  const glUrlInput = document.getElementById('gl-url') as HTMLInputElement;
  const glTokenInput = document.getElementById('gl-token') as HTMLInputElement;
  const autoBlastCheckbox = document.getElementById('auto-blast') as HTMLInputElement;

  const ghTestBtn = document.getElementById('gh-test-btn') as HTMLButtonElement;
  const glTestBtn = document.getElementById('gl-test-btn') as HTMLButtonElement;
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;

  const ghStatus = document.getElementById('gh-status') as HTMLSpanElement;
  const glStatus = document.getElementById('gl-status') as HTMLSpanElement;
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

  // Save Preferences
  saveBtn.addEventListener('click', async () => {
    let cleanGlUrl = glUrlInput.value.trim() || 'https://gitlab.com';
    try {
      cleanGlUrl = new URL(cleanGlUrl).origin;
    } catch {
      // Keep default
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
