const { spawn } = require('child_process');
const path = require('path');
const { freePort, DEFAULT_PORT } = require('./free-port.cjs');

const root = path.resolve(__dirname, '..');
const port = process.env.APP_PORT || DEFAULT_PORT;

function startMvn() {
  const devScript = path.join(__dirname, 'run-mvn.cjs');
  const child = spawn(process.execPath, [devScript, 'spring-boot:run'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code == null ? 1 : code);
  });
}

const killed = freePort(port);
// Windows 上 taskkill 后偶发需短暂等待端口真正释放
const delayMs = killed > 0 && process.platform === 'win32' ? 1000 : 0;
setTimeout(startMvn, delayMs);
