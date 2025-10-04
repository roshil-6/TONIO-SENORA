@echo off
echo Starting local HTTPS server for PWA testing...
echo.
echo This will start a local server at https://localhost:8080
echo You can then test the PWA features properly.
echo.
echo Press any key to start the server...
pause

python -m http.server 8080


