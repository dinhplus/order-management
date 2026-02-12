@echo off
setlocal enabledelayedexpansion

REM ─── Configuration ───────────────────────────────────────────
for %%A in (%0) do set "ROOT_DIR=%%~dpA"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

REM ─── Colors (Windows 10+) ───────────────────────────────────
set "GREEN=[92m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "RED=[91m"
set "RESET=[0m"

REM ─── Functions ───────────────────────────────────────────────
call :log "Starting project setup..."
echo.

REM ─── Check prerequisites ───────────────────────────────────────
echo.Checking prerequisites...

where node >nul 2>&1
if errorlevel 1 (
    call :err "Node.js is not installed. Please install Node.js 24+ from https://nodejs.org"
)

where npm >nul 2>&1
if errorlevel 1 (
    call :err "npm is not installed."
)

REM Get Node version
for /f "tokens=*" %%A in ('node -v') do set "NODE_VER=%%A"
call :log "Node !NODE_VER! detected"

REM ─── Ensure backend .env ───────────────────────────────────────
if not exist "%BACKEND_DIR%\.env" (
    call :log "Creating backend\.env from .env.example..."
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
)

REM ─── Ensure frontend .env ───────────────────────────────────────
if not exist "%FRONTEND_DIR%\.env" (
    call :log "Creating frontend\.env from .env.example..."
    copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
)

REM ─── Check PostgreSQL ───────────────────────────────────────────
call :log "Installing dependencies..."
cd /d "%ROOT_DIR%"
call npm install --silent >nul 2>&1 || npm install

REM ─── Check if Docker is available for PostgreSQL ───────────────
where docker >nul 2>&1
if errorlevel 1 (
    call :warn "Docker not found. PostgreSQL must be running separately."
    call :info "Install Docker Desktop or start PostgreSQL manually on localhost:5432"
    call :warn "Proceeding with local setup..."
) else (
    call :log "Starting PostgreSQL container..."
    docker ps -a --format "table {{.Names}}" | findstr /R "^pg-order-mgmt$" >nul
    if errorlevel 1 (
        docker run -d --name pg-order-mgmt ^
            -e POSTGRES_USER=postgres ^
            -e POSTGRES_PASSWORD=postgres ^
            -e POSTGRES_DB=order_management ^
            -p 5432:5432 ^
            postgres:15-alpine >nul 2>&1
        if errorlevel 1 (
            call :warn "Failed to start PostgreSQL container"
        ) else (
            call :log "PostgreSQL container started"
            timeout /t 3 /nobreak >nul
        )
    ) else (
        docker start pg-order-mgmt >nul 2>&1
        call :log "PostgreSQL container started"
    )
)

REM ─── Start backend ───────────────────────────────────────────────
call :log "Starting backend (port 4000)..."
cd /d "%BACKEND_DIR%"
start "Backend" cmd /k "set NODE_ENV=development && npm run start:dev"

timeout /t 5 /nobreak >nul

REM ─── Start frontend ────────────────────────────────────────────
call :log "Starting frontend (port 3000)..."
cd /d "%FRONTEND_DIR%"
start "Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

REM ─── Display info ──────────────────────────────────────────────
echo.
echo ══════════════════════════════════════════════════════════
echo   Project is running!
echo ══════════════════════════════════════════════════════════
echo.
echo   Frontend  ^> http://localhost:3000
echo   Backend   ^> http://localhost:4000/api
echo   Swagger   ^> http://localhost:4000/api/docs
echo.
echo   Login credentials:
echo     manager  / password123  (Manager role)
echo     staff    / password123  (Warehouse Staff role)
echo.
echo   Close the Backend and Frontend windows to stop services
echo.

exit /b 0

REM ─── Helper Functions ───────────────────────────────────────────
:log
echo [+] %~1
exit /b 0

:warn
echo [!] %~1
exit /b 0

:err
echo [x] %~1
exit /b 1

:info
echo [i] %~1
exit /b 0
