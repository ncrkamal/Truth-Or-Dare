const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000;
const FILES={'/':['index.html','text/html; charset=utf-8'],'/data.json':['data.json','application/json']};
const server=http.createServer((req,res)=>{
 const f=FILES[req.url.split('?')[0]];if(!f){res.writeHead(404);return res.end()}
 fs.readFile(path.join(__dirname,'public',f[0]),(e,d)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'Content-Type':f[1],'Cache-Control':'public, max-age=3600'});res.end(d)});
});
const rooms=new Map(),TOPICS=new Set(['st','msg','nk']);
const wss=new WebSocketServer({server,path:'/ws',maxPayload:8192});
const bc=(set,o)=>{const s=JSON.stringify(o);set.forEach(c=>c.ws.readyState===1&&c.ws.send(s))};
wss.on('connection',(ws,req)=>{
 const name=new URL(req.url,'http://x').searchParams.get('room')||'';
 if(!/^[a-z0-9-]{3,48}$/.test(name))return ws.close(4000,'bad room');
 let set=rooms.get(name);if(!set){set=new Set();rooms.set(name,set)}
 if(set.size>=2)return ws.close(4001,'full');
 const me={ws,id:Math.random().toString(36).slice(2,10)};set.add(me);ws.alive=true;
 ws.on('pong',()=>ws.alive=true);
 ws.send(JSON.stringify({type:'hello',id:me.id}));
 bc(set,{type:'peers',ids:[...set].map(c=>c.id),joined:[me.id]});
 let n=0;const tk=setInterval(()=>n=0,1000);
 ws.on('message',raw=>{
  if(++n>20)return;let m;try{m=JSON.parse(raw)}catch{return}
  if(!TOPICS.has(m.t)||JSON.stringify(m.d||{}).length>4096)return;
  bc(set,{type:'ev',t:m.t,d:m.d,from:me.id});
 });
 ws.on('close',()=>{clearInterval(tk);set.delete(me);if(!set.size)rooms.delete(name);else bc(set,{type:'peers',ids:[...set].map(c=>c.id),joined:[]})});
});
setInterval(()=>wss.clients.forEach(w=>{if(!w.alive)return w.terminate();w.alive=false;w.ping()}),30000);
server.listen(PORT,()=>console.log('Truth or Dare on port '+PORT));
