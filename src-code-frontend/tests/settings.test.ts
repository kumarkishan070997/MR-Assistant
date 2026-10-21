import { describe, it, expect, beforeEach, vi } from 'vitest';
import { $settings, saveSettings, loadSettings, defaultSettings } from '../src/stores/settings.store';

describe('SettingsStore', () => {
  beforeEach(() => {
    $settings.set(defaultSettings);

    // Mock chrome.storage.local
    const storageMap = new Map<string, unknown>();
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async (key: string) => {
            return { [key]: storageMap.get(key) };
          }),
          set: vi.fn(async (items: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(items)) {
              storageMap.set(k, v);
            }
          }),
        },
        onChanged: {
          addListener: vi.fn(),
        },
      },
    });
  });

  it('updates reactive atom and storage on saveSettings', async () => {
    const updated = await saveSettings({
      github: { pat: 'ghp_secret_123', rate_limit_remaining: 4500 },
      gitlab: { pat: 'glpat_secret_abc', base_url: 'https://gitlab.custom.net', custom_hosts: ['https://gitlab.custom.net'] },
    });

    expect($settings.get().github.pat).toBe('ghp_secret_123');
    expect($settings.get().gitlab.base_url).toBe('https://gitlab.custom.net');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: updated });
  });

  it('loads persisted settings into the store', async () => {
    await chrome.storage.local.set({
      settings: {
        github: { pat: 'ghp_persisted', rate_limit_remaining: 3900 },
        gitlab: { pat: 'glpat_persisted', base_url: 'https://gitlab.com', custom_hosts: [] },
        general: { auto_blast_radius: false, theme_mode: 'dark' },
      },
    });

    const loaded = await loadSettings();
    expect(loaded.github.pat).toBe('ghp_persisted');
    expect(loaded.general.auto_blast_radius).toBe(false);
    expect($settings.get().general.theme_mode).toBe('dark');
  });
});
