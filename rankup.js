/* Nuevo móvil: registro de serie (peso + reps) que, al completar la serie, salta
   a una escena épica de SUBIDA DE RANGO (Silver I) con emblema, rayos de luz,
   destellos y aparición progresiva. Todo en CANVAS, editable en vivo y con
   descarga MP4 (WebCodecs) o MediaRecorder. Pensado para anuncios con phonk. */
(function initRankUp() {
  const canvas = document.getElementById("rank-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920, CYCLE = 8.0;
  canvas.width = W; canvas.height = H;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Inter, Roboto, sans-serif';

  const emblem = new Image(); emblem.src = "assets/rank-silver.png";
  const langNow = () => {
    const on = document.querySelector("#mk-lang button.on");
    return on && on.dataset.lang === "en" ? "en" : "es";
  };
  const TX = {
    es: { brand: "RHABIT", exercise: "PRESS DE BANCA", set: "SERIE 3 / 4", weight: "PESO", reps: "REPS", kg: "kg", rep: "reps", complete: "COMPLETAR SERIE", done: "¡SERIE COMPLETADA!", rankup: "SUBIDA DE RANGO", rank: "SILVER I", sub: "Sigue así. Imparable." },
    en: { brand: "RHABIT", exercise: "BENCH PRESS", set: "SET 3 / 4", weight: "WEIGHT", reps: "REPS", kg: "kg", rep: "reps", complete: "COMPLETE SET", done: "SET COMPLETED!", rankup: "RANK UP", rank: "SILVER I", sub: "Keep going. Unstoppable." },
  };
  let weight = "60", reps = "10";
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

  // Partículas de destello (semilla fija para que sea reproducible en la descarga).
  const SPARKS = [];
  for (let i = 0; i < 34; i++) SPARKS.push({ a: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 0.7, ph: Math.random(), sz: 2 + Math.random() * 4 });

  // ---------- Escena 1: registro de serie ----------
  function drawWorkoutBG() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#140c1c"); g.addColorStop(1, "#05030a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const glow = (cx, cy, r, col) => {
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    };
    glow(W * 0.5, H * 0.12, 720, "rgba(214,31,122,0.22)");
    glow(W * 0.5, H * 0.92, 640, "rgba(122,47,214,0.20)");
  }
  function drawWorkout(t) {
    const L = TX[langNow()];
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `800 34px ${FONT}`;
    ctx.letterSpacing = "6px"; ctx.fillText(L.brand, W / 2, 150); ctx.letterSpacing = "0px";
    ctx.fillStyle = "#fff"; ctx.font = `800 66px ${FONT}`;
    ctx.fillText(L.exercise, W / 2, 258);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `600 40px ${FONT}`;
    ctx.fillText(L.set, W / 2, 332);

    // Tarjeta peso | reps
    const cardW = 840, cardH = 470, cardX = (W - cardW) / 2, cardY = 470;
    roundRect(cardX, cardY, cardW, cardH, 48);
    ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.stroke();
    const c1 = cardX + cardW * 0.28, c2 = cardX + cardW * 0.72;
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `700 34px ${FONT}`;
    ctx.fillText(L.weight, c1, cardY + 100); ctx.fillText(L.reps, c2, cardY + 100);
    ctx.fillStyle = "#fff"; ctx.font = `800 150px ${FONT}`;
    ctx.fillText(weight, c1, cardY + 270); ctx.fillText(reps, c2, cardY + 270);
    ctx.fillStyle = "rgba(255,255,255,0.42)"; ctx.font = `600 40px ${FONT}`;
    ctx.fillText(L.kg, c1, cardY + 340); ctx.fillText(L.rep, c2, cardY + 340);
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, cardY + 60); ctx.lineTo(W / 2, cardY + 400); ctx.stroke();

    // Botón completar serie (se pulsa ~2.05s)
    const pressT = 2.05, doneT = 2.35;
    const press = clamp01((t - pressT) / 0.16), done = t >= doneT;
    const bw = 780, bh = 156, bx = (W - bw) / 2, by = 1140;
    const scale = 1 - 0.05 * Math.sin(press * Math.PI);
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(scale, scale); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
    roundRect(bx, by, bw, bh, bh / 2);
    if (done) { ctx.fillStyle = "#22c55e"; }
    else { const gg = ctx.createLinearGradient(bx, 0, bx + bw, 0); gg.addColorStop(0, "#d61f7a"); gg.addColorStop(1, "#7a2fd6"); ctx.fillStyle = gg; }
    ctx.shadowColor = done ? "rgba(34,197,94,0.55)" : "rgba(214,31,122,0.5)"; ctx.shadowBlur = 50; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `800 50px ${FONT}`;
    if (done) {
      ctx.font = `800 46px ${FONT}`;
      const tw = ctx.measureText(L.done).width, cxk = W / 2 - tw / 2 - 44;
      ctx.lineWidth = 9; ctx.strokeStyle = "#fff"; ctx.lineCap = "round"; ctx.beginPath();
      ctx.moveTo(cxk - 6, by + bh / 2 + 2); ctx.lineTo(cxk + 12, by + bh / 2 + 24); ctx.lineTo(cxk + 44, by + bh / 2 - 24); ctx.stroke();
      ctx.fillText(L.done, W / 2 + 30, by + bh / 2 + 16);
    } else {
      ctx.fillText(L.complete, W / 2, by + bh / 2 + 18);
    }
    ctx.restore();
  }

  function drawFlash(a) {
    a = clamp01(a); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  // ---------- Escena 2: subida de rango ----------
  function drawRays(rt, cx, cy, alpha) {
    if (alpha <= 0.01) return;
    const n = 16;
    ctx.save();
    ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.rotate(rt * 0.22);
    for (let i = 0; i < n; i++) {
      ctx.rotate((Math.PI * 2) / n);
      const grad = ctx.createLinearGradient(0, 0, 0, -1500);
      grad.addColorStop(0, "rgba(230,230,255,0)");
      grad.addColorStop(0.04, "rgba(225,225,255,0.22)");
      grad.addColorStop(1, "rgba(225,225,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.lineTo(150, -1500); ctx.lineTo(-150, -1500); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function drawSparks(rt, cx, cy, alpha) {
    if (rt < 0.85 || alpha <= 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (const p of SPARKS) {
      const life = ((rt - 0.85) * p.sp + p.ph) % 1;
      const rad = 180 + life * 560;
      const x = cx + Math.cos(p.a) * rad * 0.72;
      const y = cy + Math.sin(p.a) * rad - life * 160;
      ctx.globalAlpha = (1 - life) * alpha;
      ctx.fillStyle = "rgba(235,235,255,1)";
      ctx.beginPath(); ctx.arc(x, y, p.sz * (1 - life * 0.5), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function spacedText(text, x, y, px) {
    ctx.letterSpacing = px + "px"; ctx.fillText(text, x, y); ctx.letterSpacing = "0px";
  }
  function drawRankUp(rt) {
    const L = TX[langNow()];
    // Fondo oscuro con halo central pulsante
    ctx.fillStyle = "#050208"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.40;
    const pulse = 0.5 + 0.5 * Math.sin(rt * 3);
    let rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1050);
    rg.addColorStop(0, `rgba(180,182,205,${0.32 + 0.1 * pulse})`);
    rg.addColorStop(0.42, "rgba(96,64,150,0.16)");
    rg.addColorStop(1, "rgba(5,2,8,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    const app = clamp01((rt - 0.15) / 0.9);
    const emAlpha = clamp01((rt - 0.15) / 0.45);
    const sc = app <= 0 ? 0 : easeOutBack(app);

    drawRays(rt, cx, cy, 0.45 * emAlpha + 0.12 * pulse);

    // Halo detrás del emblema
    if (emAlpha > 0) {
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 560 * Math.max(0.3, sc));
      gr.addColorStop(0, `rgba(205,208,232,${0.5 * emAlpha})`);
      gr.addColorStop(0.5, `rgba(150,120,210,${0.22 * emAlpha})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    // Onda de impacto al aterrizar
    const landT = 0.9;
    if (rt > landT) {
      const k = (rt - landT) / 0.6;
      if (k < 1) {
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = (1 - k) * 0.6;
        ctx.lineWidth = 8 * (1 - k) + 2; ctx.strokeStyle = "rgba(220,225,255,1)";
        ctx.beginPath(); ctx.arc(cx, cy, 200 + k * 520, 0, 7); ctx.stroke(); ctx.restore();
      }
    }

    // Emblema (con barrido de brillo enmascarado por el alfa del PNG)
    const ar = (emblem.naturalWidth && emblem.naturalHeight) ? emblem.naturalWidth / emblem.naturalHeight : 0.95;
    const ew = 660 * sc, eh = ew / ar;
    if (sc > 0.02 && emblem.complete && emblem.naturalWidth) {
      const ow = Math.round(ew), oh = Math.round(eh);
      const off = drawRankUp._off || (drawRankUp._off = document.createElement("canvas"));
      off.width = ow; off.height = oh;
      const octx = off.getContext("2d");
      octx.clearRect(0, 0, ow, oh);
      octx.drawImage(emblem, 0, 0, ow, oh);
      if (rt > landT + 0.2) {
        const sweep = ((rt - (landT + 0.2)) % 2.4) / 2.4;
        octx.save();
        octx.globalCompositeOperation = "source-atop"; // solo sobre píxeles del emblema
        const gxp = -ow * 0.35 + sweep * (ow * 1.7);
        const lg = octx.createLinearGradient(gxp - 130, 0, gxp + 130, 0);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.5, "rgba(255,255,255,0.55)");
        lg.addColorStop(1, "rgba(255,255,255,0)");
        octx.fillStyle = lg;
        octx.translate(ow / 2, oh / 2); octx.rotate(-0.32); octx.translate(-ow / 2, -oh / 2);
        octx.fillRect(-ow, -oh, ow * 3, oh * 3);
        octx.restore();
      }
      ctx.save(); ctx.globalAlpha = emAlpha;
      ctx.drawImage(off, cx - ew / 2, cy - eh / 2, ew, eh);
      ctx.restore();
    }

    drawSparks(rt, cx, cy, emAlpha);

    // Texto superior: SUBIDA DE RANGO
    const tTop = clamp01((rt - 0.7) / 0.5);
    if (tTop > 0) {
      ctx.save(); ctx.globalAlpha = tTop; ctx.textAlign = "center";
      const ty = H * 0.135 + (1 - easeOut(tTop)) * 40;
      ctx.font = `800 68px ${FONT}`; ctx.fillStyle = "rgba(232,228,255,0.96)";
      ctx.shadowColor = "rgba(150,120,255,0.85)"; ctx.shadowBlur = 34;
      spacedText(L.rankup, W / 2, ty, 10);
      ctx.restore();
    }

    // Texto rango metálico: SILVER I
    const tRank = clamp01((rt - 1.15) / 0.5);
    if (tRank > 0) {
      const rscale = 0.82 + 0.18 * easeOut(tRank);
      ctx.save(); ctx.globalAlpha = tRank; ctx.textAlign = "center";
      ctx.translate(W / 2, H * 0.72); ctx.scale(rscale, rscale);
      ctx.font = `900 156px ${FONT}`;
      const mg = ctx.createLinearGradient(0, -120, 0, 46);
      mg.addColorStop(0, "#ffffff"); mg.addColorStop(0.42, "#d9dce8"); mg.addColorStop(0.5, "#9aa0b4");
      mg.addColorStop(0.58, "#c9cedd"); mg.addColorStop(1, "#7b8296");
      ctx.fillStyle = mg;
      ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 7;
      spacedText(L.rank, 0, 0, 8);
      ctx.restore();
    }

    // Subtítulo
    const tSub = clamp01((rt - 1.6) / 0.6);
    if (tSub > 0) {
      ctx.save(); ctx.globalAlpha = tSub; ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `600 42px ${FONT}`;
      ctx.fillText(L.sub, W / 2, H * 0.80);
      ctx.restore();
    }
  }

  function render(t) {
    const flashStart = 2.82, rankStart = 3.0;
    if (t < flashStart) { drawWorkoutBG(); drawWorkout(t); }
    else if (t < rankStart) { drawWorkoutBG(); drawWorkout(flashStart); drawFlash((t - flashStart) / (rankStart - flashStart)); }
    else {
      const rt = t - rankStart;
      drawRankUp(rt);
      if (rt < 0.3) drawFlash(1 - rt / 0.3);
    }
  }

  let encoding = false;
  function frame(now) {
    if (!encoding) render(((now - start) / 1000) % CYCLE);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Controles ----------
  const wI = document.getElementById("rank-weight"), rI = document.getElementById("rank-reps");
  if (wI) wI.addEventListener("input", () => { weight = (wI.value || "0").slice(0, 4); restart(); });
  if (rI) rI.addEventListener("input", () => { reps = (rI.value || "0").slice(0, 4); restart(); });
  const langSeg = document.getElementById("mk-lang");
  if (langSeg) langSeg.addEventListener("click", () => setTimeout(restart, 0));

  // ---------- Descarga (igual patrón que la pantalla de bloqueo) ----------
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
          const blob = await enc.finish();
          encoding = false;
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
        saveBlob(blob, `rhabit-subida-rango.${ext}`);
        resolve();
      };
      restart(); rec.start();
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, CYCLE * 1000 + 120);
    });
  };
})();
