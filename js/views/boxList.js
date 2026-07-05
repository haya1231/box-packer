import { getAllBoxes, deleteBox, saveBox, getKnownRooms } from '../db.js';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export async function renderBoxList(root) {
  const [boxes, rooms] = await Promise.all([getAllBoxes(), getKnownRooms()]);

  const wrap = document.createElement('div');

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <input type="search" id="searchInput" placeholder="חיפוש לפי שם ארגז...">
    <select id="roomFilter">
      <option value="">כל החדרים</option>
      ${rooms.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('')}
    </select>
  `;
  wrap.appendChild(toolbar);

  const listEl = document.createElement('div');
  wrap.appendChild(listEl);
  root.appendChild(wrap);

  function renderList() {
    const search = toolbar.querySelector('#searchInput').value.trim().toLowerCase();
    const roomFilter = toolbar.querySelector('#roomFilter').value;

    const filtered = boxes.filter((b) => {
      const matchesSearch = !search || b.name.toLowerCase().includes(search);
      const matchesRoom = !roomFilter || b.room === roomFilter;
      return matchesSearch && matchesRoom;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">אין ארגזים להצגה.<br>לחצו על "+ ארגז חדש" כדי להתחיל.</div>`;
      return;
    }

    listEl.innerHTML = filtered.map((b) => {
      const itemCount = (b.items || []).length;
      const photoCount = (b.photos || []).length;
      return `
        <a href="#/box/${encodeURIComponent(b.id)}" class="box-card ${b.unpacked ? 'unpacked' : ''}">
          <div class="box-info">
            <h3 class="${b.unpacked ? 'unpacked-label' : ''}">${escapeHtml(b.name)}</h3>
            ${b.room ? `<span class="room-tag">${escapeHtml(b.room)}</span>` : ''}
            <div class="meta">${itemCount} פריטים · ${photoCount} תמונות</div>
          </div>
          <div>
            <button class="btn btn-secondary toggle-unpacked" data-id="${b.id}" title="סמן כנפרק/ארוז">
              ${b.unpacked ? '↩️' : '✅'}
            </button>
            <button class="btn btn-danger delete-box" data-id="${b.id}" title="מחק">🗑️</button>
          </div>
        </a>
      `;
    }).join('');

    listEl.querySelectorAll('.toggle-unpacked').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.id;
        const box = boxes.find((b) => b.id === id);
        box.unpacked = !box.unpacked;
        await saveBox(box);
        renderList();
      });
    });

    listEl.querySelectorAll('.delete-box').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.id;
        const box = boxes.find((b) => b.id === id);
        if (!confirm(`למחוק את הארגז "${box.name}"?`)) return;
        await deleteBox(id);
        const idx = boxes.findIndex((b) => b.id === id);
        boxes.splice(idx, 1);
        renderList();
      });
    });
  }

  toolbar.querySelector('#searchInput').addEventListener('input', renderList);
  toolbar.querySelector('#roomFilter').addEventListener('change', renderList);

  renderList();
}
