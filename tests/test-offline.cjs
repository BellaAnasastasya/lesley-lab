const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dist=fs.existsSync(path.join(root,'dist'))?path.join(root,'dist'):root;
function environment(){
 const events={},stores=new Map(),messages=[],origin='https://test.example/lab/';let network=true,fail='';
 const key=x=>typeof x==='string'?x:x.url;
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const entries=stores.get(name);return {async match(req,opts){let u=key(req);if(opts?.ignoreSearch)u=u.split('?')[0];return entries.get(u)?.clone();},async put(req,response){entries.set(key(req),response.clone());},async keys(){return [...entries.keys()].map(u=>({url:u}));},async delete(req){return entries.delete(key(req));}};},async keys(){return [...stores.keys()];},async delete(k){return stores.delete(k);}};
 const fetch=async req=>{const u=new URL(key(req));if(!network||u.pathname.endsWith(fail)&&fail)throw Error('network disabled');const rel=decodeURIComponent(u.pathname.replace('/lab/',''))||'index.html';const p=path.join(dist,rel);try{return new Response(fs.readFileSync(p),{status:200});}catch{return new Response('not found',{status:404});}};
 const self={location:new URL(origin+'sw.js'),clients:{async matchAll(){return [{postMessage:d=>messages.push(d)}];},async claim(){}},async skipWaiting(){},addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(fs.readFileSync(path.join(dist,'sw.js'),'utf8'),{self,caches,fetch,URL,Response,Set,Promise,Error});
 const run=async(type,extra={})=>{let pending;events[type]({waitUntil:p=>pending=p,...extra});await pending;};
 return {events,caches,messages,run,origin,setNetwork:v=>network=v,setFail:v=>fail=v};
}
(async()=>{
 const env=environment();await env.run('install');assert(!env.messages.some(m=>m.type==='CACHE_READY'));await env.run('activate');assert(env.messages.some(m=>m.type==='CACHE_READY'));
 const files=JSON.parse(fs.readFileSync(path.join(dist,'offline-manifest.json'),'utf8'));env.setNetwork(false);
 for(const file of files){let response;env.events.fetch({request:{url:new URL(file,env.origin).href,method:'GET',mode:file==='./'?'navigate':'cors'},respondWith:p=>response=p});const r=await response;assert(r?.ok,'offline missing '+file);assert((await r.arrayBuffer()).byteLength>0);}
 const cacheName=(await env.caches.keys())[0],cache=await env.caches.open(cacheName);
 await cache.delete(env.origin+'assets/heroes/miya.png');env.messages.length=0;
 await env.run('message',{data:{type:'CHECK_CACHE'},source:{postMessage:d=>env.messages.push(d)}});assert.equal(env.messages.at(-1).type,'CACHE_ERROR');
 env.setNetwork(true);await env.run('message',{data:{type:'REPAIR_CACHE'}});assert.equal(env.messages.at(-1).type,'CACHE_READY');env.setNetwork(false);assert(await cache.match(env.origin+'assets/heroes/miya.png'));
 const broken=environment();broken.setFail('lesley.png');await assert.rejects(()=>broken.run('install'));assert(broken.messages.some(m=>m.type==='CACHE_ERROR'));assert(!broken.messages.some(m=>m.type==='CACHE_READY'));
 console.log(`PASS: ${files.length} offline routes/assets, incomplete-cache detection, repair, failed install never announces ready.`);
})().catch(e=>{console.error(e);process.exit(1);});
