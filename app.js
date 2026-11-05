'use strict';
const D=window.LESLEY_DATA,$=id=>document.getElementById(id),H=new Map(D.heroes.map(h=>[h.name,h]));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={enemy:[],ally:[],counterMode:false};let latest='';
try{const saved=JSON.parse(localStorage.getItem('lesley-lab-v1')||'{}');const a=LesleyLogic.analyze(D,saved.enemy,saved.ally);state.enemy=a.enemy;state.ally=a.ally;state.counterMode=!!saved.counterMode;}catch{}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,2400);}
function save(){try{localStorage.setItem('lesley-lab-v1',JSON.stringify(state));}catch{toast('Penyimpanan draft tidak tersedia di browser ini.');}}
const face=(src,name,small=false)=>`<span class="face ${small?'sm':''}"><img src="./${esc(src)}" alt="${esc(name)}" width="56" height="56"></span>`;
function renderTeam(type){
 const names=state[type],limit=type==='enemy'?5:4,query=$(type+'Search').value.trim().toLocaleLowerCase('id');
 $(type+'Count').textContent=`${names.length}/${limit}`;
 $(type+'Slots').innerHTML=Array.from({length:limit},(_,i)=>names[i]?`<button type="button" class="slot chosen" data-remove="${i}" aria-label="Hapus ${esc(names[i])}">${face(H.get(names[i]).image,names[i])}<span>${esc(names[i])}</span><b class="x" aria-hidden="true">×</b></button>`:`<span class="slot" aria-label="Slot ${i+1} kosong"><span style="font-size:20px;font-weight:300;color:#72778b">+</span></span>`).join('');
 $(type+'Slots').querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{names.splice(+el.dataset.remove,1);change();});
 const full=names.length>=limit;$(type+'Search').hidden=full;
 const available=D.heroes.filter(h=>h.name!=='Lesley'&&!state.enemy.includes(h.name)&&!state.ally.includes(h.name));
 const matches=query?available.filter(h=>h.name.toLocaleLowerCase('id').includes(query)).sort((a,b)=>a.name.localeCompare(b.name)):[];
 $(type+'Matches').innerHTML=full?'':matches.map(h=>`<button type="button" class="suggest" data-name="${esc(h.name)}">${face(h.image,h.name,true)}<span>${esc(h.name)}</span></button>`).join('')||(query?'<div class="empty">Hero tidak ditemukan atau sudah dipilih.</div>':'');
 $(type+'Matches').querySelectorAll('[data-name]').forEach(el=>el.onclick=()=>{if(names.length>=limit||state.enemy.includes(el.dataset.name)||state.ally.includes(el.dataset.name))return;names.push(el.dataset.name);$(type+'Search').value='';change();});
}
function change(){save();renderTeam('enemy');renderTeam('ally');renderBuild();}
const title=k=>({'fatal':'Fatal','weapon-master':'Weapon Master','quantum-charge':'Quantum Charge','weakness-finder':'Weakness Finder','marksman':'Marksman','assassin':'Assassin','flicker':'Flicker','purify':'Purify'})[k];
function renderBuild(){
 const a=LesleyLogic.analyze(D,state.enemy,state.ally,state),s=a.signals;
 const loadout=(kind,id,label,sub)=>`<div class="loadout-card">${face(`assets/${kind}/${id}.png`,title(id))}<div><small>${label}</small><b>${title(id)}</b><span>${sub}</span></div></div>`;
 $('result').innerHTML=`<div class="sectionlabel">Lethal Shot / Critical burst</div><div class="row-title"><b>Build Lesley</b><span class="actions"><button type="button" id="counter" class="linkbtn ${state.counterMode?'counter-on':''}" aria-pressed="${state.counterMode}">⟳ Counter awal${state.counterMode?' ✓':''}</button><button type="button" id="copy" class="linkbtn">Salin ↗</button></span></div>
 <div class="chips">${(a.tags.length?a.tags:['Isi draft untuk menyesuaikan']).map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>
 <div class="itemgrid">${a.order.map((id,i)=>`<div class="item ${['berserker','endless','blade'].includes(id)?'must':''}"><span class="num">0${i+1}</span>${face(D.items[id].image,D.items[id].name)}<b>${esc(D.items[id].name)}</b><small>${esc({magic:'Siklus skill',tough:'Magic / CC',warrior:'Defense fisik',berserker:'Core · critical',endless:'Core · setelah skill',blade:'Core · burst ATK',gun:'Jarak & kiting',sea:'Antiheal / shield',nature:'Aktif anti-fisik',athena:'Anti-magic burst',radiant:'Anti-magic berulang',immortal:'Revive',haas:'Pemulihan HP',hepta:'Ambush'}[id])}</small></div>`).join('')}</div>
 <div class="loadout-row">${loadout('emblems',a.emblem,'Emblem','Fatal · Weapon Master')}${loadout('spells',a.spell,'Battle spell',a.spell==='flicker'?'Jaga jalur keluar':'Lepas CC biasa')}</div>
 <div class="talents">${a.talents.map(t=>`<div class="talent"><img src="./assets/talents/${t}.png" alt=""><span>${title(t)}</span></div>`).join('')}</div>
 <div class="tip">Urutan beli dari kiri ke kanan. ${state.counterMode?'Counter situasional dimajukan.':'Core burst lebih dulu; pertahanan maju jika risiko sangat tinggi.'}</div>
 <details><summary>Kenapa build ini?</summary>${a.order.map((id,i)=>`<div class="why"><b>${i+1}. ${esc(D.items[id].name)}</b><span>${esc(a.reasons[id])}</span></div>`).join('')}<div class="why"><b>Emblem & spell</b><span>${a.emblem==='assassin'?'Peel cukup membuka peluang pickoff; emblem Assassin mendukung pola burst.':'Marksman menjadi pilihan sustain saat ruang tembak lebih terbatas.'} ${a.spell==='purify'?'CC berantai terdeteksi tanpa suppression; Purify tetap harus diaktifkan tepat waktu.':'Flicker membantu reposisi. Hindari menunggu sampai terkena suppression.'} ${title(a.talents[2])} dipilih untuk ${a.talents[2]==='quantum-charge'?'pemulihan dan gerak setelah basic attack.':'membantu menghambat gerak target lewat basic attack.'}</span></div></details>
 <details><summary>Baca matchup & rencana main</summary><div class="tip notes">${a.notes.map(n=>`<p>${esc(n)}</p>`).join('')}<p><b>Pola tembak:</b> pasif siap → basic attack → skill 1 → basic attack → mundur. Simpan skill 2 untuk melepas dive. Gunakan ultimate dari posisi aman; pelurunya bisa dihalangi hero lain.</p>${state.enemy.map(n=>`<p><b>${esc(n)}</b> · ${esc(H.get(n).kit)}</p>`).join('')}${state.ally.length?'<p><b>Dukungan teman</b></p>'+state.ally.map(n=>`<p><b>${esc(n)}</b> · ${esc(H.get(n).kit)}</p>`).join(''):''}</div></details>
 <details><summary>Dasar analisis</summary><p class="tip">Sinyal draft: fisik ${s.physical.toFixed(1)}, magic ${s.magic.toFixed(1)}, dive ${s.dive.toFixed(1)}, sustain ${s.heal.toFixed(1)}, peel ${s.protection.toFixed(1)}. Ini skor heuristik, bukan persentase, damage, atau jaminan menang. Semua hero bertanda sama diperlakukan setara; tidak ada pembobotan tier/meta dari contoh.</p><p class="tip">Tidak membaca item musuh, gold, level, atau patch secara langsung. Antiheal teman tidak diasumsikan sudah dibeli. Dua slot situasional dipilih berdasarkan prioritas, jadi tidak semua ancaman dapat tertutup sekaligus.</p></details>`;
 $('counter').onclick=()=>{state.counterMode=!state.counterMode;save();renderBuild();};
 latest=`Lesley Lab\nMusuh: ${a.enemy.join(', ')||'belum diisi'}\nTeman: ${a.ally.join(', ')||'belum diisi'}\n${a.order.map((k,i)=>`${i+1}. ${D.items[k].name}`).join('\n')}\nEmblem: ${title(a.emblem)} · ${a.talents.map(title).join(' / ')}\nSpell: ${title(a.spell)}\n${state.counterMode?'Counter awal':'Urutan adaptif'}\nCatatan: rekomendasi berbasis draft; cek item musuh saat bermain.`;
 $('copy').onclick=async()=>{try{await navigator.clipboard.writeText(latest);toast('Build disalin.');}catch{const t=document.createElement('textarea');t.value=latest;t.style.fontSize='16px';document.body.append(t);t.select();t.setSelectionRange(0,t.value.length);const ok=document.execCommand('copy');t.remove();toast(ok?'Build disalin.':'Salin otomatis gagal. Coba dari browser Safari.');}};
}
for(const type of ['enemy','ally'])$(type+'Search').addEventListener('input',()=>renderTeam(type));
$('reset').onclick=()=>{state.enemy=[];state.ally=[];state.counterMode=false;$('enemySearch').value='';$('allySearch').value='';change();toast('Draft dikosongkan.');};
renderTeam('enemy');renderTeam('ally');renderBuild();
let registration,checkTimer;
function cacheStatus(p){
 if(p.type==='CACHE_PROGRESS'){$('artProgress').max=p.total;$('artProgress').value=p.done;$('artStatus').textContent=`Menyimpan ${p.done}/${p.total} berkas. Tetap online sampai selesai.`;$('offlineText').textContent=`Menyiapkan offline · ${p.done}/${p.total}`;}
 if(p.type==='CACHE_READY'){$('offlineState').classList.add('ok');$('offlineText').textContent=navigator.onLine?'Siap offline · seluruh gambar tersimpan':'Mode offline · seluruh gambar tersedia';$('artProgress').max=p.total;$('artProgress').value=p.total;$('artStatus').textContent=`${p.total}/${p.total} berkas tersimpan di perangkat ini. Internet boleh dimatikan.`;$('retryCache').hidden=true;$('offlinePanel').hidden=true;clearTimeout(checkTimer);}
 if(p.type==='CACHE_ERROR'){$('offlineState').classList.remove('ok');$('offlinePanel').hidden=false;$('offlineText').textContent='Offline belum siap';$('artStatus').textContent=p.message||'Penyimpanan belum lengkap. Aktifkan internet lalu coba lagi.';$('retryCache').hidden=false;clearTimeout(checkTimer);}
}
function checkCache(){const worker=navigator.serviceWorker.controller||registration?.active;worker?.postMessage({type:'CHECK_CACHE'});}
async function setupOffline(){
 if(!('serviceWorker'in navigator)){cacheStatus({type:'CACHE_ERROR',message:'PWA memerlukan Safari dengan service worker melalui HTTPS/localhost.'});return;}
 navigator.serviceWorker.addEventListener('message',e=>cacheStatus(e.data||{}));
 navigator.serviceWorker.addEventListener('controllerchange',checkCache);
 try{
  registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
  const monitor=worker=>worker?.addEventListener('statechange',()=>{if(worker.state==='redundant')cacheStatus({type:'CACHE_ERROR'});if(worker.state==='activated')checkCache();});
  monitor(registration.installing);registration.addEventListener('updatefound',()=>monitor(registration.installing));
  if(registration.active)checkCache();
  navigator.serviceWorker.ready.then(r=>{registration=r;checkCache();});
  checkTimer=setTimeout(()=>{if(!$('offlineState').classList.contains('ok')){$('retryCache').hidden=false;$('artStatus').textContent+=' Jika unduhan terhenti, tekan Coba simpan lagi.';}},45000);
 }catch(e){cacheStatus({type:'CACHE_ERROR',message:'Cache belum tersimpan. Buka lewat HTTPS dan pastikan penyimpanan perangkat cukup.'});}
}
$('retryCache').onclick=async()=>{$('retryCache').hidden=true;const worker=navigator.serviceWorker.controller||registration?.active;if(worker){worker.postMessage({type:'REPAIR_CACHE'});}else{await setupOffline();try{await registration?.update();}catch{}}};
window.addEventListener('online',checkCache);window.addEventListener('offline',checkCache);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkCache();});
setupOffline();
