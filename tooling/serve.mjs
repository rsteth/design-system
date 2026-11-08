#!/usr/bin/env node
import {createServer} from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root = await realpath(resolve(process.argv[2] ?? '.'));
const port = Number(process.argv[3] ?? 4310);
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.csv':'text/csv','.woff2':'font/woff2'};
createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.split('/').some(part => part.startsWith('.') || part === 'node_modules')) throw new Error('Private path');
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) throw new Error('Traversal');
    if ((await stat(path)).isDirectory()) path = resolve(path,'index.html');
    const actual = await realpath(path);
    if (!actual.startsWith(root + sep)) throw new Error('Symlink outside root');
    const body = await readFile(actual);
    res.writeHead(200, {'Content-Type':mime[extname(actual)] ?? 'application/octet-stream','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}); res.end(body);
  } catch { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found'); }
}).listen(port,'127.0.0.1',() => console.log(`Local workbench: http://127.0.0.1:${port}/`));
