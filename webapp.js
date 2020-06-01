const spawnSync = require('child_process').spawnSync;
const fs = require('fs');
const path = require('path');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const webappPath = path.join('packages', 'webapp');

console.log('WHAT');

// Force perform 'npm install'
if (!fs.existsSync(path.join(webappPath, 'node_modules')) || process.argv.includes('--install')) {
    console.log('RUNNING npm install...');
    spawnSync(npm, ['install'], {
        cwd: webappPath,
        stdio: 'inherit'
    });
}

// Decide if starting with https or not
if (process.argv.includes('--https')) {
    const startCommand = process.platform === 'win32' ? '($env:HTTPS = "true") -and (npm start)' : 'npm run start:https';

    spawnSync(startCommand, {
        cwd: webappPath,
        stdio: 'inherit',
        shell:true
    });
} else {
    spawnSync(npm, ['start'], {
        cwd: webappPath,
        stdio: 'inherit'
    });
}