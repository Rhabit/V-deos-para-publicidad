/* Móvil (Estadísticas): TIME-LAPSE motivacional estilo short.
   De usuario principiante a avanzado a lo largo de mucho tiempo: sube el nivel,
   los anillos de % se elevan, las barras y la gráfica se completan, se marcan
   los músculos trabajados de ninguno a todos. Mismo marco/3D exacto que el resto.
   Solo se anima al pasar el cursor. Descarga MP4. */
(function initStats() {
  const canvas = document.getElementById("stats-canvas");
  if (!canvas) return;
  const mainCtx = canvas.getContext("2d");
  const W = 1080, H = 1920, CYCLE = 7.0;
  canvas.width = W; canvas.height = H;
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  const pcv = document.createElement("canvas"); pcv.width = W; pcv.height = H;
  const pctx = pcv.getContext("2d");
  let ctx = mainCtx;

  const C = { bg: "#090906", surface: "#17120F", surfaceAlt: "#221c17", accent: "#ff7a1a", sport: "#f5b14a", text: "#ffffff", textDim: "#c2b8a8", border: "#2c241d" };
  const PW = 798, PH = 1729, PX = Math.round(540 - PW / 2), PY = Math.round(960 - PH / 2), PR = 120;
  const SX = PX + 33, SY = PY + 33, SW = PW - 66, SH = PH - 66, SR = 90;

  const langNow = () => { const on = document.querySelector("#mk-lang button.on"); return on && on.dataset.lang === "en" ? "en" : "es"; };
  const poseNow = () => { const on = document.querySelector("#mk-pose button.on"); return on && on.dataset.pose === "flat" ? "flat" : "iso"; };
  const bgColor = () => { const el = document.getElementById("mk-color"); return (el && el.value) || "#202124"; };
  const EN = () => langNow() === "en";

  const img = (src) => { const i = new Image(); i.src = src; if (i.decode) i.decode().catch(() => {}); return i; };
  const cuerpo = img("assets/musc/cuerpo.png");
  const MUSCLES = ["pecho", "dorsales", "deltoideslateral", "deltoidesanterior", "hombro", "trapeciosuperior", "trapeciomedio", "biceps", "triceps", "antebrazo", "abdominalsuperior", "abdominalmedia", "oblicuosexternos", "serratoanterior", "cuádriceps", "isquiotibiales", "gluteomayor", "gemelo"].map((m) => ({ m, im: img("assets/musc/" + m + ".png") }));

  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  function roundRect(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function spaced(text, x, y, px) { ctx.letterSpacing = px + "px"; ctx.fillText(text, x, y); ctx.letterSpacing = "0px"; }
  function glow(cx, cy, r, col) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.fillRect(SX, SY, SW, SH); ctx.restore(); }
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(Math.round(n));

  // ---------- Marco ----------
  function drawPhone(content) {
    const g = ctx.createLinearGradient(PX + PW * 0.3, PY, PX + PW * 0.7, PY + PH);
    g.addColorStop(0, "#2a221c"); g.addColorStop(1, "#0e0b09");
    roundRect(PX, PY, PW, PH, PR); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#33291f"; ctx.stroke();
    ctx.save(); roundRect(SX, SY, SW, SH, SR); ctx.clip();
    ctx.fillStyle = C.bg; ctx.fillRect(SX, SY, SW, SH);
    content();
    ctx.restore();
    roundRect(540 - 117, PY + 48, 234, 21, 11); ctx.fillStyle = "#000"; ctx.fill();
  }
  function statusBar() {
    const y = SY + 66;
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `600 32px ${FONT}`; ctx.fillText("9:41", SX + 42, y);
    let bx = SX + SW - 160; ctx.fillStyle = C.textDim;
    for (let i = 0; i < 4; i++) { const bh = 7 + i * 6; ctx.fillRect(bx + i * 12, y - bh, 7, bh); }
    const btx = SX + SW - 94, bty = y - 20, bw = 50, bh = 24;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(194,184,168,0.7)"; roundRect(btx, bty, bw, bh, 6); ctx.stroke();
    ctx.fillStyle = "rgba(194,184,168,0.7)"; roundRect(btx + bw + 2, bty + 7, 4, 10, 2); ctx.fill();
    ctx.fillStyle = C.textDim; roundRect(btx + 4, bty + 4, (bw - 8) * 0.7, bh - 8, 3); ctx.fill();
  }
  function ring(cx, cy, r, lw, frac, col, track) {
    ctx.save(); ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.lineWidth = lw; ctx.strokeStyle = track || "rgba(255,122,26,0.14)"; ctx.stroke();
    if (frac > 0.001) {
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke();
      const a = -Math.PI / 2 + frac * Math.PI * 2, hx = cx + Math.cos(a) * r, hy = cy + Math.sin(a) * r;
      ctx.beginPath(); ctx.arc(hx, hy, lw * 0.62, 0, 7); ctx.fillStyle = "#fff"; ctx.fill();
    }
    ctx.restore();
  }

  function scene(t) {
    const p = clamp01(t / CYCLE), e = easeOut(p), pulse = 0.5 + 0.5 * Math.sin(t * 6);
    statusBar();
    const l = {
      es: { title: "TU PROGRESO", sub: "De principiante a avanzado", consist: "CONSTANCIA", habits: "HÁBITOS COMPLETADOS", cal: "RACHA DE DÍAS", muscTitle: "MÚSCULOS TRABAJADOS", tasks: ["Entrenar", "Meditar", "Leer 20 min", "Beber agua"] },
      en: { title: "YOUR PROGRESS", sub: "From beginner to advanced", consist: "CONSISTENCY", habits: "HABITS COMPLETED", cal: "DAY STREAK", muscTitle: "MUSCLES WORKED", tasks: ["Workout", "Meditate", "Read 20 min", "Drink water"] },
    }[langNow()];

    // Header
    ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `800 46px ${FONT}`; ctx.fillText(l.title, SX + 40, SY + 158);
    ctx.fillStyle = C.textDim; ctx.font = `500 26px ${FONT}`; ctx.fillText(l.sub, SX + 40, SY + 198);

    // ── Gráfica lineal (constancia sube) ──
    const gcY = SY + 236, gcH = 336, gcX = SX + 40, gcW = SW - 80;
    roundRect(gcX, gcY, gcW, gcH, 24); ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `600 24px ${FONT}`; spaced(l.consist, gcX + 30, gcY + 48, 1);
    ctx.fillStyle = C.accent; ctx.font = `800 64px ${FONT}`; ctx.fillText(Math.round(12 + e * 84) + "%", gcX + 30, gcY + 116);
    const pts = [0.12, 0.2, 0.16, 0.3, 0.28, 0.44, 0.52, 0.48, 0.64, 0.74, 0.86, 0.96];
    const cax = gcX + 30, caw = gcW - 60, cay = gcY + 150, cah = gcH - 182, n = pts.length;
    const gpx = (i) => cax + caw * i / (n - 1), gpy = (v) => cay + cah - v * cah;
    ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
    for (let g = 0; g <= 3; g++) { const yy = cay + cah * g / 3; ctx.beginPath(); ctx.moveTo(cax, yy); ctx.lineTo(cax + caw, yy); ctx.stroke(); }
    const prog = e * (n - 1), lastI = Math.floor(prog), frac = prog - lastI, rp = [];
    for (let i = 0; i <= lastI && i < n; i++) rp.push([gpx(i), gpy(pts[i])]);
    if (lastI < n - 1) { const vv = pts[lastI] + (pts[lastI + 1] - pts[lastI]) * frac; rp.push([gpx(lastI + frac), gpy(vv)]); }
    if (rp.length >= 2) {
      ctx.beginPath(); ctx.moveTo(rp[0][0], cay + cah); rp.forEach((q) => ctx.lineTo(q[0], q[1])); ctx.lineTo(rp[rp.length - 1][0], cay + cah); ctx.closePath();
      const ag = ctx.createLinearGradient(0, cay, 0, cay + cah); ag.addColorStop(0, "rgba(255,122,26,0.35)"); ag.addColorStop(1, "rgba(255,122,26,0)"); ctx.fillStyle = ag; ctx.fill();
      ctx.beginPath(); rp.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.strokeStyle = C.accent; ctx.lineWidth = 5; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();
      const hd = rp[rp.length - 1]; ctx.beginPath(); ctx.arc(hd[0], hd[1], 11, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = C.accent; ctx.lineWidth = 4; ctx.stroke();
    }

    // ── Lista de tareas (se completan y se tachan) ──
    const tY = SY + 606, tH = 300, tX = SX + 40, tW = SW - 80;
    roundRect(tX, tY, tW, tH, 24); ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `600 24px ${FONT}`; spaced(l.habits, tX + 30, tY + 46, 1);
    const rowH = 56, rowY0 = tY + 96;
    l.tasks.forEach((task, i) => {
      const ry = rowY0 + i * rowH, done = clamp01((e - (0.12 + i * 0.16)) / 0.1), on = done > 0.5;
      const bxx = tX + 34, byy = ry;
      roundRect(bxx, byy - 24, 48, 48, 14);
      if (on) {
        const cg = ctx.createLinearGradient(bxx, byy - 24, bxx + 48, byy + 24); cg.addColorStop(0, C.accent); cg.addColorStop(1, C.sport); ctx.fillStyle = cg; ctx.fill();
        ctx.save(); ctx.strokeStyle = "#1a0f04"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(bxx + 12, byy); ctx.lineTo(bxx + 21, byy + 11); ctx.lineTo(bxx + 37, byy - 12); ctx.stroke(); ctx.restore();
      } else { ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke(); }
      ctx.textAlign = "left"; ctx.fillStyle = on ? C.textDim : C.text; ctx.font = `600 34px ${FONT}`; ctx.fillText(task, bxx + 74, byy + 12);
      if (done > 0) { const tw = ctx.measureText(task).width; ctx.strokeStyle = C.textDim; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bxx + 74, byy - 1); ctx.lineTo(bxx + 74 + tw * done, byy - 1); ctx.stroke(); }
    });

    // ── Calendario (racha; los días se van rellenando) ──
    const kY = SY + 936, kH = 340, kX = SX + 40, kW = SW - 80;
    roundRect(kX, kY, kW, kH, 24); ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `600 24px ${FONT}`; spaced(l.cal, kX + 30, kY + 48, 1);
    const cols = 7, rows = 5, cellN = cols * rows, filledN = Math.round(e * cellN);
    ctx.textAlign = "right"; ctx.fillStyle = C.accent; ctx.font = `800 46px ${FONT}`; ctx.fillText(String(filledN), kX + kW - 30, kY + 54);
    const gpad = 30, gtop = kY + 86, cellStep = (kH - 116) / rows, cellSz = Math.min((kW - gpad * 2) / cols - 10, cellStep - 10);
    const cellW = (kW - gpad * 2) / cols;
    for (let d = 0; d < cellN; d++) {
      const cc = d % cols, rr = Math.floor(d / cols);
      const dx = kX + gpad + cc * cellW + (cellW - cellSz) / 2, dy = gtop + rr * cellStep;
      const a = clamp01(e * cellN - d);
      roundRect(dx, dy, cellSz, cellSz, 10);
      if (a > 0.5) { ctx.fillStyle = "rgba(255,122,26,0.92)"; ctx.fill(); } else { ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.border; ctx.stroke(); }
    }

    // ── Mapa de músculos (de ninguno a todos) ──
    const mTitleY = SY + 1328, mBoxY = mTitleY + 30, mBoxH = SY + SH - mBoxY - 22;
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `600 24px ${FONT}`; spaced(l.muscTitle, SX + 40, mTitleY, 1);
    const mX = SX + 40, mW = SW - 80;
    roundRect(mX, mBoxY, mW, mBoxH, 24); ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.save(); roundRect(mX + 4, mBoxY + 4, mW - 8, mBoxH - 8, 20); ctx.clip();
    if (cuerpo.complete && cuerpo.naturalWidth) {
      const ar = cuerpo.naturalWidth / cuerpo.naturalHeight; let dw = mW - 60, dh = (mW - 60) / ar; if (dh > mBoxH - 28) { dh = mBoxH - 28; dw = dh * ar; }
      const ix = mX + (mW - dw) / 2, iy = mBoxY + (mBoxH - dh) / 2;
      ctx.globalAlpha = 0.5; ctx.drawImage(cuerpo, ix, iy, dw, dh); ctx.globalAlpha = 1;
      MUSCLES.forEach((mu, i) => { const a = clamp01((e - i / MUSCLES.length * 0.9) / 0.08); if (a > 0.01 && mu.im.complete && mu.im.naturalWidth) { ctx.globalAlpha = a; ctx.drawImage(mu.im, ix, iy, dw, dh); ctx.globalAlpha = 1; } });
      const nOn = MUSCLES.filter((mu, i) => e > i / MUSCLES.length * 0.9).length;
      ctx.textAlign = "right"; ctx.fillStyle = C.accent; ctx.font = `800 40px ${FONT}`; ctx.fillText(nOn + "/" + MUSCLES.length, mX + mW - 30, mBoxY + 54);
    }
    ctx.restore();
  }

  // ---------- Proyección 3D ----------
  const ISO = { ry: -16 * Math.PI / 180, rx: 4 * Math.PI / 180, rz: 1 * Math.PI / 180, psp: 4200 };
  function dest(u, v) {
    let x = (u - 0.5) * PW, y = (v - 0.5) * PH, z = 0, c, s, a, b;
    c = Math.cos(ISO.rz); s = Math.sin(ISO.rz); a = x * c - y * s; b = x * s + y * c; x = a; y = b;
    c = Math.cos(ISO.rx); s = Math.sin(ISO.rx); a = y * c - z * s; b = y * s + z * c; y = a; z = b;
    c = Math.cos(ISO.ry); s = Math.sin(ISO.ry); a = x * c + z * s; b = -x * s + z * c; x = a; z = b;
    const f = ISO.psp / (ISO.psp - z); return [540 + x * f, 960 + y * f];
  }
  function drawTri(im, s0, s1, s2, d0, d1, d2) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]); ctx.lineTo(d2[0], d2[1]); ctx.closePath(); ctx.clip();
    const x0 = s0[0], y0 = s0[1], x1 = s1[0], y1 = s1[1], x2 = s2[0], y2 = s2[1];
    const u0 = d0[0], v0 = d0[1], u1 = d1[0], v1 = d1[1], u2 = d2[0], v2 = d2[1];
    const den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
    if (Math.abs(den) > 1e-6) {
      const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / den, b = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / den;
      const c = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / den, d = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / den;
      const e = (u0 * (x1 * y2 - x2 * y1) + u1 * (x2 * y0 - x0 * y2) + u2 * (x0 * y1 - x1 * y0)) / den, f = (v0 * (x1 * y2 - x2 * y1) + v1 * (x2 * y0 - x0 * y2) + v2 * (x0 * y1 - x1 * y0)) / den;
      ctx.setTransform(a, b, c, d, e, f); ctx.drawImage(im, 0, 0);
    }
    ctx.restore();
  }
  function blitIso(src) {
    const N = 14, M = 24;
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, v0 = j / M, v1 = (j + 1) / M;
      const A = dest(u0, v0), B = dest(u1, v0), Cc = dest(u1, v1), D = dest(u0, v1);
      const sA = [PX + u0 * PW, PY + v0 * PH], sB = [PX + u1 * PW, PY + v0 * PH], sC = [PX + u1 * PW, PY + v1 * PH], sD = [PX + u0 * PW, PY + v1 * PH];
      drawTri(src, sA, sB, sC, A, B, Cc); drawTri(src, sA, sC, sD, A, Cc, D);
    }
  }
  function render(t) {
    ctx = pctx; pctx.clearRect(0, 0, W, H);
    drawPhone(() => scene(t));
    ctx = mainCtx; mainCtx.fillStyle = bgColor(); mainCtx.fillRect(0, 0, W, H);
    if (poseNow() === "iso") blitIso(pcv); else mainCtx.drawImage(pcv, 0, 0);
  }

  let start = performance.now(), hover = false, encoding = false;
  const clipEl = canvas.closest(".clip");
  if (clipEl) {
    clipEl.addEventListener("mouseenter", () => { hover = true; start = performance.now(); });
    clipEl.addEventListener("mouseleave", () => { hover = false; render(0); });
  }
  render(0);
  function frame(now) { if (!encoding && hover) render(((now - start) / 1000) % CYCLE); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  function saveBlob(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000); }
  window.__statsDownload = async function () {
    if (window.mp4Support && window.mp4Support()) {
      const enc = await window.makeMp4Encoder(W, H, 30, 12000000);
      if (enc) {
        try {
          encoding = true; const FPS = 30, total = Math.round(CYCLE * FPS);
          for (let i = 0; i < total; i++) { render(i / FPS); await enc.addFrame(canvas, i * 1e6 / FPS, i % 60 === 0); }
          const blob = await enc.finish(); encoding = false;
          if (blob.size >= 1000) { saveBlob(blob, "rhabit-estadisticas.mp4"); return; }
        } catch (e) { encoding = false; }
      }
    }
    return new Promise((resolve, reject) => {
      const cands = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1", "video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
      const mime = window.MediaRecorder && cands.find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) { reject(new Error("MediaRecorder no soportado")); return; }
      const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
      const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 12000000 });
      const chunks = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => { const blob = new Blob(chunks, { type: mime.split(";")[0] }); if (blob.size < 1000) { reject(new Error("vacío")); return; } saveBlob(blob, `rhabit-estadisticas.${ext}`); resolve(); };
      start = performance.now(); rec.start();
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, CYCLE * 1000 + 200);
    });
  };
})();
