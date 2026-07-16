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
  // color elegido en un canvas 1080x1920 y lo graba con MediaRecorder. El color
  // queda "quemado" en el vídeo, así que sirve para redes (sin transparencia).
  // El clip se baja ENTERO a memoria antes de grabar: reproducirlo en streaming
  // por red se atasca y grabaría un fotograma congelado.
  async function clientDownload(clip) {
    const color = colorInput.value || "#202124";
    const v0 = clip.querySelector("video");
    const resp = await fetch((v0 && v0.currentSrc) || srcFor(clip.dataset.base));
    if (!resp.ok) throw new Error("no carga el clip");
    const clipUrl = URL.createObjectURL(await resp.blob());
    try {
      await new Promise((resolve, reject) => {
        const v = document.createElement("video");
        v.src = clipUrl; v.muted = true; v.playsInline = true; v.loop = false; v.preload = "auto";
        v.onerror = () => reject(new Error("no decodifica el clip"));
        v.onloadedmetadata = () => {
          const W = v.videoWidth || 1080, H = v.videoHeight || 1920;
          const canvas = document.createElement("canvas");
          canvas.width = W; canvas.height = H;
          const ctx = canvas.getContext("2d", { alpha: false });
          const cands = ["video/mp4;codecs=h264", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
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
            saveBlob(blob, `${clip.dataset.name}-${pose}${lang === "en" ? "-en" : ""}.${ext}`);
            resolve();
          };
          let raf = 0;
          const draw = () => {
            ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
            try { ctx.drawImage(v, 0, 0, W, H); } catch (e) {}
            raf = requestAnimationFrame(draw);
          };
          const finish = () => { if (rec.state !== "inactive") { cancelAnimationFrame(raf); rec.stop(); } };
          v.onended = finish;
          const startRec = () => {
            if (rec.state !== "inactive") return;
            guard = setTimeout(finish, ((v.duration || 16) + 3) * 1000);
            rec.start(); draw(); v.play().catch(reject);
          };
          v.currentTime = 0;
          // Arranca cuando puede reproducir sin cortes (desde blob es casi inmediato).
          if (v.readyState >= 3) startRec();
          else { v.oncanplaythrough = startRec; setTimeout(startRec, 1200); }
        };
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(clipUrl), 10000);
    }
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
