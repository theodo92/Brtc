@echo off
REM Lance le tableau de bord BRTC sur http://localhost:8080
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "Serveur BRTC - fermer cette fenetre pour arreter" py -m http.server 8080
  timeout /t 2 >nul
  start "" http://localhost:8080
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "Serveur BRTC - fermer cette fenetre pour arreter" python -m http.server 8080
  timeout /t 2 >nul
  start "" http://localhost:8080
  exit /b
)
REM Pas de Python : ouverture directe du fichier (fonctionne aussi)
start "" "%~dp0index.html"
