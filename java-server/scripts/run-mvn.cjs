const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const javaHome = process.env.JAVA_HOME || 'D:\\Jdk';
const mavenHome = process.env.MAVEN_HOME || 'D:\\maven';
const mvnName = process.platform === 'win32' ? 'mvn.cmd' : 'mvn';
const mvnCmd = path.join(mavenHome, 'bin', mvnName);

const args = ['-s', '.mvn/settings.xml', ...process.argv.slice(2)];
const env = { ...process.env, JAVA_HOME: javaHome, MAVEN_HOME: mavenHome };

const child = spawn(mvnCmd, args, {
  cwd: root,
  stdio: 'inherit',
  env,
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code == null ? 1 : code);
});
