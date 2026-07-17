/* Nuevo móvil (Entrenos): flujo de AÑADIR EJERCICIO.
   1) Pantalla de entreno con "＋ Añadir ejercicio" bajo el último ejercicio.
   2) Se pulsa → se abre el selector con la lista de ejercicios.
   3) Se pulsa el ojo → detalle con la animación del ejercicio + músculos afectados.
   4) Se pulsa "Agregar" → el ejercicio se añade al entreno.
   Mismo marco/3D exacto que el resto (render.html). Solo se anima al pasar el cursor. */
(function initAddExercise() {
  const canvas = document.getElementById("addex-canvas");
  if (!canvas) return;
  const mainCtx = canvas.getContext("2d");
  const W = 1080, H = 1920, CYCLE = 10.0;
  canvas.width = W; canvas.height = H;
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  const pcv = document.createElement("canvas"); pcv.width = W; pcv.height = H;
  const pctx = pcv.getContext("2d");
  let ctx = mainCtx;

  const C = { bg: "#090906", surface: "#17120F", surfaceAlt: "#221c17", accent: "#ff7a1a", sport: "#f5b14a", text: "#ffffff", textDim: "#c2b8a8", border: "#2c241d" };
  const PW = 798, PH = 1729, PX = Math.round(540 - PW / 2), PY = Math.round(960 - PH / 2), PR = 120;
  const SX = PX + 33, SY = PY + 33, SW = PW - 66, SH = PH - 66, SR = 90;

  const langNow = () => { const on = document.querySelector("#mk-lang button.on"); return on && on.dataset.lang === "en" ? "en" : "es"; };
  const poseNow = () => { const on = document.querySelector("#mk-pose button.on"); return on && on.dataset.pose === "flat" ? "flat" : "iso"; };
  const bgColor = () => { const el = document.getElementById("mk-color"); return (el && el.value) || "#202124"; };
  const T = {
    es: { time: "TIEMPO", vol: "VOLUMEN", sets: "SERIES", musc: "MÚSCULOS", set: "SERIE", prev: "ANTERIOR", addSet: "Añadir serie", addEx: "Añadir ejercicio", picker: "Añadir ejercicio", search: "Buscar ejercicio", add: "Agregar", affected: "MÚSCULOS TRABAJADOS", curl: "Curl de bíceps", lateral: "Elevaciones laterales", row: "Remo con polea", bench: "Press de banca", squat: "Sentadilla" },
    en: { time: "TIME", vol: "VOLUME", sets: "SETS", musc: "MUSCLES", set: "SET", prev: "PREVIOUS", addSet: "Add set", addEx: "Add exercise", picker: "Add exercise", search: "Search exercise", add: "Add", affected: "MUSCLES WORKED", curl: "Biceps curl", lateral: "Lateral raises", row: "Cable row", bench: "Bench press", squat: "Squat" },
  };

  const img = (src) => { const i = new Image(); i.src = src; if (i.decode) i.decode().catch(() => {}); return i; };
  const thumbCurl = img("assets/ex-curl.png"), thumbBench = img("assets/ex-bench.png");
  const thumbRow = img("assets/ex-row-poster.webp"), thumbLat = img("assets/ex-lateral-poster.webp");
  const bodyIco = img("assets/musculo-cuerpo.png");

  // Vídeo de animación del ejercicio (se dibuja en el detalle).
  const exVid = document.createElement("video");
  exVid.src = "assets/ex-lateral.mp4"; exVid.muted = true; exVid.loop = true; exVid.playsInline = true; exVid.preload = "auto";
  exVid.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;left:-9999px";
  document.body.appendChild(exVid);

  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeInOut = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function spaced(text, x, y, px) { ctx.letterSpacing = px + "px"; ctx.fillText(text, x, y); ctx.letterSpacing = "0px"; }
  function circleImg(im, cx, cy, r, bg) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
    ctx.fillStyle = bg || C.surfaceAlt; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (im && im.complete && im.naturalWidth) {
      const ar = im.naturalWidth / im.naturalHeight, d = r * 2; let dw, dh;
      if (ar > 1) { dh = d; dw = d * ar; } else { dw = d; dh = d / ar; }
      ctx.drawImage(im, cx - dw / 2, cy - dh / 2, dw, dh);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
  }
  function eyeIcon(cx, cy, s, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.12; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - s * 0.6, cy); ctx.quadraticCurveTo(cx, cy - s * 0.55, cx + s * 0.6, cy); ctx.quadraticCurveTo(cx, cy + s * 0.55, cx - s * 0.6, cy); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.2, 0, 7); ctx.stroke(); ctx.restore();
  }
  function cursor(x, y, press) {
    ctx.save();
    if (press > 0) { ctx.globalAlpha = (1 - press) * 0.5; ctx.strokeStyle = C.accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 20 + press * 40, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    const s = 1 - 0.12 * Math.sin(clamp01(press) * Math.PI);
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 44); ctx.lineTo(12, 33); ctx.lineTo(20, 50); ctx.lineTo(27, 47); ctx.lineTo(19, 30); ctx.lineTo(34, 30); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  }

  // ---------- Marco (idéntico al resto) ----------
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
    const sbY = SY + 150;
    const cols = [[T[langNow()].time, "12:04"], [T[langNow()].vol, String(vol)], [T[langNow()].sets, String(nSets)], [T[langNow()].musc, String(nMusc)]];
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
  // Tarjeta de ejercicio con todas las series hechas.
  function exerciseCard(x, y, w, name, thumb, sets, appear) {
    const headH = 118, colH = 54, rowH = 92;
    const cardH = headH + colH + rowH * sets.length + 20;
    ctx.save(); if (appear < 1) { ctx.globalAlpha = appear; }
    roundRect(x, y, w, cardH, 42); ctx.fillStyle = C.surface; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = appear < 1 ? C.accent : C.border; ctx.stroke();
    const tR = 42, tX = x + 40 + tR, tY = y + 34 + tR;
    circleImg(thumb, tX, tY, tR);
    ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `700 38px ${FONT}`; ctx.fillText(name, tX + tR + 28, tY + 13);
    ctx.textAlign = "center"; ctx.fillStyle = C.textDim; ctx.font = `800 38px ${FONT}`; ctx.fillText("···", x + w - 56, tY - 6);
    const inX = x + 20, inW = w - 40;
    const cSet = inX + inW * 0.10, cPrev = inX + inW * 0.34, cKg = inX + inW * 0.56, cReps = inX + inW * 0.73, cChk = inX + inW * 0.90;
    const L = T[langNow()];
    ctx.fillStyle = C.textDim; ctx.font = `700 23px ${FONT}`;
    spaced(L.set, cSet, y + headH + 22, 1); spaced(L.prev, cPrev, y + headH + 22, 1); spaced("KG", cKg, y + headH + 22, 1); spaced("REPS", cReps, y + headH + 22, 1);
    let ry = y + headH + colH;
    sets.forEach((s, i) => {
      const cy = ry + rowH / 2;
      roundRect(inX - 2, ry + 6, inW + 4, rowH - 12, 22); ctx.fillStyle = "rgba(255,122,26,0.13)"; ctx.fill();
      ctx.textAlign = "center"; ctx.font = `700 36px ${FONT}`; ctx.fillStyle = C.accent; ctx.fillText(String(i + 1), cSet, cy + 12);
      ctx.fillStyle = C.textDim; ctx.font = `500 30px ${FONT}`; ctx.fillText(s.prev, cPrev, cy + 10);
      ctx.fillStyle = C.text; ctx.font = `700 40px ${FONT}`; ctx.fillText(s.kg, cKg, cy + 13); ctx.fillText(s.reps, cReps, cy + 13);
      const chS = 72, chX = cChk - chS / 2, chY = cy - chS / 2;
      roundRect(chX, chY, chS, chS, 22); const cg = ctx.createLinearGradient(chX, chY, chX + chS, chY + chS); cg.addColorStop(0, C.accent); cg.addColorStop(1, C.sport); ctx.fillStyle = cg; ctx.fill();
      ctx.save(); ctx.strokeStyle = "#1a0f04"; ctx.lineWidth = chS * 0.14; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(cChk - chS * 0.2, cy + 2); ctx.lineTo(cChk - chS * 0.03, cy + chS * 0.18); ctx.lineTo(cChk + chS * 0.24, cy - chS * 0.2); ctx.stroke(); ctx.restore();
      ry += rowH;
    });
    ctx.restore();
    return cardH;
  }
  // Botón "＋ Añadir ejercicio"
  function addExBtn(x, y, w, press) {
    const h = 78;
    ctx.save(); const sc = 1 - 0.04 * Math.sin(clamp01(press) * Math.PI); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.setLineDash([10, 8]); ctx.lineWidth = 2.5; ctx.strokeStyle = press > 0 ? C.accent : "rgba(255,122,26,0.55)"; roundRect(x, y, w, h, 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.accent; ctx.textAlign = "center"; ctx.font = `700 34px ${FONT}`; ctx.fillText("＋  " + T[langNow()].addEx, x + w / 2, y + h / 2 + 12); ctx.restore();
    return h;
  }

  // ---------- Escenas ----------
  const EX = () => { const L = T[langNow()]; return [
    { name: L.lateral, musc: "hombros · trapecio", muscEs: ["Hombros", "Trapecio"], muscEn: ["Shoulders", "Traps"], thumb: thumbLat },
    { name: L.row, musc: "espalda alta · bíceps", thumb: thumbRow },
    { name: L.curl, musc: "bíceps · antebrazos", thumb: thumbCurl },
    { name: L.bench, musc: "pecho · tríceps", thumb: thumbBench },
  ]; };

  function drawGym(added, addPress) {
    statusBar();
    const nSets = added ? 6 : 3, vol = added ? 496 : 376, nMusc = added ? 3 : 2;
    statsBar(nSets, vol, nMusc);
    const cardX = SX + 24, cardW = SW - 48;
    let y = SY + 262;
    y += exerciseCard(cardX, y, cardW, T[langNow()].curl, thumbCurl, [{ prev: "10×12", kg: "12", reps: "12" }, { prev: "12×10", kg: "12", reps: "10" }, { prev: "12×9", kg: "14", reps: "8" }], 1) + 22;
    if (added) { y += exerciseCard(cardX, y, cardW, T[langNow()].lateral, thumbLat, [{ prev: "9×15", kg: "10", reps: "15" }, { prev: "10×12", kg: "10", reps: "12" }, { prev: "10×12", kg: "12", reps: "10" }], clamp01((added - 0) )) + 22; }
    return y;
  }

  // Modal genérico deslizante (0=oculto abajo, 1=arriba)
  function sheet(prog, topY, draw) {
    const off = (1 - easeOut(prog)) * (SY + SH - topY);
    ctx.save(); ctx.globalAlpha = Math.min(1, prog * 1.4); ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(SX, SY, SW, SH); ctx.restore();
    ctx.save(); ctx.translate(0, off);
    roundRect(SX, topY, SW, SY + SH - topY + 40, 42); ctx.fillStyle = C.surface; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.fillStyle = C.border; roundRect(540 - 34, topY + 16, 68, 8, 4); ctx.fill();
    draw(off);
    ctx.restore();
  }

  function drawSelector(prog, eyePress, cur) {
    const topY = SY + 260;
    sheet(prog, topY, () => {
      const L = T[langNow()];
      ctx.textAlign = "center"; ctx.fillStyle = C.text; ctx.font = `800 40px ${FONT}`; ctx.fillText(L.picker, 540, topY + 78);
      // buscador
      const sbX = SX + 34, sbW = SW - 68, sbY = topY + 108, sbH = 76;
      roundRect(sbX, sbY, sbW, sbH, 18); ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
      ctx.strokeStyle = C.textDim; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sbX + 40, sbY + sbH / 2, 13, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sbX + 50, sbY + sbH / 2 + 10); ctx.lineTo(sbX + 62, sbY + sbH / 2 + 22); ctx.stroke();
      ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `500 30px ${FONT}`; ctx.fillText(L.search, sbX + 76, sbY + sbH / 2 + 11);
      // lista
      let ly = sbY + sbH + 26; const rowH = 128;
      EX().forEach((ex, i) => {
        const isTarget = i === 0;
        roundRect(sbX, ly, sbW, rowH - 16, 20); ctx.fillStyle = isTarget && eyePress < 0 ? "rgba(255,122,26,0.08)" : C.bg; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
        circleImg(ex.thumb, sbX + 30 + 40, ly + (rowH - 16) / 2, 40);
        ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `700 34px ${FONT}`; ctx.fillText(ex.name, sbX + 130, ly + 48);
        ctx.fillStyle = C.textDim; ctx.font = `500 26px ${FONT}`; ctx.fillText(ex.musc, sbX + 130, ly + 84);
        // ojo
        const eyeX = sbX + sbW - 60, eyeY = ly + (rowH - 16) / 2;
        roundRect(eyeX - 40, eyeY - 34, 80, 68, 16); ctx.fillStyle = C.surfaceAlt; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
        eyeIcon(eyeX, eyeY, 34, isTarget ? C.accent : C.textDim);
        if (isTarget && cur) cur(eyeX, eyeY);
        ly += rowH;
      });
    });
  }

  function drawDetail(prog, addPress, cur) {
    const topY = SY + 150;
    sheet(1, SY + 260, () => { }); // selector detrás (ya abierto)
    // Vuelve a pintar el selector base tenue no hace falta; dibujamos el detalle encima:
    const off = (1 - easeOut(prog)) * (SY + SH - topY);
    ctx.save(); ctx.globalAlpha = Math.min(1, prog * 1.4); ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(SX, SY, SW, SH); ctx.restore();
    ctx.save(); ctx.translate(0, off);
    roundRect(SX, topY, SW, SY + SH - topY + 40, 42); ctx.fillStyle = C.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.fillStyle = C.border; roundRect(540 - 34, topY + 16, 68, 8, 4); ctx.fill();
    const L = T[langNow()], ex = EX()[0];
    // animación (vídeo) 4:3
    const aX = SX + 34, aW = SW - 68, aY = topY + 46, aH = aW * 0.62;
    ctx.save(); roundRect(aX, aY, aW, aH, 20); ctx.clip(); ctx.fillStyle = "#000"; ctx.fillRect(aX, aY, aW, aH);
    if (exVid.readyState >= 2) { const vr = exVid.videoWidth / exVid.videoHeight || 1.33, br = aW / aH; let dw, dh; if (vr > br) { dh = aH; dw = aH * vr; } else { dw = aW; dh = aW / vr; } try { ctx.drawImage(exVid, aX + (aW - dw) / 2, aY + (aH - dh) / 2, dw, dh); } catch (e) {} }
    else if (thumbLat.complete && thumbLat.naturalWidth) { ctx.drawImage(thumbLat, aX, aY, aW, aH); }
    ctx.restore();
    ctx.lineWidth = 2; ctx.strokeStyle = C.border; roundRect(aX, aY, aW, aH, 20); ctx.stroke();
    // nombre
    ctx.textAlign = "center"; ctx.fillStyle = C.text; ctx.font = `800 42px ${FONT}`; ctx.fillText(ex.name, 540, aY + aH + 66);
    // músculos afectados
    ctx.fillStyle = C.textDim; ctx.font = `700 24px ${FONT}`; ctx.textAlign = "left"; spaced(L.affected, aX, aY + aH + 128, 1);
    const chips = langNow() === "en" ? ex.muscEn : ex.muscEs; let chx = aX;
    const chy = aY + aH + 150;
    chips.forEach((m, i) => {
      ctx.font = `700 30px ${FONT}`; const tw = ctx.measureText(m).width, cw = tw + 44;
      roundRect(chx, chy, cw, 60, 30);
      if (i === 0) { ctx.fillStyle = "rgba(255,122,26,0.16)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,122,26,0.5)"; ctx.stroke(); ctx.fillStyle = C.accent; }
      else { ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke(); ctx.fillStyle = C.textDim; }
      ctx.textAlign = "center"; ctx.fillText(m, chx + cw / 2, chy + 40); chx += cw + 16;
    });
    // cuerpo con músculo (info adicional)
    if (bodyIco.complete && bodyIco.naturalWidth) {
      const bh = 150, bw2 = bh * (bodyIco.naturalWidth / bodyIco.naturalHeight);
      ctx.globalAlpha = 0.9; ctx.drawImage(bodyIco, 540 - bw2 / 2, chy + 92, bw2, bh); ctx.globalAlpha = 1;
    }
    // botón Agregar
    const bY = SY + SH - 120, bX = SX + 40, bW = SW - 80, bHh = 92;
    ctx.save(); const sc = 1 - 0.05 * Math.sin(clamp01(addPress) * Math.PI); ctx.translate(bX + bW / 2, bY + bHh / 2); ctx.scale(sc, sc); ctx.translate(-(bX + bW / 2), -(bY + bHh / 2));
    roundRect(bX, bY, bW, bHh, bHh / 2); const gg = ctx.createLinearGradient(bX, 0, bX + bW, 0); gg.addColorStop(0, C.accent); gg.addColorStop(1, C.sport); ctx.fillStyle = gg; ctx.fill();
    ctx.fillStyle = "#1a0f04"; ctx.textAlign = "center"; ctx.font = `800 40px ${FONT}`; ctx.fillText("＋  " + L.add, 540, bY + bHh / 2 + 14); ctx.restore();
    if (cur) cur(540, bY + bHh / 2);
    ctx.restore();
  }

  // ---------- Línea de tiempo ----------
  // 0-1.8 gym+tap add · 1.8-2.3 abre selector · 2.3-3.6 tap ojo · 3.6-4.1 abre detalle
  // 4.1-6.0 detalle+tap agregar · 6.0-6.6 cierra · 6.6-10 gym con ejercicio añadido
  function scene(t) {
    if (t < 2.0) {
      const y = drawGym(0, 0);
      const btnY = SY + 262 + (118 + 54 + 92 * 3 + 20) + 22;
      const press = t > 1.35 ? clamp01((t - 1.35) / 0.2) * clamp01((1.7 - t) / 0.35) : 0;
      addExBtn(SX + 24 + 0, btnY, SW - 48, t > 1.35 ? clamp01((t - 1.35) / 0.18) : 0);
      // cursor hacia el botón
      const cp = clamp01(t / 1.35); const cx0 = 540, cy0 = SY + SH * 0.5, cxT = 540 - 100, cyT = btnY + 39;
      const cxx = cx0 + (cxT - cx0) * easeInOut(cp), cyy = cy0 + (cyT - cy0) * easeInOut(cp);
      cursor(cxx, cyy, t > 1.35 ? clamp01((t - 1.35) / 0.18) * clamp01((1.7 - t) / 0.3) : 0);
    } else if (t < 3.7) {
      drawGym(0, 0);
      const prog = clamp01((t - 2.0) / 0.4);
      const eyeP = t > 3.15 ? clamp01((t - 3.15) / 0.18) * clamp01((3.5 - t) / 0.3) : -1;
      let cxx, cyy, press = 0;
      drawSelector(prog, eyeP, (ex, ey) => {
        const cp = clamp01((t - 2.4) / 0.7); const sx0 = 540, sy0 = SY + SH * 0.8;
        cxx = sx0 + (ex - sx0) * easeInOut(cp); cyy = sy0 + (ey - sy0) * easeInOut(cp);
        press = t > 3.15 ? clamp01((t - 3.15) / 0.18) * clamp01((3.5 - t) / 0.3) : 0;
      });
      if (cxx !== undefined) cursor(cxx, cyy, press);
    } else if (t < 6.6) {
      drawGym(0, 0);
      const prog = clamp01((t - 3.7) / 0.4);
      const addP = t > 5.4 ? clamp01((t - 5.4) / 0.18) * clamp01((5.8 - t) / 0.3) : 0;
      let cxx, cyy, press = 0;
      drawDetail(t < 6.0 ? prog : clamp01((6.6 - t) / 0.4), addP, (ax, ay) => {
        const cp = clamp01((t - 4.3) / 1.0); const sx0 = 540, sy0 = SY + SH * 0.55;
        cxx = sx0 + (ax - sx0) * easeInOut(cp); cyy = sy0 + (ay - sy0) * easeInOut(cp);
        press = addP;
      });
      if (t < 6.0 && cxx !== undefined) cursor(cxx, cyy, press);
    } else {
      const ap = clamp01((t - 6.6) / 0.5);
      drawGym(ap, 0);
    }
  }

  // ---------- Proyección 3D (idéntica a render.html iso) ----------
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

  // ---------- Bucle: solo al pasar el cursor ----------
  let start = performance.now(), hover = false, encoding = false;
  const clipEl = canvas.closest(".clip");
  if (clipEl) {
    clipEl.addEventListener("mouseenter", () => { hover = true; start = performance.now(); exVid.play().catch(() => {}); });
    clipEl.addEventListener("mouseleave", () => { hover = false; exVid.pause(); render(0); });
  }
  render(0);
  function frame(now) { if (!encoding && hover) render(((now - start) / 1000) % CYCLE); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  // ---------- Descarga ----------
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
