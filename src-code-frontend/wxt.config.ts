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
    name: 'PR / MR Context Anchor',
    description: 'In-diff cross-referencing, blast radius estimation, and private scratchpads for GitHub & GitLab.',
    version: '0.1.0',
    permissions: ['storage'],
    host_permissions: [
      'https://github.com/*',
      'https://gitlab.com/*',
      'https://api.github.com/*',
      '*://*/*',
    ],
    action: {
      default_title: 'PR / MR Context Anchor Settings',
    },
  },
});
