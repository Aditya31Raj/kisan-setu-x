import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const userProfile = process.env.USERPROFILE || process.env.HOME || '';
const pgDir = process.env.PG_DIR || path.join(userProfile, '.kisan-postgres');
const pgBin = path.join(pgDir, 'pgsql', 'bin');
const pgData = path.join(pgDir, 'data');
const pgLog = path.join(pgDir, 'server.log');
const pgCtl = path.join(pgBin, process.platform === 'win32' ? 'pg_ctl.exe' : 'pg_ctl');
const pgIsReady = path.join(pgBin, process.platform === 'win32' ? 'pg_isready.exe' : 'pg_isready');

export function isPortOpen(port = 5432, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      status = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function waitForDb(maxRetries = 15, delayMs = 500) {
  for (let i = 0; i < maxRetries; i++) {
    const open = await isPortOpen(5432, '127.0.0.1', 800);
    if (open) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

export async function startDatabase() {
  const alreadyRunning = await isPortOpen(5432, '127.0.0.1');
  if (alreadyRunning) {
    console.log('PostgreSQL is already running on port 5432.');
    return true;
  }

  if (!fs.existsSync(pgCtl) || !fs.existsSync(pgData)) {
    console.warn(`Local PostgreSQL binary not found at ${pgCtl}. Please start PostgreSQL manually.`);
    return false;
  }

  // Check for stale postmaster.pid
  const pidFile = path.join(pgData, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      const pidContent = fs.readFileSync(pidFile, 'utf8').trim().split('\n')[0];
      const pid = parseInt(pidContent, 10);
      if (pid) {
        let isAlive = false;
        try {
          process.kill(pid, 0);
          isAlive = true;
        } catch {}
        if (!isAlive) {
          console.log(`Cleaning up stale postmaster.pid (PID ${pid})...`);
          fs.unlinkSync(pidFile);
        }
      }
    } catch {}
  }

  console.log('Starting PostgreSQL server...');
  try {
    const res = spawnSync(pgCtl, ['-D', pgData, '-l', pgLog, 'start'], {
      windowsHide: true,
      stdio: 'inherit'
    });

    const ready = await waitForDb(15, 500);
    if (ready) {
      console.log('PostgreSQL is ready and accepting connections on port 5432.');
      return true;
    } else {
      console.error('PostgreSQL did not start within the expected time. Check log at:', pgLog);
      return false;
    }
  } catch (err) {
    console.error('Failed to execute pg_ctl:', err.message);
    return false;
  }
}

export async function stopDatabase() {
  if (!fs.existsSync(pgCtl) || !fs.existsSync(pgData)) {
    console.warn(`Local PostgreSQL binary not found at ${pgCtl}.`);
    return false;
  }

  console.log('Stopping PostgreSQL server...');
  try {
    spawnSync(pgCtl, ['-D', pgData, '-m', 'fast', 'stop'], {
      windowsHide: true,
      stdio: 'inherit'
    });
    console.log('PostgreSQL server stopped.');
    return true;
  } catch (err) {
    console.error('Failed to stop PostgreSQL:', err.message);
    return false;
  }
}

export async function checkStatus() {
  const running = await isPortOpen(5432, '127.0.0.1');
  if (running) {
    console.log('PostgreSQL: RUNNING (port 5432 is open and accepting connections)');
  } else {
    console.log('PostgreSQL: STOPPED (no connection on port 5432)');
  }
  return running;
}

// CLI execution
const command = process.argv[2];
if (command === 'start') {
  startDatabase();
} else if (command === 'stop') {
  stopDatabase();
} else if (command === 'status') {
  checkStatus();
}
