import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  if (/^\/outdoor(\/|$)|winter-mountain-bik/i.test(window.location.pathname)) {
    block.innerHTML = `<div class="outdoor-footer">
      <strong>OUTDOOR</strong>
      <span>Gear and guides for riders · White-label demo</span>
    </div>`;
    return;
  }

  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
