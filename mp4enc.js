/* Codificador MP4 (H.264) en el navegador con WebCodecs + mp4-muxer.
   Permite descargar MP4 real en el sitio estático (sin servidor). Si el navegador
   no soporta WebCodecs, quien lo llame cae a MediaRecorder (WebM). */
(function () {
  "use strict";

  window.mp4Support = function () {
    return !!(window.VideoEncoder && window.VideoFrame && window.Mp4Muxer);
  };

  // Devuelve { addFrame(canvas, tsUs, keyFrame), finish()->Blob mp4 } o null.
  window.makeMp4Encoder = async function (W, H, fps, bitrate) {
    if (!window.mp4Support()) return null;
    bitrate = bitrate || 12000000;
    const cands = ["avc1.640028", "avc1.4D0028", "avc1.42E028", "avc1.640033", "avc1.4D0033", "avc1.42E033"];
    let codec = null;
    for (const c of cands) {
      try {
        const r = await VideoEncoder.isConfigSupported({ codec: c, width: W, height: H, bitrate: bitrate, framerate: fps });
        if (r && r.supported) { codec = c; break; }
      } catch (e) { /* sigue */ }
    }
    if (!codec) return null;

    let muxer, encoder, failed = false;
    try {
      muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: "avc", width: W, height: H },
        fastStart: "in-memory",
      });
      encoder = new VideoEncoder({
        output: (chunk, meta) => { try { muxer.addVideoChunk(chunk, meta); } catch (e) { failed = true; } },
        error: () => { failed = true; },
      });
      encoder.configure({ codec: codec, width: W, height: H, bitrate: bitrate, framerate: fps, latencyMode: "quality" });
    } catch (e) { return null; }

    return {
      async addFrame(canvas, tsUs, keyFrame) {
        if (failed) throw new Error("encoder error");
        const frame = new VideoFrame(canvas, { timestamp: Math.max(0, Math.round(tsUs)) });
        encoder.encode(frame, { keyFrame: !!keyFrame });
        frame.close();
        // Contrapresión: no dejar crecer la cola sin límite.
        while (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4));
      },
      async finish() {
        await encoder.flush();
        muxer.finalize();
        if (failed) throw new Error("encoder error");
        return new Blob([muxer.target.buffer], { type: "video/mp4" });
      },
    };
  };
})();
