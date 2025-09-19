#!/usr/bin/env node

/**
 * QuickBooks Web Connector Configuration File Generator
 * Generates QWC files for different environments (development, production)
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate QWC file content
 */
function generateQWCContent(config) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<QBWCXML>
   <AppName>${config.appName}</AppName>
   <AppID>${config.appId}</AppId>
   <AppURL>${config.serverUrl}/api/quickbooks-connector</AppURL>
   <AppDescription>${config.description}</AppDescription>
   <AppSupport>${config.supportUrl || config.serverUrl + '/support'}</AppSupport>
   <UserName>${config.username}</UserName>
   <OwnerID>${config.ownerId}</OwnerID>
   <FileID>${config.fileId}</FileID>
   <QBType>QBFS</QBType>
   <Scheduler>
      <RunEveryNMinutes>${config.syncInterval || 60}</RunEveryNMinutes>
   </Scheduler>
   <IsReadOnly>${config.isReadOnly || 'true'}</IsReadOnly>
   <AuthFlags>0x0</AuthFlags>
   <Notify>true</Notify>
   <AppUniqueName>${config.uniqueName}</AppUniqueName>
   <AppDisplayName>${config.displayName}</AppDisplayName>
</QBWCXML>`;
}

/**
 * Configuration templates
 */
const configurations = {
  development: {
    appName: 'QB Tile Analytics (Dev)',
    appId: '{E4C1A2B3-9876-4321-A123-456655440DEV}',
    description: 'QuickBooks Web Connector for South African Tile Business Analytics - Development',
    username: 'qb_tile_dev',
    ownerId: '{12345678-1234-1234-1234-123456789DEV}',
    fileId: '{QBFILE-TILE-DEV-2024}',
    uniqueName: 'QB_TileAnalytics_SA_Dev_v1.0',
    displayName: 'QuickBooks Tile Analytics Dashboard (Development)',
    serverUrl: 'http://localhost:3001',
    syncInterval: 5, // More frequent for development
    isReadOnly: 'true'
  },
  
  sandbox: {
    appName: 'QB Tile Analytics (Sandbox)',
    appId: '{E4C1A2B3-9876-4321-A123-456655440SBX}',
    description: 'QuickBooks Web Connector for South African Tile Business Analytics - Sandbox',
    username: 'qb_tile_sandbox',
    ownerId: '{12345678-1234-1234-1234-123456789SBX}',
    fileId: '{QBFILE-TILE-SANDBOX-2024}',
    uniqueName: 'QB_TileAnalytics_SA_Sandbox_v1.0',
    displayName: 'QuickBooks Tile Analytics Dashboard (Sandbox)',
    serverUrl: 'https://3001-i2g27v96x2mfgmgvt86w5-6532622b.e2b.dev',
    syncInterval: 10, // Moderate frequency for testing
    isReadOnly: 'true'
  },
  
  production: {
    appName: 'QB Tile Analytics',
    appId: '{E4C1A2B3-9876-4321-A123-456789ABCDEF}',
    description: 'QuickBooks Web Connector for South African Tile Business Analytics',
    username: 'qb_tile_user',
    ownerId: '{12345678-1234-1234-1234-123456789ABC}',
    fileId: '{QBFILE-TILE-2024-ANALYTICS}',
    uniqueName: 'QB_TileAnalytics_SA_v1.0',
    displayName: 'QuickBooks Tile Analytics Dashboard',
    serverUrl: 'https://your-domain.com', // To be updated with actual production URL
    supportUrl: 'https://your-domain.com/support',
    syncInterval: 60, // Standard hourly sync
    isReadOnly: 'true'
  }
};

/**
 * Generate QWC files for all environments
 */
function generateAllQWCFiles() {
  const publicDir = join(__dirname, '..', 'public');
  
  console.log('🔧 Generating QuickBooks Web Connector configuration files...');
  
  for (const [env, config] of Object.entries(configurations)) {
    const qwcContent = generateQWCContent(config);
    const filename = env === 'production' 
      ? 'QB_TileAnalytics.qwc' 
      : `QB_TileAnalytics_${env}.qwc`;
    
    const filePath = join(publicDir, filename);
    
    try {
      writeFileSync(filePath, qwcContent, 'utf8');
      console.log(`✅ Generated: ${filename}`);
      console.log(`   Server URL: ${config.serverUrl}`);
      console.log(`   Username: ${config.username}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to generate ${filename}:`, error.message);
    }
  }
}

/**
 * Generate single QWC file for specific environment
 */
function generateQWCFile(environment, customServerUrl = null) {
  if (!configurations[environment]) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.log(`Available environments: ${Object.keys(configurations).join(', ')}`);
    return;
  }
  
  const config = { ...configurations[environment] };
  
  // Override server URL if provided
  if (customServerUrl) {
    config.serverUrl = customServerUrl;
    config.supportUrl = customServerUrl + '/support';
    console.log(`🔄 Using custom server URL: ${customServerUrl}`);
  }
  
  const qwcContent = generateQWCContent(config);
  const filename = environment === 'production' 
    ? 'QB_TileAnalytics.qwc' 
    : `QB_TileAnalytics_${environment}.qwc`;
  
  const publicDir = join(__dirname, '..', 'public');
  const filePath = join(publicDir, filename);
  
  try {
    writeFileSync(filePath, qwcContent, 'utf8');
    console.log(`✅ Generated: ${filename}`);
    console.log(`   Server URL: ${config.serverUrl}`);
    console.log(`   Username: ${config.username}`);
    console.log(`   Sync Interval: ${config.syncInterval} minutes`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Download the QWC file from your application');
    console.log('2. Import it into QuickBooks Web Connector');
    console.log('3. Configure the password in QB Web Connector');
    console.log('4. Test the connection');
  } catch (error) {
    console.error(`❌ Failed to generate ${filename}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    generateAllQWCFiles();
  } else if (args[0] === '--env' && args[1]) {
    const environment = args[1];
    const customUrl = args[3] === '--url' ? args[4] : null;
    generateQWCFile(environment, customUrl);
  } else {
    console.log('Usage:');
    console.log('  node generate-qwc.js                    # Generate all environments');
    console.log('  node generate-qwc.js --env development  # Generate specific environment');
    console.log('  node generate-qwc.js --env production --url https://yourdomain.com  # With custom URL');
    console.log('');
    console.log('Available environments: development, sandbox, production');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateQWCFile, generateAllQWCFiles, configurations };