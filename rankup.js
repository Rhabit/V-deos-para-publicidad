/* Clip "Registra cada serie · subida de rango":
   ESCENA 1 = el clip real de la app (gym-<pose>[-en].webm), idéntico al resto.
   ESCENA 2 = subida de rango (Silver I) épica en el mismo marco de móvil.
   Se reproduce el vídeo real y, al terminar, encadena la animación de rango.
   Descarga: MP4 (WebCodecs) uniendo vídeo + rango, o MediaRecorder del canvas. */
(function initRankUp() {
  const canvas = document.getElementById("rank-canvas");
  if (!canvas) return;
  const mainCtx = canvas.getContext("2d");
  const W = 1080, H = 1920, RANK = 5.0, FPS = 30;
  canvas.width = W; canvas.height = H;
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  const pcv = document.createElement("canvas"); pcv.width = W; pcv.height = H;
  const pctx = pcv.getContext("2d");
  let ctx = mainCtx;

  const C = { text: "#ffffff", sport: "#f5b14a", textDim: "#c2b8a8" };
  const PX = 150, PY = 86, PW = 780, PH = 1748, PR = 96;
  const SX = PX + 16, SY = PY + 16, SW = PW - 32, SH = PH - 32, SR = PR - 16;

  const emblem = new Image(); emblem.src = "assets/rank-silver.png";
  const langNow = () => { const on = document.querySelector("#mk-lang button.on"); return on && on.dataset.lang === "en" ? "en" : "es"; };
  const poseNow = () => { const on = document.querySelector("#mk-pose button.on"); return on && on.dataset.pose === "flat" ? "flat" : "iso"; };
  const TX = {
    es: { rankup: "SUBIDA DE RANGO", rank: "SILVER I", sub: "Sigue así. Imparable." },
    en: { rankup: "RANK UP", rank: "SILVER I", sub: "Keep going. Unstoppable." },
  };

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

  // ---------- Vídeo real (escena 1) ----------
  const vid = document.createElement("video");
  vid.muted = true; vid.playsInline = true; vid.loop = false; vid.preload = "auto";
  vid.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px";
  document.body.appendChild(vid);
  let vidDur = 6.2;
  vid.addEventListener("loadedmetadata", () => { if (vid.duration) vidDur = vid.duration; });
  const clipSrc = () => `assets/clips/gym-${poseNow()}${langNow() === "en" ? "-en" : ""}.webm`;
  function loadClip(restart) {
    const s = clipSrc();
    if (!vid.src.endsWith(s)) { vid.src = s; vid.load(); }
    if (restart) { try { vid.currentTime = 0; } catch (e) {} state = "workout"; vid.play().catch(() => {}); }
  }

  // ---------- Marco de móvil (escena 2) ----------
  function drawPhone(content) {
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
    let bx = SX + SW - 168; ctx.fillStyle = C.text;
    for (let i = 0; i < 4; i++) { const bh = 8 + i * 7; ctx.fillRect(bx + i * 13, y - bh, 8, bh); }
    const btx = SX + SW - 100, bty = y - 22, bw = 56, bh = 26;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,0.6)";
    roundRect(btx, bty, bw, bh, 7); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.6)"; roundRect(btx + bw + 2, bty + 8, 5, 10, 2); ctx.fill();
    ctx.fillStyle = C.text; roundRect(btx + 4, bty + 4, (bw - 8) * 0.7, bh - 8, 4); ctx.fill();
  }
  function drawRays(rt, cx, cy, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.rotate(rt * 0.22);
    for (let i = 0; i < 16; i++) {
      ctx.rotate((Math.PI * 2) / 16);
      const g = ctx.createLinearGradient(0, 0, 0, -1400);
      g.addColorStop(0, "rgba(255,205,140,0)"); g.addColorStop(0.04, "rgba(255,190,120,0.24)"); g.addColorStop(1, "rgba(255,190,120,0)");
      ctx.fillStyle = g;
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
    ctx.fillStyle = "#0a0705"; ctx.fillRect(SX, SY, SW, SH);
    const cx = W / 2, cy = SY + SH * 0.34;
    const pulse = 0.5 + 0.5 * Math.sin(rt * 3);
    let rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
    rg.addColorStop(0, `rgba(255,150,60,${0.26 + 0.1 * pulse})`); rg.addColorStop(0.42, "rgba(180,90,30,0.14)"); rg.addColorStop(1, "rgba(10,7,5,0)");
    ctx.fillStyle = rg; ctx.fillRect(SX, SY, SW, SH);

    const app = clamp01((rt - 0.15) / 0.9), emAlpha = clamp01((rt - 0.15) / 0.45);
    const sc = app <= 0 ? 0 : easeOutBack(app);
    drawRays(rt, cx, cy, 0.45 * emAlpha + 0.12 * pulse);
    if (emAlpha > 0) {
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 440 * Math.max(0.3, sc));
      gr.addColorStop(0, `rgba(255,200,140,${0.5 * emAlpha})`); gr.addColorStop(0.5, `rgba(255,140,50,${0.22 * emAlpha})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = gr; ctx.fillRect(SX, SY, SW, SH); ctx.restore();
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
      spacedText(L.rankup, W / 2, ty, 8); ctx.restore();
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
      spacedText(L.rank, 0, 0, 7); ctx.restore();
    }
    const tSub = clamp01((rt - 1.6) / 0.6);
    if (tSub > 0) {
      ctx.save(); ctx.globalAlpha = tSub; ctx.textAlign = "center";
      ctx.fillStyle = C.textDim; ctx.font = `600 36px ${FONT}`;
      ctx.fillText(L.sub, W / 2, SY + SH * 0.77); ctx.restore();
    }
    drawStatusBar();
  }
  // Inclinación del clip real (medida): lean suave, casi rectangular.
  function blitIso(src) {
    const cx = W / 2, cy = H / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.transform(0.97, 0, -0.042, 0.95, 0, 0); ctx.translate(-cx, -cy);
    ctx.drawImage(src, 6, 0); ctx.restore();
  }
  // Dibuja la escena 2 (rango) en el canvas principal, con pose y flash inicial.
  function renderRank(rt) {
    ctx = pctx; pctx.clearRect(0, 0, W, H);
    drawPhone(() => { drawRankUp(rt); });
    ctx = mainCtx;
    mainCtx.fillStyle = "#000"; mainCtx.fillRect(0, 0, W, H);
    if (poseNow() === "iso") blitIso(pcv); else mainCtx.drawImage(pcv, 0, 0);
    if (rt < 0.28) { mainCtx.save(); mainCtx.globalAlpha = 1 - rt / 0.28; mainCtx.fillStyle = "#fff"; mainCtx.fillRect(0, 0, W, H); mainCtx.restore(); }
  }
  function drawVideoFrame() {
    mainCtx.fillStyle = "#000"; mainCtx.fillRect(0, 0, W, H);
    if (vid.readyState >= 2) { try { mainCtx.drawImage(vid, 0, 0, W, H); } catch (e) {} }
  }

  // ---------- Bucle de vista previa ----------
  let state = "workout", rankStart = 0, encoding = false;
  loadClip(true);
  function tick(now) {
    if (!encoding) {
      if (state === "workout") {
        drawVideoFrame();
        if (vid.ended || (vid.duration && vid.currentTime >= vid.duration - 0.05)) { state = "rank"; rankStart = now; }
      } else {
        const rt = (now - rankStart) / 1000;
        renderRank(rt);
        if (rt >= RANK) { state = "workout"; try { vid.currentTime = 0; } catch (e) {} vid.play().catch(() => {}); }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const poseSeg = document.getElementById("mk-pose"), langSeg = document.getElementById("mk-lang");
  if (poseSeg) poseSeg.addEventListener("click", () => setTimeout(() => loadClip(true), 0));
  if (langSeg) langSeg.addEventListener("click", () => setTimeout(() => loadClip(true), 0));

  // ---------- Descarga: vídeo + rango en un MP4 ----------
  function saveBlob(blob, name) {
    const u = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
  }
  function waitImg(img) { return (img.complete && img.naturalWidth) ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; setTimeout(r, 3000); }); }
  function ensureVid() {
    return new Promise((res) => {
      if (vid.readyState >= 2 && vid.duration) return res();
      const on = () => { if (vid.readyState >= 2 && vid.duration) { cleanup(); res(); } };
      const cleanup = () => { vid.removeEventListener("loadeddata", on); vid.removeEventListener("canplay", on); };
      vid.addEventListener("loadeddata", on); vid.addEventListener("canplay", on); setTimeout(() => { cleanup(); res(); }, 6000);
    });
  }
  function seekTo(t) {
    return new Promise((res) => {
      const done = () => { vid.removeEventListener("seeked", done); res(); };
      vid.addEventListener("seeked", done); try { vid.currentTime = Math.min(t, (vid.duration || t) - 0.001); } catch (e) { res(); }
      setTimeout(res, 400);
    });
  }
  window.__rankupDownload = async function () {
    loadClip(false); await Promise.all([waitImg(emblem), ensureVid()]);
    const D = vid.duration || vidDur, name = "rhabit-registro-subida-rango";
    if (window.mp4Support && window.mp4Support()) {
      const enc = await window.makeMp4Encoder(W, H, FPS, 12000000);
      if (enc) {
        try {
          encoding = true; vid.pause();
          const n1 = Math.round(D * FPS);
          for (let i = 0; i < n1; i++) { await seekTo(i / FPS); drawVideoFrame(); await enc.addFrame(canvas, i * 1e6 / FPS, i % 60 === 0); }
          const n2 = Math.round(RANK * FPS);
          for (let j = 0; j < n2; j++) { renderRank(j / FPS); await enc.addFrame(canvas, (n1 + j) * 1e6 / FPS, (n1 + j) % 60 === 0); }
          const blob = await enc.finish(); encoding = false; state = "workout"; loadClip(true);
          if (blob.size >= 1000) { saveBlob(blob, name + ".mp4"); return; }
        } catch (e) { encoding = false; state = "workout"; loadClip(true); }
      }
    }
    // Fallback: graba el canvas en vivo un ciclo completo (vídeo + rango).
    return new Promise((resolve, reject) => {
      const cands = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1", "video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mime = window.MediaRecorder && cands.find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) { reject(new Error("MediaRecorder no soportado")); return; }
      const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
      const rec = new MediaRecorder(canvas.captureStream(FPS), { mimeType: mime, videoBitsPerSecond: 12000000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime.split(";")[0] });
        if (blob.size < 1000) { reject(new Error("grabación vacía")); return; }
        saveBlob(blob, `${name}.${ext}`); resolve();
      };
      encoding = false; state = "workout"; try { vid.currentTime = 0; } catch (e) {} vid.play().catch(() => {});
      rec.start();
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, (D + RANK) * 1000 + 500);
    });
  };
})();
