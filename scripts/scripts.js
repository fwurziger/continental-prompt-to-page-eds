import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Groups each heading with the content that follows it so an intro section can
 * be laid out in columns. Authored content is a flat run of headings and
 * paragraphs, which CSS alone cannot group.
 * @param {HTMLElement} main The main container element
 */
export function decorateIntroColumns(main) {
  main.querySelectorAll('.section.intro > .default-content-wrapper').forEach((wrapper) => {
    const groups = [];
    [...wrapper.children].forEach((child) => {
      if (child.tagName === 'H3') groups.push([child]);
      else if (groups.length) groups[groups.length - 1].push(child);
    });
    if (groups.length < 2) return;

    const grid = document.createElement('div');
    grid.className = 'intro-columns';
    groups.forEach((group) => {
      const column = document.createElement('div');
      column.className = 'intro-column';
      group.forEach((node) => column.append(node));
      grid.append(column);
    });
    wrapper.append(grid);
  });
}

/**
 * Turns pipe delimited paragraphs into a comparison table. Rich text authored
 * in AEM cannot carry table markup, so rows arrive as `a | b | c` paragraphs
 * and the first one is treated as the header.
 * @param {HTMLElement} main The main container element
 */
export function decorateSpecsTable(main) {
  main.querySelectorAll('.section.specs > .default-content-wrapper').forEach((wrapper) => {
    const rows = [...wrapper.querySelectorAll('p')].filter((p) => p.textContent.includes('|'));
    if (rows.length < 2) return;

    const table = document.createElement('table');
    const head = document.createElement('thead');
    const body = document.createElement('tbody');
    rows[0].before(table);
    rows.forEach((paragraph, index) => {
      const cells = paragraph.textContent.split('|').map((cell) => cell.trim());
      const tr = document.createElement('tr');
      cells.forEach((cell, column) => {
        const isHeader = index === 0 || column === 0;
        const td = document.createElement(isHeader ? 'th' : 'td');
        if (index > 0 && column === 0) td.scope = 'row';
        td.textContent = cell;
        tr.append(td);
      });
      (index === 0 ? head : body).append(tr);
      paragraph.remove();
    });
    table.append(head, body);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateIntroColumns(main);
  decorateSpecsTable(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
