import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
http.createServer((req,res)=>{
  const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const relative=requested==='/'?'index.html':requested.slice(1);
  const file=path.resolve(root,relative);
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('Not found');return}
  res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(8080,'127.0.0.1',()=>console.log('BLOCK-RYNNER test server: http://127.0.0.1:8080'));
