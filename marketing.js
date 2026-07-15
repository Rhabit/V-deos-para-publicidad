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

  // ---- Descarga: compone color + pose sobre el clip alfa ----
  clips.forEach((clip) => {
    clip.querySelector("[data-dl]").addEventListener("click", (e) => download(clip, e.currentTarget));
  });

  // Descarga: SIEMPRE vía el servidor (ffmpeg) -> MP4 válido con color correcto.
  // Si el servidor no soporta /render, avisa (no genera un webm de peor calidad).
  async function download(clip, btn) {
    if (btn.disabled) return;
    const prev = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = "Procesando…";
    try {
      const color = (colorInput.value || "#202124").replace("#", "");
      const url = `/render?clip=${clip.dataset.base}&pose=${pose}&color=${color}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const blob = await r.blob();
      if (!blob || blob.type.indexOf("video") < 0 || blob.size < 1000) throw new Error("respuesta inválida");
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u; a.download = `${clip.dataset.name}-${pose}.mp4`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 6000);
    } catch (err) {
      alert("Para descargar el vídeo tienes que arrancar el servidor de render:\n\n" +
            "    bash start.sh\n\n" +
            "(No sirve 'python3 -m http.server'; necesita server.py + ffmpeg.)");
    } finally {
      btn.disabled = false; btn.innerHTML = prev;
    }
  }

  // Aviso al cargar si el servidor de render no está disponible.
  fetch("/render?ping=1").then((r) => {
    if (r.status === 400) return; // 400 = endpoint vivo (params invalidos) -> OK
    if (!r.ok) showServerBanner();
  }).catch(() => showServerBanner());

  function showServerBanner() {
    if (document.getElementById("mk-banner")) return;
    const b = document.createElement("div");
    b.id = "mk-banner";
    b.textContent = "⚠ Servidor de vídeo no detectado — arranca con: bash start.sh  (para poder descargar)";
    document.body.appendChild(b);
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
