import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plannerAPI } from './planner-api.js';

const PORT = process.env.PORT || 5173;
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.json':'application/json; charset=utf-8', '.css':'text/css; charset=utf-8',
               '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/planner') {
    const respond = (status, body) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') return respond(405, {error:'请使用 POST'});
    if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) return respond(403,{error:'请求来源无效'});
    try {
      let content = '';
      for await (const chunk of req) {
        content += chunk.toString();
        if (Buffer.byteLength(content) > 64000) return respond(413,{error:'对话内容过长'});
      }
      let input;
      try { input = JSON.parse(content); } catch { return respond(400,{error:'请求格式不正确'}); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) return respond(400,{error:'请求格式不正确'});
      return respond(200, await plannerAPI(input));
    } catch (error) {
      return respond(error.status || 502,{error:error.status ? error.message : '连接超时或服务不可用，行程没有变化。'});
    }
  }

  if (url.pathname.startsWith('/api/')) {
    res.writeHead(404, { 'content-type':'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error:'接口不存在' }));
  }

  let p = normalize(url.pathname === '/' ? '/index.html' : url.pathname);
  if (!(p === '/index.html' || /^\/src\/[a-z-]+\.(js|css)$/.test(p))) { res.writeHead(404); return res.end('404'); }
  if (p.includes('..')) { res.writeHead(403); return res.end('no'); }
  try {
    const body = await readFile(join(ROOT, p));
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type':'text/plain; charset=utf-8' });
    res.end('404 ' + p);
  }
}).listen(PORT, '127.0.0.1', () => console.log('http://localhost:' + PORT));
