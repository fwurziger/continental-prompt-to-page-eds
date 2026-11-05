import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  if (/^\/reply(\/|$)/i.test(window.location.pathname)) {
    const link = (text, path) => `<li><a href="${path.startsWith('http') ? path : `https://www.reply.com${path}`}">${text}</a></li>`;
    block.innerHTML = `<div class="reply-footer">
      <a class="reply-footer-brand" href="https://www.reply.com/it"><img src="/icons/reply-logo-white.svg" alt="Reply" width="129" height="64"></a>
      <div class="reply-footer-columns">
        <div><h3>We are</h3><ul>${link('Company Profile', '/it/company-profile')}${link('Offices', '/it/offices')}${link('Investors', '/it/investors')}${link('Newsroom', '/it/newsroom')}</ul></div>
        <div><h3>Privacy &amp; legal</h3><ul>${link('Privacy &amp; Cookie Policy', '/it/privacy-policy')}${link('Accessibilità', '/it/accessibility')}</ul></div>
        <div><h3>Careers</h3><ul>${link('Careers', 'https://www.reply.com/it/about/careers/')}${link('Contacts', '/it/contacts')}</ul></div>
      </div>
      <p class="reply-footer-note">Pagina dimostrativa generata con Prompt to Page · Adobe Experience Manager Edge Delivery</p>
    </div>`;
    return;
  }

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
