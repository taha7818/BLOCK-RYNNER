const KEY='block-rynner-riftbound-v1';
export const DEFAULT_SAVE={version:1,highestLevel:1,coins:0,purchased:['classic'],equipped:{skin:'classic',trail:'none'},upgrades:{extraLife:0,shield:0,speed:0,multiplier:0},settings:{music:.6,sfx:.8,screenShake:true,reducedMotion:false},stats:{deaths:0,bosses:0,levels:0},best:{}};
const clone=v=>JSON.parse(JSON.stringify(v));
function normalize(raw={}){const base=clone(DEFAULT_SAVE);return {...base,...raw,equipped:{...base.equipped,...raw.equipped},upgrades:{...base.upgrades,...raw.upgrades},settings:{...base.settings,...raw.settings},stats:{...base.stats,...raw.stats},best:{...base.best},purchased:Array.isArray(raw.purchased)?raw.purchased:['classic']}}
export class SaveManager{
  constructor(storage=globalThis.localStorage){this.storage=storage;this.data=this.load()}
  load(){try{return normalize(JSON.parse(this.storage?.getItem(KEY)||'{}'))}catch{return normalize()}}
  commit(){try{this.storage?.setItem(KEY,JSON.stringify(this.data))}catch{}return this.data}
  addCoins(amount){this.data.coins=Math.max(0,this.data.coins+Math.floor(amount));return this.commit()}
  spend(amount){if(this.data.coins<amount)return false;this.data.coins-=amount;this.commit();return true}
  unlockLevel(level){this.data.highestLevel=Math.max(this.data.highestLevel,Math.min(100,level));this.commit()}
  recordLevel(level,time,coins){const old=this.data.best[level];if(!old||time<old.time)this.data.best[level]={time,coins};this.data.stats.levels++;this.commit()}
  reset(){this.data=normalize();this.commit();return this.data}
}
export {KEY as SAVE_KEY};
