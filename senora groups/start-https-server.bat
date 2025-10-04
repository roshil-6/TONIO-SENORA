@echo off
echo 🔒 Starting HTTPS Server for PWA Testing
echo ================================================

echo.
echo 📋 This will start a local HTTPS server for PWA testing
echo 🌐 Your PWA will be available at: https://localhost:8080
echo.

echo 🚀 Starting server...
python -m http.server 8080

pause
