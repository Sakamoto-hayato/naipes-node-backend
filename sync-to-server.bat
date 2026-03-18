@echo off
echo ========================================
echo Syncing source files to server...
echo ========================================
echo.
echo Server: 64.225.63.155
echo Directory: /var/www/naipes-backend/
echo.
echo You will need to enter the password: Akulakk2026@Sakamoto
echo.
pause

cd /d d:\naipes\naipes-backend

echo.
echo Transferring src directory...
scp -o StrictHostKeyChecking=no -r src/ root@64.225.63.155:/var/www/naipes-backend/

echo.
echo ========================================
echo Files transferred successfully!
echo ========================================
echo.
echo Now rebuild on server with:
echo   ssh root@64.225.63.155
echo   cd /var/www/naipes-backend
echo   npm run build
echo   pm2 restart naipes-backend
echo.
pause
