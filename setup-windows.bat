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

echo Checking for Git installation...
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Git is not installed!
    echo.
    echo Please install Git for Windows first:
    echo https://git-scm.com/download/win
    echo.
    echo After installing Git, run this script again.
    echo.
    pause
    exit /b 1
)
echo Git found!

echo Checking for Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js LTS first:
    echo https://nodejs.org
    echo.
    echo After installing Node.js, run this script again.
    echo.
    pause
    exit /b 1
)
echo Node.js found!

echo Creating project directory...
if not exist "C:\QB-Analytics" mkdir "C:\QB-Analytics"
cd /d "C:\QB-Analytics"

echo Cloning repository from GitHub...
if exist ".git" (
    echo Repository already exists, pulling latest changes...
    git pull origin main
) else (
    echo Please enter your GitHub repository URL:
    set /p REPO_URL="Repository URL: "
    git clone %REPO_URL% .
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