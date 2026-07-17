/* Móvil (Entrenos): AÑADIR EJERCICIO — estilo anuncio, atractivo, como la app real.
   Entreno → "＋ Añadir ejercicio" → selector con buscador + FILTROS por músculo +
   lista larga → ojo → DETALLE (animación, récords, músculos afectados) → Agregar.
   Sin ratón: un punto/dedo con tap. Mismo marco/3D exacto que el resto.
   Solo se anima al pasar el cursor. Descarga MP4. */
(function initAddExercise() {
  const canvas = document.getElementById("addex-canvas");
  if (!canvas) return;
  const mainCtx = canvas.getContext("2d");
  const W = 1080, H = 1920, CYCLE = 11.0;
  canvas.width = W; canvas.height = H;
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  const pcv = document.createElement("canvas"); pcv.width = W; pcv.height = H;
  const pctx = pcv.getContext("2d");
  let ctx = mainCtx;

  const C = { bg: "#090906", surface: "#17120F", surfaceAlt: "#221c17", accent: "#ff7a1a", accentSoft: "#c45b12", sport: "#f5b14a", text: "#ffffff", textDim: "#c2b8a8", border: "#2c241d" };
  const PW = 798, PH = 1729, PX = Math.round(540 - PW / 2), PY = Math.round(960 - PH / 2), PR = 120;
  const SX = PX + 33, SY = PY + 33, SW = PW - 66, SH = PH - 66, SR = 90;

  const langNow = () => { const on = document.querySelector("#mk-lang button.on"); return on && on.dataset.lang === "en" ? "en" : "es"; };
  const poseNow = () => { const on = document.querySelector("#mk-pose button.on"); return on && on.dataset.pose === "flat" ? "flat" : "iso"; };
  const bgColor = () => { const el = document.getElementById("mk-color"); return (el && el.value) || "#202124"; };
  const EN = () => langNow() === "en";
  const L = () => EN() ? {
    time: "TIME", vol: "VOLUME", sets: "SETS", musc: "MUSCLES", set: "SET", prev: "PREVIOUS",
    addEx: "Add exercise", picker: "Add exercise", search: "Search exercise", add: "Add to workout",
    affected: "MUSCLES WORKED", records: "PERSONAL RECORDS", best: "Best weight", rm: "Est. 1RM", volT: "Total volume", volS: "Set volume",
    primary: "PRIMARY", secondary: "SECONDARY", equip: "EQUIPMENT",
    filters: ["All", "Shoulders", "Chest", "Back", "Arms", "Legs"],
  } : {
    time: "TIEMPO", vol: "VOLUMEN", sets: "SERIES", musc: "MÚSCULOS", set: "SERIE", prev: "ANTERIOR",
    addEx: "Añadir ejercicio", picker: "Añadir ejercicio", search: "Buscar ejercicio", add: "Agregar al entreno",
    affected: "MÚSCULOS TRABAJADOS", records: "RÉCORDS PERSONALES", best: "Mejor peso", rm: "1RM est.", volT: "Volumen total", volS: "Vol. serie",
    primary: "PRINCIPAL", secondary: "SECUNDARIOS", equip: "EQUIPAMIENTO",
    filters: ["Todos", "Hombros", "Pecho", "Espalda", "Brazo", "Pierna"],
  };

  const img = (src) => { const i = new Image(); i.src = src; if (i.decode) i.decode().catch(() => {}); return i; };
  const thumbCurl = img("assets/ex-curl.png"), thumbBench = img("assets/ex-bench.png");
  const thumbRow = img("assets/ex-row-poster.webp"), thumbLat = img("assets/ex-lateral-poster.webp");
  const bodyIco = img("assets/musculo-cuerpo.png");
  const exVid = document.createElement("video");
  exVid.src = "assets/ex-lateral.mp4"; exVid.muted = true; exVid.loop = true; exVid.playsInline = true; exVid.preload = "auto";
  exVid.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;left:-9999px";
  document.body.appendChild(exVid);

  // Ejercicios (grupo g para filtrar). El objetivo es "Elevaciones laterales".
  const DATA = [
    { es: "Press militar", en: "Overhead press", g: 0, mp: ["hombros", "Hombros", "Shoulders"], ms: ["tríceps", "Tríceps", "Triceps"], eq: ["Barra", "Barbell"], th: null },
    { es: "Elevaciones laterales", en: "Lateral raises", g: 0, mp: ["hombros", "Hombros", "Shoulders"], ms: ["trapecio", "Trapecio", "Traps"], eq: ["Mancuernas", "Dumbbells"], th: thumbLat, target: true, vid: true },
    { es: "Face pull", en: "Face pull", g: 0, mp: ["hombros", "Hombros", "Shoulders"], ms: ["espalda alta", "Espalda alta", "Upper back"], eq: ["Polea", "Cable"], th: thumbRow },
    { es: "Press de banca", en: "Bench press", g: 1, mp: ["pecho", "Pecho", "Chest"], ms: ["tríceps", "Tríceps", "Triceps"], eq: ["Barra", "Barbell"], th: thumbBench },
    { es: "Aperturas", en: "Chest fly", g: 1, mp: ["pecho", "Pecho", "Chest"], ms: ["hombros", "Hombros", "Shoulders"], eq: ["Polea", "Cable"], th: null },
    { es: "Remo con polea", en: "Cable row", g: 2, mp: ["espalda alta", "Espalda alta", "Upper back"], ms: ["bíceps", "Bíceps", "Biceps"], eq: ["Polea", "Cable"], th: thumbRow },
    { es: "Dominadas", en: "Pull-ups", g: 2, mp: ["dorsales", "Dorsales", "Lats"], ms: ["bíceps", "Bíceps", "Biceps"], eq: ["Peso corporal", "Bodyweight"], th: null },
    { es: "Curl de bíceps", en: "Biceps curl", g: 3, mp: ["bíceps", "Bíceps", "Biceps"], ms: ["antebrazos", "Antebrazos", "Forearms"], eq: ["Mancuernas", "Dumbbells"], th: thumbCurl },
    { es: "Sentadilla", en: "Squat", g: 4, mp: ["cuádriceps", "Cuádriceps", "Quads"], ms: ["glúteos", "Glúteos", "Glutes"], eq: ["Barra", "Barbell"], th: null },
    { es: "Peso muerto", en: "Deadlift", g: 4, mp: ["isquios", "Isquios", "Hamstrings"], ms: ["glúteos", "Glúteos", "Glutes"], eq: ["Barra", "Barbell"], th: null },
  ];
  const exName = (e) => EN() ? e.en : e.es;
  const exMeta = (e) => `${e.mp[EN() ? 2 : 1]} · ${e.ms[EN() ? 2 : 1]} · ${e.eq[EN() ? 1 : 0]}`;

  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeInOut = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  function roundRect(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function spaced(text, x, y, px) { ctx.letterSpacing = px + "px"; ctx.fillText(text, x, y); ctx.letterSpacing = "0px"; }
  function glow(cx, cy, r, col) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.fillRect(SX, SY, SW, SH); ctx.restore(); }
  function circleImg(im, cx, cy, r, dumb) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
    if (im && im.complete && im.naturalWidth) {
      ctx.fillStyle = "#000"; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      const ar = im.naturalWidth / im.naturalHeight, d = r * 2; let dw, dh;
      if (ar > 1) { dh = d; dw = d * ar; } else { dw = d; dh = d / ar; }
      ctx.drawImage(im, cx - dw / 2, cy - dh / 2, dw, dh);
    } else {
      ctx.fillStyle = "rgba(255,122,26,0.10)"; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.strokeStyle = C.accent; ctx.lineWidth = r * 0.13; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy); ctx.lineTo(cx + r * 0.5, cy); ctx.stroke();
      ctx.lineWidth = r * 0.3;
      ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy - r * 0.28); ctx.lineTo(cx - r * 0.5, cy + r * 0.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + r * 0.5, cy - r * 0.28); ctx.lineTo(cx + r * 0.5, cy + r * 0.28); ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = dumb ? "rgba(255,122,26,0.4)" : C.border; ctx.stroke();
  }
  function eyeIcon(cx, cy, s, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.13; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - s * 0.62, cy); ctx.quadraticCurveTo(cx, cy - s * 0.58, cx + s * 0.62, cy); ctx.quadraticCurveTo(cx, cy + s * 0.58, cx - s * 0.62, cy); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.2, 0, 7); ctx.stroke(); ctx.restore();
  }
  // Dedo/tap (sin ratón)
  function finger(x, y, press) {
    if (x === undefined) return;
    ctx.save();
    if (press > 0.01) { ctx.globalAlpha = (1 - press) * 0.55; ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(x, y, 28 + press * 46, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    const gl = ctx.createRadialGradient(x, y, 0, x, y, 52); gl.addColorStop(0, "rgba(255,255,255,0.5)"); gl.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 52, 0, 7); ctx.fill();
    const r = 30 * (1 - 0.24 * Math.sin(clamp01(press) * Math.PI));
    ctx.fillStyle = "rgba(255,255,255,0.94)"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // ---------- Marco ----------
  function drawPhone(content) {
    const g = ctx.createLinearGradient(PX + PW * 0.3, PY, PX + PW * 0.7, PY + PH);
    g.addColorStop(0, "#2a221c"); g.addColorStop(1, "#0e0b09");
    roundRect(PX, PY, PW, PH, PR); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#33291f"; ctx.stroke();
    ctx.save(); roundRect(SX, SY, SW, SH, SR); ctx.clip();
    ctx.fillStyle = C.bg; ctx.fillRect(SX, SY, SW, SH);
    content();
    ctx.restore();
    roundRect(540 - 117, PY + 48, 234, 21, 11); ctx.fillStyle = "#000"; ctx.fill();
  }
  function statusBar() {
    const y = SY + 66;
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `600 32px ${FONT}`; ctx.fillText("9:41", SX + 42, y);
    let bx = SX + SW - 160; ctx.fillStyle = C.textDim;
    for (let i = 0; i < 4; i++) { const bh = 7 + i * 6; ctx.fillRect(bx + i * 12, y - bh, 7, bh); }
    const btx = SX + SW - 94, bty = y - 20, bw = 50, bh = 24;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(194,184,168,0.7)"; roundRect(btx, bty, bw, bh, 6); ctx.stroke();
    ctx.fillStyle = "rgba(194,184,168,0.7)"; roundRect(btx + bw + 2, bty + 7, 4, 10, 2); ctx.fill();
    ctx.fillStyle = C.textDim; roundRect(btx + 4, bty + 4, (bw - 8) * 0.7, bh - 8, 3); ctx.fill();
  }
  function statsBar(nSets, vol, nMusc) {
    const sbY = SY + 150, l = L();
    const cols = [[l.time, "12:04"], [l.vol, String(vol)], [l.sets, String(nSets)], [l.musc, String(nMusc)]];
    const gx0 = SX + 26, gw = SW - 52, cw = gw / 4;
    ctx.textAlign = "center";
    cols.forEach((c, i) => {
      const cx = gx0 + cw * i + cw / 2;
      if (i === 0) { ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, sbY - 62, 14, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, sbY - 62); ctx.lineTo(cx, sbY - 71); ctx.moveTo(cx, sbY - 62); ctx.lineTo(cx + 8, sbY - 62); ctx.stroke(); }
      ctx.fillStyle = C.text; ctx.font = `800 44px ${FONT}`; ctx.fillText(c[1], cx, sbY);
      ctx.fillStyle = C.textDim; ctx.font = `600 23px ${FONT}`; spaced(c[0], cx, sbY + 38, 1);
      if (i < 3) { ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx0 + cw * (i + 1), sbY - 34); ctx.lineTo(gx0 + cw * (i + 1), sbY + 28); ctx.stroke(); }
    });
    ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(SX, sbY + 84); ctx.lineTo(SX + SW, sbY + 84); ctx.stroke();
  }
  function exerciseCard(x, y, w, name, thumb, sets, appear) {
    const headH = 118, colH = 54, rowH = 92, cardH = headH + colH + rowH * sets.length + 20;
    ctx.save(); if (appear < 1) ctx.globalAlpha = appear;
    if (appear < 1) glow(x + w / 2, y + cardH / 2, 360, `rgba(255,122,26,${0.25 * (1 - appear)})`);
    roundRect(x, y, w, cardH, 42); ctx.fillStyle = C.surface; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = appear < 1 ? "rgba(255,122,26,0.6)" : C.border; ctx.stroke();
    const tR = 42, tX = x + 40 + tR, tY = y + 34 + tR;
    circleImg(thumb, tX, tY, tR, true);
    ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `700 38px ${FONT}`; ctx.fillText(name, tX + tR + 28, tY + 13);
    ctx.textAlign = "center"; ctx.fillStyle = C.textDim; ctx.font = `800 38px ${FONT}`; ctx.fillText("···", x + w - 56, tY - 6);
    const inX = x + 20, inW = w - 40;
    const cSet = inX + inW * 0.10, cPrev = inX + inW * 0.34, cKg = inX + inW * 0.56, cReps = inX + inW * 0.73, cChk = inX + inW * 0.90;
    const l = L(); ctx.fillStyle = C.textDim; ctx.font = `700 23px ${FONT}`;
    spaced(l.set, cSet, y + headH + 22, 1); spaced(l.prev, cPrev, y + headH + 22, 1); spaced("KG", cKg, y + headH + 22, 1); spaced("REPS", cReps, y + headH + 22, 1);
    let ry = y + headH + colH;
    sets.forEach((s, i) => {
      const cy = ry + rowH / 2;
      roundRect(inX - 2, ry + 6, inW + 4, rowH - 12, 22); ctx.fillStyle = "rgba(255,122,26,0.13)"; ctx.fill();
      ctx.textAlign = "center"; ctx.font = `700 36px ${FONT}`; ctx.fillStyle = C.accent; ctx.fillText(String(i + 1), cSet, cy + 12);
      ctx.fillStyle = C.textDim; ctx.font = `500 30px ${FONT}`; ctx.fillText(s.p, cPrev, cy + 10);
      ctx.fillStyle = C.text; ctx.font = `700 40px ${FONT}`; ctx.fillText(s.k, cKg, cy + 13); ctx.fillText(s.r, cReps, cy + 13);
      const chS = 72, chX = cChk - chS / 2, chY = cy - chS / 2;
      roundRect(chX, chY, chS, chS, 22); const cg = ctx.createLinearGradient(chX, chY, chX + chS, chY + chS); cg.addColorStop(0, C.accent); cg.addColorStop(1, C.sport); ctx.fillStyle = cg; ctx.fill();
      ctx.save(); ctx.strokeStyle = "#1a0f04"; ctx.lineWidth = chS * 0.14; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(cChk - chS * 0.2, cy + 2); ctx.lineTo(cChk - chS * 0.03, cy + chS * 0.18); ctx.lineTo(cChk + chS * 0.24, cy - chS * 0.2); ctx.stroke(); ctx.restore();
      ry += rowH;
    });
    ctx.restore();
    return cardH;
  }
  function addExBtn(x, y, w, press) {
    const h = 82;
    ctx.save(); const sc = 1 - 0.04 * Math.sin(clamp01(press) * Math.PI); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
    if (press > 0) glow(x + w / 2, y + h / 2, 240, `rgba(255,122,26,${0.3 * press})`);
    ctx.setLineDash([11, 8]); ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(255,122,26,0.6)"; roundRect(x, y, w, h, 22); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.accent; ctx.textAlign = "center"; ctx.font = `800 34px ${FONT}`; ctx.fillText("＋  " + L().addEx, x + w / 2, y + h / 2 + 12); ctx.restore();
    return h;
  }

  function drawGym(added) {
    statusBar();
    statsBar(added > 0 ? 6 : 3, added > 0 ? 496 : 376, added > 0 ? 3 : 2);
    const cardX = SX + 24, cardW = SW - 48; let y = SY + 262;
    y += exerciseCard(cardX, y, cardW, EN() ? "Biceps curl" : "Curl de bíceps", thumbCurl, [{ p: "10×12", k: "12", r: "12" }, { p: "12×10", k: "12", r: "10" }, { p: "12×9", k: "14", r: "8" }], 1) + 22;
    if (added > 0) y += exerciseCard(cardX, y, cardW, EN() ? "Lateral raises" : "Elevaciones laterales", thumbLat, [{ p: "9×15", k: "10", r: "15" }, { p: "10×12", k: "10", r: "12" }, { p: "10×12", k: "12", r: "10" }], clamp01(added)) + 22;
    return y;
  }

  // ---------- Selector ----------
  function drawSelector(prog, filterIdx, listFade, tap) {
    const topY = SY + 150, l = L();
    ctx.save(); ctx.globalAlpha = Math.min(1, prog * 1.5); ctx.fillStyle = "rgba(0,0,0,0.62)"; ctx.fillRect(SX, SY, SW, SH); ctx.restore();
    const off = (1 - easeOut(prog)) * (SY + SH - topY);
    ctx.save(); ctx.translate(0, off);
    roundRect(SX, topY, SW, SY + SH - topY + 40, 44); ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    glow(540, topY + 40, 340, "rgba(255,122,26,0.16)");
    ctx.fillStyle = C.border; roundRect(540 - 34, topY + 18, 68, 8, 4); ctx.fill();
    ctx.textAlign = "center"; ctx.fillStyle = C.text; ctx.font = `800 42px ${FONT}`; ctx.fillText(l.picker, 540, topY + 86);
    // buscador
    const sbX = SX + 34, sbW = SW - 68, sbY = topY + 116, sbH = 74;
    roundRect(sbX, sbY, sbW, sbH, 18); ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.strokeStyle = C.textDim; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sbX + 40, sbY + sbH / 2, 13, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sbX + 50, sbY + sbH / 2 + 10); ctx.lineTo(sbX + 62, sbY + sbH / 2 + 22); ctx.stroke();
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `500 30px ${FONT}`; ctx.fillText(l.search, sbX + 76, sbY + sbH / 2 + 11);
    // chips de filtro (músculo)
    const chY = sbY + sbH + 22, chH = 62; let chx = sbX;
    let filterTapPos;
    l.filters.forEach((f, i) => {
      ctx.font = `700 28px ${FONT}`; const tw = ctx.measureText(f).width, cw = tw + 40;
      const on = i === filterIdx;
      roundRect(chx, chY, cw, chH, 30);
      if (on) { ctx.fillStyle = "rgba(255,122,26,0.18)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.accent; ctx.stroke(); ctx.fillStyle = C.accent; }
      else { ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke(); ctx.fillStyle = C.textDim; }
      ctx.textAlign = "center"; ctx.fillText(f, chx + cw / 2, chY + 41);
      if (i === 1) filterTapPos = [chx + cw / 2, chY + chH / 2];
      chx += cw + 14;
    });
    // lista (filtrada) con recorte
    const listTop = chY + chH + 20, listBot = SY + SH - 8;
    const items = DATA.filter((e) => filterIdx === 0 || e.g === filterIdx - 1);
    ctx.save(); roundRect(sbX, listTop, sbW, listBot - listTop, 8); ctx.clip();
    ctx.globalAlpha = listFade;
    let ly = listTop; const rowH = 132;
    let eyeTapPos;
    items.forEach((ex) => {
      const isT = ex.target;
      roundRect(sbX, ly, sbW, rowH - 16, 22); ctx.fillStyle = isT ? "rgba(255,122,26,0.09)" : C.bg; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = isT ? "rgba(255,122,26,0.35)" : C.border; ctx.stroke();
      circleImg(ex.th, sbX + 30 + 42, ly + (rowH - 16) / 2, 42, true);
      ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `700 34px ${FONT}`; ctx.fillText(exName(ex), sbX + 138, ly + 50);
      ctx.fillStyle = C.textDim; ctx.font = `500 25px ${FONT}`; ctx.fillText(exMeta(ex), sbX + 138, ly + 86);
      const eyeX = sbX + sbW - 62, eyeY = ly + (rowH - 16) / 2;
      roundRect(eyeX - 40, eyeY - 34, 80, 68, 16); ctx.fillStyle = C.surfaceAlt; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = isT ? "rgba(255,122,26,0.4)" : C.border; ctx.stroke();
      eyeIcon(eyeX, eyeY, 32, isT ? C.accent : C.textDim);
      if (isT) eyeTapPos = [eyeX, eyeY + off];
      ly += rowH;
    });
    ctx.restore();
    ctx.restore();
    return { filterTap: filterTapPos ? [filterTapPos[0], filterTapPos[1] + off] : undefined, eyeTap: eyeTapPos };
  }

  // ---------- Detalle ----------
  function drawDetail(prog, addPress) {
    const topY = SY + 90, l = L(), ex = DATA[1];
    ctx.save(); ctx.globalAlpha = Math.min(1, prog * 1.5); ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(SX, SY, SW, SH); ctx.restore();
    const off = (1 - easeOut(prog)) * (SY + SH - topY);
    ctx.save(); ctx.translate(0, off);
    roundRect(SX, topY, SW, SY + SH - topY + 40, 44); ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.fillStyle = C.border; roundRect(540 - 34, topY + 16, 68, 8, 4); ctx.fill();

    // Cabecera: animación con degradado + nombre/músculo superpuestos
    const aX = SX, aW = SW, aY = topY + 34, aH = 520;
    ctx.save(); roundRect(aX + 4, aY, aW - 8, aH, 30); ctx.clip(); ctx.fillStyle = "#000"; ctx.fillRect(aX, aY, aW, aH);
    if (exVid.readyState >= 2) { const vr = (exVid.videoWidth / exVid.videoHeight) || 1.33, br = aW / aH; let dw, dh; if (vr > br) { dh = aH; dw = aH * vr; } else { dw = aW; dh = aW / vr; } try { ctx.drawImage(exVid, aX + (aW - dw) / 2, aY + (aH - dh) / 2, dw, dh); } catch (e) {} }
    else if (thumbLat.complete) { ctx.drawImage(thumbLat, aX, aY - 40, aW, aH + 80); }
    const gv = ctx.createLinearGradient(0, aY, 0, aY + aH); gv.addColorStop(0, "rgba(11,9,7,0.55)"); gv.addColorStop(0.5, "rgba(11,9,7,0)"); gv.addColorStop(1, "rgba(11,9,7,0.95)");
    ctx.fillStyle = gv; ctx.fillRect(aX, aY, aW, aH);
    ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `800 48px ${FONT}`; ctx.fillText(exName(ex), aX + 40, aY + aH - 70);
    ctx.fillStyle = C.accent; ctx.font = `600 28px ${FONT}`; ctx.fillText(exMeta(ex), aX + 40, aY + aH - 28);
    ctx.restore();

    let y = aY + aH + 46;
    // Récords personales (grid 2x2)
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `700 24px ${FONT}`; spaced(l.records, SX + 40, y, 1);
    y += 24;
    const prs = [["🏆", l.best, "14 kg"], ["📈", l.rm, "17.5 kg"], ["⏱", l.volT, "1.9k kg"], ["📄", l.volS, "180 kg"]];
    const gpX = SX + 34, gpW = SW - 68, cw = (gpW - 16) / 2, chH = 118;
    prs.forEach((p, i) => {
      const px = gpX + (i % 2) * (cw + 16), py = y + Math.floor(i / 2) * (chH + 16);
      roundRect(px, py, cw, chH, 20); ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
      ctx.textAlign = "left"; ctx.font = `700 30px ${FONT}`; ctx.fillStyle = C.accent; ctx.fillText(p[0], px + 26, py + 44);
      ctx.fillStyle = C.textDim; ctx.font = `600 22px ${FONT}`; ctx.fillText(p[1], px + 66, py + 42);
      ctx.fillStyle = C.text; ctx.font = `800 42px ${FONT}`; ctx.fillText(p[2], px + 26, py + 92);
    });
    y += chH * 2 + 16 + 44;
    // Músculos trabajados: chips principal/secundario
    ctx.fillStyle = C.textDim; ctx.font = `700 24px ${FONT}`; spaced(l.affected, SX + 40, y, 1); y += 24;
    const chips = [[ex.mp[EN() ? 2 : 1], true], [ex.ms[EN() ? 2 : 1], false]]; let cx = SX + 34;
    chips.forEach(([m, prim]) => {
      ctx.font = `700 30px ${FONT}`; const tw = ctx.measureText(m).width, w2 = tw + 90;
      roundRect(cx, y, w2, 64, 32);
      if (prim) { ctx.fillStyle = "rgba(255,122,26,0.16)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,122,26,0.5)"; ctx.stroke(); }
      else { ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx + 34, y + 32, 9, 0, 7); ctx.fillStyle = prim ? C.accent : C.textDim; ctx.fill();
      ctx.fillStyle = prim ? C.accent : C.textDim; ctx.textAlign = "left"; ctx.fillText(m, cx + 56, y + 42);
      cx += w2 + 16;
    });
    // Botón Agregar (aura)
    const bY = SY + SH - 122, bX = SX + 40, bW = SW - 80, bHh = 96;
    glow(540, bY + bHh / 2, 300, `rgba(255,122,26,${0.28 + 0.1 * Math.sin(perf() * 3)})`);
    ctx.save(); const sc = 1 - 0.05 * Math.sin(clamp01(addPress) * Math.PI); ctx.translate(bX + bW / 2, bY + bHh / 2); ctx.scale(sc, sc); ctx.translate(-(bX + bW / 2), -(bY + bHh / 2));
    roundRect(bX, bY, bW, bHh, bHh / 2); const gg = ctx.createLinearGradient(bX, 0, bX + bW, 0); gg.addColorStop(0, C.accent); gg.addColorStop(1, C.sport); ctx.fillStyle = gg; ctx.fill();
    ctx.fillStyle = "#1a0f04"; ctx.textAlign = "center"; ctx.font = `800 40px ${FONT}`; ctx.fillText("＋  " + l.add, 540, bY + bHh / 2 + 14); ctx.restore();
    ctx.restore();
    return [540, bY + bHh / 2 + off];
  }

  let _perf = 0; const perf = () => _perf;

  // ---------- Línea de tiempo ----------
  function scene(t) {
    _perf = t;
    if (t < 2.0) {
      const btnY = SY + 262 + (118 + 54 + 92 * 3 + 20) + 22;
      drawGym(0);
      const press = t > 1.35 ? clamp01((t - 1.35) / 0.16) * clamp01((1.75 - t) / 0.35) : 0;
      addExBtn(SX + 24, btnY, SW - 48, t > 1.35 ? clamp01((t - 1.35) / 0.16) : 0);
      const cp = clamp01(t / 1.35), fx = 540 + (540 - 540) * cp, fy = (SY + SH * 0.62) + ((btnY + 41) - (SY + SH * 0.62)) * easeInOut(cp);
      finger(fx, fy, press);
    } else if (t < 3.8) {
      drawGym(0);
      const prog = clamp01((t - 2.0) / 0.4);
      const filterIdx = t > 3.05 ? 1 : 0;
      const listFade = t < 3.0 ? 1 : (t < 3.2 ? clamp01((t - 3.0) / 0.1) < 0.5 ? 1 - clamp01((t - 3.0) / 0.1) * 2 : (clamp01((t - 3.0) / 0.1) - 0.5) * 2 : 1);
      const lf = t > 3.0 && t < 3.22 ? Math.abs((t - 3.11) / 0.11) : 1; // dip al cambiar filtro
      const info = drawSelector(prog, filterIdx, Math.max(0.15, lf), null);
      const press = t > 3.05 ? clamp01((t - 3.05) / 0.14) * clamp01((3.4 - t) / 0.3) : 0;
      if (info.filterTap) { const cp = clamp01((t - 2.5) / 0.55), sx0 = 540, sy0 = SY + SH * 0.82; finger(sx0 + (info.filterTap[0] - sx0) * easeInOut(cp), sy0 + (info.filterTap[1] - sy0) * easeInOut(cp), press); }
    } else if (t < 5.0) {
      drawGym(0);
      const info = drawSelector(1, 1, 1, null);
      const press = t > 4.35 ? clamp01((t - 4.35) / 0.14) * clamp01((4.7 - t) / 0.3) : 0;
      if (info.eyeTap) { const cp = clamp01((t - 3.9) / 0.5), sx0 = 540, sy0 = SY + SH * 0.6; finger(sx0 + (info.eyeTap[0] - sx0) * easeInOut(cp), sy0 + (info.eyeTap[1] - sy0) * easeInOut(cp), press); }
    } else if (t < 8.4) {
      drawGym(0); drawSelector(1, 1, 1, null);
      const prog = t < 7.9 ? clamp01((t - 5.0) / 0.4) : clamp01((8.4 - t) / 0.4);
      const addP = t > 7.1 ? clamp01((t - 7.1) / 0.14) * clamp01((7.5 - t) / 0.3) : 0;
      const addPos = drawDetail(prog, addP);
      if (t < 7.9) { const cp = clamp01((t - 5.6) / 1.1), sx0 = 540, sy0 = SY + SH * 0.5; finger(sx0 + (addPos[0] - sx0) * easeInOut(cp), sy0 + (addPos[1] - sy0) * easeInOut(cp), addP); }
    } else {
      drawGym(clamp01((t - 8.4) / 0.5));
    }
  }

  // ---------- Proyección 3D ----------
  const ISO = { ry: -16 * Math.PI / 180, rx: 4 * Math.PI / 180, rz: 1 * Math.PI / 180, psp: 4200 };
  function dest(u, v) {
    let x = (u - 0.5) * PW, y = (v - 0.5) * PH, z = 0, c, s, a, b;
    c = Math.cos(ISO.rz); s = Math.sin(ISO.rz); a = x * c - y * s; b = x * s + y * c; x = a; y = b;
    c = Math.cos(ISO.rx); s = Math.sin(ISO.rx); a = y * c - z * s; b = y * s + z * c; y = a; z = b;
    c = Math.cos(ISO.ry); s = Math.sin(ISO.ry); a = x * c + z * s; b = -x * s + z * c; x = a; z = b;
    const f = ISO.psp / (ISO.psp - z); return [540 + x * f, 960 + y * f];
  }
  function drawTri(im, s0, s1, s2, d0, d1, d2) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]); ctx.lineTo(d2[0], d2[1]); ctx.closePath(); ctx.clip();
    const x0 = s0[0], y0 = s0[1], x1 = s1[0], y1 = s1[1], x2 = s2[0], y2 = s2[1];
    const u0 = d0[0], v0 = d0[1], u1 = d1[0], v1 = d1[1], u2 = d2[0], v2 = d2[1];
    const den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
    if (Math.abs(den) > 1e-6) {
      const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / den, b = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / den;
      const c = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / den, d = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / den;
      const e = (u0 * (x1 * y2 - x2 * y1) + u1 * (x2 * y0 - x0 * y2) + u2 * (x0 * y1 - x1 * y0)) / den, f = (v0 * (x1 * y2 - x2 * y1) + v1 * (x2 * y0 - x0 * y2) + v2 * (x0 * y1 - x1 * y0)) / den;
      ctx.setTransform(a, b, c, d, e, f); ctx.drawImage(im, 0, 0);
    }
    ctx.restore();
  }
  function blitIso(src) {
    const N = 14, M = 24;
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, v0 = j / M, v1 = (j + 1) / M;
      const A = dest(u0, v0), B = dest(u1, v0), Cc = dest(u1, v1), D = dest(u0, v1);
      const sA = [PX + u0 * PW, PY + v0 * PH], sB = [PX + u1 * PW, PY + v0 * PH], sC = [PX + u1 * PW, PY + v1 * PH], sD = [PX + u0 * PW, PY + v1 * PH];
      drawTri(src, sA, sB, sC, A, B, Cc); drawTri(src, sA, sC, sD, A, Cc, D);
    }
  }
  function render(t) {
    ctx = pctx; pctx.clearRect(0, 0, W, H);
    drawPhone(() => scene(t));
    ctx = mainCtx; mainCtx.fillStyle = bgColor(); mainCtx.fillRect(0, 0, W, H);
    if (poseNow() === "iso") blitIso(pcv); else mainCtx.drawImage(pcv, 0, 0);
  }

  let start = performance.now(), hover = false, encoding = false;
  const clipEl = canvas.closest(".clip");
  if (clipEl) {
    clipEl.addEventListener("mouseenter", () => { hover = true; start = performance.now(); exVid.play().catch(() => {}); });
    clipEl.addEventListener("mouseleave", () => { hover = false; exVid.pause(); render(0); });
  }
  render(0);
  function frame(now) { if (!encoding && hover) render(((now - start) / 1000) % CYCLE); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  function saveBlob(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000); }
  window.__addexDownload = async function () {
    exVid.play().catch(() => {});
    if (window.mp4Support && window.mp4Support()) {
      const enc = await window.makeMp4Encoder(W, H, 30, 12000000);
      if (enc) {
        try {
          encoding = true; const FPS = 30, total = Math.round(CYCLE * FPS);
          for (let i = 0; i < total; i++) { render(i / FPS); await enc.addFrame(canvas, i * 1e6 / FPS, i % 60 === 0); }
          const blob = await enc.finish(); encoding = false;
          if (blob.size >= 1000) { saveBlob(blob, "rhabit-anadir-ejercicio.mp4"); return; }
        } catch (e) { encoding = false; }
      }
    }
    return new Promise((resolve, reject) => {
      const cands = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1", "video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
      const mime = window.MediaRecorder && cands.find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) { reject(new Error("MediaRecorder no soportado")); return; }
      const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
      const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 12000000 });
      const chunks = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => { const blob = new Blob(chunks, { type: mime.split(";")[0] }); if (blob.size < 1000) { reject(new Error("vacío")); return; } saveBlob(blob, `rhabit-anadir-ejercicio.${ext}`); resolve(); };
      start = performance.now(); rec.start();
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, CYCLE * 1000 + 200);
    });
  };
})();
