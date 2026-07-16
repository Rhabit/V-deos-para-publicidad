/* Nuevo móvil: escena 1 = registro de serie con el estilo de la app original
   (ActiveWorkout: barra de stats, tarjeta de ejercicio, filas de series naranjas
   con check). Al completar la última serie salta a la escena 2 = SUBIDA DE RANGO
   (Silver I) épica, todo dentro del mismo marco de móvil y con la paleta cálida
   de la marca. Canvas puro, editable en vivo, descarga MP4/MediaRecorder. */
(function initRankUp() {
  const canvas = document.getElementById("rank-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920, CYCLE = 8.0;
  canvas.width = W; canvas.height = H;
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  // Paleta de la app (src/theme.ts)
  const C = {
    bg: "#090906", surface: "#17120F", surfaceAlt: "#221c17",
    accent: "#ff7a1a", sport: "#f5b14a", text: "#ffffff",
    textDim: "#c2b8a8", border: "#2c241d",
  };

  // Marco de móvil
  const PX = 150, PY = 86, PW = 780, PH = 1748, PR = 96;
  const SX = PX + 16, SY = PY + 16, SW = PW - 32, SH = PH - 32, SR = PR - 16;

  const emblem = new Image(); emblem.src = "assets/rank-silver.png";
  const langNow = () => {
    const on = document.querySelector("#mk-lang button.on");
    return on && on.dataset.lang === "en" ? "en" : "es";
  };
  const TX = {
    es: { exercise: "Press de banca", time: "TIEMPO", vol: "VOLUMEN", sets: "SERIES", muscles: "MÚSCULOS", colSet: "SERIE", colPrev: "ANTERIOR", addSet: "Añadir serie", rankup: "SUBIDA DE RANGO", rank: "SILVER I", sub: "Sigue así. Imparable." },
    en: { exercise: "Bench press", time: "TIME", vol: "VOLUME", sets: "SETS", muscles: "MUSCLES", colSet: "SET", colPrev: "PREVIOUS", addSet: "Add set", rankup: "RANK UP", rank: "SILVER I", sub: "Keep going. Unstoppable." },
  };
  let weight = "62", reps = "8";
  let start = performance.now();
  const restart = () => { start = performance.now(); };

  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeOutBack = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function spacedText(text, x, y, px) { ctx.letterSpacing = px + "px"; ctx.fillText(text, x, y); ctx.letterSpacing = "0px"; }

  const SPARKS = [];
  for (let i = 0; i < 30; i++) SPARKS.push({ a: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 0.7, ph: Math.random(), sz: 2 + Math.random() * 4 });

  // ---------- Marco de móvil ----------
  function drawPhone(content) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    roundRect(PX, PY, PW, PH, PR); ctx.fillStyle = "#0b0a09"; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = "#2a2320"; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.stroke();
    ctx.save(); roundRect(SX, SY, SW, SH, SR); ctx.clip();
    content();
    ctx.restore();
    const nw = 230, nh = 34;
    roundRect(W / 2 - nw / 2, SY + 14, nw, nh, nh / 2); ctx.fillStyle = "#000"; ctx.fill();
  }
  function drawStatusBar() {
    const y = SY + 70;
    ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `700 30px ${FONT}`;
    ctx.fillText("9:41", SX + 46, y);
    // señal
    let bx = SX + SW - 168, by = y;
    ctx.fillStyle = C.text;
    for (let i = 0; i < 4; i++) { const bh = 8 + i * 7; ctx.fillRect(bx + i * 13, by - bh, 8, bh); }
    // batería
    const btx = SX + SW - 100, bty = y - 22, bw = 56, bh = 26;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,0.6)";
    roundRect(btx, bty, bw, bh, 7); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.6)"; roundRect(btx + bw + 2, bty + 8, 5, 10, 2); ctx.fill();
    ctx.fillStyle = C.text; roundRect(btx + 4, bty + 4, (bw - 8) * 0.7, bh - 8, 4); ctx.fill();
  }
  function dumbbell(cx, cy, s, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineCap = "round";
    ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy); ctx.lineTo(cx + s * 0.5, cy); ctx.stroke();
    ctx.lineWidth = s * 0.36;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy - s * 0.3); ctx.lineTo(cx - s * 0.5, cy + s * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + s * 0.5, cy - s * 0.3); ctx.lineTo(cx + s * 0.5, cy + s * 0.3); ctx.stroke();
    ctx.restore();
  }
  function checkMark(cx, cy, s, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.28; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(cx - s * 0.42, cy + s * 0.02); ctx.lineTo(cx - s * 0.1, cy + s * 0.34); ctx.lineTo(cx + s * 0.46, cy - s * 0.36); ctx.stroke();
    ctx.restore();
  }

  // ---------- Escena 1: registro de serie ----------
  function drawWorkout(t) {
    const L = TX[langNow()];
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    drawStatusBar();

    const pressT = 2.0, done3 = t >= pressT;
    const sets = [
      { n: 1, prev: "60×10", kg: "60", reps: "10", done: true },
      { n: 2, prev: "60×9", kg: "60", reps: "9", done: true },
      { n: 3, prev: "62×8", kg: weight, reps: reps, done: done3 },
    ];
    const vol = sets.filter((s) => s.done).reduce((a, s) => a + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0);
    const nDone = sets.filter((s) => s.done).length;

    // Barra de stats
    const sbY = SY + 150;
    const cols = [
      { label: L.time, value: "12:04" },
      { label: L.vol, value: String(Math.round(vol)) },
      { label: L.sets, value: String(nDone) },
      { label: L.muscles, value: "2" },
    ];
    const gx0 = SX + 30, gw = SW - 60, cw = gw / cols.length;
    ctx.textAlign = "center";
    cols.forEach((c, i) => {
      const cx = gx0 + cw * i + cw / 2;
      ctx.fillStyle = C.text; ctx.font = `800 46px ${FONT}`; ctx.fillText(c.value, cx, sbY);
      ctx.fillStyle = C.textDim; ctx.font = `600 24px ${FONT}`; spacedText(c.label, cx, sbY + 40, 1);
      if (i < cols.length - 1) { ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx0 + cw * (i + 1), sbY - 34); ctx.lineTo(gx0 + cw * (i + 1), sbY + 30); ctx.stroke(); }
    });
    ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(SX, sbY + 90); ctx.lineTo(SX + SW, sbY + 90); ctx.stroke();

    // Tarjeta de ejercicio
    const cardX = SX + 26, cardW = SW - 52, cardY = sbY + 128;
    const rowH = 118, headH = 130, colH = 64;
    const cardH = headH + colH + rowH * 3 + 96;
    roundRect(cardX, cardY, cardW, cardH, 34);
    ctx.fillStyle = "rgba(255,255,255,0.025)"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();

    // Cabecera: thumb + nombre + ...
    const thumbR = 44, thumbX = cardX + 44 + thumbR, thumbY = cardY + 40 + thumbR;
    ctx.beginPath(); ctx.arc(thumbX, thumbY, thumbR, 0, 7); ctx.fillStyle = "rgba(255,122,26,0.08)"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,122,26,0.45)"; ctx.stroke();
    dumbbell(thumbX, thumbY, 46, C.accent);
    ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `800 44px ${FONT}`;
    ctx.fillText(L.exercise, thumbX + thumbR + 30, thumbY + 15);
    ctx.textAlign = "center"; ctx.fillStyle = C.textDim; ctx.font = `800 40px ${FONT}`;
    ctx.fillText("···", cardX + cardW - 60, thumbY - 6);

    // Cabecera de columnas
    const inX = cardX + 20, inW = cardW - 40;
    const colSet = inX + inW * 0.10, colPrev = inX + inW * 0.34, colKg = inX + inW * 0.56, colReps = inX + inW * 0.73, colChk = inX + inW * 0.90;
    const colY = cardY + headH + 26;
    ctx.fillStyle = C.textDim; ctx.font = `700 24px ${FONT}`; ctx.textAlign = "center";
    spacedText(L.colSet, colSet, colY, 1); spacedText(L.colPrev, colPrev, colY, 1);
    spacedText("KG", colKg, colY, 1); spacedText("REPS", colReps, colY, 1);

    // Filas de series
    let ry = cardY + headH + colH;
    sets.forEach((s) => {
      const cy = ry + rowH / 2;
      const isCurr = s.n === 3;
      const doneAnim = isCurr ? clamp01((t - pressT) / 0.3) : 1;
      const on = s.done;
      if (on) {
        ctx.globalAlpha = isCurr ? doneAnim : 1;
        roundRect(inX - 4, ry + 8, inW + 8, rowH - 16, 22);
        const gg = ctx.createLinearGradient(0, ry, 0, ry + rowH);
        gg.addColorStop(0, "rgba(255,122,26,0.16)"); gg.addColorStop(1, "rgba(255,122,26,0.05)");
        ctx.fillStyle = gg; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,122,26,0.30)"; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // número
      ctx.textAlign = "center"; ctx.font = `800 34px ${FONT}`;
      ctx.fillStyle = on ? C.accent : C.textDim; ctx.fillText(String(s.n), colSet, cy + 12);
      // anterior
      ctx.fillStyle = C.textDim; ctx.font = `500 28px ${FONT}`; ctx.fillText(s.prev, colPrev, cy + 10);
      // kg / reps
      const valColor = on ? C.accent : C.text;
      if (!on) {
        roundRect(colKg - 62, cy - 34, 124, 68, 14); ctx.fillStyle = C.surfaceAlt; ctx.fill();
        roundRect(colReps - 62, cy - 34, 124, 68, 14); ctx.fillStyle = C.surfaceAlt; ctx.fill();
      }
      ctx.fillStyle = valColor; ctx.font = `800 44px ${FONT}`;
      ctx.fillText(String(s.kg), colKg, cy + 14); ctx.fillText(String(s.reps), colReps, cy + 14);
      // check
      const chS = 62, chX = colChk - chS / 2, chY = cy - chS / 2;
      const pop = isCurr ? 1 + 0.18 * Math.sin(clamp01((t - pressT) / 0.18) * Math.PI) : 1;
      ctx.save(); ctx.translate(colChk, cy); ctx.scale(pop, pop); ctx.translate(-colChk, -cy);
      roundRect(chX, chY, chS, chS, 16);
      if (on) {
        const cg = ctx.createLinearGradient(chX, chY, chX, chY + chS);
        cg.addColorStop(0, C.sport); cg.addColorStop(1, C.accent);
        ctx.fillStyle = cg; ctx.globalAlpha = isCurr ? doneAnim : 1; ctx.fill(); ctx.globalAlpha = 1;
        checkMark(colChk, cy, chS * 0.7, "#1a0f06");
      } else {
        ctx.lineWidth = 3; ctx.strokeStyle = C.border; ctx.stroke();
        checkMark(colChk, cy, chS * 0.62, "rgba(194,184,168,0.35)");
      }
      ctx.restore();

      // pista de toque antes de completar
      if (isCurr && t < pressT) {
        const pulse = (Math.sin(t * 6) + 1) / 2;
        ctx.globalAlpha = 0.35 + 0.35 * pulse;
        ctx.beginPath(); ctx.arc(colChk, cy, chS * 0.6 + 12 * pulse, 0, 7);
        ctx.lineWidth = 4; ctx.strokeStyle = C.accent; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ry += rowH;
    });

    // Añadir serie (discontinuo)
    const asY = ry + 22, asX = inX, asW = inW, asH = 66;
    ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,122,26,0.4)";
    roundRect(asX, asY, asW, asH, 18); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C.accent; ctx.textAlign = "center"; ctx.font = `700 32px ${FONT}`;
    ctx.fillText("+  " + L.addSet, asX + asW / 2, asY + asH / 2 + 12);
  }

  function drawFlash(a) { a = clamp01(a); if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fff"; roundRect(SX, SY, SW, SH, SR); ctx.fill(); ctx.restore(); }

  // ---------- Escena 2: subida de rango (dentro del móvil, paleta cálida) ----------
  function drawRays(rt, cx, cy, alpha) {
    if (alpha <= 0.01) return;
    const n = 16;
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.rotate(rt * 0.22);
    for (let i = 0; i < n; i++) {
      ctx.rotate((Math.PI * 2) / n);
      const grad = ctx.createLinearGradient(0, 0, 0, -1400);
      grad.addColorStop(0, "rgba(255,205,140,0)");
      grad.addColorStop(0.04, "rgba(255,190,120,0.24)");
      grad.addColorStop(1, "rgba(255,190,120,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(130, -1400); ctx.lineTo(-130, -1400); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function drawSparks(rt, cx, cy, alpha) {
    if (rt < 0.85 || alpha <= 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (const p of SPARKS) {
      const life = ((rt - 0.85) * p.sp + p.ph) % 1;
      const rad = 150 + life * 470;
      const x = cx + Math.cos(p.a) * rad * 0.72, y = cy + Math.sin(p.a) * rad - life * 150;
      ctx.globalAlpha = (1 - life) * alpha; ctx.fillStyle = "rgba(255,210,150,1)";
      ctx.beginPath(); ctx.arc(x, y, p.sz * (1 - life * 0.5), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function drawRankUp(rt) {
    const L = TX[langNow()];
    ctx.fillStyle = "#0a0705"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = SY + SH * 0.34;
    const pulse = 0.5 + 0.5 * Math.sin(rt * 3);
    let rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
    rg.addColorStop(0, `rgba(255,150,60,${0.26 + 0.1 * pulse})`);
    rg.addColorStop(0.42, "rgba(180,90,30,0.14)");
    rg.addColorStop(1, "rgba(10,7,5,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    const app = clamp01((rt - 0.15) / 0.9);
    const emAlpha = clamp01((rt - 0.15) / 0.45);
    const sc = app <= 0 ? 0 : easeOutBack(app);

    drawRays(rt, cx, cy, 0.45 * emAlpha + 0.12 * pulse);

    if (emAlpha > 0) {
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 440 * Math.max(0.3, sc));
      gr.addColorStop(0, `rgba(255,200,140,${0.5 * emAlpha})`);
      gr.addColorStop(0.5, `rgba(255,140,50,${0.22 * emAlpha})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    const landT = 0.9;
    if (rt > landT) {
      const k = (rt - landT) / 0.6;
      if (k < 1) {
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = (1 - k) * 0.6;
        ctx.lineWidth = 8 * (1 - k) + 2; ctx.strokeStyle = "rgba(255,210,150,1)";
        ctx.beginPath(); ctx.arc(cx, cy, 160 + k * 430, 0, 7); ctx.stroke(); ctx.restore();
      }
    }

    const ar = (emblem.naturalWidth && emblem.naturalHeight) ? emblem.naturalWidth / emblem.naturalHeight : 0.95;
    const ew = 480 * sc, eh = ew / ar;
    if (sc > 0.02 && emblem.complete && emblem.naturalWidth) {
      const ow = Math.round(ew), oh = Math.round(eh);
      const off = drawRankUp._off || (drawRankUp._off = document.createElement("canvas"));
      off.width = ow; off.height = oh;
      const octx = off.getContext("2d");
      octx.clearRect(0, 0, ow, oh); octx.drawImage(emblem, 0, 0, ow, oh);
      if (rt > landT + 0.2) {
        const sweep = ((rt - (landT + 0.2)) % 2.4) / 2.4;
        octx.save(); octx.globalCompositeOperation = "source-atop";
        const gxp = -ow * 0.35 + sweep * (ow * 1.7);
        const lg = octx.createLinearGradient(gxp - 110, 0, gxp + 110, 0);
        lg.addColorStop(0, "rgba(255,240,220,0)"); lg.addColorStop(0.5, "rgba(255,240,220,0.55)"); lg.addColorStop(1, "rgba(255,240,220,0)");
        octx.fillStyle = lg; octx.translate(ow / 2, oh / 2); octx.rotate(-0.32); octx.translate(-ow / 2, -oh / 2);
        octx.fillRect(-ow, -oh, ow * 3, oh * 3); octx.restore();
      }
      ctx.save(); ctx.globalAlpha = emAlpha; ctx.drawImage(off, cx - ew / 2, cy - eh / 2, ew, eh); ctx.restore();
    }

    drawSparks(rt, cx, cy, emAlpha);

    const tTop = clamp01((rt - 0.7) / 0.5);
    if (tTop > 0) {
      ctx.save(); ctx.globalAlpha = tTop; ctx.textAlign = "center";
      const ty = SY + SH * 0.11 + (1 - easeOut(tTop)) * 34;
      ctx.font = `800 54px ${FONT}`; ctx.fillStyle = C.sport;
      ctx.shadowColor = "rgba(255,140,40,0.85)"; ctx.shadowBlur = 30;
      spacedText(L.rankup, W / 2, ty, 8);
      ctx.restore();
    }

    const tRank = clamp01((rt - 1.15) / 0.5);
    if (tRank > 0) {
      const rscale = 0.82 + 0.18 * easeOut(tRank);
      ctx.save(); ctx.globalAlpha = tRank; ctx.textAlign = "center";
      ctx.translate(W / 2, SY + SH * 0.66); ctx.scale(rscale, rscale);
      ctx.font = `900 132px ${FONT}`;
      const mg = ctx.createLinearGradient(0, -100, 0, 40);
      mg.addColorStop(0, "#ffffff"); mg.addColorStop(0.42, "#dcdfe8"); mg.addColorStop(0.5, "#9aa0b4"); mg.addColorStop(0.58, "#c9cedd"); mg.addColorStop(1, "#7b8296");
      ctx.fillStyle = mg; ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
      spacedText(L.rank, 0, 0, 7);
      ctx.restore();
    }

    const tSub = clamp01((rt - 1.6) / 0.6);
    if (tSub > 0) {
      ctx.save(); ctx.globalAlpha = tSub; ctx.textAlign = "center";
      ctx.fillStyle = C.textDim; ctx.font = `600 36px ${FONT}`;
      ctx.fillText(L.sub, W / 2, SY + SH * 0.77);
      ctx.restore();
    }
  }

  function render(t) {
    const flashStart = 2.85, rankStart = 3.02;
    drawPhone(() => {
      if (t < flashStart) { drawWorkout(t); }
      else if (t < rankStart) { drawWorkout(flashStart); drawFlash((t - flashStart) / (rankStart - flashStart)); }
      else { const rt = t - rankStart; drawRankUp(rt); if (rt < 0.3) drawFlash(1 - rt / 0.3); }
    });
  }

  let encoding = false;
  function frame(now) { if (!encoding) render(((now - start) / 1000) % CYCLE); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  // ---------- Controles ----------
  const wI = document.getElementById("rank-weight"), rI = document.getElementById("rank-reps");
  if (wI) wI.addEventListener("input", () => { weight = (wI.value || "0").slice(0, 4); restart(); });
  if (rI) rI.addEventListener("input", () => { reps = (rI.value || "0").slice(0, 4); restart(); });
  const langSeg = document.getElementById("mk-lang");
  if (langSeg) langSeg.addEventListener("click", () => setTimeout(restart, 0));

  // ---------- Descarga ----------
  function saveBlob(blob, name) {
    const u = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
  }
  window.__rankupDownload = async function () {
    if (window.mp4Support && window.mp4Support()) {
      const enc = await window.makeMp4Encoder(W, H, 30, 12000000);
      if (enc) {
        try {
          encoding = true;
          const FPS = 30, total = Math.round(CYCLE * FPS);
          for (let i = 0; i < total; i++) { render(i / FPS); await enc.addFrame(canvas, i * 1e6 / FPS, i % 60 === 0); }
          const blob = await enc.finish(); encoding = false;
          if (blob.size >= 1000) { saveBlob(blob, "rhabit-subida-rango.mp4"); return; }
        } catch (e) { encoding = false; }
      }
    }
    return new Promise((resolve, reject) => {
      const cands = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1", "video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mime = window.MediaRecorder && cands.find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) { reject(new Error("MediaRecorder no soportado")); return; }
      const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
      const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 12000000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime.split(";")[0] });
        if (blob.size < 1000) { reject(new Error("grabación vacía")); return; }
        saveBlob(blob, `rhabit-subida-rango.${ext}`); resolve();
      };
      restart(); rec.start();
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, CYCLE * 1000 + 120);
    });
  };
})();
