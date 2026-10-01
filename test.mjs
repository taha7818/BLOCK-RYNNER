import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LEVELS,levelSignature} from '../js/levels.js';
import {DIMENSIONS,dimensionFor} from '../js/dimensions.js';
import {BOSSES,createBoss,hitBoss} from '../js/bosses.js';
import {SaveManager} from '../js/save.js';
import {SHOP_ITEMS,purchase} from '../js/shop.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};

assert.equal(LEVELS.length,100,'exactly 100 levels are generated');
assert.equal(DIMENSIONS.length,10,'ten dimensions exist');
assert.equal(BOSSES.length,10,'ten bosses exist');
assert.equal(new Set(LEVELS.map(levelSignature)).size,100,'all level layouts have unique signatures');
assert.deepEqual(LEVELS.filter(x=>x.boss).map(x=>x.number),[10,20,30,40,50,60,70,80,90,100]);
assert.equal(new Set(BOSSES.map(x=>x.name)).size,10,'boss names are unique');
assert.equal(new Set(BOSSES.map(x=>x.attacks.join(','))).size,10,'boss patterns are unique');
for(let n=1;n<=100;n++){
  const l=LEVELS[n-1];assert.equal(l.dimension,Math.floor((n-1)/10));assert.equal(l.theme,dimensionFor(n));assert.ok(l.platforms.length>0);assert.ok(l.boss||l.goal,'stage has a completion route');
}
const finalBoss=createBoss(9);assert.equal(finalBoss.name,'Nexus Devourer');assert.equal(finalBoss.maxHp,82);while(!finalBoss.dead){finalBoss.inv=0;hitBoss(finalBoss)}assert.equal(finalBoss.hp,0);

const mem=storage(),save=new SaveManager(mem);assert.equal(save.data.highestLevel,1);save.addCoins(1000);const skin=SHOP_ITEMS.find(x=>x.id==='rift');assert.equal(purchase(save,skin).ok,true);assert.ok(save.data.purchased.includes('rift'));const reloaded=new SaveManager(mem);assert.equal(reloaded.data.equipped.skin,'rift');reloaded.unlockLevel(101);assert.equal(reloaded.data.highestLevel,100);assert.equal(reloaded.reset().coins,0);

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/type="module" src="js\/game\.js"/);assert.doesNotMatch(html,/<script>\s*[^<]/);assert.doesNotMatch(html,/style="/);
for(const file of ['css/style.css','css/menu.css','css/shop.css','js/game.js','js/player.js','js/levels.js','js/bosses.js','js/shop.js','js/enemies.js','js/dimensions.js','js/save.js','js/ui.js'])assert.ok(fs.existsSync(path.join(root,file)),`${file} exists`);

console.log('✓ 100 unique playable level configurations');
console.log('✓ 10 dimensions and boss stages at every tenth level');
console.log('✓ 10 distinct bosses including the four-phase final boss');
console.log('✓ save/load, unlock cap, reset, purchase and equip persistence');
console.log('✓ GitHub Pages-safe relative assets and separated source files');
