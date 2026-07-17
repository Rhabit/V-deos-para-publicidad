/* Nuevo móvil: escena 1 = registro de series con el estilo de "Registra cada
   serie" (dos tarjetas de ejercicio como la app original). Al completar la última
   serie salta a la escena 2 = SUBIDA DE RANGO (Silver I) épica, todo dentro del
   mismo marco de móvil, con la paleta cálida de la marca y soporte de vista
   isométrica / plana (selector Pose). Canvas puro, editable, descarga MP4. */
(function initRankUp() {
  const canvas = document.getElementById("rank-canvas");
  if (!canvas) return;
  const mainCtx = canvas.getContext("2d");
  const W = 1080, H = 1920, CYCLE = 8.0;
  canvas.width = W; canvas.height = H;
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  // Offscreen: se pinta el móvil aquí y se vuelca plano o en perspectiva (iso).
  const pcv = document.createElement("canvas"); pcv.width = W; pcv.height = H;
  const pctx = pcv.getContext("2d");
  let ctx = mainCtx; // las funciones de dibujo usan este contexto mutable

  const C = {
    bg: "#090906", surface: "#17120F", surfaceAlt: "#221c17",
    accent: "#ff7a1a", sport: "#f5b14a", text: "#ffffff",
    textDim: "#c2b8a8", border: "#2c241d",
  };

  // Móvil EXACTO del generador de clips (render.html): 266×576.3 CSS × deviceScaleFactor 3,
  // centrado en el lienzo. Marco/pantalla según styles.css .phone (padding 11, radios 40/30).
  const PW = 798, PH = 1729, PX = Math.round(540 - PW / 2), PY = Math.round(960 - PH / 2), PR = 120;
  const SX = PX + 33, SY = PY + 33, SW = PW - 66, SH = PH - 66, SR = 90;

  const emblem = new Image(); emblem.src = "assets/rank-silver.png";
  if (emblem.decode) emblem.decode().catch(() => {});
  const thumbCurl = new Image(); thumbCurl.src = "assets/ex-curl.png";
  const thumbBench = new Image(); thumbBench.src = "assets/ex-bench.png";
  const bodyIco = new Image(); bodyIco.src = "assets/musculo-cuerpo.png";
  const langNow = () => { const on = document.querySelector("#mk-lang button.on"); return on && on.dataset.lang === "en" ? "en" : "es"; };
  const poseNow = () => { const on = document.querySelector("#mk-pose button.on"); return on && on.dataset.pose === "flat" ? "flat" : "iso"; };

  const TX = {
    es: { time: "TIEMPO", vol: "VOLUMEN", sets: "SERIES", muscles: "MÚSCULOS", colSet: "SERIE", colPrev: "ANTERIOR", addSet: "Añadir serie", rankup: "SUBIDA DE RANGO", rank: "SILVER I", sub: "Sigue así. Imparable.", ex1: "Curl de bíceps", ex2: "Press de banca" },
    en: { time: "TIME", vol: "VOLUME", sets: "SETS", muscles: "MUSCLES", colSet: "SET", colPrev: "PREVIOUS", addSet: "Add set", rankup: "RANK UP", rank: "SILVER I", sub: "Keep going. Unstoppable.", ex1: "Biceps curl", ex2: "Bench press" },
  };
  let weight = "14", reps = "8";
  let start = performance.now();
  const restart = () => { start = performance.now(); };

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

  // ---------- Marco de móvil ----------
  function drawPhone(content) {
    // Cuerpo: gradiente 160deg #2a221c → #0e0b09, borde #33291f (styles.css .phone)
    const g = ctx.createLinearGradient(PX + PW * 0.3, PY, PX + PW * 0.7, PY + PH);
    g.addColorStop(0, "#2a221c"); g.addColorStop(1, "#0e0b09");
    roundRect(PX, PY, PW, PH, PR); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#33291f"; ctx.stroke();
    ctx.save(); roundRect(SX, SY, SW, SH, SR); ctx.clip();
    ctx.fillStyle = C.bg; ctx.fillRect(SX, SY, SW, SH);
    content();
    ctx.restore();
    // Notch (::before): 78×7 top:16, centrado, ×3
    const nw = 234, nh = 21;
    roundRect(540 - nw / 2, PY + 48, nw, nh, nh / 2); ctx.fillStyle = "#000"; ctx.fill();
  }
  function drawStatusBar() {
    const y = SY + 66;
    ctx.textAlign = "left"; ctx.fillStyle = C.textDim; ctx.font = `600 32px ${FONT}`;
    ctx.fillText("9:41", SX + 42, y);
    let bx = SX + SW - 160;
    ctx.fillStyle = C.textDim;
    for (let i = 0; i < 4; i++) { const bh = 7 + i * 6; ctx.fillRect(bx + i * 12, y - bh, 7, bh); }
    const btx = SX + SW - 94, bty = y - 20, bw = 50, bh = 24;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(194,184,168,0.7)";
    roundRect(btx, bty, bw, bh, 6); ctx.stroke();
    ctx.fillStyle = "rgba(194,184,168,0.7)"; roundRect(btx + bw + 2, bty + 7, 4, 10, 2); ctx.fill();
    ctx.fillStyle = C.textDim; roundRect(btx + 4, bty + 4, (bw - 8) * 0.7, bh - 8, 3); ctx.fill();
  }
  function dumbbell(cx, cy, s, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineCap = "round";
    ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy); ctx.lineTo(cx + s * 0.5, cy); ctx.stroke();
    ctx.lineWidth = s * 0.36;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy - s * 0.3); ctx.lineTo(cx - s * 0.5, cy + s * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + s * 0.5, cy - s * 0.3); ctx.lineTo(cx + s * 0.5, cy + s * 0.3); ctx.stroke();
    ctx.restore();
  }
  function checkMark(cx, cy, s, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.28; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(cx - s * 0.42, cy + s * 0.02); ctx.lineTo(cx - s * 0.1, cy + s * 0.34); ctx.lineTo(cx + s * 0.46, cy - s * 0.36); ctx.stroke();
    ctx.restore();
  }

  // ---------- Escena 1: registro de series (dos ejercicios) ----------
  // Se anima UNA sola serie: primero el peso, luego las reps, luego se completa.
  const KG_T0 = 0.5, KG_T1 = 1.15, RP_T0 = 1.45, RP_T1 = 2.0, PRESS_T = 2.2;
  function typeNum(target, t, t0, t1) {
    const tgt = parseInt(target) || 0;
    if (t < t0) return "";
    if (t >= t1 || !tgt) return String(target);
    return String(Math.round(tgt * ((t - t0) / (t1 - t0))));
  }
  function drawCard(x, y, w, name, rows, t, thumb) {
    const headH = 118, colH = 54, rowH = 92, pad = 22;
    const cardH = headH + colH + rowH * rows.length + 74 + pad;
    roundRect(x, y, w, cardH, 42);
    ctx.fillStyle = C.surface; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();

    const thumbR = 42, thumbX = x + 40 + thumbR, thumbY = y + 34 + thumbR;
    ctx.save();
    ctx.beginPath(); ctx.arc(thumbX, thumbY, thumbR, 0, 7); ctx.clip();
    ctx.fillStyle = C.surfaceAlt; ctx.fillRect(thumbX - thumbR, thumbY - thumbR, thumbR * 2, thumbR * 2);
    if (thumb && thumb.complete && thumb.naturalWidth) {
      const iar = thumb.naturalWidth / thumb.naturalHeight, d = thumbR * 2;
      let dw, dh; if (iar > 1) { dh = d; dw = d * iar; } else { dw = d; dh = d / iar; }
      ctx.drawImage(thumb, thumbX - dw / 2, thumbY - dh / 2, dw, dh);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(thumbX, thumbY, thumbR, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
    ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `700 38px ${FONT}`;
    ctx.fillText(name, thumbX + thumbR + 28, thumbY + 13);
    ctx.textAlign = "center"; ctx.fillStyle = C.textDim; ctx.font = `800 38px ${FONT}`;
    ctx.fillText("···", x + w - 56, thumbY - 6);

    const L = TX[langNow()];
    const inX = x + 20, inW = w - 40;
    const cSet = inX + inW * 0.10, cPrev = inX + inW * 0.34, cKg = inX + inW * 0.56, cReps = inX + inW * 0.73, cChk = inX + inW * 0.90;
    const colY = y + headH + 22;
    ctx.fillStyle = C.textDim; ctx.font = `700 23px ${FONT}`; ctx.textAlign = "center";
    spacedText(L.colSet, cSet, colY, 1); spacedText(L.colPrev, cPrev, colY, 1);
    spacedText("KG", cKg, colY, 1); spacedText("REPS", cReps, colY, 1);

    let ry = y + headH + colH;
    rows.forEach((s, i) => {
      const cy = ry + rowH / 2;
      const doneAnim = s.active ? clamp01((t - PRESS_T) / 0.3) : 1;
      const on = s.done;
      if (on) {
        ctx.globalAlpha = s.active ? doneAnim : 1;
        roundRect(inX - 2, ry + 6, inW + 4, rowH - 12, 22);
        ctx.fillStyle = "rgba(255,122,26,0.13)"; ctx.fill(); // color-mix accent 13% (web)
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = "center"; ctx.font = `700 36px ${FONT}`;
      ctx.fillStyle = on ? C.accent : C.textDim; ctx.fillText(String(i + 1), cSet, cy + 12);
      ctx.fillStyle = C.textDim; ctx.font = `500 30px ${FONT}`; ctx.fillText(s.prev, cPrev, cy + 10);
      let kgTxt = String(s.kg), repsTxt = String(s.reps), kgFocus = false, repsFocus = false;
      if (s.active) {
        kgTxt = typeNum(s.kg, t, KG_T0, KG_T1); repsTxt = typeNum(s.reps, t, RP_T0, RP_T1);
        kgFocus = t >= KG_T0 && t < RP_T0; repsFocus = t >= RP_T0 && t < PRESS_T;
      }
      if (!on) {
        // Casillas de entrada: fondo --bg con borde --border (foco: borde acento)
        roundRect(cKg - 58, cy - 30, 116, 60, 14); ctx.fillStyle = C.bg; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = kgFocus ? C.accent : C.border; ctx.stroke();
        roundRect(cReps - 58, cy - 30, 116, 60, 14); ctx.fillStyle = C.bg; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = repsFocus ? C.accent : C.border; ctx.stroke();
      }
      ctx.fillStyle = C.text; ctx.font = `700 40px ${FONT}`; ctx.textAlign = "center";
      ctx.fillText(kgTxt, cKg, cy + 13); ctx.fillText(repsTxt, cReps, cy + 13);
      // Cursor parpadeante en la casilla que se está rellenando y aún vacía.
      if ((kgFocus && !kgTxt) || (repsFocus && !repsTxt)) {
        const bx = (kgFocus && !kgTxt) ? cKg : cReps;
        if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = C.accent; ctx.fillRect(bx - 2, cy - 20, 4, 40); }
      }

      const chS = 72, chX = cChk - chS / 2, chY = cy - chS / 2;
      const pop = s.active ? 1 + 0.18 * Math.sin(clamp01((t - PRESS_T) / 0.18) * Math.PI) : 1;
      ctx.save(); ctx.translate(cChk, cy); ctx.scale(pop, pop); ctx.translate(-cChk, -cy);
      roundRect(chX, chY, chS, chS, 22);
      if (on) {
        const cg = ctx.createLinearGradient(chX, chY, chX + chS, chY + chS);
        cg.addColorStop(0, C.accent); cg.addColorStop(1, C.sport);
        ctx.fillStyle = cg; ctx.globalAlpha = s.active ? doneAnim : 1; ctx.fill(); ctx.globalAlpha = 1;
        checkMark(cChk, cy, chS * 0.55, "#1a0f04");
      } else {
        ctx.fillStyle = C.surfaceAlt; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.border; ctx.stroke();
        checkMark(cChk, cy, chS * 0.5, "rgba(194,184,168,0.55)");
      }
      ctx.restore();

      if (s.active && t >= RP_T1 && t < PRESS_T) {
        const pulse = (Math.sin(t * 6) + 1) / 2;
        ctx.globalAlpha = 0.35 + 0.35 * pulse;
        ctx.beginPath(); ctx.arc(cChk, cy, chS * 0.6 + 12 * pulse, 0, 7);
        ctx.lineWidth = 4; ctx.strokeStyle = C.accent; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ry += rowH;
    });

    const asY = ry + 16, asH = 62;
    ctx.save(); ctx.setLineDash([9, 7]); ctx.lineWidth = 2; ctx.strokeStyle = C.border;
    roundRect(inX, asY, inW, asH, 20); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C.accent; ctx.textAlign = "center"; ctx.font = `700 30px ${FONT}`;
    ctx.fillText("+  " + L.addSet, inX + inW / 2, asY + asH / 2 + 11);
    return cardH;
  }

  function drawWorkout(t) {
    const L = TX[langNow()];
    drawStatusBar();

    const done3 = t >= PRESS_T;
    const ex1Rows = [
      { prev: "10×12", kg: "12", reps: "12", done: true },
      { prev: "12×10", kg: "12", reps: "10", done: true },
      { prev: "12×9", kg: weight, reps: reps, done: done3, active: true },
    ];
    const ex2Rows = [
      { prev: "47×10", kg: "50", reps: "10", done: false },
      { prev: "47×9", kg: "50", reps: "10", done: false },
      { prev: "52×8", kg: "55", reps: "8", done: false },
    ];
    const allRows = ex1Rows.concat(ex2Rows);
    const vol = allRows.filter((s) => s.done).reduce((a, s) => a + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0);
    const nDone = allRows.filter((s) => s.done).length;

    // Barra de stats
    const sbY = SY + 206;
    const cols = [
      { label: L.time, value: "12:04", clock: true },
      { label: L.vol, value: String(Math.round(vol)) },
      { label: L.sets, value: String(nDone) },
      { label: L.muscles, value: "2", body: true },
    ];
    const gx0 = SX + 26, gw = SW - 52, cw = gw / cols.length;
    ctx.textAlign = "center";
    cols.forEach((c, i) => {
      const cx = gx0 + cw * i + cw / 2;
      if (c.clock) {
        ctx.strokeStyle = C.accent; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, sbY - 62, 14, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, sbY - 62); ctx.lineTo(cx, sbY - 71); ctx.moveTo(cx, sbY - 62); ctx.lineTo(cx + 8, sbY - 62); ctx.stroke();
      }
      ctx.fillStyle = C.text; ctx.font = `800 44px ${FONT}`;
      if (c.body && bodyIco.complete && bodyIco.naturalWidth) {
        const vw = ctx.measureText(c.value).width, ic = 44, gap = 4;
        const ix = cx - (ic + gap + vw) / 2, iar = bodyIco.naturalWidth / bodyIco.naturalHeight;
        let dw = ic, dh = ic / iar; if (dh > ic) { dh = ic; dw = ic * iar; } // contain
        ctx.drawImage(bodyIco, ix + (ic - dw) / 2, sbY - 34 + (ic - dh) / 2, dw, dh);
        ctx.textAlign = "left"; ctx.fillText(c.value, ix + ic + gap, sbY); ctx.textAlign = "center";
      } else {
        ctx.fillText(c.value, cx, sbY);
      }
      ctx.fillStyle = C.textDim; ctx.font = `600 23px ${FONT}`; spacedText(c.label, cx, sbY + 38, 1);
      if (i < cols.length - 1) { ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx0 + cw * (i + 1), sbY - 34); ctx.lineTo(gx0 + cw * (i + 1), sbY + 28); ctx.stroke(); }
    });
    ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(SX, sbY + 84); ctx.lineTo(SX + SW, sbY + 84); ctx.stroke();

    // Dos tarjetas de ejercicio
    const cardX = SX + 24, cardW = SW - 48;
    let y = sbY + 112;
    y += drawCard(cardX, y, cardW, L.ex1, ex1Rows, t, thumbCurl) + 22;
    drawCard(cardX, y, cardW, L.ex2, ex2Rows, t, thumbBench);
  }

  function drawFlash(a) { a = clamp01(a); if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fff"; ctx.fillRect(SX, SY, SW, SH); ctx.restore(); }

  // ---------- Escena 2: subida de rango ----------
  function drawRays(rt, cx, cy, alpha) {
    if (alpha <= 0.01) return;
    const n = 16;
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.rotate(rt * 0.22);
    for (let i = 0; i < n; i++) {
      ctx.rotate((Math.PI * 2) / n);
      const grad = ctx.createLinearGradient(0, 0, 0, -1400);
      grad.addColorStop(0, "rgba(255,205,140,0)"); grad.addColorStop(0.04, "rgba(255,190,120,0.24)"); grad.addColorStop(1, "rgba(255,190,120,0)");
      ctx.fillStyle = grad;
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

    // Entrada épica: el emblema baja desde arriba haciendo un "slam" (zoom de 1.6→1),
    // con impacto (destello + temblor), haz de luz y estela.
    const landT = 0.85;
    const p = clamp01(rt / landT);
    const emAlpha = clamp01(rt / 0.3);
    let sc, yOff;
    if (rt <= landT) { sc = 1.65 - 0.65 * easeOut(p); yOff = (1 - easeOut(p)) * -220; }
    else { const b = clamp01((rt - landT) / 0.45); sc = 1 + 0.07 * Math.sin(b * Math.PI); yOff = 0; }

    // Temblor de impacto (decae en 0.35 s)
    const shake = (rt > landT && rt < landT + 0.35) ? (1 - (rt - landT) / 0.35) * 18 : 0;
    const shx = shake * Math.sin(rt * 82), shy = shake * Math.cos(rt * 63);

    // Haz de luz vertical detrás del emblema
    const beamA = clamp01((rt - 0.1) / 0.35) * (rt < landT + 0.6 ? 1 : clamp01(1 - (rt - (landT + 0.6)) / 0.7));
    if (beamA > 0.01) {
      const bw = 140 * (rt < landT ? 0.5 + 0.5 * (rt / landT) : 1) + 40 * pulse;
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = beamA * 0.55;
      const bg3 = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
      bg3.addColorStop(0, "rgba(255,205,135,0)"); bg3.addColorStop(0.5, "rgba(255,225,165,0.75)"); bg3.addColorStop(1, "rgba(255,205,135,0)");
      ctx.fillStyle = bg3; ctx.fillRect(cx - bw, SY, bw * 2, SH); ctx.restore();
    }

    // Rayos (estallan al aterrizar)
    const rayFlare = rt > landT - 0.1 && rt < landT + 0.4 ? 0.5 * (1 - Math.abs(rt - landT) / 0.4) : 0;
    ctx.save(); ctx.translate(shx, shy);
    drawRays(rt, cx, cy, 0.45 * emAlpha + 0.12 * pulse + rayFlare);
    ctx.restore();

    if (emAlpha > 0) {
      const gr = ctx.createRadialGradient(cx, cy + yOff, 0, cx, cy + yOff, 460 * Math.max(0.4, sc));
      gr.addColorStop(0, `rgba(255,205,145,${0.55 * emAlpha})`); gr.addColorStop(0.5, `rgba(255,140,50,${0.24 * emAlpha})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = gr; ctx.fillRect(SX, SY, SW, SH); ctx.restore();
    }

    // Anillo de choque
    if (rt > landT) {
      const k = (rt - landT) / 0.55;
      if (k < 1) {
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = (1 - k) * 0.7;
        ctx.lineWidth = 12 * (1 - k) + 2; ctx.strokeStyle = "rgba(255,225,175,1)";
        ctx.beginPath(); ctx.arc(cx, cy, 150 + k * 470, 0, 7); ctx.stroke(); ctx.restore();
      }
    }

    // Emblema
    const ar = (emblem.naturalWidth && emblem.naturalHeight) ? emblem.naturalWidth / emblem.naturalHeight : 0.95;
    const ew = 470 * sc, eh = ew / ar, ey = cy + yOff;
    if (sc > 0.02 && emblem.complete && emblem.naturalWidth) {
      const ow = Math.round(ew), oh = Math.round(eh);
      const off = drawRankUp._off || (drawRankUp._off = document.createElement("canvas"));
      off.width = ow; off.height = oh;
      const octx = off.getContext("2d");
      octx.clearRect(0, 0, ow, oh); octx.drawImage(emblem, 0, 0, ow, oh);
      if (rt > landT + 0.15) {
        const sweep = ((rt - (landT + 0.15)) % 2.4) / 2.4;
        octx.save(); octx.globalCompositeOperation = "source-atop";
        const gxp = -ow * 0.35 + sweep * (ow * 1.7);
        const lg = octx.createLinearGradient(gxp - 110, 0, gxp + 110, 0);
        lg.addColorStop(0, "rgba(255,240,220,0)"); lg.addColorStop(0.5, "rgba(255,240,220,0.6)"); lg.addColorStop(1, "rgba(255,240,220,0)");
        octx.fillStyle = lg; octx.translate(ow / 2, oh / 2); octx.rotate(-0.32); octx.translate(-ow / 2, -oh / 2);
        octx.fillRect(-ow, -oh, ow * 3, oh * 3); octx.restore();
      }
      ctx.save(); ctx.globalAlpha = emAlpha; ctx.translate(shx, shy); ctx.drawImage(off, cx - ew / 2, ey - eh / 2, ew, eh); ctx.restore();
    }

    // Destello de impacto (blanco cálido) justo al aterrizar
    if (rt > landT - 0.03) {
      const bk = clamp01((rt - (landT - 0.03)) / 0.3);
      if (bk < 1) {
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 1 - bk;
        const bb = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120 + bk * 560);
        bb.addColorStop(0, "rgba(255,248,225,0.95)"); bb.addColorStop(0.55, "rgba(255,205,130,0.4)"); bb.addColorStop(1, "rgba(255,185,95,0)");
        ctx.fillStyle = bb; ctx.fillRect(SX, SY, SW, SH); ctx.restore();
      }
    }

    drawSparks(rt, cx, cy, emAlpha);

    const tTop = clamp01((rt - 0.7) / 0.5);
    if (tTop > 0) {
      ctx.save(); ctx.globalAlpha = tTop; ctx.textAlign = "center";
      const ty = SY + SH * 0.11 + (1 - easeOut(tTop)) * 34;
      ctx.font = `800 54px ${FONT}`; ctx.fillStyle = C.sport;
      ctx.shadowColor = "rgba(255,140,40,0.85)"; ctx.shadowBlur = 30;
      spacedText(L.rankup, W / 2, ty, 8);
      ctx.restore();
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
      spacedText(L.rank, 0, 0, 7);
      ctx.restore();
    }
    const tSub = clamp01((rt - 1.6) / 0.6);
    if (tSub > 0) {
      ctx.save(); ctx.globalAlpha = tSub; ctx.textAlign = "center";
      ctx.fillStyle = C.textDim; ctx.font = `600 36px ${FONT}`;
      ctx.fillText(L.sub, W / 2, SY + SH * 0.77);
      ctx.restore();
    }
  }

  // ---------- Vuelco: plano o isométrico ----------
  // Inclinación medida del clip real "Registra cada serie": lean suave (cizalla
  // horizontal ~-0.042, top hacia la derecha) + ligera reducción, casi rectangular.
  // Perspectiva 3D EXACTA del generador de clips (render.html, iso):
  // perspective:1400px (×3) · rotateY(-16deg) rotateX(4deg) rotateZ(1deg), móvil centrado.
  const ISO = { ry: -16 * Math.PI / 180, rx: 4 * Math.PI / 180, rz: 1 * Math.PI / 180, psp: 1400 * 3 };
  function dest(u, v) {
    let x = (u - 0.5) * PW, y = (v - 0.5) * PH, z = 0, c, s, a, b;
    c = Math.cos(ISO.rz); s = Math.sin(ISO.rz); a = x * c - y * s; b = x * s + y * c; x = a; y = b;      // rotateZ
    c = Math.cos(ISO.rx); s = Math.sin(ISO.rx); a = y * c - z * s; b = y * s + z * c; y = a; z = b;      // rotateX
    c = Math.cos(ISO.ry); s = Math.sin(ISO.ry); a = x * c + z * s; b = -x * s + z * c; x = a; z = b;      // rotateY
    const f = ISO.psp / (ISO.psp - z);
    return [540 + x * f, 960 + y * f];
  }
  function drawTri(img, s0, s1, s2, d0, d1, d2) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]); ctx.lineTo(d2[0], d2[1]); ctx.closePath(); ctx.clip();
    const x0 = s0[0], y0 = s0[1], x1 = s1[0], y1 = s1[1], x2 = s2[0], y2 = s2[1];
    const u0 = d0[0], v0 = d0[1], u1 = d1[0], v1 = d1[1], u2 = d2[0], v2 = d2[1];
    const den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
    if (Math.abs(den) > 1e-6) {
      const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / den;
      const b = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / den;
      const c = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / den;
      const d = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / den;
      const e = (u0 * (x1 * y2 - x2 * y1) + u1 * (x2 * y0 - x0 * y2) + u2 * (x0 * y1 - x1 * y0)) / den;
      const f = (v0 * (x1 * y2 - x2 * y1) + v1 * (x2 * y0 - x0 * y2) + v2 * (x0 * y1 - x1 * y0)) / den;
      ctx.setTransform(a, b, c, d, e, f); ctx.drawImage(img, 0, 0);
    }
    ctx.restore();
  }
  function blitIso(src) {
    const N = 14, M = 24;
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, v0 = j / M, v1 = (j + 1) / M;
      const A = dest(u0, v0), B = dest(u1, v0), Cc = dest(u1, v1), D = dest(u0, v1);
      const sA = [PX + u0 * PW, PY + v0 * PH], sB = [PX + u1 * PW, PY + v0 * PH], sC = [PX + u1 * PW, PY + v1 * PH], sD = [PX + u0 * PW, PY + v1 * PH];
      drawTri(src, sA, sB, sC, A, B, Cc);
      drawTri(src, sA, sC, sD, A, Cc, D);
    }
  }
  const bgColor = () => { const el = document.getElementById("mk-color"); return (el && el.value) || "#202124"; };
  function render(t) {
    const flashStart = 2.85, rankStart = 3.02;
    ctx = pctx;
    pctx.clearRect(0, 0, W, H);
    drawPhone(() => {
      if (t < flashStart) { drawWorkout(t); }
      else if (t < rankStart) { drawWorkout(flashStart); drawFlash((t - flashStart) / (rankStart - flashStart)); }
      else { const rt = t - rankStart; drawRankUp(rt); if (rt < 0.3) drawFlash(1 - rt / 0.3); }
    });
    ctx = mainCtx;
    // Fondo = color elegido (como el resto de clips); el móvil se compone encima.
    mainCtx.fillStyle = bgColor(); mainCtx.fillRect(0, 0, W, H);
    if (poseNow() === "iso") blitIso(pcv); else mainCtx.drawImage(pcv, 0, 0);
  }

  let encoding = false, hover = false;
  const clipEl = canvas.closest(".clip");
  if (clipEl) {
    clipEl.addEventListener("mouseenter", () => { hover = true; start = performance.now(); });
    clipEl.addEventListener("mouseleave", () => { hover = false; render(0); });
  }
  render(0); // fotograma inicial estático; solo se anima con el cursor encima
  function frame(now) { if (!encoding && hover) render(((now - start) / 1000) % CYCLE); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  // ---------- Controles ----------
  const wI = document.getElementById("rank-weight"), rI = document.getElementById("rank-reps");
  if (wI) wI.addEventListener("input", () => { weight = (wI.value || "0").slice(0, 4); restart(); });
  if (rI) rI.addEventListener("input", () => { reps = (rI.value || "0").slice(0, 4); restart(); });
  const langSeg = document.getElementById("mk-lang");
  if (langSeg) langSeg.addEventListener("click", () => setTimeout(restart, 0));

  // ---------- Descarga ----------
  function saveBlob(blob, name) {
    const u = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
  }
  function waitImg(img) {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise((res) => { img.onload = res; img.onerror = res; setTimeout(res, 3000); });
  }
  window.__rankupDownload = async function () {
    await Promise.all([emblem, thumbCurl, thumbBench].map(waitImg));
    if (window.mp4Support && window.mp4Support()) {
      const enc = await window.makeMp4Encoder(W, H, 30, 12000000);
      if (enc) {
        try {
          encoding = true;
          const FPS = 30, total = Math.round(CYCLE * FPS);
          for (let i = 0; i < total; i++) { render(i / FPS); await enc.addFrame(canvas, i * 1e6 / FPS, i % 60 === 0); }
          const blob = await enc.finish(); encoding = false;
          if (blob.size >= 1000) { saveBlob(blob, "rhabit-subida-rango.mp4"); return; }
        } catch (e) { encoding = false; }
      }
    }
    return new Promise((resolve, reject) => {
      const cands = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1", "video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mime = window.MediaRecorder && cands.find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) { reject(new Error("MediaRecorder no soportado")); return; }
      const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
      const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 12000000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime.split(";")[0] });
        if (blob.size < 1000) { reject(new Error("grabación vacía")); return; }
        saveBlob(blob, `rhabit-subida-rango.${ext}`); resolve();
      };
      restart(); rec.start();
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, CYCLE * 1000 + 120);
    });
  };
})();
