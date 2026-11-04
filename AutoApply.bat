@echo off
title AutoApply - One-Click Launcher
cd /d "%~dp0"

:: Check if virtual environment exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found in %~dp0venv!
    echo Please ensure the venv folder exists.
    pause
    exit /b 1
)

:: Run launcher with automatic browser opening
venv\Scripts\python.exe run.py

if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] AutoApply shut down or exited with code %errorlevel%.
    pause
)
