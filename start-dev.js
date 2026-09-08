import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
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

async function main() {
  console.log('\n🌾 ===================================================');
  console.log('         Kisan Setu - Unified Runner');
  console.log('===================================================\n');

  // 1. PostgreSQL
  const dbRunning = await isPortInUse(5432);
  if (dbRunning) {
    console.log('✓ PostgreSQL is running on port 5432.');
  } else {
    console.log('Starting PostgreSQL...');
    const { startDatabase } = await import('./kisan-setu-backend/scripts/db-control.js');
    await startDatabase();
  }

  // 2. Backend
  const backendRunning = await isPortInUse(5000);
  if (backendRunning) {
    console.log('✓ Backend API is already running on http://localhost:5000');
  } else {
    console.log('Starting Backend API on port 5000...');
    const backend = spawn('node', ['src/server.js'], {
      cwd: path.join(__dirname, 'kisan-setu-backend'),
      stdio: 'inherit',
      shell: true
    });
    backend.on('error', (err) => console.error('Backend error:', err));
  }

  // 3. Frontend
  const frontendRunning = await isPortInUse(5173);
  if (frontendRunning) {
    console.log('✓ Frontend Web is already running on http://localhost:5173');
  } else {
    console.log('Starting Frontend Web on port 5173...');
    const frontend = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, 'kisan setu'),
      stdio: 'inherit',
      shell: true
    });
    frontend.on('error', (err) => console.error('Frontend error:', err));
  }

  console.log('\n===================================================');
  console.log('🚀 Kisan Setu is live:');
  console.log('   - Frontend:  http://localhost:5173');
  console.log('   - Backend:   http://localhost:5000/health');
  console.log('   - API Docs:  http://localhost:5000/api-docs');
  console.log('\n🔑 Demo Credentials:');
  console.log('   - Farmer: demo.farmer@kisansetu.local  / ChangeMeFarmer123!');
  console.log('   - Buyer:  demo.buyer@kisansetu.local   / ChangeMeBuyer123!');
  console.log('   - Admin:  demo.admin@kisansetu.local   / ChangeMeAdmin123!');
  console.log('===================================================\n');
}

main().catch(console.error);
