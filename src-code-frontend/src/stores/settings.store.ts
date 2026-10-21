import { atom } from 'nanostores';

export interface ExtensionSettings {
  github: {
    pat: string;
    rate_limit_remaining?: number;
  };
  gitlab: {
    pat: string;
    base_url: string;
    custom_hosts: string[];
  };
  general: {
    auto_blast_radius: boolean;
    theme_mode: 'auto' | 'light' | 'dark';
  };
}

export const defaultSettings: ExtensionSettings = {
  github: {
    pat: '',
    rate_limit_remaining: undefined,
  },
  gitlab: {
    pat: '',
    base_url: 'https://gitlab.com',
    custom_hosts: [],
  },
  general: {
    auto_blast_radius: true,
    theme_mode: 'auto',
  },
};

export const $settings = atom<ExtensionSettings>(defaultSettings);

/**
 * Loads settings from chrome.storage.local into the reactive atom.
 */
export async function loadSettings(): Promise<ExtensionSettings> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const data = await chrome.storage.local.get('settings');
      if (data && data.settings) {
        const merged: ExtensionSettings = {
          github: { ...defaultSettings.github, ...data.settings.github },
          gitlab: { ...defaultSettings.gitlab, ...data.settings.gitlab },
          general: { ...defaultSettings.general, ...data.settings.general },
        };
        $settings.set(merged);
        return merged;
      }
    } catch (err) {
      console.error('[SettingsStore] Failed to load settings from storage:', err);
    }
  }
  return defaultSettings;
}

/**
 * Updates settings both in the reactive atom and persists to chrome.storage.local.
 */
export async function saveSettings(updated: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = $settings.get();
  const next: ExtensionSettings = {
    github: { ...current.github, ...updated.github },
    gitlab: { ...current.gitlab, ...updated.gitlab },
    general: { ...current.general, ...updated.general },
  };

  $settings.set(next);

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      await chrome.storage.local.set({ settings: next });
    } catch (err) {
      console.error('[SettingsStore] Failed to persist settings to storage:', err);
    }
  }

  return next;
}

// Listen to storage changes to keep atom synced across extension contexts
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings?.newValue) {
      $settings.set(changes.settings.newValue);
    }
  });
}
