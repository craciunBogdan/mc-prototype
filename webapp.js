#!/usr/bin/env node
const spawnSync = require('child_process').spawnSync;

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

spawnSync(npm, ['start'], {
    cwd: './packages/webapp',
    stdio: 'inherit'
});