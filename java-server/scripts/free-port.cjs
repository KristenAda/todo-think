const { execSync } = require('child_process');

const DEFAULT_PORT = '3000';

/**
 * 释放指定 TCP 监听端口（开发重启时避免 PortInUseException）
 * @param {string|number} port
 * @returns {number} 已结束的进程数
 */
function freePort(port = process.env.APP_PORT || DEFAULT_PORT) {
  const portStr = String(port);
  if (!/^\d+$/.test(portStr)) {
    throw new Error(`无效端口: ${portStr}`);
  }

  if (process.platform === 'win32') {
    return freePortWindows(portStr);
  }
  return freePortUnix(portStr);
}

function freePortWindows(port) {
  let output = '';
  try {
    output = execSync('netstat -ano -p tcp', { encoding: 'utf8', shell: true });
  } catch {
    return 0;
  }

  const listenRegex = new RegExp(`:${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)`, 'i');
  const pids = new Set();

  for (const line of output.split('\n')) {
    const match = line.match(listenRegex);
    if (match) {
      pids.add(match[1]);
    }
  }

  let killed = 0;
  for (const pid of pids) {
    if (pid === String(process.pid)) {
      continue;
    }
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', shell: true });
      console.log(`[dev] 已释放端口 ${port}（结束进程 PID ${pid}）`);
      killed += 1;
    } catch {
      // 进程可能已退出，忽略
    }
  }

  return killed;
}

function freePortUnix(port) {
  let pids = [];
  try {
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' });
    pids = output
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return 0;
  }

  let killed = 0;
  for (const pid of pids) {
    if (pid === String(process.pid)) {
      continue;
    }
    try {
      process.kill(Number(pid), 'SIGTERM');
      console.log(`[dev] 已释放端口 ${port}（结束进程 PID ${pid}）`);
      killed += 1;
    } catch {
      // 忽略
    }
  }

  return killed;
}

if (require.main === module) {
  const port = process.argv[2] || process.env.APP_PORT || DEFAULT_PORT;
  freePort(port);
}

module.exports = { freePort, DEFAULT_PORT };
