#!/usr/bin/env python3
"""Servidor local: sirve la web y compone los vídeos con ffmpeg (color correcto).

Endpoint:  GET /render?clip=<exercise|calendar|swipe|gym>&pose=<iso|flat>&color=RRGGBB
Devuelve un MP4 (H.264, bt709, faststart) con el clip transparente sobre el color.
Requiere ffmpeg en el PATH.
"""
import http.server
import socketserver
import os
import re
import subprocess
import tempfile
import urllib.parse

PORT = 8099
ROOT = os.path.dirname(os.path.abspath(__file__))
CLIPS = os.path.join(ROOT, "assets", "clips")
VALID_CLIP = {"exercise", "calendar", "swipe", "gym", "filter", "swipe2"}
VALID_POSE = {"iso", "flat"}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/render":
            return self.render(urllib.parse.parse_qs(parsed.query))
        return super().do_GET()

    def render(self, q):
        clip = (q.get("clip", [""])[0])
        pose = (q.get("pose", ["iso"])[0])
        color = (q.get("color", ["202124"])[0]).lstrip("#")
        if clip not in VALID_CLIP or pose not in VALID_POSE or not re.fullmatch(r"[0-9a-fA-F]{6}", color):
            self.send_error(400, "parametros invalidos")
            return
        src = os.path.join(CLIPS, f"{clip}-{pose}.webm")
        if not os.path.isfile(src):
            self.send_error(404, "clip no encontrado")
            return

        out = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        out.close()
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"color=c=0x{color}:s=1080x1920:r=60",
            "-c:v", "libvpx-vp9", "-i", src,  # decodifica el canal alfa del VP9
            # RANGO COMPLETO (yuvj420p, pc) + matriz bt601: los valores del píxel
            # son el RGB final, sin expansión de rango que lava el fondo en
            # reproductores de escritorio (VLC, etc.). Verificado exacto vs el
            # color CSS del preview.
            "-filter_complex", "[0:v][1:v]overlay=shortest=1,format=yuvj420p",
            "-c:v", "libx264", "-preset", "medium", "-crf", "17",
            "-pix_fmt", "yuvj420p",
            "-color_range", "pc", "-colorspace", "smpte170m",
            "-color_primaries", "smpte170m", "-color_trc", "smpte170m",
            "-movflags", "+faststart",
            out.name,
        ]
        try:
            r = subprocess.run(cmd, capture_output=True, timeout=120)
            if r.returncode != 0 or not os.path.getsize(out.name):
                self.send_error(500, "ffmpeg fallo")
                return
            with open(out.name, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Content-Disposition", f'attachment; filename="rhabit-{clip}-{pose}.mp4"')
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_error(500, str(e))
        finally:
            try:
                os.unlink(out.name)
            except OSError:
                pass

    def log_message(self, *a):
        pass


class Server(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    print(f"Rhabit · Vídeos en http://localhost:{PORT}  (Ctrl+C para parar)")
    with Server(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
