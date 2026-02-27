import './style.css';
import './button.css';
import SaveButton from './SaveButton.svelte';
import { mount, unmount } from 'svelte';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
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
