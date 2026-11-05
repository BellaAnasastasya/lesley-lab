'use strict';
const DATA=window.LESLEY_DATA;
const byId=x=>document.getElementById(x);
const HERO=new Map(DATA.heroes.map(h=>[h.name,h]));
const selected={enemy:[],ally:[]};
const state={counterFirst:false};
const imageSuccess=new Map();
const esc=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
// Hero file-naming and EXACT remote source order copied from Gord Lab V11.
const heroSlug=s=>s.toLowerCase().replace(/[.'’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const heroUrls=name=>{
  const special={"Chang'e":"chang27e","Lapu-Lapu":"lapu-lapu","Yi Sun-shin":"yi_sun-shin"};
  const filename=special[name]||heroSlug(name).replaceAll('-','_');
  return [
    `https://raw.githubusercontent.com/Ceplin03/database-mlbb.Mobile-Legends-Bang-Bang/master/images-hero/${filename}.png`,
    `https://mlbbhub.com/images/heroes/${heroSlug(name)}.png`
  ];
};
function face(urls,name,small=false){
  const first=imageSuccess.get(name)||urls[0];
  const all=[first,...urls.filter(u=>u!==first)];
  return `<span class="face ${small?'sm':''}"><img alt="${esc(name)}" src="${esc(all[0])}" data-next="1" data-urls="${esc(encodeURIComponent(JSON.stringify(all)))}" loading="lazy" referrerpolicy="no-referrer" onerror="retryImage(this)"><span class="letters">${esc(name.slice(0,2).toUpperCase())}</span></span>`;
}
window.retryImage=img=>{
  let urls;
  try{urls=JSON.parse(decodeURIComponent(img.dataset.urls));}catch(e){img.remove();return;}
  let next=Number(img.dataset.next)||0;
  if(next<urls.length){img.dataset.next=String(next+1);img.src=urls[next];}
  else{img.onerror=null;img.remove();}
};
function loadDraft(){
  try{
    const old=JSON.parse(localStorage.getItem('lesley-lab-draft-v1')||'{}');
    const used=new Set(['Lesley']);
    for(const side of ['enemy','ally']){
      const max=side==='enemy'?5:4;
      selected[side]=(Array.isArray(old[side])?old[side]:[]).slice(0,max).filter(n=>{
        if(!HERO.has(n)||used.has(n))return false;
        used.add(n);return true;
      });
    }
    state.counterFirst=!!old.counterFirst;
  }catch(e){}
}
function saveDraft(){try{localStorage.setItem('lesley-lab-draft-v1',JSON.stringify({...selected,counterFirst:state.counterFirst}));}catch(e){}}
function rank(h){return h.tier==='S'?0:h.tier==='A'?1:h.proMeta?2:3;}
function renderTeam(side){
  const group=selected[side],max=side==='enemy'?5:4,full=group.length>=max;
  byId(side+'Count').textContent=`${group.length}/${max}`;
  byId(side+'Slots').innerHTML=Array.from({length:max},(_,i)=>{
    const name=group[i];
    return name?`<button type="button" class="slot chosen" data-remove="${i}" aria-label="Hapus ${esc(name)}">${face(heroUrls(name),name)}<span>${esc(name)}</span><b class="x">×</b></button>`:'<span class="slot">+</span>';
  }).join('');
  byId(side+'Slots').querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{
    group.splice(Number(btn.dataset.remove),1);saveDraft();renderTeam('enemy');renderTeam('ally');renderBuild();
  });
  byId(side+'Search').style.display=full?'none':'';
  byId(side+'Matches').style.display=full?'none':'';
  const query=byId(side+'Search').value.trim().toLowerCase();
  const found=full||!query?[]:DATA.heroes.filter(h=>h.name!=='Lesley' &&
    !selected.enemy.includes(h.name)&&!selected.ally.includes(h.name)&&h.name.toLowerCase().includes(query))
    .sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name)).slice(0,12);
  byId(side+'Matches').innerHTML=found.map(h=>`<button class="suggest" type="button" data-name="${esc(h.name)}">${face(heroUrls(h.name),h.name,true)}<span>${esc(h.name)}</span>${['S','A'].includes(h.tier)?`<i class="tier">${h.tier}</i>`:h.proMeta?'<i class="tier">PRO</i>':''}</button>`).join('');
  byId(side+'Matches').querySelectorAll('[data-name]').forEach(btn=>btn.onclick=()=>{
    const name=btn.dataset.name;
    if(group.length>=max||!HERO.has(name)||name==='Lesley'||selected.enemy.includes(name)||selected.ally.includes(name))return;
    group.push(name);byId(side+'Search').value='';saveDraft();renderTeam('enemy');renderTeam('ally');renderBuild();
  });
}
function spellFace(spell){return face(DATA.spells[spell]?.imgs||[],spell,true);}
function renderBuild(){
  const r=LesleyLogic.analyzeDraft(DATA,selected.enemy,selected.ally,state);
  const cards=r.order.map((id,i)=>{
    const it=DATA.items[id];
    return `<div class="item ${id==='berserker'||id==='endless'?'must':''}"><span class="num">${i+1}</span>${face(it.imgs,it.name)}<b>${esc(it.name)}</b><small>${esc(it.desc)}</small></div>`;
  }).join('');
  const emblem=DATA.emblem;
  const itemWhy=r.order.map((id,i)=>`<div class="why"><b>${i+1}. ${esc(DATA.items[id].name)}</b><span>${esc(r.notes[id]||DATA.items[id].why)}</span></div>`).join('');
  byId('result').innerHTML=`<div class="resulthead"><b>Build Lesley</b><div class="actions"><button class="linkbtn" id="counter" type="button">${state.counterFirst?'↶ Normal':'⟳ Counter dulu'}</button><button class="linkbtn" id="copy" type="button">Salin ↗</button></div></div>
    <div class="chips"><span class="pill">${esc(r.style)}</span>${r.tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>
    <div class="itemgrid">${cards}</div>
    <div class="loadout-row"><div class="loadout-card">${face(emblem.imgs,emblem.name,true)}<div><small>Emblem · 3 talent tetap</small><b>${esc(emblem.name)}</b><span>${esc(r.talents.join(' / '))}</span></div></div>
    <div class="loadout-card">${spellFace(r.spell)}<div><small>Spell · situasional</small><b>${esc(r.spell)}</b><span>${esc(r.spell==='Purify'?'Rantai CC':r.spell==='Sprint'?'Slow & zoning':'Escape & reposition')}</span></div></div></div>
    <div class="plan"><b>🎯 ${esc(r.style)}</b><div>${esc(r.tactic)}</div></div>
    <details class="notes"><summary>Alasan item & opsi late game</summary>${itemWhy}<div class="why"><b>Jika kondisi berubah</b><span>${esc(r.lateSwap)}</span></div></details>
    <div class="tip" style="margin-top:7px">${state.counterFirst?'Counter ancaman dipercepat, core critical tetap dijaga.':'Core sniper diprioritaskan; counter masuk sesuai ancaman draft.'}</div>`;
  byId('counter').onclick=()=>{state.counterFirst=!state.counterFirst;saveDraft();renderBuild();};
  byId('copy').onclick=async()=>{
    const text=`Lesley Lab — build situasional\nMusuh: ${selected.enemy.join(', ')||'-'}\nTeman: ${selected.ally.join(', ')||'-'}\n${r.order.map((id,i)=>`${i+1}. ${DATA.items[id].name}`).join('\n')}\nEmblem: ${r.emblem} · ${r.talents.join(' / ')}\nSpell: ${r.spell}\nGaya main: ${r.style}\n${r.tactic}`;
    try{await navigator.clipboard.writeText(text);}catch(e){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}
    byId('copy').textContent='Disalin ✓';
  };
  return r;
}
// User explicitly opts into prefetching; no bundled game-art files.
const ART_CACHE='lesley-lab-art-v1';
function tasks(){return [
  ...DATA.heroes.map(h=>({name:h.name,urls:heroUrls(h.name)})),
  ...Object.values(DATA.items).map(i=>({name:i.name,urls:i.imgs})),
  {name:DATA.emblem.name,urls:DATA.emblem.imgs},
  ...Object.values(DATA.spells).map(s=>({name:s.name,urls:s.imgs}))
];}
let artBusy=false;
function loadOne(url,limit=3700){return new Promise(resolve=>{
  const img=new Image();let done=false;
  const timer=setTimeout(()=>finish(false),limit);
  function finish(result){if(done)return;done=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve(result);}
  img.referrerPolicy='no-referrer';img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=url;
});}
async function countCached(){
  if(!('caches' in window))return 0;
  const cache=await caches.open(ART_CACHE);let count=0;
  for(const task of tasks()) if((await Promise.all(task.urls.map(u=>cache.match(u)))).some(Boolean))count++;
  return count;
}
async function updateCacheStatus(){
  const all=tasks().length;byId('artProgress').max=all;
  if(!('caches' in window)){byId('artStatus').textContent='Browser tidak mendukung Cache Storage.';return;}
  try{const n=await countCached();byId('artProgress').value=n;
    byId('artStatus').textContent=`${n}/${all} jenis gambar tersimpan. Offline memakai gambar yang berhasil disimpan.`;
  }catch(e){byId('artStatus').textContent='Cache tidak tersedia di mode ini.';}
}
async function downloadImages(){
  if(artBusy)return;
  if(!('caches' in window)){byId('artStatus').textContent='Cache Storage tidak didukung.';return;}
  artBusy=true;const btn=byId('download');btn.disabled=true;btn.textContent='Mengunduh gambar…';
  const list=tasks(),all=list.length,cache=await caches.open(ART_CACHE);
  let next=0,completed=0,good=0;
  async function worker(){while(next<all){
    const task=list[next++];let found=false;
    for(const url of task.urls){
      try{
        if(await cache.match(url)){imageSuccess.set(task.name,url);found=true;break;}
        if(!(await loadOne(url)))continue;
        const r=await fetch(url,{mode:'no-cors',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
        if(r.ok||r.type==='opaque'){await cache.put(url,r.clone());imageSuccess.set(task.name,url);found=true;break;}
      }catch(e){} // CORS/source failures are normal: try Gord's second URL.
    }
    completed++;if(found)good++;
    byId('artProgress').value=completed;
    byId('artStatus').textContent=`Diproses ${completed}/${all} · berhasil ${good} · gagal ${completed-good}`;
  }}
  try{await Promise.all(Array.from({length:6},worker));
    const total=await countCached();
    byId('artProgress').value=total;
    byId('artStatus').textContent=`Selesai. ${total}/${all} gambar di-cache. ${all-total} belum tersedia dari sumber online; teks/fallback tetap muncul.`;
  }catch(e){byId('artStatus').textContent='Gagal menyimpan semuanya; coba lagi saat online.';}
  finally{artBusy=false;btn.disabled=false;btn.textContent='Coba simpan gambar yang belum ada';}
}
(function init(){
  if(!DATA||DATA.heroCount!==133||DATA.heroes.length!==133||!HERO.has('Lesley')){
    byId('result').innerHTML='<div class="empty">Data hero tidak lengkap.</div>';return;
  }
  loadDraft();byId('logo').innerHTML=face(heroUrls('Lesley'),'Lesley');
  for(const s of ['enemy','ally']){byId(s+'Search').addEventListener('input',()=>renderTeam(s));renderTeam(s);}
  renderBuild();byId('download').onclick=downloadImages;updateCacheStatus();
  if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready)
      .then(()=>preparePwaIcons()).catch(()=>{});
  }
})();
// PWA icons are generated from the same online Lesley portrait, not bundled image assets.
// SW serves these virtual same-origin PNG URLs from CacheStorage after first online launch.
async function preparePwaIcons(){
  if(!('caches' in window))return;
  const cache=await caches.open('lesley-lab-shell-v1');
  if(await cache.match('./pwa-192.png') && await cache.match('./pwa-512.png'))return;
  const image=await new Promise(resolve=>{
    const img=new Image();let done=false;
    const timer=setTimeout(()=>finish(null),4800);
    function finish(value){if(done)return;done=true;clearTimeout(timer);resolve(value);}
    img.crossOrigin='anonymous';img.referrerPolicy='no-referrer';
    img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=heroUrls('Lesley')[0];
  });
  for(const size of [192,512]){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const ctx=canvas.getContext('2d');if(!ctx)continue;
    ctx.fillStyle='#10203b';ctx.fillRect(0,0,size,size);
    if(image){
      ctx.save();ctx.beginPath();ctx.arc(size/2,size/2,size*.44,0,Math.PI*2);ctx.clip();
      ctx.drawImage(image,0,0,size,size);ctx.restore();
    }else{
      ctx.fillStyle='#9cc4ff';ctx.font=`900 ${Math.round(size*.56)}px sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('L',size/2,size*.53);
    }
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(blob)await cache.put(`./pwa-${size}.png`,new Response(blob,{headers:{'Content-Type':'image/png'}}));
  }
}
