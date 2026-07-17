/* Galería de vídeos: pose (iso/plano) + color de fondo en vivo,
   y descarga que compone color+pose sobre los clips con alfa. */
(function () {
  "use strict";

  const clips = [...document.querySelectorAll(".clip")];
  const poseSeg = document.getElementById("mk-pose");
  const colorInput = document.getElementById("mk-color");
  const root = document.documentElement;
  let pose = "iso";
  let lang = "es";

  // Clip por idioma: <base>-<pose>-en.webm en inglés; ES es el nombre sin sufijo.
  const srcFor = (base) => `assets/clips/${base}-${pose}${lang === "en" ? "-en" : ""}.webm`;

  function setVideos() {
    clips.forEach((clip) => {
      const v = clip.querySelector("video");
      if (!v) return; // clips sin vídeo (p.ej. pantalla de bloqueo en canvas)
      const want = srcFor(clip.dataset.base);
      if (v.dataset.want === want) return;
      v.dataset.want = want;
      // Si aún no existe la versión EN del clip, cae a la ES (no rompe la galería).
      v.onerror = () => {
        const es = want.replace("-en.webm", ".webm");
        if (es !== want && !(v.currentSrc || v.src).endsWith(es)) { v.src = es; v.play().catch(() => {}); }
      };
      v.src = want; v.play().catch(() => {});
    });
  }
  setVideos();

  // ---- Pose ----
  poseSeg.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      pose = b.dataset.pose;
      poseSeg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      setVideos();
    });
  });

  // ---- Idioma (ES/EN): traduce toda la UI + títulos y cambia el clip ----
  const langSeg = document.getElementById("mk-lang");
  const UI = {
    brand:     { es: "Rhabit · Vídeos para publicidad", en: "Rhabit · Marketing videos" },
    tagline:   { es: "Clips 9:16 · 1080×1920 · elige pose y color, descarga directa", en: "9:16 clips · 1080×1920 · pick pose & color, direct download" },
    pose:      { es: "Pose", en: "Pose" },
    iso:       { es: "Isométrico", en: "Isometric" },
    flat:      { es: "Plano", en: "Flat" },
    bg:        { es: "Fondo", en: "Background" },
    langLabel: { es: "Idioma", en: "Language" },
    lockWall:  { es: "Fondo de pantalla", en: "Wallpaper" },
    lockAdd:   { es: "Añadir notificación", en: "Add notification" },
  };
  const CLIP_TX = {
    lock:     { pill: { es: "Notificaciones", en: "Notifications" }, title: { es: "Pantalla de bloqueo", en: "Lock screen" } },
    rankup:   { pill: { es: "Entrenos", en: "Workouts" },          title: { es: "Subida de rango épica", en: "Epic rank up" } },
    exercise: { pill: { es: "Entrenos", en: "Workouts" },        title: { es: "Entrena con guía visual", en: "Train with visual guidance" } },
    calendar: { pill: { es: "Organización", en: "Organization" }, title: { es: "Tu mes entero de un vistazo", en: "Your whole month at a glance" } },
    filter:   { pill: { es: "Organización", en: "Organization" }, title: { es: "Filtra el mes por hábito", en: "Filter the month by habit" } },
    swipe:    { pill: { es: "Hábitos", en: "Habits" },           title: { es: "Repasa tu día con un swipe", en: "Review your day with a swipe" } },
    swipe2:   { pill: { es: "Hábitos", en: "Habits" },           title: { es: "Swipe de hábitos · anuncio", en: "Habit swipe · ad" } },
    gym:      { pill: { es: "Entrenos", en: "Workouts" },        title: { es: "Registra cada serie", en: "Log every set" } },
  };
  const DL = { es: "Descargar vídeo", en: "Download video" };

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.dataset.i18n; if (UI[k]) el.textContent = UI[k][lang];
    });
    clips.forEach((clip) => {
      const tx = CLIP_TX[clip.dataset.base]; if (!tx) return;
      const pill = clip.querySelector(".pill");
      if (pill && pill.lastChild) pill.lastChild.nodeValue = " " + tx.pill[lang];
      const h2 = clip.querySelector("h2"); if (h2) h2.textContent = tx.title[lang];
      const btn = clip.querySelector("[data-dl]");
      if (btn && btn.lastChild) btn.lastChild.nodeValue = " " + DL[lang];
    });
  }
  langSeg.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      lang = b.dataset.lang;
      langSeg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      applyLang();
      setVideos();
    });
  });
  applyLang();

  // ---- Color ----
  colorInput.addEventListener("input", () => root.style.setProperty("--clipbg", colorInput.value));
  root.style.setProperty("--clipbg", colorInput.value);

  // ---- Descarga ----
  clips.forEach((clip) => {
    clip.querySelector("[data-dl]").addEventListener("click", (e) => download(clip, e.currentTarget));
  });

  // Si hay server.py (uso local) se usa -> MP4 con ffmpeg (mejor calidad).
  // En el sitio estático (GitHub Pages) no hay servidor: se compone y codifica
  // EN EL NAVEGADOR (canvas + MediaRecorder), así funciona para cualquier visitante.
  let serverOk = false;
  fetch("/render?ping=1", { method: "GET" })
    .then((r) => { serverOk = r.status === 400 || r.ok; }) // 400 = endpoint vivo (params inválidos)
    .catch(() => { serverOk = false; });

  async function download(clip, btn) {
    if (btn.disabled) return;
    const prev = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = "Generando…";
    try {
      if (clip.dataset.base === "lock") {
        if (window.__lockDownload) await window.__lockDownload();
      } else if (clip.dataset.base === "rankup") {
        if (window.__rankupDownload) await window.__rankupDownload();
      } else if (serverOk && lang === "es") {
        try { await serverDownload(clip); }
        catch (e) { await clientDownload(clip); }
      } else {
        await clientDownload(clip); // EN o sitio estático: se compone en el navegador
      }
    } catch (err) {
      alert("No se pudo generar el vídeo en este navegador. Prueba con Chrome de escritorio.");
    } finally {
      btn.disabled = false; btn.innerHTML = prev;
    }
  }

  // Descarga vía servidor (ffmpeg) -> MP4 válido con color correcto (solo en local).
  async function serverDownload(clip) {
    const color = (colorInput.value || "#202124").replace("#", "");
    const r = await fetch(`/render?clip=${clip.dataset.base}&pose=${pose}&color=${color}`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const blob = await r.blob();
    if (!blob || blob.type.indexOf("video") < 0 || blob.size < 1000) throw new Error("respuesta inválida");
    saveBlob(blob, `${clip.dataset.name}-${pose}.mp4`);
  }

  // Descarga en el navegador: pinta cada fotograma del clip (con alfa) sobre el
  // color elegido en un canvas 1080x1920. Intenta MP4 real (WebCodecs H.264) y si
  // no está disponible cae a MediaRecorder (WebM en Chrome/Firefox, MP4 en Safari).
  // El clip se baja ENTERO a memoria antes: en streaming por red se atasca.
  async function clientDownload(clip) {
    const color = colorInput.value || "#202124";
    const v0 = clip.querySelector("video");
    const resp = await fetch((v0 && v0.currentSrc) || srcFor(clip.dataset.base));
    if (!resp.ok) throw new Error("no carga el clip");
    const clipUrl = URL.createObjectURL(await resp.blob());
    const nameBase = `${clip.dataset.name}-${pose}${lang === "en" ? "-en" : ""}`;
    try {
      const v = document.createElement("video");
      v.src = clipUrl; v.muted = true; v.playsInline = true; v.loop = false; v.preload = "auto";
      await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error("no decodifica el clip")); });
      const W = v.videoWidth || 1080, H = v.videoHeight || 1920;
      const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (await encodeClipMp4(v, canvas, ctx, color, W, H, nameBase)) { v.removeAttribute("src"); v.load(); return; }
      await recordMediaRecorder(v, canvas, ctx, color, W, H, nameBase);
    } finally {
      setTimeout(() => URL.revokeObjectURL(clipUrl), 10000);
    }
  }

  // MP4 real: reproduce el clip y codifica cada fotograma con WebCodecs H.264.
  // Usa requestAnimationFrame + video.currentTime (fiable) en vez de RVFC, que en
  // algunos entornos no dispara; deduplica por currentTime (timestamps monótonos).
  async function encodeClipMp4(v, canvas, ctx, color, W, H, nameBase) {
    if (!window.mp4Support || !window.mp4Support()) return false;
    const enc = await window.makeMp4Encoder(W, H, 60, 12000000);
    if (!enc) return false;
    // Espera a poder reproducir sin cortes (en red, si no, no se pintan frames).
    if (v.readyState < 3) await new Promise((res) => {
      const go = () => res();
      v.addEventListener("canplaythrough", go, { once: true });
      v.addEventListener("canplay", go, { once: true });
      setTimeout(go, 2500);
    });
    let n = 0;
    try {
      await new Promise((resolve, reject) => {
        let done = false, raf = 0, lastT = -1, busy = false, ended = false;
        const finish = () => { if (!done) { done = true; cancelAnimationFrame(raf); resolve(); } };
        const step = async () => {
          if (done) return;
          const t = v.currentTime;
          if (!busy && t > lastT + 1e-4) {
            lastT = t; busy = true;
            ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
            try { ctx.drawImage(v, 0, 0, W, H); } catch (e) {}
            try { await enc.addFrame(canvas, t * 1e6, n % 120 === 0); n++; } catch (e) { return reject(e); }
            busy = false;
          }
          if (ended && (v.currentTime >= (v.duration || 1e9) - 0.06)) finish();
          else raf = requestAnimationFrame(step);
        };
        v.onended = () => { ended = true; };
        v.currentTime = 0;
        v.play().then(() => { raf = requestAnimationFrame(step); }).catch(reject);
        setTimeout(finish, ((v.duration || 16) + 5) * 1000);
      });
      if (window.__mkDbg) window.__mkDbg.n = n;
      if (n < 2) throw new Error("sin frames:" + n);
      const blob = await enc.finish();
      if (blob.size < 1000) throw new Error("mp4 vacío");
      saveBlob(blob, nameBase + ".mp4");
      return true;
    } catch (e) {
      if (window.__mkDbg) window.__mkDbg.err = String(e && e.message || e);
      try { await enc.finish(); } catch (e2) {}
      return false;
    }
  }

  // Fallback MediaRecorder.
  function recordMediaRecorder(v, canvas, ctx, color, W, H, nameBase) {
    return new Promise((resolve, reject) => {
      const cands = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1", "video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mime = window.MediaRecorder && cands.find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) { reject(new Error("MediaRecorder no soportado")); return; }
      const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
      const rec = new MediaRecorder(canvas.captureStream(60), { mimeType: mime, videoBitsPerSecond: 12000000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      let guard = 0;
      rec.onstop = () => {
        clearTimeout(guard);
        const blob = new Blob(chunks, { type: mime.split(";")[0] });
        if (blob.size < 1000) { reject(new Error("grabación vacía")); return; }
        saveBlob(blob, `${nameBase}.${ext}`);
        resolve();
      };
      let raf = 0;
      const draw = () => { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); try { ctx.drawImage(v, 0, 0, W, H); } catch (e) {} raf = requestAnimationFrame(draw); };
      const finish = () => { if (rec.state !== "inactive") { cancelAnimationFrame(raf); rec.stop(); } };
      v.onended = finish;
      const startRec = () => { if (rec.state !== "inactive") return; guard = setTimeout(finish, ((v.duration || 16) + 3) * 1000); rec.start(); draw(); v.play().catch(reject); };
      v.currentTime = 0;
      if (v.readyState >= 3) startRec(); else { v.oncanplaythrough = startRec; setTimeout(startRec, 1200); }
    });
  }

  function saveBlob(blob, name) {
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
  }

  // ---- Lightbox ----
  const light = document.getElementById("mk-light");
  const lvid = document.getElementById("mk-light-video");
  clips.forEach((clip) => {
    const full = clip.querySelector(".clip__full");
    if (!full) return; // el clip de canvas (lock) no tiene lightbox
    full.addEventListener("click", () => {
      const cv = clip.querySelector("video");
      lvid.src = (cv && cv.currentSrc) || srcFor(clip.dataset.base); light.hidden = false; lvid.play().catch(() => {});
    });
  });
  const close = () => { light.hidden = true; lvid.pause(); lvid.removeAttribute("src"); lvid.load(); };
  light.addEventListener("click", (e) => { if (e.target === light) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !light.hidden) close(); });
})();
