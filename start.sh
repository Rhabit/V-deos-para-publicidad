#!/bin/bash
# Arranca el servidor local y abre la web. Ciérralo con Ctrl+C.
cd "$(dirname "$0")"
echo "Sirviendo Rhabit · Vídeos en http://localhost:8099"
echo "(deja esta ventana abierta mientras lo usas · Ctrl+C para parar)"
python3 "$(dirname "$0")/server.py" >/dev/null 2>&1 &
SRV=$!
sleep 1
xdg-open "http://localhost:8099" >/dev/null 2>&1 || echo "Abre manualmente: http://localhost:8099"
trap "kill $SRV 2>/dev/null" EXIT
wait $SRV
