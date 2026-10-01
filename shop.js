export const SHOP_ITEMS=[
  {id:'classic',type:'cosmetic',slot:'skin',name:'Classic Runner',price:0,body:'#f28a45',head:'#ffd1a3',accent:'#ffcc58',description:'The original orange BLOCK-RYNNER look.'},
  {id:'rift',type:'cosmetic',slot:'skin',name:'Rift Walker',price:180,body:'#6b55dd',head:'#d8c7ff',accent:'#62efff',description:'Armor cut from stable rift crystal.'},
  {id:'ember',type:'cosmetic',slot:'skin',name:'Ember Knight',price:300,body:'#a73236',head:'#ffd0a5',accent:'#ffbd47',description:'Forged in the Cinder Core.'},
  {id:'glitch',type:'cosmetic',slot:'skin',name:'Glitch Unit',price:520,body:'#15265e',head:'#a9eaff',accent:'#ff44bd',description:'A runner the Neon Grid cannot track.'},
  {id:'voidling',type:'cosmetic',slot:'skin',name:'Voidling',price:760,body:'#28234c',head:'#b9a7ff',accent:'#7ff9ff',description:'Starlight in a very small suit.'},
  {id:'crown',type:'cosmetic',slot:'skin',name:'Nexus Crown',price:1100,body:'#171828',head:'#ffd6ad',accent:'#ffd95d',description:'A trophy for masters of every dimension.'},
  {id:'trail-cyan',type:'cosmetic',slot:'trail',name:'Ion Trail',price:240,body:'#26304a',head:'#bcd0ef',accent:'#56eeff',description:'A cool cyan trail behind every sprint.'},
  {id:'trail-ember',type:'cosmetic',slot:'trail',name:'Ember Trail',price:420,body:'#442128',head:'#ffd1aa',accent:'#ff7048',description:'Leaves harmless sparks in your wake.'},
  {id:'extraLife',type:'upgrade',name:'Reserve Heart',price:180,max:2,description:'Begin each run with one additional life per rank.'},
  {id:'shield',type:'upgrade',name:'Rift Shield',price:260,max:2,description:'Absorb one hit per level per rank.'},
  {id:'speed',type:'upgrade',name:'Kinetic Boots',price:340,max:2,description:'A modest 4% movement boost per rank.'},
  {id:'multiplier',type:'upgrade',name:'Shard Magnet',price:500,max:2,description:'Collected shards are worth 25% more per rank.'}
];
export function purchase(save,item){
  if(item.type==='cosmetic'){
    if(save.data.purchased.includes(item.id)){save.data.equipped[item.slot]=item.id;save.commit();return {ok:true,equipped:true}}
    if(!save.spend(item.price))return {ok:false,reason:'Not enough shards'};
    save.data.purchased.push(item.id);save.data.equipped[item.slot]=item.id;save.commit();return {ok:true,purchased:true};
  }
  const rank=save.data.upgrades[item.id]||0;if(rank>=item.max)return {ok:false,reason:'Max rank reached'};
  const cost=item.price*(rank+1);if(!save.spend(cost))return {ok:false,reason:'Not enough shards'};
  save.data.upgrades[item.id]=rank+1;save.commit();return {ok:true,purchased:true};
}
export const skinById=id=>SHOP_ITEMS.find(x=>x.id===id&&x.slot==='skin')||SHOP_ITEMS[0];
