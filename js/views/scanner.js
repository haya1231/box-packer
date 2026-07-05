export async function renderScanner(root) {
  const wrap = document.createElement('div');
  wrap.className = 'scanner-wrap';
  wrap.innerHTML = `
    <h2>סריקת ארגז</h2>
    <video id="scanVideo" playsinline muted></video>
    <div class="scanner-status" id="scanStatus">מבקש הרשאת מצלמה...</div>
  `;
  root.appendChild(wrap);

  const video = wrap.querySelector('#scanVideo');
  const statusEl = wrap.querySelector('#scanStatus');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let stream = null;
  let rafId = null;
  let stopped = false;

  function stop() {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    window.removeEventListener('hashchange', stop);
  }
  window.addEventListener('hashchange', stop);

  function goToScannedUrl(text) {
    try {
      const url = new URL(text, location.href);
      if (url.origin === location.origin && url.hash.startsWith('#/box/')) {
        stop();
        location.hash = url.hash;
        return;
      }
    } catch {
      /* not a URL we can parse — ignore */
    }
    statusEl.textContent = `קוד לא מזוהה: ${text}`;
  }

  function tick() {
    if (stopped) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // eslint-disable-next-line no-undef
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        goToScannedUrl(code.data);
        return;
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    await video.play();
    statusEl.textContent = 'כוונו את המצלמה אל תווית ה-QR של הארגז';
    rafId = requestAnimationFrame(tick);
  } catch (err) {
    statusEl.textContent = 'לא ניתן לגשת למצלמה. ודאו שנתתם הרשאה, או השתמשו במצלמת הנייד לסריקה ישירה מהמדבקה.';
  }
}
