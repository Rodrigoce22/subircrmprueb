@echo off
echo.
echo  ==========================================
echo   influence CRM - Iniciando...
echo  ==========================================
echo.

:: Matar procesos anteriores en los puertos
echo  Liberando puertos...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

:: Arrancar Backend
echo  Iniciando Backend (puerto 3001)...
start "Influence - Backend" cmd /k "cd /d %~dp0backend && node src/index.js"

:: Esperar que el backend levante
timeout /t 5 /nobreak >nul

:: Arrancar Frontend
echo  Iniciando Frontend (puerto 5173)...
start "Influence - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo  ==========================================
echo   Backend:   http://localhost:3001/health
echo   Frontend:  http://localhost:5173
echo   Login:     admin@influence.com
echo   Password:  influence2024
echo  ==========================================
echo.

start "" "http://localhost:5173"
exit
