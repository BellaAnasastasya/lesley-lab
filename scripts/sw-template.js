'use strict';
const CACHE='lesley-lab-__VERSION__',ROOT=new URL('./',self.location).href;
const url=p=>new URL(p,ROOT).href;
async function notify(data){for(const c of await self.clients.matchAll({type:'window',includeUncontrolled:true}))c.postMessage(data);}
async function list(cache){const response=await cache.match(url('offline-manifest.json'));if(!response)throw Error('Daftar offline belum tersimpan.');return [...new Set([...(await response.json()),'./offline-manifest.json'])];}
async function cacheAll(){
 const cache=await caches.open(CACHE);
 try{
  const response=await fetch(url('offline-manifest.json'),{cache:'reload'});if(!response.ok)throw Error('Daftar aset tidak bisa diunduh.');
  const files=[...new Set([...(await response.clone().json()),'./offline-manifest.json'])];
  await cache.put(url('offline-manifest.json'),response);
  let done=0;
  for(let i=0;i<files.length;i+=6){await Promise.all(files.slice(i,i+6).map(async path=>{
   const key=url(path);let cached=await cache.match(key);
   if(!cached){
    let response;
    for(let attempt=0;attempt<3;attempt++){try{response=await fetch(key,{cache:'reload'});if(response.ok)break;}catch{}}
    if(!response?.ok)throw Error('Gagal menyimpan '+path);
    await cache.put(key,response);
   }
   done++;await notify({type:'CACHE_PROGRESS',done,total:files.length});
  }));}
  const keys=new Set((await cache.keys()).map(r=>r.url));if(files.some(f=>!keys.has(url(f))))throw Error('Aset belum lengkap.');
  return files.length;
 }catch(error){await notify({type:'CACHE_ERROR',message:error.message+'. Tetap online dan coba lagi.'});throw error;}
}
self.addEventListener('install',event=>event.waitUntil(cacheAll().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await self.clients.claim();
 for(const key of await caches.keys())if(key.startsWith('lesley-lab-')&&key!==CACHE)await caches.delete(key);
 const cache=await caches.open(CACHE),files=await list(cache);await notify({type:'CACHE_READY',total:files.length});
})()));
self.addEventListener('message',event=>{if(event.data?.type==='REPAIR_CACHE'){event.waitUntil(cacheAll().then(total=>notify({type:'CACHE_READY',total})).catch(()=>{}));return;}if(event.data?.type!=='CHECK_CACHE')return;event.waitUntil((async()=>{
 try{const cache=await caches.open(CACHE),files=await list(cache),keys=new Set((await cache.keys()).map(r=>r.url));
 const complete=files.every(f=>keys.has(url(f)));event.source?.postMessage(complete?{type:'CACHE_READY',total:files.length}:{type:'CACHE_ERROR',message:'Cache tidak lengkap. Aktifkan internet dan muat ulang untuk menyimpan kembali.'});
 }catch{event.source?.postMessage({type:'CACHE_ERROR',message:'Cache belum lengkap. Aktifkan internet dan coba simpan lagi.'});}
})());});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;
 if(event.request.mode==='navigate')return await cache.match(url('index.html'))||fetch(event.request);
 return fetch(event.request);
 })());
});
