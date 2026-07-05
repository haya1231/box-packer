import { renderBoxList } from './views/boxList.js';
import { renderBoxEditor } from './views/boxEditor.js';
import { renderBoxView } from './views/boxView.js';
import { renderScanner } from './views/scanner.js';

const appEl = document.getElementById('app');

function parseRoute(hash) {
  const path = (hash || '#/').replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return { view: 'list' };
  if (parts[0] === 'scan') return { view: 'scan' };
  if (parts[0] === 'box' && parts[1] === 'new') return { view: 'new' };
  if (parts[0] === 'box' && parts[1] && parts[2] === 'edit') {
    return { view: 'edit', id: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === 'box' && parts[1]) return { view: 'box', id: decodeURIComponent(parts[1]) };
  return { view: 'list' };
}

async function render() {
  const route = parseRoute(location.hash);
  appEl.innerHTML = '';
  window.scrollTo(0, 0);

  try {
    if (route.view === 'list') return await renderBoxList(appEl);
    if (route.view === 'new') return await renderBoxEditor(appEl, null);
    if (route.view === 'edit') return await renderBoxEditor(appEl, route.id);
    if (route.view === 'box') return await renderBoxView(appEl, route.id);
    if (route.view === 'scan') return await renderScanner(appEl);
    return await renderBoxList(appEl);
  } catch (err) {
    appEl.innerHTML = `<div class="empty-state">אירעה שגיאה בטעינת המסך.<br>${err.message || err}</div>`;
    console.error(err);
  }
}

window.addEventListener('hashchange', render);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

render();
