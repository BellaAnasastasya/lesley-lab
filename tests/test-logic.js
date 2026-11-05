'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);
const DATA=ctx.window.LESLEY_DATA;
const {analyzeDraft}=require('../logic.js');
const test=(en=[],al=[],opts={})=>analyzeDraft(DATA,en,al,opts);
const valid=r=>{
  assert.equal(r.order.length,6,'6 items always');
  assert.equal(new Set(r.order).size,6,'no duplicate items');
  assert(r.order.every(k=>DATA.items[k]));
  assert.equal(r.order[1],'berserker');
  assert(r.order.includes('endless'));
  assert(!r.order.includes('golden'));
  assert.deepEqual(Array.from(r.talents),['Fatal','Weapon Master','Quantum Charge']);
  assert(['Flicker','Purify','Sprint'].includes(r.spell));
  assert.equal(r.order[0]=== 'rapid'||r.order[0]==='tough'||r.order[0]==='warrior',true);
};
assert.equal(DATA.heroes.length,133);
assert.equal(DATA.heroCount,133);
assert.equal(DATA.heroes.find(h=>h.name==='Lesley').kit,'Crit true-damage poke, kamuflase dan snipe');
const empty=test();valid(empty);
assert.equal(empty.spell,'Flicker');
assert(empty.order.includes('blade'));
const heal=test(['Estes','Floryn','Uranus']);valid(heal);
assert(heal.order.includes('sea'),'healer draft should trigger anti-heal');
const assassins=test(['Fanny','Ling','Hayabusa','Saber','Natalia']);valid(assassins);
assert(assassins.order.includes('nature'),'physical burst needs Wind of Nature');
const mages=test(['Eudora','Aurora','Kadita','Gusion','Valir']);valid(mages);
assert(mages.order.includes('meteor'),'magic burst needs Rose Gold Meteor');
const tank=test(['Atlas','Tigreal','Barats','Belerick']);valid(tank);
assert(!tank.order.includes('roar'),'true-damage sniper should not be forced into Malefic Roar');
const purify=test(['Aurora','Eudora','Atlas','Vexana']);valid(purify);
assert.equal(purify.spell,'Purify');
const suppress=test(['Franco','Kaja','Barats','Aurora']);valid(suppress);
assert.notEqual(suppress.spell,'Purify','suppression is not cleared by Purify');
const counterBefore=test(['Fanny','Ling','Hayabusa','Saber'],[],{counterFirst:true});valid(counterBefore);
assert(counterBefore.order.indexOf('nature')<=assassins.order.indexOf('nature'));
const names=DATA.heroes.map(x=>x.name).filter(x=>x!=='Lesley');
let tests=0;
for(let t=0;t<2500;t++){
  let pool=names.slice();
  let enemies=[],allies=[];
  for(let i=0;i<9;i++){
    const p=(t*13+i*37+Math.floor(Math.random()*pool.length))%pool.length;
    (i<5?enemies:allies).push(pool.splice(p,1)[0]);
  }
  valid(test(enemies,allies,{counterFirst:t%2===0}));
  tests++;
}
console.log(`PASS: 133 heroes · 8 targeted matchups · ${tests} random draft combinations · 6 unique slots`);
console.log('Baseline:',empty.order.map(id=>DATA.items[id].name).join(' > '));
console.log('Healers:',heal.order.map(id=>DATA.items[id].name).join(' > '));
console.log('Physical dive:',assassins.order.map(id=>DATA.items[id].name).join(' > '));
console.log('Magic burst:',mages.order.map(id=>DATA.items[id].name).join(' > '));
