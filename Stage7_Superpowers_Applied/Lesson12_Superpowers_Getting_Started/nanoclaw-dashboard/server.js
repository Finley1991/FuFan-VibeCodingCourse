import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 7777;
const HOST = process.env.HOST || '127.0.0.1';
const HTML_PATH = path.join(__dirname, 'index.html');

// NanoClaw 后端项目根：本前端通过 spawn `pnpm run chat` 调它的 CLI
// 优先 env var；否则默认在并排目录 ~/projects/nanoclaw-fork/nanoclaw-v2
const NANOCLAW_ROOT = process.env.NANOCLAW_ROOT
  || path.join(process.env.HOME, 'projects', 'nanoclaw-fork', 'nanoclaw-v2');

// 启动时校验 NanoClaw 后端可达，避免运行时神秘失败
if (!fs.existsSync(path.join(NANOCLAW_ROOT, 'package.json'))) {
  console.error(`❌ 找不到 NanoClaw 后端：${NANOCLAW_ROOT}`);
  console.error(`   请设置环境变量：NANOCLAW_ROOT=/path/to/nanoclaw-v2`);
  process.exit(1);
}

function log(method, url, extra = '') {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`[${ts}] ${method.padEnd(4)} ${url}${extra ? '  ' + extra : ''}`);
}

function stripPnpmWrapper(text) {
  return text
    .split('\n')
    .filter(line =>
      !line.match(/^>\s+nanoclaw@/) &&    // pnpm 第 1 行：> nanoclaw@2.x.x ...
      !line.match(/^>\s+tsx\s+/) &&        // pnpm 第 2 行：> tsx scripts/chat.ts ...
      !line.match(/^\s*$/))
    .join('\n')
    .trim();
}

function jsonError(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: msg }));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    log('GET', req.url);
    try {
      const html = fs.readFileSync(HTML_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      log('ERR', req.url, err.message);
      res.writeHead(500);
      res.end('Error reading index.html: ' + err.message);
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let message;
      try {
        message = JSON.parse(body).message;
      } catch {
        return jsonError(res, 400, 'Invalid JSON body');
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        return jsonError(res, 400, 'Missing or empty message');
      }

      const trimmed = message.trim();
      log('POST', '/chat', `"${trimmed.substring(0, 60)}${trimmed.length > 60 ? '…' : ''}"`);

      const proc = spawn('pnpm', ['run', 'chat', trimmed], {
        cwd: NANOCLAW_ROOT,
        shell: false,
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';
      let responded = false;

      proc.stdout.on('data', d => { stdout += d.toString(); });
      proc.stderr.on('data', d => { stderr += d.toString(); });

      proc.on('close', code => {
        if (responded) return;
        responded = true;
        const raw = stdout || stderr || '';
        const reply = stripPnpmWrapper(raw) || '(Andy 没有返回内容)';
        log('DONE', '/chat', `exit=${code} reply_len=${reply.length}`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ reply }));
      });

      proc.on('error', err => {
        if (responded) return;
        responded = true;
        log('ERR', '/chat', err.message);
        jsonError(res, 500, 'Failed to spawn chat process: ' + err.message);
      });

      const timeout = setTimeout(() => {
        if (responded) return;
        responded = true;
        proc.kill();
        log('TIMEOUT', '/chat', 'killed after 120s');
        jsonError(res, 504, 'Chat process timed out after 120 seconds');
      }, 120000);

      proc.on('close', () => clearTimeout(timeout));
    });
    return;
  }

  log(req.method, req.url, '404');
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`\n🐾 NanoClaw Dashboard`);
  console.log(`   http://${HOST}:${PORT}\n`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Kill with: lsof -ti:${PORT} | xargs kill`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
