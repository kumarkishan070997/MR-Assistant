import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: [],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'PeerPilot — AI Code Review Copilot',
    description: 'In-diff blast radius analysis, anchored review notes, file check-off tracking, and AI code review for GitHub & GitLab.',
    version: '0.2.0',
    permissions: ['storage'],
    host_permissions: [
      'https://github.com/*',
      'https://gitlab.com/*',
      'https://api.github.com/*',
      '*://*/*',
    ],
    icons: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
    action: {
      default_title: 'PeerPilot Settings & AI Review Copilot',
      default_icon: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
      },
    },
  },
});
