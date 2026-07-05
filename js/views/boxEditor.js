import { getBox, saveBox, deleteBox, createId, getKnownRooms } from '../db.js';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function renderBoxEditor(root, existingId) {
  const isNew = !existingId;
  const rooms = await getKnownRooms();

  const box = isNew
    ? { id: createId(), name: '', room: '', items: [], photos: [], unpacked: false, createdAt: Date.now() }
    : await getBox(existingId);

  if (!isNew && !box) {
    root.innerHTML = `<div class="empty-state">הארגז לא נמצא.</div>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <h2>${isNew ? 'ארגז חדש' : 'עריכת ארגז'}</h2>
    <form class="box-form" id="boxForm">
      <div class="field">
        <label for="nameInput">שם הארגז</label>
        <input type="text" id="nameInput" placeholder="לדוגמה: מטבח 1" required value="${escapeHtml(box.name)}">
      </div>
      <div class="field">
        <label for="roomInput">חדר יעד בבית החדש</label>
        <input type="text" id="roomInput" list="roomOptions" placeholder="לדוגמה: מטבח" value="${escapeHtml(box.room || '')}">
        <datalist id="roomOptions">
          ${rooms.map((r) => `<option value="${escapeHtml(r)}">`).join('')}
        </datalist>
      </div>

      <div class="field">
        <label>פריטים ברשימה</label>
        <div class="item-row">
          <input type="text" id="itemInput" placeholder="הוסיפו פריט ולחצו Enter">
          <button type="button" class="btn btn-secondary" id="addItemBtn">הוסף</button>
        </div>
        <ul class="item-list" id="itemList"></ul>
      </div>

      <div class="field">
        <label>תמונות של תכולת הארגז</label>
        <input type="file" id="photoInput" accept="image/*" capture="environment" multiple>
        <div class="photo-grid" id="photoGrid"></div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">שמירה</button>
        ${!isNew ? `<button type="button" class="btn btn-danger" id="deleteBtn">מחיקת ארגז</button>` : ''}
      </div>
    </form>
  `;
  root.appendChild(wrap);

  const items = [...(box.items || [])];
  const photos = [...(box.photos || [])];

  const itemListEl = wrap.querySelector('#itemList');
  const photoGridEl = wrap.querySelector('#photoGrid');

  function renderItems() {
    itemListEl.innerHTML = items.map((text, i) => `
      <li>
        <span>${escapeHtml(text)}</span>
        <button type="button" data-i="${i}" class="removeItem">✕</button>
      </li>
    `).join('');
    itemListEl.querySelectorAll('.removeItem').forEach((btn) => {
      btn.addEventListener('click', () => {
        items.splice(Number(btn.dataset.i), 1);
        renderItems();
      });
    });
  }

  function renderPhotos() {
    photoGridEl.innerHTML = photos.map((p, i) => `
      <div class="photo-thumb">
        <img src="${p.dataUrl}" alt="תמונה">
        <button type="button" data-i="${i}" class="removePhoto">✕</button>
      </div>
    `).join('');
    photoGridEl.querySelectorAll('.removePhoto').forEach((btn) => {
      btn.addEventListener('click', () => {
        photos.splice(Number(btn.dataset.i), 1);
        renderPhotos();
      });
    });
  }

  renderItems();
  renderPhotos();

  function addItem() {
    const input = wrap.querySelector('#itemInput');
    const text = input.value.trim();
    if (!text) return;
    items.push(text);
    input.value = '';
    renderItems();
    input.focus();
  }

  wrap.querySelector('#addItemBtn').addEventListener('click', addItem);
  wrap.querySelector('#itemInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  });

  wrap.querySelector('#photoInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      photos.push({ id: createId(), dataUrl });
    }
    e.target.value = '';
    renderPhotos();
  });

  wrap.querySelector('#boxForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    box.name = wrap.querySelector('#nameInput').value.trim();
    box.room = wrap.querySelector('#roomInput').value.trim();
    box.items = items;
    box.photos = photos;
    if (!box.name) return;
    await saveBox(box);
    location.hash = `#/box/${encodeURIComponent(box.id)}`;
  });

  if (!isNew) {
    wrap.querySelector('#deleteBtn').addEventListener('click', async () => {
      if (!confirm(`למחוק את הארגז "${box.name}"?`)) return;
      await deleteBox(box.id);
      location.hash = '#/';
    });
  }
}
