/* Draft heuristics, not live inventory detection or a damage simulator. */
(function(root){
'use strict';
const hardCC=new Set(['stun','knockup','freeze','suppress','pull','taunt','polymorph','immobilize','fear','displacement']);
function analyze(data,enemy=[],ally=[],options={}){
 const H=new Map(data.heroes.map(h=>[h.name,h])), clean=(xs,max,exclude=[])=>[...new Set(xs)].filter(n=>H.has(n)&&n!=='Lesley'&&!exclude.includes(n)).slice(0,max);
 enemy=clean(enemy,5);ally=clean(ally,4,enemy);
 const enemies=enemy.map(n=>H.get(n)),allies=ally.map(n=>H.get(n)),v=(h,k)=>h.traits[k]||0;
 const sum=(xs,k)=>xs.reduce((s,h)=>s+v(h,k),0);
 const protection=sum(allies,'R')*.8+sum(allies,'F')*.35+sum(allies,'Q')*.3+sum(allies,'C')*.2;
 const heal=sum(enemies,'H')*1.5+sum(enemies,'S')*.8+sum(enemies,'L')*.45+sum(enemies,'Q')*.5;
 const tank=sum(enemies,'T')+sum(enemies,'F')*.4;
 const controls=enemies.filter(h=>(h.cc||[]).some(c=>hardCC.has(c))).length;
 const suppress=enemies.some(h=>h.cc.includes('suppress'));
 const magicHeroes=enemies.filter(h=>v(h,'G')>=2);
 const physicalHeroes=enemies.filter(h=>v(h,'G')<2&&/assassin|fighter|marksman/i.test(h.role));
 const rawPhysical=physicalHeroes.reduce((s,h)=>s+v(h,'B')*.8+v(h,'D')*.9+v(h,'A')*.7,0);
 const rawMagic=magicHeroes.reduce((s,h)=>s+v(h,'G')*.8+v(h,'B')*.9+v(h,'D')*.4+v(h,'Z')*.6+v(h,'A')*.6,0);
 const dive=Math.max(0,sum(enemies,'D')+sum(enemies,'M')*.35-protection*.42);
 const physical=Math.max(rawPhysical*.55,rawPhysical-protection*.6),magic=Math.max(rawMagic*.55,rawMagic-protection*.45);
 const burstMage=magicHeroes.some(h=>v(h,'B')>=3);
 const sustainedMagic=magicHeroes.reduce((s,h)=>s+v(h,'Z')+v(h,'A'),0);
 const poke=sum(enemies,'P');
 const scores={
  gun:30+dive*.6+protection*.6,
  sea:heal>=3?22+heal*5+tank:0,
  nature:physical>=4?18+physical*4+dive:0,
  athena:magic>=4&&burstMage?22+magic*4:0,
  radiant:magic>=4&&!burstMage?18+magic*3+sustainedMagic*2:0,
  immortal:dive>=8?18+dive*2+controls*2:0,
  haas:10+poke*2+(!sum(allies,'H')?12:0),
  hepta:enemies.length&&tank<4&&dive<4?24+sum(allies,'C')*2:0
 };
 const ranked=Object.keys(scores).filter(k=>scores[k]>0).sort((a,b)=>scores[b]-scores[a]||a.localeCompare(b));
 // Boots + 3 burst core + 2 situational slots. No Golden Staff/on-hit conversion.
 const flex=ranked.slice(0,2);
 const boot=controls>=2||magic>physical&&magic>=4?'tough':physical>=7&&magic<4?'warrior':'magic';
 let order=[boot,'berserker','endless','blade',...flex];
 if(options.counterMode){
  const counter=flex.find(k=>['nature','athena','radiant','sea'].includes(k));
  if(counter){order=order.filter(k=>k!==counter);order.splice(counter==='nature'?2:3,0,counter);}
 }
 // A single high threat may need its defensive active before the expensive attack item.
 else if(Math.max(physical,magic)>=12){const defense=flex.find(k=>['nature','athena','radiant'].includes(k));if(defense){order=order.filter(k=>k!==defense);order.splice(3,0,defense);}}
 const spell=!suppress&&controls>=3&&dive>=4?'purify':'flicker';
 const emblem=protection>=5&&dive<5?'assassin':'marksman';
 const talent=dive>=5||poke>=4?'quantum-charge':'weakness-finder';
 const reasons={
  magic:'Cooldown membantu siklus skill dan tembakan pasif. Lesley memakai energy; sepatu ini dipilih untuk cooldown.',
  tough:`${controls} hero dengan hard CC; tekanan magic ${magic.toFixed(1)}. ${suppress?'Suppression tetap harus dihindari.':''}`,
  warrior:'Komposisi lawan dominan tekanan fisik/basic attack.',
  berserker:'Core critical damage. Pasif Lesley berfokus pada tembakan burst, bukan spam on-hit.',
  endless:'Kombinasikan skill → basic attack. Jangan menganggap setiap reset Lethal Shot selalu memicu pasif item yang masih cooldown.',
  blade:'Physical attack tinggi mendukung scaling Lethal Shot. Dipertahankan sebagai core damage.',
  gun:`Menjaga jarak serang ketika poke; perlindungan tim ${protection>=5?'cukup':'terbatas'}.`,
  sea:`Sustain/shield lawan terdeteksi (${heal.toFixed(1)}). Teman tidak diasumsikan sudah membeli antiheal.`,
  nature:`Ancaman fisik ${physical.toFixed(1)}; aktif manual sebelum burst masuk. Tidak menahan true damage Lesley/Karrie atau magic.`,
  athena:'Ada ancaman kombo magic burst. Pilihan ini mengorbankan satu slot ofensif untuk bertahan.',
  radiant:'Tekanan magic berulang lebih menonjol daripada satu kombo burst.',
  immortal:'Risiko dive tinggi. Revive membantu hanya jika posisi bangkit bisa diamankan.',
  haas:'Pemulihan lewat basic attack untuk menghadapi poke; nilainya turun jika tim sudah punya healer.',
  hepta:'Ada setup CC teman dan target relatif tipis. Mainkan pola ambush agar pasif item siap.'
 };
 const notes=[];
 if(!enemy.length)notes.push('Build awal. Isi musuh dan teman agar dua slot situasional serta urutannya menyesuaikan.');
 if(enemy.length<5||ally.length<4)notes.push(`Draft belum lengkap (${enemy.length}/5 musuh, ${ally.length}/4 teman). Rekomendasi masih sementara.`);
 if(tank>=4)notes.push('Frontline tebal: manfaatkan Lethal Shot true damage dan jaga jarak. HP tinggi tetap memerlukan beberapa tembakan; tidak otomatis beralih ke Golden Staff/DHS.');
 if(suppress)notes.push('Ada suppression: Purify tidak menghapusnya. Simpan jarak dan Flicker sebelum tertangkap; Tough Boots juga bukan solusi suppression.');
 notes.push(protection>=5?'Teman memberi frontline/peel: tembak setelah mereka membuka ruang. Keberadaan hero tidak menjamin mereka selalu bisa melindungi.':'Peel/frontline teman terbatas: jaga jalur mundur dan jangan maju hanya untuk mengaktifkan item.');
 if(enemy.includes('Lesley')||enemy.includes('Karrie')||enemy.includes('Alpha'))notes.push('True damage tidak diblokir Wind of Nature atau defense biasa; utamakan jarak dan hindari pemicu serangannya.');
 const missing=ranked.filter(k=>!flex.includes(k)&&scores[k]>=40);
 if(missing.length)notes.push('Slot terbatas. Ancaman tambahan: '+missing.map(k=>data.items[k].name).join(', ')+'. Tukar item sesuai ancaman yang benar-benar dominan di pertandingan.');
 return {order,flex,spell,emblem,talents:['fatal','weapon-master',talent],reasons,notes,missing,enemy,ally,scores,signals:{physical,magic,dive,heal,tank,protection,controls,suppress},tags:[heal>=3?'Antiheal dibutuhkan':null,physical>=4?'Tekanan fisik':null,magic>=4?'Tekanan magic':null,dive>=5?'Waspada dive':null,protection>=5?'Peel tersedia':null].filter(Boolean)};
}
const api={analyze};root.LesleyLogic=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis==='undefined'?window:globalThis);
