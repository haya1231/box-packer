import { getBox } from '../db.js';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function boxUrl(id) {
  return `${location.origin}${location.pathname}#/box/${encodeURIComponent(id)}`;
}

export async function renderPrintLabels(root, ids) {
  const boxes = (await Promise.all(ids.map((id) => getBox(id)))).filter(Boolean);

  if (boxes.length === 0) {
    root.innerHTML = `<div class="empty-state">לא נמצאו ארגזים להדפסה.</div>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="box-actions no-print">
      <a class="btn btn-secondary" href="#/">⬅️ חזרה לרשימה</a>
      <button type="button" class="btn btn-primary" id="printAllBtn">🖨️ הדפסת ${boxes.length} מדבקות</button>
    </div>
    <div class="label-sheet" id="labelSheet"></div>
  `;
  root.appendChild(wrap);

  const sheet = wrap.querySelector('#labelSheet');

  boxes.forEach((box) => {
    const card = document.createElement('div');
    card.className = 'label-card';
    card.innerHTML = `
      <div class="room-tag">${box.room ? escapeHtml(box.room) : 'ללא חדר'}</div>
      <h2>${escapeHtml(box.name)}</h2>
      <div class="qr-wrap"></div>
      <div class="meta">${(box.items || []).length} פריטים · ${(box.photos || []).length} תמונות</div>
    `;
    sheet.appendChild(card);

    try {
      // eslint-disable-next-line no-undef
      new QRCode(card.querySelector('.qr-wrap'), {
        text: boxUrl(box.id),
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (err) {
      card.querySelector('.qr-wrap').innerHTML = '<div class="meta">שגיאה בהצגת קוד ה-QR.</div>';
      console.error(err);
    }
  });

  wrap.querySelector('#printAllBtn').addEventListener('click', () => window.print());
}
