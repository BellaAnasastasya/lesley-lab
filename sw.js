/* Versioned offline shell + persistent cache of online artwork. */
'use strict';
const SHELL='lesley-lab-shell-v1';
const ART='lesley-lab-art-v1';
const CORE=['./','./index.html','./data.js','./logic.js','./app.js','./manifest.webmanifest'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lesley-lab-shell-')&&k!==SHELL).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>r.ok?r:Promise.reject('not ok')).catch(()=>caches.match('./index.html')));
    return;
  }
  if(req.destination==='image'){
    event.respondWith(caches.open(ART).then(async c=>{
      const cached=await c.match(req);
      if(cached)return cached;
      const response=await fetch(req);
      if(response.ok||response.type==='opaque')c.put(req,response.clone()).catch(()=>{});
      return response;
    }));
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
  }
});
