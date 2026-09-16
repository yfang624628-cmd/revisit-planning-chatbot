import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plannerAPI } from './planner-api.js';
import { mapTile } from './map-service.js';
import {contentPreview,reloadContent,rollbackContent,getContent} from './content-store.js';

const PORT = process.env.PORT || 5173;
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.json':'application/json; charset=utf-8', '.css':'text/css; charset=utf-8',
               '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  const tileMatch=url.pathname.match(/^\/api\/map-tile\/(\d{1,2})\/(\d+)\/(\d+)\.png$/);
  if(tileMatch){
    if(req.method!=='GET'){res.writeHead(405);return res.end();}
    const tile=await mapTile(...tileMatch.slice(1).map(Number));
    if(!tile){res.writeHead(204,{'cache-control':'no-store'});return res.end();}
    res.writeHead(200,{'content-type':tile.contentType,'cache-control':'public, max-age=86400'});
    return res.end(tile.body);
  }

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
      console.error('[planner]',error);
      return respond(error.status || 502,{error:error.status ? error.message : '连接超时或服务不可用，行程没有变化。'});
    }
  }

  if (url.pathname === '/api/content') {
    const respond = (status, body) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(body)); };
    if (req.method === 'GET') {
      try { return respond(200, await contentPreview({city:url.searchParams.get('city')||'',roleId:url.searchParams.get('roleId')||'',revisit:{interests:url.searchParams.getAll('interest'),avoid:url.searchParams.getAll('avoid')}})); }
      catch (error) { return respond(422,{error:error.message,issues:error.issues}); }
    }
    if (req.method !== 'POST') return respond(405,{error:'请使用 GET 或 POST'});
    let body=''; for await(const chunk of req){body+=chunk; if(Buffer.byteLength(body)>64000)return respond(413,{error:'请求过长'});}
    let input={};try{input=JSON.parse(body||'{}');}catch{return respond(400,{error:'请求格式不正确'});}
    if(input.action==='reload'){const result=await reloadContent();return respond(result.ok?200:422,{...result,version:result.config?.version});}
    if(input.action==='rollback'){const result=rollbackContent();return respond(result.ok?200:409,{...result,version:result.config?.version});}
    if(input.action==='status'){const config=await getContent();return respond(200,{version:config.version,status:config.status});}
    return respond(400,{error:'未知内容操作'});
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
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream', 'cache-control':'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type':'text/plain; charset=utf-8' });
    res.end('404 ' + p);
  }
}).listen(PORT, '127.0.0.1', () => console.log('http://localhost:' + PORT));
