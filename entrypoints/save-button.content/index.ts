import './style.css';
import './button.css';
import SaveButton from './SaveButton.svelte';
import { mount, unmount } from 'svelte';
import { extractPageMetadata } from './extractor';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'EXTRACT_METADATA') {
        try {
          const metadata = extractPageMetadata();
          sendResponse(metadata);
        } catch (err) {
          console.error('Reading Nook: failed to extract metadata', err);
          sendResponse(null);
        }
        return true;
      }
    });

    const ui = await createShadowRootUi(ctx, {
      name: 'reading-nook-save-button',
      position: 'overlay',
      onMount: (container) => {
        return mount(SaveButton, { target: container });
      },
      onRemove: (app) => {
        if (app) unmount(app);
      },
    });

    ui.mount();
  },
});
