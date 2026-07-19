const fs = require("fs");
const b64 = fs.readFileSync("assets/rhabit-icon.png").toString("base64");
const ICON = "data:image/png;base64," + b64;
let js = fs.readFileSync("lockscreen.js", "utf8");
// Sustituye la ruta del icono por la constante embebida (icono por defecto sin archivos externos)
js = js.split('"assets/rhabit-icon.png"').join("RHABIT_ICON");

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Móvil de notificaciones — editable</title>
<style>
  :root{ --bg:#0b0b0f; --surface:#15151b; --border:#2a2a33; --accent:#ff7a1a; --dim:#9aa0ad; --text:#fff; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px}
  h1{font-size:18px;font-weight:800;margin:4px 0 0}
  .seg{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden}
  .seg button{background:transparent;color:var(--dim);border:0;padding:8px 16px;font-weight:700;cursor:pointer}
  .seg button.on{background:var(--accent);color:#160c04}
  .clip{width:360px;max-width:92vw;display:flex;flex-direction:column;gap:12px}
  .clip__video{position:relative;background:#0c0806;border-radius:22px;overflow:hidden;border:1px solid var(--border)}
  .lock-canvas{display:block;width:100%;aspect-ratio:9/16;background:#0c0806}
  .lock-ctrl{display:flex;flex-direction:column;gap:9px}
  .lock-file{display:inline-flex;align-items:center;gap:8px;border:1px dashed var(--border);border-radius:10px;padding:9px 12px;color:var(--dim);cursor:pointer;font-size:13px;font-weight:600}
  .lock-file:hover{border-color:var(--accent);color:var(--accent)}
  .lock-file .ico{width:16px;height:16px}
  .lock-list{display:flex;flex-direction:column;gap:7px}
  .lock-row{display:flex;gap:7px;align-items:center}
  .lock-row input{background:var(--surface);border:1px solid var(--border);border-radius:9px;color:var(--text);padding:9px 11px;font-size:13px;min-width:0}
  .lock-row input:focus{outline:none;border-color:var(--accent)}
  .lock-row .lock-app{width:90px;flex:none}
  .lock-row .lock-text{flex:1}
  .lock-del{width:38px;height:38px;flex:none;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--dim);cursor:pointer;display:grid;place-items:center}
  .lock-del:hover{border-color:#a33;color:#ff6b5a}
  .lock-del .ico{width:16px;height:16px}
  .lock-add{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px dashed var(--border);border-radius:10px;padding:10px;background:transparent;color:var(--accent);cursor:pointer;font-weight:700;font-size:13px}
  .lock-add:hover{border-color:var(--accent)}
  .lock-add .ico{width:15px;height:15px}
  .lock-ico{flex:none;width:38px;height:38px;border-radius:9px;overflow:hidden;cursor:pointer;border:1px solid var(--border);background:#140f0b}
  .lock-ico:hover{border-color:var(--accent)}
  .lock-ico__img{display:grid;place-items:center;width:100%;height:100%;background-size:cover;background-position:center}
  .lock-move{display:flex;flex-direction:column;gap:2px;flex:none}
  .lock-mv{width:24px;height:18px;padding:0;border:1px solid var(--border);border-radius:6px;background:#140f0b;color:var(--dim);cursor:pointer;font-size:10px;line-height:1;display:grid;place-items:center}
  .lock-mv:hover{border-color:var(--accent);color:var(--accent)}
  .ico{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .btn{border:0;border-radius:12px;background:var(--accent);color:#160c04;font-weight:800;padding:12px 20px;cursor:pointer}
  .hint{color:var(--dim);font-size:12px;max-width:360px;text-align:center;line-height:1.5}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/></symbol>
  <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M4 17l5-5 4 4 3-3 4 4"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M8 11l4 4 4-4"/><path d="M5 19h14"/></symbol>
</svg>

<h1>Móvil de notificaciones</h1>
<div class="seg" id="mk-lang">
  <button type="button" data-lang="es" class="on">ES</button>
  <button type="button" data-lang="en">EN</button>
</div>

<article class="clip">
  <div class="clip__video"><canvas id="lock-canvas" class="lock-canvas"></canvas></div>
  <div class="lock-ctrl">
    <label class="lock-file"><svg class="ico"><use href="#i-image"/></svg> Fondo de pantalla<input type="file" id="lock-wall" accept="image/*" hidden></label>
    <div class="lock-list" id="lock-list"></div>
    <button type="button" class="lock-add" id="lock-add"><svg class="ico"><use href="#i-plus"/></svg> Añadir notificación</button>
  </div>
  <button class="btn" id="dl" type="button"><svg class="ico" style="width:16px;height:16px;vertical-align:-3px"><use href="#i-download"/></svg> Descargar vídeo</button>
</article>
<p class="hint">Pasa el cursor por encima del móvil para reproducir. Edita cada notificación (app, texto, icono), sube un fondo y descarga el vídeo. Todo está en este único archivo — modifícalo a tu gusto.</p>

<script>var RHABIT_ICON = ${JSON.stringify(ICON)};</script>
<script>
${js}
</script>
<script>
  document.getElementById("dl").addEventListener("click", async (e) => {
    const b = e.currentTarget, prev = b.innerHTML; b.disabled = true; b.textContent = "Generando…";
    try { if (window.__lockDownload) await window.__lockDownload(); }
    catch (err) { alert("No se pudo generar el vídeo en este navegador."); }
    finally { b.disabled = false; b.innerHTML = prev; }
  });
  document.querySelectorAll("#mk-lang button").forEach((btn) => btn.addEventListener("click", () => {
    document.querySelectorAll("#mk-lang button").forEach((x) => x.classList.toggle("on", x === btn));
  }));
</script>
</body>
</html>`;
fs.writeFileSync("notificaciones-editable.html", html);
console.log("generado notificaciones-editable.html (" + Math.round(html.length/1024) + " KB); icono embebido: " + Math.round(b64.length/1024) + " KB base64");
