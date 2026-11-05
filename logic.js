/* Lesley Lab: draft heuristics, not actual in-match inventory or calculated damage. */
(function(root, factory) {
  'use strict';
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  root.LesleyLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const heavyCC = new Set(['stun','knockup','knockback','freeze','polymorph','immobilize','taunt','fear','pull','displacement','throw']);
  const cleansingCC = new Set(['stun','knockup','knockback','freeze','polymorph','immobilize','taunt','fear','pull','displacement','throw']);
  const n = (h,k) => Number(h?.traits?.[k] || 0);
  const total = (arr,k) => arr.reduce((a,h)=>a+n(h,k),0);
  const uniq = a => [...new Set(a)];
  const cap = (v,min,max)=>Math.min(max,Math.max(min,v));
  const nameOf = h=>h?.name || '';

  function analyzeDraft(data, enemyNames=[], allyNames=[], opts={}) {
    const byName=new Map(data.heroes.map(h=>[h.name,h]));
    const enemies=uniq(enemyNames).filter(x=>x!=='Lesley').map(x=>byName.get(x)).filter(Boolean).slice(0,5);
    const allyNamesClean=uniq(allyNames).filter(x=>x!=='Lesley'&&!enemies.some(h=>h.name===x));
    const allies=allyNamesClean.map(x=>byName.get(x)).filter(Boolean).slice(0,4);
    const en=k=>total(enemies,k), al=k=>total(allies,k);
    const ccCount=enemies.filter(h=>(h.cc||[]).some(x=>heavyCC.has(x))).length;
    const cleanseCC=enemies.filter(h=>(h.cc||[]).some(x=>cleansingCC.has(x))).length;
    const suppress=enemies.filter(h=>(h.cc||[]).includes('suppress')).length;
    const stuns=enemies.reduce((s,h)=>s+(h.cc||[]).filter(x=>cleansingCC.has(x)).length,0);
    const protection=al('R')*.68+al('F')*.42+al('Q')*.32+al('H')*.22+al('C')*.24;
    const heal=en('H')*1.95+en('S')*.59+en('L')*.47+en('Q')*.43;
    const bulky=en('T')*.83+en('F')*.41;
    const crowd=en('C')*.50+ccCount*.77;
    const dive=cap(en('D')*.78+en('M')*.40+en('B')*.20-protection*.39,0,30);
    const physical=enemies.reduce((s,h)=>{
      const r=String(h.role||'').toLowerCase();
      const isPhysical=/assassin|fighter|marksman/.test(r)&&n(h,'G')<2;
      return s+(isPhysical?(n(h,'D')*.66+n(h,'B')*.59+n(h,'A')*.40+n(h,'P')*.28):n(h,'D')*.10);
    },0);
    const magic=enemies.reduce((s,h)=>s+n(h,'G')*.77+(n(h,'G')>=2?n(h,'B')*.35:0),0);
    const physicalRisk=cap(physical*.88+dive*.45-protection*.25,0,35);
    const magicRisk=cap(magic*.92+en('C')*.09-protection*.24,0,35);
    const slow=enemies.reduce((s,h)=>s+((h.cc||[]).includes('slow')?1:0),0) + en('Z')*.25;
    const physicalEmergency=physicalRisk>=7.1 && (dive>=3.6||en('B')>=5);
    const magicEmergency=magicRisk>=7.4 && (dive>=3.4||en('B')>=5);
    const hardPhysical=physicalRisk>=5.0 && (dive>=2.8 || physicalRisk>=7.5);
    const hardMagic=magicRisk>=5.3 && (dive>=2.7 || magicRisk>=7.8);
    const hardHeal=heal>=3.35;
    const hardControl=crowd>=5.0 || stuns>=5;
    const hardDive=dive>=4.8;
    const isSafe=dive<3.4&&crowd<4.0&&physicalRisk<5.4&&magicRisk<5.4;

    // Lesley is a single-shot critical/true-damage sniper: never swap to Golden Staff/on-hit.
    // Boots cover positioning, control and lane pressure; attack-speed boots are not the default.
    const boots=(magicRisk>=3.6 && crowd>=3.8) || (hardControl && crowd>=5.0 && suppress===0)
      ? 'tough' : (physicalRisk>=6.2&&magicRisk<3.4 ? 'warrior' : 'rapid');

    const signals={heal,bulky,crowd,dive,physicalRisk,magicRisk,protection,slow,ccCount,
      stuns,suppress,hardPhysical,hardMagic,hardHeal,hardControl,hardDive,physicalEmergency,magicEmergency};

    let spell='Flicker';
    // Purify cannot cleanse suppression. Choose only when multiple removable CC threats matter.
    if(suppress===0 && (cleanseCC>=2 || (cleanseCC===1&&crowd>=5.8)) &&
      crowd>=4.5 && (dive>=2.9 || crowd>=6.8)) spell='Purify';
    else if(suppress===0 && slow>=5.2&&cleanseCC===0&&dive<4.8&&crowd<4.7) spell='Sprint';

    // Score viable counter-items. These signals are *pre-match* draft estimates.
    // Emergency counters go earlier, but Lesley's 2 main damage items stay locked.
    const counter=[];
    if(hardHeal) counter.push({id:'sea',score:heal*1.18+2.2,reason:'Heal, regen, dan shield musuh tinggi'});
    if(hardPhysical) counter.push({id:'nature',score:physicalRisk*.95+(physicalEmergency?2.5:0),reason:'Ancaman dive/burst fisik'});
    if(hardMagic) counter.push({id:'meteor',score:magicRisk*.94+(magicEmergency?2.5:0),reason:'Ancaman burst magic'});
    if(dive>=8.2 && physicalRisk>=5.5 && magicRisk>=5.5)
      counter.push({id:'immortal',score:dive*.58+4,reason:'Ancaman campuran sangat berat; kesempatan hidup lagi'});
    counter.sort((a,b)=>b.score-a.score);
    const pick=counter.slice(0,2);
    const has=id=>pick.some(x=>x.id===id);

    let order=[boots,'berserker'];
    const emergency=pick.find(x=>x.id==='nature'&&physicalEmergency||x.id==='meteor'&&magicEmergency);
    const push=id=>{if(data.items[id]&&!order.includes(id))order.push(id);};
    // "Counter dulu" is a *priority* mode, not an RNG reroll.
    const counterFirst=!!opts.counterFirst;
    if(emergency || (counterFirst && pick.length)) push((emergency||pick[0]).id);
    push('endless');
    // Against severe healing, counter before optional range/damage; otherwise finish core first.
    if(hardHeal && !has('sea')) { /* Healing signal lost to two more urgent survival slots. */ }
    if(!counterFirst && !emergency && has('sea') && heal>=6.0) push('sea');
    for(const x of pick) if(order.length<5 && (x.id==='nature'||x.id==='meteor') &&
      ((x.id==='nature'&&physicalEmergency)||(x.id==='meteor'&&magicEmergency)))push(x.id);
    // Malefic Gun gives spacing; Blade of Despair scales empowered true-damage shots.
    // If both counter slots are required, keep one additional damage item.
    if(pick.length>=2) {
      if(hardDive || bulky>=5) push('gun'); else push('blade');
    } else {
      push('gun');
      push('blade');
    }
    for(const x of pick) push(x.id);
    // A single counter may push a damage item to slot 6. No "penetration mandatory vs tank" shortcut.
    if(isSafe && heal<3.35 && bulky<5 && order.length<6) push('hepta');
    if(order.length<6) push('blade');
    if(order.length<6) push('gun');
    if(order.length<6) push('hepta');
    if(order.length<6) push('hunter');
    order=order.slice(0,6);

    // Enforce both crit/shot cores, capped at 6 equipment slots.
    for(const required of ['berserker','endless']){
      if(!order.includes(required)){
        const index=order.findLastIndex((id,i)=>i>1&&!['berserker','endless'].includes(id));
        if(index>=0)order[index]=required;
      }
    }
    // A late situational swap is advice, never a silent change in the six equipment slots.
    const lateSwap=hardHeal&&!order.includes('sea')?'Sea Halberd jika heal musuh mulai dominan':
      (hardPhysical&&!order.includes('nature')?'Wind of Nature jika assassin fisik menjadi ancaman utama':
      (hardMagic&&!order.includes('meteor')?'Rose Gold Meteor jika burst magic makin berat':
      (!hardPhysical&&!hardMagic&&!hardHeal?'Jual boots saat full build hanya jika posisi aman; utamakan item damage atau Immortality.':
      'Perhatikan item aktual lawan dan sesuaikan slot fleksibel saat pertandingan.')));

    let style='Hit & run';
    if(hardDive || hardControl) style='Sniper defensif';
    else if(bulky>=5) style='Kite frontline';
    else if(isSafe) style='Pickoff / poke';
    const tactics={
      'Hit & run':'Pancing pasif → tembak → Skill 1 → tembak lagi → mundur. Jangan diam untuk spam basic attack.',
      'Sniper defensif':'Tunggu diver/CC terlihat dulu. Sisakan Skill 2 untuk knockback, tembak dari sudut aman dan hindari ulti dekat assassin.',
      'Kite frontline':'Serang garis depan dengan empowered true damage, jaga jarak. Jangan memaksakan item physical penetration hanya karena ada tank.',
      'Pickoff / poke':'Cari sudut kabut, colek core dengan 2 empowered shot. Pindah posisi sesudah menembak; jangan memaksa duel panjang.'
    };
    const notes={
      rapid:'Speed rotasi dan menjaga jarak saat sniper poke.',tough:'Magic/CC tinggi; jangan terpaku sepatu damage.',
      warrior:'Lane dan burst fisik lebih dominan.',berserker:'Core crit, memperbesar tembakan pasif.',
      endless:'Stat damage, mobilitas dan sustain untuk ritme skill → basic.',
      gun:'Ekstra jarak untuk hit-and-run dan spacing.',blade:'Raw physical attack menaikkan damage tembakan Lesley.',
      sea:'Antiheal situasional bila heal/regen/shield besar.',
      nature:'Aktifkan sebelum burst fisik; tidak memblokir damage magic/true.',
      meteor:'Shield darurat saat mage burst mengancam.',
      immortal:'Cadangan revive bila dive campuran berat.',
      hepta:'Poke first-hit saat aman dan target relatif mudah diisolasi.',
      hunter:'Damage + speed untuk memutar posisi; slot ofensif alternatif.'
    };
    const tags=[hardHeal?'Antiheal':null, hardPhysical?'Anti-fisik':null, hardMagic?'Anti-magic':null,
      hardControl?'CC berat':null,bulky>=5?'HP tebal':null,!hardHeal&&!hardPhysical&&!hardMagic?'Crit sniper':null].filter(Boolean).slice(0,3);
    return {order,spell,style,tactic:tactics[style],tags,signals,notes,lateSwap,
      emblem:'Marksman',talents:['Fatal','Weapon Master','Quantum Charge'],
      selectedCounters:pick.map(x=>x.id),explanations:pick,version:data.patch||'unknown'};
  }
  return {analyzeDraft};
});
