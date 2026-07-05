import { getBox, saveBox } from '../db.js';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function boxUrl(id) {
  return `${location.origin}${location.pathname}#/box/${encodeURIComponent(id)}`;
}

export async function renderBoxView(root, id) {
  const box = await getBox(id);

  if (!box) {
    root.innerHTML = `<div class="empty-state">הארגז לא נמצא במכשיר הזה.<br>ייתכן שהוא נוצר במכשיר אחר.</div>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="label-card" id="labelCard">
      <div class="room-tag">${box.room ? escapeHtml(box.room) : 'ללא חדר'}</div>
      <h2>${escapeHtml(box.name)}</h2>
      <div class="qr-wrap" id="qrWrap"></div>
      <div class="meta">${(box.items || []).length} פריטים · ${(box.photos || []).length} תמונות</div>
    </div>

    <div class="box-actions no-print">
      <button class="btn btn-secondary" id="printBtn">🖨️ הדפסת מדבקה</button>
      <a class="btn btn-secondary" href="#/box/${encodeURIComponent(box.id)}/edit">✏️ עריכה</a>
      <button class="btn ${box.unpacked ? 'btn-secondary' : 'btn-primary'}" id="unpackedBtn">
        ${box.unpacked ? '↩️ סמן כארוז' : '✅ סמן כנפרק'}
      </button>
    </div>

    <div class="no-print">
      <div class="section-title">רשימת פריטים</div>
      ${(box.items || []).length
        ? `<ul class="item-list">${box.items.map((it) => `<li><span>${escapeHtml(it)}</span></li>`).join('')}</ul>`
        : '<div class="meta">אין פריטים ברשימה.</div>'}

      <div class="section-title">תמונות</div>
      ${(box.photos || []).length
        ? `<div class="photo-grid">${box.photos.map((p) => `<div class="photo-thumb"><img src="${p.dataUrl}" alt="תמונה"></div>`).join('')}</div>`
        : '<div class="meta">אין תמונות.</div>'}
    </div>
  `;
  root.appendChild(wrap);

  // eslint-disable-next-line no-undef
  new QRCode(wrap.querySelector('#qrWrap'), {
    text: boxUrl(box.id),
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.M,
  });

  wrap.querySelector('#printBtn').addEventListener('click', () => window.print());

  wrap.querySelector('#unpackedBtn').addEventListener('click', async () => {
    box.unpacked = !box.unpacked;
    await saveBox(box);
    root.innerHTML = '';
    renderBoxView(root, id);
  });
}
