/* Clip "Registra cada serie · subida de rango":
   ESCENA 1 = el clip real de la app (gym-<pose>[-en].webm) — MISMO móvil, tamaño,
   inclinación y aspecto 3D que el resto de anuncios (no dibujamos móvil propio).
   ESCENA 2 = SUBIDA DE RANGO (Silver I) épica a pantalla completa, superpuesta
   sobre el último fotograma del móvil (que queda congelado detrás).
   Descarga: MP4 (WebCodecs) uniendo vídeo + rango, o MediaRecorder del canvas. */
(function initRankUp() {
  const canvas = document.getElementById("rank-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920, RANK = 5.0, FPS = 30;
  canvas.width = W; canvas.height = H;
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  const C = { text: "#ffffff", sport: "#f5b14a", textDim: "#c2b8a8" };
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
  function spacedText(text, x, y, px) { ctx.letterSpacing = px + "px"; ctx.fillText(text, x, y); ctx.letterSpacing = "0px"; }

  const SPARKS = [];
  for (let i = 0; i < 34; i++) SPARKS.push({ a: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 0.7, ph: Math.random(), sz: 2 + Math.random() * 5 });

  // ---------- Vídeo real (escena 1) ----------
  const vid = document.createElement("video");
  vid.muted = true; vid.playsInline = true; vid.loop = false; vid.preload = "auto";
  vid.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px";
  document.body.appendChild(vid);
  let vidDur = 6.2;
  vid.addEventListener("loadedmetadata", () => { if (vid.duration) vidDur = vid.duration; });
  const clipSrc = () => `assets/clips/gym-${poseNow()}${langNow() === "en" ? "-en" : ""}.webm`;
  let state = "workout", rankStart = 0, encoding = false;
  function loadClip(restart) {
    const s = clipSrc();
    if (!vid.src.endsWith(s)) { vid.src = s; vid.load(); }
    if (restart) { try { vid.currentTime = 0; } catch (e) {} state = "workout"; vid.play().catch(() => {}); }
  }
  function drawVideoFrame() {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    if (vid.readyState >= 2) { try { ctx.drawImage(vid, 0, 0, W, H); } catch (e) {} }
  }

  // ---------- Subida de rango a pantalla completa (escena 2) ----------
  function drawRays(rt, cx, cy, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.rotate(rt * 0.22);
    for (let i = 0; i < 16; i++) {
      ctx.rotate((Math.PI * 2) / 16);
      const g = ctx.createLinearGradient(0, 0, 0, -1600);
      g.addColorStop(0, "rgba(255,205,140,0)"); g.addColorStop(0.04, "rgba(255,190,120,0.26)"); g.addColorStop(1, "rgba(255,190,120,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-38, 0); ctx.lineTo(38, 0); ctx.lineTo(170, -1600); ctx.lineTo(-170, -1600); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function drawSparks(rt, cx, cy, alpha) {
    if (rt < 0.85 || alpha <= 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (const p of SPARKS) {
      const life = ((rt - 0.85) * p.sp + p.ph) % 1;
      const rad = 180 + life * 560;
      const x = cx + Math.cos(p.a) * rad * 0.72, y = cy + Math.sin(p.a) * rad - life * 160;
      ctx.globalAlpha = (1 - life) * alpha; ctx.fillStyle = "rgba(255,210,150,1)";
      ctx.beginPath(); ctx.arc(x, y, p.sz * (1 - life * 0.5), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  // Dibuja la celebración a pantalla completa sobre el fotograma congelado.
  function renderRank(rt) {
    drawVideoFrame(); // último fotograma del móvil, congelado detrás
    const cx = W / 2, cy = H * 0.40;
    // Oscurecido para que la celebración resalte
    const dark = clamp01(rt / 0.4) * 0.82;
    ctx.fillStyle = `rgba(6,3,1,${dark})`; ctx.fillRect(0, 0, W, H);
    const L = TX[langNow()];
    const pulse = 0.5 + 0.5 * Math.sin(rt * 3);
    let rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1000);
    rg.addColorStop(0, `rgba(255,150,60,${(0.28 + 0.1 * pulse) * clamp01(rt / 0.4)})`); rg.addColorStop(0.42, "rgba(180,90,30,0.14)"); rg.addColorStop(1, "rgba(10,7,5,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    const app = clamp01((rt - 0.15) / 0.9), emAlpha = clamp01((rt - 0.15) / 0.45);
    const sc = app <= 0 ? 0 : easeOutBack(app);
    drawRays(rt, cx, cy, 0.5 * emAlpha + 0.12 * pulse);
    if (emAlpha > 0) {
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 560 * Math.max(0.3, sc));
      gr.addColorStop(0, `rgba(255,200,140,${0.5 * emAlpha})`); gr.addColorStop(0.5, `rgba(255,140,50,${0.22 * emAlpha})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    const landT = 0.9;
    if (rt > landT) {
      const k = (rt - landT) / 0.6;
      if (k < 1) {
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = (1 - k) * 0.6;
        ctx.lineWidth = 8 * (1 - k) + 2; ctx.strokeStyle = "rgba(255,210,150,1)";
        ctx.beginPath(); ctx.arc(cx, cy, 200 + k * 520, 0, 7); ctx.stroke(); ctx.restore();
      }
    }
    const ar = (emblem.naturalWidth && emblem.naturalHeight) ? emblem.naturalWidth / emblem.naturalHeight : 0.95;
    const ew = 640 * sc, eh = ew / ar;
    if (sc > 0.02 && emblem.complete && emblem.naturalWidth) {
      const ow = Math.round(ew), oh = Math.round(eh);
      const off = renderRank._off || (renderRank._off = document.createElement("canvas"));
      off.width = ow; off.height = oh;
      const octx = off.getContext("2d");
      octx.clearRect(0, 0, ow, oh); octx.drawImage(emblem, 0, 0, ow, oh);
      if (rt > landT + 0.2) {
        const sweep = ((rt - (landT + 0.2)) % 2.4) / 2.4;
        octx.save(); octx.globalCompositeOperation = "source-atop";
        const gxp = -ow * 0.35 + sweep * (ow * 1.7);
        const lg = octx.createLinearGradient(gxp - 130, 0, gxp + 130, 0);
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
      const ty = H * 0.135 + (1 - easeOut(tTop)) * 40;
      ctx.font = `800 66px ${FONT}`; ctx.fillStyle = C.sport;
      ctx.shadowColor = "rgba(255,140,40,0.85)"; ctx.shadowBlur = 34;
      spacedText(L.rankup, W / 2, ty, 10); ctx.restore();
    }
    const tRank = clamp01((rt - 1.15) / 0.5);
    if (tRank > 0) {
      const rscale = 0.82 + 0.18 * easeOut(tRank);
      ctx.save(); ctx.globalAlpha = tRank; ctx.textAlign = "center";
      ctx.translate(W / 2, H * 0.72); ctx.scale(rscale, rscale);
      ctx.font = `900 156px ${FONT}`;
      const mg = ctx.createLinearGradient(0, -120, 0, 46);
      mg.addColorStop(0, "#ffffff"); mg.addColorStop(0.42, "#d9dce8"); mg.addColorStop(0.5, "#9aa0b4"); mg.addColorStop(0.58, "#c9cedd"); mg.addColorStop(1, "#7b8296");
      ctx.fillStyle = mg; ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 7;
      spacedText(L.rank, 0, 0, 8); ctx.restore();
    }
    const tSub = clamp01((rt - 1.6) / 0.6);
    if (tSub > 0) {
      ctx.save(); ctx.globalAlpha = tSub; ctx.textAlign = "center";
      ctx.fillStyle = C.textDim; ctx.font = `600 42px ${FONT}`;
      ctx.fillText(L.sub, W / 2, H * 0.80); ctx.restore();
    }
    if (rt < 0.28) { ctx.save(); ctx.globalAlpha = 1 - rt / 0.28; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  // ---------- Bucle de vista previa ----------
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
          await seekTo(D - 0.03); // congelar último fotograma para la celebración
          const n2 = Math.round(RANK * FPS);
          for (let j = 0; j < n2; j++) { renderRank(j / FPS); await enc.addFrame(canvas, (n1 + j) * 1e6 / FPS, (n1 + j) % 60 === 0); }
          const blob = await enc.finish(); encoding = false; state = "workout"; loadClip(true);
          if (blob.size >= 1000) { saveBlob(blob, name + ".mp4"); return; }
        } catch (e) { encoding = false; state = "workout"; loadClip(true); }
      }
    }
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
