import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Reading Nook',
    description:
      'A cozy corner for saving, remembering, and actually reading the interesting things you find online.',
    version: '0.1.0',
    permissions: [
      'storage',
      'alarms',
      'notifications',
      'activeTab',
      'tabs',
      'declarativeNetRequest',
    ],
    icons: {
      16: '/icons/icon-16.png',
      48: '/icons/icon-48.png',
      128: '/icons/icon-128.png',
    },
    web_accessible_resources: [
      {
        resources: ['reader.html', 'reflection.html'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
