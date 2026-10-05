const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000,FILE=process.env.ROOMS_FILE||path.join(__dirname,'rooms.json'),TTL=(+process.env.ROOM_TTL_HOURS||72)*36e5,VERSION=5;
const FILES={'/':['index.html','text/html; charset=utf-8','no-cache'],'/data.json':['data.json','application/json','no-cache']};
const rooms=new Map(),TOPICS=new Set(['st','msg','nk','close']);
let dirty=false;
try{const d=JSON.parse(fs.readFileSync(FILE,'utf8'));for(const[k,v]of Object.entries(d))rooms.set(k,{members:new Map(v.members.map(p=>[p,null])),state:v.state,msgs:v.msgs,hist:v.hist,nk:v.nk,seen:v.seen})}catch(e){}
const save=()=>{if(!dirty)return;dirty=false;const o={};rooms.forEach((r,k)=>o[k]={members:[...r.members.keys()],state:r.state,msgs:r.msgs,hist:r.hist,nk:r.nk,seen:r.seen});fs.writeFile(FILE,JSON.stringify(o),()=>{})};
setInterval(save,5000);
const server=http.createServer((req,res)=>{
 const u=req.url.split('?')[0];
 if(u==='/version'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('v'+VERSION+' rooms:'+rooms.size)}
 const f=FILES[u];if(!f){res.writeHead(404);return res.end()}
 fs.readFile(path.join(__dirname,'public',f[0]),(e,d)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'Content-Type':f[1],'Cache-Control':f[2]});res.end(d)});
});
const ids=r=>[...r.members.keys()],onl=r=>[...r.members].filter(([,w])=>w).map(([p])=>p);
const send=(w,o)=>{if(w&&w.readyState===1)w.send(JSON.stringify(o))};
const bc=(r,o)=>r.members.forEach(w=>send(w,o));
const peers=r=>bc(r,{type:'peers',ids:ids(r),online:onl(r)});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:8192});
wss.on('connection',(ws,req)=>{
 const u=new URL(req.url,'http://x'),name=u.searchParams.get('room')||'',pid=u.searchParams.get('pid')||'',create=u.searchParams.get('create')==='1';
 if(!/^[a-z0-9-]{3,48}$/.test(name)||!/^[a-z0-9]{8,40}$/.test(pid))return ws.close(4000,'bad');
 let r=rooms.get(name);
 if(!r){if(!create)return ws.close(4004,'notfound');r={members:new Map(),state:null,msgs:[],hist:[],nk:{},seen:Date.now()};rooms.set(name,r)}
 else if(!r.members.has(pid)){if(create)return ws.close(4003,'exists');if(r.members.size>=2)return ws.close(4001,'full')}
 const old=r.members.get(pid);if(old&&old!==ws)old.close(4002,'replaced');
 r.members.set(pid,ws);r.seen=Date.now();dirty=true;ws.alive=true;
 ws.on('pong',()=>ws.alive=true);
 send(ws,{type:'hello',id:pid,ids:ids(r),online:onl(r),snap:{state:r.state,msgs:r.msgs,hist:r.hist,nk:r.nk}});
 peers(r);
 let n=0;const tk=setInterval(()=>n=0,1000);
 ws.on('message',raw=>{
  if(++n>20)return;let m;try{m=JSON.parse(raw)}catch{return}
  if(!TOPICS.has(m.t))return;const d=m.d||{};if(JSON.stringify(d).length>4096)return;
  r.seen=Date.now();dirty=true;
  if(m.t==='close'){bc(r,{type:'closed'});r.members.forEach(w=>w&&w.close(4005,'closed'));rooms.delete(name);return}
  let out=d;
  if(m.t==='st'){if(d.last&&d.round>((r.state&&r.state.round)||0)){r.hist=[...r.hist,d.last].slice(-200);r.msgs=[]}r.state=d}
  if(m.t==='msg'){out={text:String(d.text||'').slice(0,500)};r.msgs=[...r.msgs,{from:pid,text:out.text}].slice(-200)}
  if(m.t==='nk'){out={name:String(d.name||'').slice(0,30)};r.nk[pid]=out.name}
  bc(r,{type:'ev',t:m.t,d:out,from:pid});
 });
 ws.on('close',()=>{clearInterval(tk);if(r.members.get(pid)===ws){r.members.set(pid,null);r.seen=Date.now();dirty=true;if(rooms.get(name)===r)peers(r)}});
});
setInterval(()=>wss.clients.forEach(w=>{if(!w.alive)return w.terminate();w.alive=false;w.ping()}),30000);
setInterval(()=>{const n=Date.now();rooms.forEach((r,k)=>{if(!onl(r).length&&n-r.seen>TTL){rooms.delete(k);dirty=true}})},36e5);
server.listen(PORT,()=>console.log('Couples Games v'+VERSION+' on port '+PORT));
