import { spawn } from 'child_process';

const shellPath = 'C:\\Windows\\System32\\cmd.exe';
console.log('\x1b[36m%s\x1b[0m', '=== Starting SORMS System (Frontend & Backend) ===');

const backend = spawn('dotnet', ['run', '--project', '../SORMS.API/SORMS.API.csproj'], {
  stdio: 'inherit', shell: shellPath 
});
backend.on('error', (err) => console.error('\x1b[31m%s\x1b[0m', 'Backend Error: ' + err.message));

const frontend = spawn('npx', ['vite'], {
  stdio: 'inherit', shell: shellPath 
});
frontend.on('error', (err) => console.error('\x1b[31m%s\x1b[0m', 'Frontend Error: ' + err.message));

frontend.on('exit', () => backend.kill());
backend.on('exit', () => frontend.kill());

process.on('SIGINT', () => {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit();
});
