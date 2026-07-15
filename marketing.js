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
  function clientDownload(clip) {
    return new Promise((resolve, reject) => {
      const color = colorInput.value || "#202124";
      const v = document.createElement("video");
      v.src = srcFor(clip.dataset.base);
      v.muted = true; v.playsInline = true; v.loop = false; v.preload = "auto";
      v.onerror = () => reject(new Error("no carga el clip"));
      v.onloadedmetadata = () => {
        const W = v.videoWidth || 1080, H = v.videoHeight || 1920;
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d", { alpha: false });
        const cands = ["video/mp4;codecs=h264", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
        const mime = window.MediaRecorder && cands.find((t) => MediaRecorder.isTypeSupported(t));
        if (!mime) { reject(new Error("MediaRecorder no soportado")); return; }
        const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
        const stream = canvas.captureStream(60);
        const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = () => {
          v.removeAttribute("src"); v.load();
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
        // corta por seguridad si el vídeo no dispara 'ended'
        const guard = setTimeout(finish, ((v.duration || 16) + 2) * 1000);
        rec.onstop = ((orig) => () => { clearTimeout(guard); orig(); })(rec.onstop);
        v.currentTime = 0;
        rec.start();
        draw();
        v.play().catch((e) => reject(e));
      };
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
    clip.querySelector(".clip__full").addEventListener("click", () => {
      lvid.src = srcFor(clip.dataset.base); light.hidden = false; lvid.play().catch(() => {});
    });
  });
  const close = () => { light.hidden = true; lvid.pause(); lvid.removeAttribute("src"); lvid.load(); };
  light.addEventListener("click", (e) => { if (e.target === light) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !light.hidden) close(); });
})();
