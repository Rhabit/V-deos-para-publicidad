// Graba cada móvil (mockup real) con FONDO TRANSPARENTE -> WebM VP9 alfa.
// Genera 2 poses (iso/flat). El color se compone en la app.
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const { execFileSync } = require("child_process");

const APP = "/home/hugo/Downloads/Claude/Marketing-App";
const OUT = APP + "/assets/clips";
const TMP = "/tmp/claude-1000/-home-hugo-Downloads-Claude-Marketing-App/b19a12f5-0074-4c12-b2d4-d4c5e5faf37c/scratchpad/frames";

const PHONES = [
  { p: "exercise", dur: 6, shot: true },
  { p: "calendar", dur: 10 },
  { p: "filter", dur: 15 }, // screencast: la cámara (zoom+flotado) está siempre en movimiento → emite frames continuos
  { p: "swipe2", dur: 14, holdEnd: 2.0 }, // anuncio App Store del swipe; holdEnd: mantiene la tarjeta CTA estática del final
  { p: "swipe", dur: 11 },
  { p: "gym", dur: 6.5 },
];
const POSES = ["iso", "flat"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function record(browser, phone, pose) {
  const tag = `${phone.p}-${pose}`;
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
  await page.goto(`http://localhost:8099/render.html?p=${phone.p}&pose=${pose}`, { waitUntil: "networkidle0" });
  await page.waitForFunction("window.__ready === true", { timeout: 8000 }).catch(() => {});
  await sleep(700);
  await page.evaluate(() => window.__mkReplayLoop && window.__mkReplayLoop(0));
  await sleep(120);

  const client = await page.target().createCDPSession();
  await client.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });

  const frames = [];
  if (phone.shot) {
    // Timestamp REAL (no i/FPS): el screenshot a 1080p tarda ~45ms, así que el FPS
    // nominal descuadra el contenido. Capturamos lo más rápido posible durante la
    // duración de reloj y etiquetamos con el tiempo transcurrido.
    const durMs = phone.dur * 1000;
    const t0 = Date.now();
    while (Date.now() - t0 < durMs) {
      const buf = await page.screenshot({ type: "png", omitBackground: true });
      frames.push({ data: Buffer.from(buf).toString("base64"), ts: (Date.now() - t0) / 1000 });
    }
  } else {
    client.on("Page.screencastFrame", async (f) => {
      frames.push({ data: f.data, ts: f.metadata.timestamp });
      try { await client.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) {}
    });
    await client.send("Page.startScreencast", { format: "png", everyNthFrame: 1, maxWidth: 1080, maxHeight: 1920 });
    await sleep(phone.dur * 1000);
    await client.send("Page.stopScreencast");
    await sleep(150);
  }
  await page.close();
  if (frames.length < 2) throw new Error("sin frames " + tag);

  const dir = `${TMP}/${tag}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let list = "";
  for (let i = 0; i < frames.length; i++) {
    fs.writeFileSync(`${dir}/${String(i).padStart(5, "0")}.png`, Buffer.from(frames[i].data, "base64"));
    const next = i + 1 < frames.length ? frames[i + 1].ts : frames[i].ts + 1 / 60;
    // holdEnd: mantiene el último frame (tarjeta estática) N s — el screencast deja
    // de emitir frames en las partes estáticas y el clip se cortaría antes.
    const d = (i === frames.length - 1 && phone.holdEnd) ? phone.holdEnd : Math.max(1 / 240, next - frames[i].ts);
    list += `file '${dir}/${String(i).padStart(5, "0")}.png'\nduration ${d.toFixed(4)}\n`;
  }
  list += `file '${dir}/${String(frames.length - 1).padStart(5, "0")}.png'\n`;
  fs.writeFileSync(`${dir}/list.txt`, list);

  fs.mkdirSync(OUT, { recursive: true });
  const out = `${OUT}/${tag}.webm`;
  execFileSync("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", `${dir}/list.txt`,
    "-fps_mode", "cfr", "-r", "60",
    "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24",
    "-auto-alt-ref", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4",
    out,
  ], { stdio: "ignore" });
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`[REC] ${tag}: ${frames.length} frames -> ${kb} KB`);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--force-device-scale-factor=3", "--autoplay-policy=no-user-gesture-required"],
  });
  for (const phone of PHONES)
    for (const pose of POSES) {
      try { await record(browser, phone, pose); } catch (e) { console.log(`[REC] ERROR ${phone.p}-${pose}: ${e.message}`); }
    }
  await browser.close();
  console.log("[REC] DONE");
})();
