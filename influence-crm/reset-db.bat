@echo off
echo Borrando base de datos local para reiniciar limpio...
del /f /q "%~dp0backend\influence_local.db" 2>nul
echo Listo. Ahora ejecuta start-local.bat
pause
