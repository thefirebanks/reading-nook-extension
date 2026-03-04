import '../../lib/design-tokens.css';
import { mount } from 'svelte';
import Reflection from './Reflection.svelte';

const app = mount(Reflection, {
  target: document.getElementById('app')!,
});

export default app;
