/* Pantalla de bloqueo: mockup en CANVAS (fondo + reloj + notificaciones que
   "acaban de llegar"). Editable en vivo: textos de notificaciones, añadir/quitar
   y subir fondo. Descarga capturando el canvas (MediaRecorder). */
(function initLockScreen() {
  const canvas = document.getElementById("lock-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920, CYCLE = 6.0;
  canvas.width = W; canvas.height = H;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Inter, Roboto, sans-serif';

  const langNow = () => {
    const on = document.querySelector("#mk-lang button.on");
    return on && on.dataset.lang === "en" ? "en" : "es";
  };
  const DEF = { es: "¡Es hora de tu hábito de hoy! 💪", en: "Time for today's habit! 💪" };
  const NOW = { es: "ahora", en: "now" };

  const rhabitIcon = new Image(); rhabitIcon.src = "assets/rhabit-icon.png";
  let wallpaper = null;
  let notifs = [{ app: "Rhabit", text: DEF[langNow()], color: "#ff7a1a", icon: rhabitIcon, iconSrc: "assets/rhabit-icon.png" }];
  let untouched = true;
  let start = performance.now();
  const restart = () => { start = performance.now(); };
  const ease = (k) => 1 - Math.pow(1 - k, 3);

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrapLines(text, maxW) {
    const words = String(text).split(/\s+/); const lines = []; let line = "";
    for (const w of words) { const test = line ? line + " " + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function drawWallpaper() {
    if (wallpaper && wallpaper.complete && wallpaper.naturalWidth) {
      const ar = wallpaper.naturalWidth / wallpaper.naturalHeight, car = W / H;
      let dw, dh, dx, dy;
      if (ar > car) { dh = H; dw = H * ar; dx = (W - dw) / 2; dy = 0; } else { dw = W; dh = W / ar; dx = 0; dy = (H - dh) / 2; }
      ctx.drawImage(wallpaper, dx, dy, dw, dh);
    } else {
      // Fondo por defecto: gradiente abstracto tipo fondo de móvil típico.
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#1f2b7a"); g.addColorStop(0.5, "#6a2f9c"); g.addColorStop(1, "#c33a76");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const glow = (cx, cy, r, col) => {
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      };
      glow(W * 0.82, H * 0.14, 740, "rgba(255,170,90,0.5)");
      glow(W * 0.12, H * 0.72, 840, "rgba(70,210,205,0.32)");
    }
    const og = ctx.createLinearGradient(0, 0, 0, H);
    og.addColorStop(0, "rgba(0,0,0,0.42)"); og.addColorStop(0.32, "rgba(0,0,0,0.04)");
    og.addColorStop(0.6, "rgba(0,0,0,0.04)"); og.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = og; ctx.fillRect(0, 0, W, H);
  }
  function dateStr(d) {
    const daysEs = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const monEs = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (langNow() === "en") return `${daysEn[d.getDay()]}, ${monEn[d.getMonth()]} ${d.getDate()}`;
    const s = `${daysEs[d.getDay()]}, ${d.getDate()} de ${monEs[d.getMonth()]}`;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function drawClock() {
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = `600 44px ${FONT}`;
    ctx.fillText(dateStr(now), W / 2, 248);
    ctx.fillStyle = "#fff"; ctx.font = `300 300px ${FONT}`;
    ctx.fillText(time, W / 2, 560);
  }
  function notifHeight(n) {
    ctx.font = `500 36px ${FONT}`;
    const tx = 28 + 76 + 24;
    const lines = wrapLines(n.text, (W - 2 * 48) - tx - 36);
    return Math.max(128, 62 + lines.length * 46 + 30);
  }
  function drawNotif(x, y, w, h, n, op) {
    ctx.save(); ctx.globalAlpha = op;
    roundRect(x, y, w, h, 38); ctx.fillStyle = "rgba(30,30,34,0.62)"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.stroke();
    const ic = 76, ix = x + 28, iy = y + 28;
    roundRect(ix, iy, ic, ic, 20);
    if (n.icon && n.icon.complete && n.icon.naturalWidth) {
      ctx.save(); ctx.clip();
      const img = n.icon, ar = img.naturalWidth / img.naturalHeight;
      let dw, dh, dx, dy;
      if (ar > 1) { dh = ic; dw = ic * ar; dx = ix - (dw - ic) / 2; dy = iy; }
      else { dw = ic; dh = ic / ar; dx = ix; dy = iy - (dh - ic) / 2; }
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = n.color || "#ff7a1a"; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `800 42px ${FONT}`;
      ctx.fillText(((n.app || "R").trim().charAt(0) || "R").toUpperCase(), ix + ic / 2, iy + ic / 2 + 15);
    }
    const tx = ix + ic + 24;
    ctx.textAlign = "left"; ctx.fillStyle = "rgba(235,235,240,0.72)"; ctx.font = `700 27px ${FONT}`;
    ctx.fillText((n.app || "Rhabit").toUpperCase(), tx, y + 50);
    ctx.textAlign = "right"; ctx.fillStyle = "rgba(235,235,240,0.5)"; ctx.font = `500 27px ${FONT}`;
    ctx.fillText(NOW[langNow()], x + w - 30, y + 50);
    ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = `500 36px ${FONT}`;
    wrapLines(n.text, w - (tx - x) - 36).forEach((ln, i) => ctx.fillText(ln, tx, y + 98 + i * 46));
    ctx.restore();
  }
  function drawNotifs(t) {
    const x = 48, w = W - 2 * 48, gap = 26, heights = notifs.map(notifHeight);
    let y = 1030;
    for (let i = 0; i < notifs.length; i++) {
      const appearAt = 0.35 + i * 0.30, fadeOut = CYCLE - 0.7;
      let op = 0, slide = 0;
      if (t >= appearAt) { const k = Math.min(1, (t - appearAt) / 0.5); op = k; slide = (1 - ease(k)) * 70; }
      if (t >= fadeOut) op *= Math.max(0, 1 - (t - fadeOut) / 0.6);
      if (op > 0.002) drawNotif(x, y - slide, w, heights[i], notifs[i], op);
      y += heights[i] + gap;
    }
  }
  function frame(now) {
    const t = ((now - start) / 1000) % CYCLE;
    drawWallpaper(); drawClock(); drawNotifs(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---- Controles ----
  const listEl = document.getElementById("lock-list");
  const wallInput = document.getElementById("lock-wall");
  const addBtn = document.getElementById("lock-add");
  const esc = (s) => String(s).replace(/"/g, "&quot;");

  function renderList() {
    listEl.innerHTML = "";
    notifs.forEach((n, i) => {
      const row = document.createElement("div"); row.className = "lock-row";
      const iconBg = n.iconSrc ? ` style="background-image:url('${esc(n.iconSrc)}')"` : "";
      row.innerHTML =
        `<label class="lock-ico" title="${langNow() === "en" ? "App icon" : "Icono de la app"}"><input type="file" accept="image/*" hidden>` +
        `<span class="lock-ico__img"${iconBg}>${n.iconSrc ? "" : `<svg class="ico"><use href="#i-image"/></svg>`}</span></label>` +
        `<input class="lock-app" placeholder="App" value="${esc(n.app)}">` +
        `<input class="lock-text" placeholder="${langNow() === "en" ? "Notification text" : "Texto de la notificación"}" value="${esc(n.text)}">` +
        `<button class="lock-del" type="button" aria-label="Quitar"><svg class="ico"><use href="#i-trash"/></svg></button>`;
      const appI = row.querySelector(".lock-app"), txtI = row.querySelector(".lock-text");
      appI.addEventListener("input", () => { n.app = appI.value; untouched = false; });
      txtI.addEventListener("input", () => { n.text = txtI.value; untouched = false; });
      const iconInput = row.querySelector(".lock-ico input"), iconImg = row.querySelector(".lock-ico__img");
      iconInput.addEventListener("change", () => {
        const f = iconInput.files && iconInput.files[0]; if (!f) return;
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => { n.icon = img; n.iconSrc = url; iconImg.innerHTML = ""; iconImg.style.backgroundImage = `url('${url}')`; untouched = false; restart(); };
        img.src = url;
      });
      row.querySelector(".lock-del").addEventListener("click", () => {
        notifs.splice(i, 1);
        if (!notifs.length) notifs.push({ app: "Rhabit", text: "", color: "#ff7a1a", icon: rhabitIcon, iconSrc: "assets/rhabit-icon.png" });
        untouched = false; renderList(); restart();
      });
      listEl.appendChild(row);
    });
  }
  addBtn.addEventListener("click", () => {
    const colors = ["#ff7a1a", "#3fb6ff", "#22c55e", "#9b8cff", "#f472b6"];
    notifs.push({ app: "Rhabit", text: "", color: colors[notifs.length % colors.length], icon: null, iconSrc: null });
    untouched = false; renderList(); restart();
  });
  wallInput.addEventListener("change", () => {
    const f = wallInput.files && wallInput.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => { wallpaper = img; restart(); };
    img.src = URL.createObjectURL(f);
  });
  const langSeg = document.getElementById("mk-lang");
  if (langSeg) langSeg.addEventListener("click", () => setTimeout(() => {
    if (untouched && notifs.length === 1) { notifs[0].text = DEF[langNow()]; renderList(); restart(); }
  }, 0));
  renderList();

  // ---- Descarga: captura el canvas un ciclo ----
  function saveBlob(blob, name) {
    const u = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
  }
  window.__lockDownload = function () {
    return new Promise((resolve, reject) => {
      const cands = ["video/mp4;codecs=h264", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mime = window.MediaRecorder && cands.find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) { reject(new Error("MediaRecorder no soportado")); return; }
      const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
      const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 12000000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime.split(";")[0] });
        if (blob.size < 1000) { reject(new Error("grabación vacía")); return; }
        saveBlob(blob, `rhabit-pantalla-bloqueo.${ext}`);
        resolve();
      };
      restart();
      rec.start();
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, CYCLE * 1000 + 120);
    });
  };
})();
