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
if not exist "C:\tiles" mkdir "C:\tiles"
cd /d "C:\tiles"

echo Cloning repository from GitHub...
if exist ".git" (
    echo Repository already exists, pulling latest changes...
    git pull origin main
    if %errorLevel% neq 0 (
        echo ERROR: Failed to pull from repository!
        pause
        exit /b 1
    )
) else (
    echo Please enter your GitHub repository URL:
    set /p REPO_URL="Repository URL: "
    git clone %REPO_URL% .
    if %errorLevel% neq 0 (
        echo ERROR: Failed to clone repository!
        pause
        exit /b 1
    )
)

echo.
echo Installing Node.js dependencies... This may take a few minutes.
echo Please wait...
npm install --verbose
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    echo.
    echo Try running: npm cache clean --force
    echo Then run this script again.
    pause
    exit /b 1
)

echo.
echo Building production application...
npm run build
if %errorLevel% neq 0 (
    echo ERROR: Failed to build application!
    pause
    exit /b 1
)

echo Creating IIS application directory...
if not exist "C:\inetpub\wwwroot\tiles" mkdir "C:\inetpub\wwwroot\tiles"

echo Copying build files to IIS...
xcopy "dist\*" "C:\inetpub\wwwroot\tiles\" /E /I /Y
if %errorLevel% neq 0 (
    echo ERROR: Failed to copy files to IIS!
    pause
    exit /b 1
)

echo Setting up Windows Firewall rules...
netsh advfirewall firewall add rule name="Tiles Analytics HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Tiles Analytics HTTPS" dir=in action=allow protocol=TCP localport=443

echo Creating backup directory...
if not exist "C:\Backups\Tiles" mkdir "C:\Backups\Tiles"

echo Setup complete!
echo.
echo Next steps:
echo 1. Configure IIS site in IIS Manager
echo 2. Install SSL certificate
echo 3. Import QWC file into QuickBooks Web Connector
echo 4. Test the application at http://localhost
echo.
pause