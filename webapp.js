#!/usr/bin/env node
const spawnSync = require('child_process').spawnSync;

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Perform 'npm install'
if (process.argv.includes('--install')) {
    spawnSync(npm, ['install'], {
        cwd: './packages/webapp',
        stdio: 'inherit'
    });
}

// Decide if starting with https or not
const startCommand = process.argv.includes('--https') ? 'start:https' : 'start';
spawnSync(npm, ['run', startCommand], {
    cwd: './packages/webapp',
    stdio: 'inherit'
});