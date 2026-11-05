const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=fs.existsSync(path.join(root,'dist'))?path.join(root,'dist'):root;
global.window={};require(path.join(dist,'data.js'));const D=window.LESLEY_DATA,L=require(path.join(dist,'logic.js'));
const check=(e=[],a=[],o={})=>{const x=L.analyze(D,e,a,o);assert.equal(x.order.length,6);assert.equal(new Set(x.order).size,6);for(const k of x.order)assert(D.items[k]);for(const k of ['berserker','endless','blade'])assert(x.order.includes(k));assert(['magic','tough','warrior'].includes(x.order[0]));assert(!x.order.includes('golden'));assert(x.enemy.length<=5&&x.ally.length<=4);assert(!x.ally.some(n=>x.enemy.includes(n)));assert(!x.enemy.includes('Lesley'));return x;};
assert.equal(D.heroes.length,133);assert.equal(Object.keys(D.items).length,14);
assert(check(['Saber','Hayabusa','Miya','Tigreal','Chou']).order.includes('nature'));
assert(check(['Eudora','Gusion','Aurora','Natan','Atlas']).order.includes('athena'));
assert(check(["Chang'e",'Zhuxin','Gord']).order.includes('radiant'));
assert(check(['Estes','Uranus','Esmeralda','Alpha','Ruby']).order.includes('sea'));
for(const n of ['Franco','Kaja','Barats'])assert.equal(check([n,'Eudora','Atlas','Saber','Tigreal']).spell,'flicker');
assert.equal(check(['Eudora','Aurora','Tigreal','Saber','Chou']).spell,'purify');
const en=['Saber','Nolan','Brody','Zhuxin','Lukas'];
const solo=check(en),peel=check(en,['Lolita','Minotaur','Angela','Ruby']);
assert.notDeepEqual(solo.order,peel.order);assert(peel.signals.protection>solo.signals.protection);assert(peel.signals.dive<solo.signals.dive);
const base=check(['Saber']),early=check(['Saber'],[],{counterMode:true});assert.deepEqual([...base.order].sort(),[...early.order].sort());assert(early.order.indexOf('nature')<base.order.indexOf('nature'));assert(early.order.indexOf('nature')>=2);
const bad=check(['Lesley','Saber','Saber','not-real'],['Saber','Miya','Lesley','not-real']);assert.deepEqual(bad.enemy,['Saber']);assert.deepEqual(bad.ally,['Miya']);
let seed=7581;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<2000;i++){const heroes=[...D.heroes].sort(()=>0);for(let j=heroes.length-1;j>0;j--){const k=Math.floor(rand()*(j+1));[heroes[j],heroes[k]]=[heroes[k],heroes[j]];}const e=heroes.slice(0,5).map(h=>h.name),a=heroes.slice(5,9).map(h=>h.name);check(e,a,{counterMode:!!(i%2)});}
console.log('PASS: 2,000 draft combinations, core integrity, ally effects, counter order, CC/suppression, physical/magic/sustain cases.');
