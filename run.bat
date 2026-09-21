@echo off
title CinePrep Server
echo ======================================================
echo    🎬 CinePrep - Servidor Local de Pre-Produccion
echo ======================================================
echo    🌐 Servidor corriendo en el Puerto: 3000
echo    👉 Interfaz Web: http://localhost:3000
echo    📺 Salida Visual: http://localhost:3000/output.html
echo ======================================================
echo.
echo Iniciando servidor Node.js...
start http://localhost:3000
node server.js
pause
