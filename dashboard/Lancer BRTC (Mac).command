#!/bin/sh
# Lance le tableau de bord BRTC sur http://localhost:8080 (fermer cette fenêtre pour arrêter)
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  (sleep 1; open "http://localhost:8080") &
  exec python3 -m http.server 8080
else
  open index.html
fi
