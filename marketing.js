/* Galería de vídeos: pose (iso/plano) + color de fondo en vivo,
   y descarga que compone color+pose sobre los clips con alfa. */
(function () {
  "use strict";

  const clips = [...document.querySelectorAll(".clip")];
  const poseSeg = document.getElementById("mk-pose");
  const colorInput = document.getElementById("mk-color");
  const root = document.documentElement;
  let pose = "iso";

  const srcFor = (base) => `assets/clips/${base}-${pose}.webm`;

  function setVideos() {
    clips.forEach((clip) => {
      const v = clip.querySelector("video");
      const want = srcFor(clip.dataset.base);
      if (!v.src.endsWith(want)) { v.src = want; v.play().catch(() => {}); }
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
      if (serverOk) {
        try { await serverDownload(clip); }
        catch (e) { await clientDownload(clip); }
      } else {
        await clientDownload(clip);
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
    const resp = await fetch(srcFor(clip.dataset.base));
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
            saveBlob(blob, `${clip.dataset.name}-${pose}.${ext}`);
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
    clip.querySelector(".clip__full").addEventListener("click", () => {
      lvid.src = srcFor(clip.dataset.base); light.hidden = false; lvid.play().catch(() => {});
    });
  });
  const close = () => { light.hidden = true; lvid.pause(); lvid.removeAttribute("src"); lvid.load(); };
  light.addEventListener("click", (e) => { if (e.target === light) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !light.hidden) close(); });
})();
