@echo off
echo QuickBooks Tile Analytics - Production Setup
echo ==========================================

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please right-click and "Run as administrator"
    pause
    exit /b 1
)

echo Installing Node.js dependencies...
npm install

echo Building production application...
npm run build

echo Creating IIS application directory...
if not exist "C:\inetpub\wwwroot\qb-analytics" mkdir "C:\inetpub\wwwroot\qb-analytics"

echo Copying build files to IIS...
xcopy "dist\*" "C:\inetpub\wwwroot\qb-analytics\" /E /I /Y

echo Setting up Windows Firewall rules...
netsh advfirewall firewall add rule name="QB Analytics HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="QB Analytics HTTPS" dir=in action=allow protocol=TCP localport=443

echo Creating backup directory...
if not exist "C:\Backups\QB-Analytics" mkdir "C:\Backups\QB-Analytics"

echo Setup complete!
echo.
echo Next steps:
echo 1. Configure IIS site in IIS Manager
echo 2. Install SSL certificate
echo 3. Import QWC file into QuickBooks Web Connector
echo 4. Test the application at http://localhost
echo.
pause