@echo off
cd /d "%~dp0"
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed.
    exit /b 1
)
go run ./cmd/server
