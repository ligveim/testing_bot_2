@echo off
REM Telegram Tarot Bot Launcher for Windows
REM ========================================

echo.
echo ========================================
echo   TELEGRAM TAROT BOT LAUNCHER
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Display Node.js version
echo [INFO] Node.js detected:
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [WARNING] Dependencies not installed!
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] Configuration file (.env) not found!
    echo.
    echo Please create .env file with your tokens:
    echo   - TELEGRAM_BOT_TOKEN
    echo   - ANTHROPIC_API_KEY
    echo.
    echo You can copy .env.example and rename it to .env
    echo.
    pause
    exit /b 1
)

REM Check if tarot_cards folder exists
if not exist "tarot_cards\" (
    echo [WARNING] Tarot cards folder not found!
    echo [INFO] Generating tarot card images...
    echo.
    python generate_cards.py
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to generate tarot cards!
        echo Please make sure Python and Pillow are installed.
        echo.
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Starting Telegram Tarot Bot...
echo.
echo ========================================
echo   BOT IS RUNNING
echo ========================================
echo.
echo Press Ctrl+C to stop the bot
echo.
echo ========================================
echo.

REM Start the bot
node bot.js

REM If bot exits, pause to show error messages
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Bot exited with error code %ERRORLEVEL%
    echo.
)

pause
