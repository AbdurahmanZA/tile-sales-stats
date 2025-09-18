# QuickBooks Tile Analytics - Windows Production Deployment Guide

## System Requirements
- Windows 10 Pro/Enterprise
- QuickBooks 2021 installed
- Administrator access
- Internet connection for Supabase

## Deployment Options

### Option 1: IIS Deployment (Recommended)

#### Step 1: Enable IIS
1. Open "Turn Windows features on or off"
2. Enable "Internet Information Services"
3. Enable "World Wide Web Services" → "Application Development Features" → "ASP.NET 4.8"

#### Step 2: Install Node.js
1. Download Node.js LTS from https://nodejs.org
2. Install with default settings
3. Verify: Open CMD and run `node --version`

#### Step 3: Build the Application
```batch
# Navigate to your project folder
cd C:\QB-Analytics
npm install
npm run build
```

#### Step 4: Deploy to IIS
1. Copy the `dist` folder contents to `C:\inetpub\wwwroot\qb-analytics`
2. Open IIS Manager
3. Create new site:
   - Site name: "QB Analytics"
   - Physical path: `C:\inetpub\wwwroot\qb-analytics`
   - Port: 80 (or 443 for HTTPS)

### Option 2: Node.js + PM2 (Alternative)

#### Install PM2
```batch
npm install -g pm2
npm install -g pm2-windows-service
```

#### Create ecosystem file
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'qb-analytics',
    script: 'npx',
    args: 'serve -s dist -l 3000',
    cwd: 'C:\\QB-Analytics',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
}
```

#### Install as Windows Service
```batch
pm2-service-install
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## SSL Certificate Setup

### Option 1: Self-Signed Certificate (Development)
```batch
# Generate certificate using PowerShell
New-SelfSignedCertificate -DnsName "localhost", "qb-analytics.local" -CertStoreLocation "cert:\LocalMachine\My"
```

### Option 2: Let's Encrypt (Production)
1. Install Certbot for Windows
2. Configure domain pointing to your server
3. Run: `certbot --nginx` or configure manually in IIS

## QuickBooks Web Connector Configuration

### Update QWC File for Local Deployment
```xml
<?xml version="1.0" encoding="UTF-8"?>
<QBWCXML>
   <AppName>QB Tile Analytics</AppName>
   <AppID>{E4C1A2B3-9876-4321-A123-456789ABCDEF}</AppID>
   <AppURL>https://localhost/functions/v1/quickbooks-connector</AppURL>
   <AppDescription>QuickBooks Web Connector for South African Tile Business Analytics</AppDescription>
   <AppSupport>https://localhost/support</AppSupport>
   <UserName>qb_tile_user</UserName>
   <OwnerID>{12345678-1234-1234-1234-123456789ABC}</OwnerID>
   <FileID>{QBFILE-TILE-2024-ANALYTICS}</FileID>
   <QBType>QBFS</QBType>
   <Scheduler>
      <RunEveryNMinutes>60</RunEveryNMinutes>
   </Scheduler>
   <IsReadOnly>true</IsReadOnly>
</QBWCXML>
```

## Windows Firewall Configuration
```batch
# Allow HTTP traffic
netsh advfirewall firewall add rule name="QB Analytics HTTP" dir=in action=allow protocol=TCP localport=80

# Allow HTTPS traffic
netsh advfirewall firewall add rule name="QB Analytics HTTPS" dir=in action=allow protocol=TCP localport=443
```

## Auto-Startup Configuration

### Create Startup Batch File
```batch
@echo off
cd /d "C:\QB-Analytics"
npm run preview
pause
```

### Add to Windows Startup
1. Press `Win + R`, type `shell:startup`
2. Copy the batch file to the startup folder
3. Or use Task Scheduler for more control

## Environment Variables
```batch
# Create .env.production
VITE_SUPABASE_URL=https://ydeyxmrradqlqedqhkmx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=https://localhost
```

## Monitoring & Maintenance

### Windows Event Viewer Setup
1. Create custom log for QB Analytics
2. Monitor application errors
3. Set up email alerts for critical issues

### Backup Strategy
```batch
# Create backup script (backup.bat)
@echo off
set BACKUP_DIR=C:\Backups\QB-Analytics
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%

xcopy "C:\inetpub\wwwroot\qb-analytics" "%BACKUP_DIR%\%DATE%" /E /I /Y
```

### Performance Optimization
1. Enable gzip compression in IIS
2. Set up caching headers
3. Monitor memory usage
4. Regular Windows updates

## Security Checklist
- [ ] Windows Defender enabled
- [ ] Regular security updates
- [ ] Strong passwords for all accounts
- [ ] Network isolation if possible
- [ ] Regular backups
- [ ] SSL certificate properly configured
- [ ] Firewall rules configured
- [ ] User access controls

## Troubleshooting Common Issues

### QuickBooks Connection Issues
1. Verify QB Web Connector is running
2. Check Windows services
3. Validate QWC file configuration
4. Test network connectivity

### Application Not Loading
1. Check IIS application pool status
2. Verify Node.js installation
3. Check Windows Event Viewer
4. Validate file permissions

### Performance Issues
1. Monitor CPU/Memory usage
2. Check network latency to Supabase
3. Optimize database queries
4. Enable application caching

## Support and Maintenance
- Schedule weekly restarts
- Monitor disk space
- Update dependencies monthly
- Test backups regularly
- Document any custom configurations