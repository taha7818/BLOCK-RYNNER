import {dimensionFor} from './dimensions.js';

const ARCHETYPES=['meadow-run','stairway','gap-dance','high-road','enemy-gauntlet','moving-cross','hazard-hall','vertical-rush','split-route'];
const mulberry32=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};
const pick=(r,a)=>a[Math.floor(r()*a.length)];

export function createLevel(levelNumber){
  const number=Math.max(1,Math.min(100,levelNumber|0)),dimension=Math.floor((number-1)/10),stage=(number-1)%10+1,boss=stage===10,theme=dimensionFor(number),r=mulberry32(number*7919+dimension*101);
  const archetype=boss?'boss-arena':ARCHETYPES[(stage-1+dimension*2)%ARCHETYPES.length];
  const width=boss?3300:3900+dimension*220+stage*85;
  const floorY=620,platforms=[],hazards=[],coins=[],enemies=[],checkpoints=[];
  if(boss){
    platforms.push({x:0,y:floorY,w:width,h:90,type:'ground'});
    const arenaStep=500-dimension*12;
    for(let x=620+dimension*9;x<width-500;x+=arenaStep)platforms.push({x,y:floorY-130-((Math.floor(x/arenaStep)+dimension)%3)*48,w:160+dimension*7,h:22,type:dimension>=5&&Math.floor(x/arenaStep)%2?'moving':'platform',axis:'y',range:45+dimension*4,speed:.75+dimension*.06,offset:x*.01});
    for(let x=330+dimension*13;x<width-400;x+=310-dimension*4)coins.push({x,y:floorY-68-(x%3)*12});
    for(let i=0;i<dimension;i++)hazards.push({x:720+i*(190+dimension*7),y:floorY-20,w:48+dimension*3,h:20,type:dimension===4?'lava':dimension===5?'laser':dimension===6?'toxic':dimension>=7?'void':'spikes',cycle:95+dimension*5,offset:i*19});
    if(dimension>=3)enemies.push({x:1180+dimension*50,y:floorY-34,type:availableEnemies(number)[Math.min(availableEnemies(number).length-1,dimension-2)],dir:-1});
    return {number,dimension,stage,boss,theme,archetype,width,timeLimit:210,platforms,hazards,coins,enemies,checkpoints,goal:null,intro:`Guardian ${dimension+1}: ${['Moss Colossus','Dune Wyrm','Frost Matriarch','Jungle Idol','Magma Titan','Neon Overmind','Plague Engine','Void Leviathan','Shadow Regent','Nexus Devourer'][dimension]}`};
  }

  // Every level is reproducible, but its route, gaps, elevations and encounters are level-specific.
  let x=0,lastY=floorY;const chunks=10+stage+dimension;
  platforms.push({x:0,y:floorY,w:620,h:90,type:'ground'});x=620;
  for(let i=1;i<chunks;i++){
    const progress=i/chunks;
    const gap=Math.round(55+dimension*5+stage*2+r()*(55+dimension*4));
    const w=Math.round(230+r()*(270-Math.min(90,dimension*6)));
    let y=floorY;
    if(['stairway','high-road','vertical-rush','split-route'].includes(archetype)||i%3===0)y=floorY-Math.round((60+r()*145)*Math.min(1,progress+.25));
    if(Math.abs(y-lastY)>160)y=lastY+Math.sign(y-lastY)*150;
    const type=(number>=16&&i%4===1)?'moving':(number>=53&&i%5===2)?'phase':'platform';
    platforms.push({x:x+gap,y,w,h:type==='ground'?90:24,type,axis:number>=35&&i%3===0?'y':'x',range:60+dimension*7,speed:.7+dimension*.07,offset:r()*6.28});
    if(y<floorY-70&&i%3===0)platforms.push({x:x+gap-70,y:floorY,w:90,h:90,type:'ground'});
    if(number>=6&&gap>70)hazards.push({x:x+8,y:floorY-20,w:Math.max(35,gap-16),h:20,type:dimension===4?'lava':dimension===5?'laser':dimension===6?'toxic':dimension===7?'void':dimension===8?'shadow':'spikes',cycle:90+Math.round(r()*90),offset:Math.round(r()*80)});
    const coinCount=2+Math.floor(r()*4);for(let c=0;c<coinCount;c++)coins.push({x:x+gap+35+c*Math.min(52,(w-60)/coinCount),y:y-38-Math.sin(c/Math.max(1,coinCount-1)*Math.PI)*36});
    if(number>=3&&(i%2===0||archetype==='enemy-gauntlet'))enemies.push({x:x+gap+w*.55,y:y-34,type:pick(r,availableEnemies(number)),dir:r()>.5?1:-1});
    if(number>=28&&i%5===0)hazards.push({x:x+gap+w*.22,y:y-38,w:42,h:38,type:dimension===3?'snapvine':dimension>=5?'turret':'crusher',cycle:110-Math.min(35,dimension*3),offset:i*17});
    if(i===Math.floor(chunks/2)){checkpoints.push({x:x+gap+20,y:y-70});platforms.push({x:x+gap,y,w:Math.max(w,145),h:24,type:'platform'})}
    x+=gap+w;lastY=y;
  }
  platforms.push({x:x+70,y:floorY,w:600,h:90,type:'ground'});
  for(let i=0;i<dimension;i++){
    const hx=900+i*310+(stage%3)*60;if(hx<width-600)hazards.push({x:hx,y:floorY-18,w:70,h:18,type:dimension===1?'quicksand':dimension===2?'ice':dimension===4?'lava':dimension===6?'toxic':'spikes',cycle:120,offset:i*23});
  }
  const tutorial=number<=10?['Move with A / D','Jump with SPACE','Stomp enemies from above','Collect shards for the shop','Sprint with SHIFT','Moving platforms carry you','Hazards demand timing','Checkpoints save your run','Use every skill',''][number-1]:'';
  return {number,dimension,stage,boss,theme,archetype,width:Math.max(width,x+670),timeLimit:Math.max(95,185-dimension*5-stage*2),platforms,hazards,coins,enemies,checkpoints,goal:{x:x+480,y:floorY-125,w:46,h:125},tutorial,intro:`Level ${number} · ${archetype.replaceAll('-',' ')}`};
}

function availableEnemies(level){const out=['walker'];if(level>=8)out.push('dasher');if(level>=18)out.push('hopper');if(level>=27)out.push('flyer');if(level>=46)out.push('turret');if(level>=64)out.push('stalker');return out}
export const LEVELS=Array.from({length:100},(_,i)=>createLevel(i+1));
export function levelSignature(l){return [l.archetype,l.platforms.map(p=>`${p.x}:${p.y}:${p.w}:${p.type}`).join('|'),l.hazards.map(h=>`${h.x}:${h.type}`).join('|'),l.enemies.map(e=>`${e.x}:${e.type}`).join('|')].join('#')}
