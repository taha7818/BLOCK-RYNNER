export const BOSSES=[
  {name:'Moss Colossus',color:'#4f9a4d',accent:'#c9ff6c',hp:16,attacks:['slam','seed']},
  {name:'Dune Wyrm',color:'#c77a35',accent:'#ffe16d',hp:20,attacks:['dash','burst']},
  {name:'Frost Matriarch',color:'#4c88bd',accent:'#bffaff',hp:24,attacks:['shards','leap']},
  {name:'Jungle Idol',color:'#276444',accent:'#ffdf56',hp:28,attacks:['totem','seed','slam']},
  {name:'Magma Titan',color:'#6d2630',accent:'#ff6239',hp:34,attacks:['meteor','burst','slam']},
  {name:'Neon Overmind',color:'#252a72',accent:'#ff46db',hp:40,attacks:['laser','teleport','burst']},
  {name:'Plague Engine',color:'#58622c',accent:'#bfff3c',hp:46,attacks:['toxic','dash','meteor']},
  {name:'Void Leviathan',color:'#30265f',accent:'#8ef6ff',hp:54,attacks:['gravity','shards','teleport']},
  {name:'Shadow Regent',color:'#321d3a',accent:'#ff4d91',hp:64,attacks:['clone','dash','laser','burst']},
  {name:'Nexus Devourer',color:'#311637',accent:'#ff4e9d',hp:82,attacks:['meteor','laser','gravity','dash','burst'],phases:4}
];
export function createBoss(index){const d=BOSSES[index];return {...d,index,x:2450,y:465,w:index===9?150:105,h:index===9?155:120,maxHp:d.hp,hp:d.hp,t:0,phase:1,dir:-1,inv:0,dead:false}}
export function updateBoss(b,dt,player,spawn){if(!b||b.dead)return;b.t+=dt;b.inv=Math.max(0,b.inv-dt);b.phase=Math.min(b.phases||3,1+Math.floor((1-b.hp/b.maxHp)*(b.phases||3)));const interval=Math.max(42,105-b.index*4-b.phase*7);if(b.t%interval<dt){const attack=b.attacks[Math.floor(b.t/interval)%b.attacks.length];if(attack==='dash'){b.dir=player.x>b.x?1:-1;b.vx=b.dir*(5+b.phase)}else if(attack==='teleport'){b.x=1500+((b.t*97)%1100)}else if(attack==='slam'||attack==='leap'){b.vy=-12-b.phase}else if(attack==='laser'){for(let i=-2;i<=2;i++)spawn(b.x,b.y+40+i*18,player.x>b.x?7:-7,'boss')}else if(attack==='meteor'||attack==='shards'||attack==='toxic'||attack==='gravity'||attack==='seed'||attack==='burst'||attack==='clone'||attack==='totem'){const count=2+b.phase;for(let i=0;i<count;i++)spawn(player.x-160+i*100,70-i*30,(i-count/2)*.35,'fall')}}b.vx=(b.vx||0)*.96;b.vy=(b.vy||0)+.72*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y+b.h>=620){b.y=620-b.h;b.vy=0}if(b.x<900||b.x>3050-b.w){b.x=Math.max(900,Math.min(3050-b.w,b.x));b.vx*=-1}}
export function hitBoss(b,damage=1){if(!b||b.dead||b.inv>0)return false;b.hp=Math.max(0,b.hp-damage);b.inv=9;if(b.hp===0)b.dead=true;return true}
