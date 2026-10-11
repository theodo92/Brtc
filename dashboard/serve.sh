#!/usr/bin/env sh
# Lance le tableau de bord BRTC sur http://localhost:8080
cd "$(dirname "$0")" && python3 -m http.server "${1:-8080}"
