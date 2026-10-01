import {LEVELS} from './levels.js';
import {DIMENSIONS} from './dimensions.js';
import {SaveManager} from './save.js';
import {skinById} from './shop.js';
import {AudioSystem} from './audio.js';
import {Player} from './player.js';
import {makeEnemies,updateEnemies} from './enemies.js';
import {BOSSES,createBoss,updateBoss,hitBoss} from './bosses.js';
import {UI} from './ui.js';

const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const save=new SaveManager(),audio=new AudioSystem(save.data.settings),ui=new UI(save);
const input={left:false,right:false,sprint:false,jumpPressed:false,fire:false};
let width=innerWidth,height=innerHeight,dpr=1,scale=1,camera=0,last=performance.now(),running=false,paused=false,current=1,config=null,player=null,enemies=[],coins=[],hazards=[],platforms=[],projectiles=[],boss=null,goal=null,runCoins=0,startTime=0,timeLeft=0,worldTime=0,shake=0,particles=[],checkpoint=-1,fireCooldown=0,pendingIntro=false;

function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';scale=Math.min(1.18,Math.max(.48,height/720));ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();

ui.on('play',startLevel);ui.on('pause',togglePause);ui.on('quit',quit);ui.on('replay',()=>startLevel(current,true));ui.on('next',()=>startLevel(Math.min(100,current+1)));ui.on('settings',()=>{audio.settings=save.data.settings;audio.applySettings()});ui.on('purchase',()=>audio.play('buy'));ui.on('error',()=>audio.play('hurt'));ui.on('introDone',()=>{pendingIntro=false;running=true});

function startLevel(number,replay=false){
  current=Math.max(1,Math.min(save.data.highestLevel,number|0));config=LEVELS[current-1];platforms=config.platforms.map(p=>({...p,renderX:p.x,renderY:p.y}));hazards=config.hazards.map(h=>({...h}));coins=config.coins.map((c,i)=>({...c,id:i,collected:false,phase:i*.7}));enemies=makeEnemies(config);goal=config.goal?{...config.goal}:null;boss=config.boss?createBoss(config.dimension):null;projectiles=[];particles=[];runCoins=0;checkpoint=-1;worldTime=0;timeLeft=config.timeLimit;startTime=performance.now();player=new Player(save.data.upgrades);player.reset(120,config.boss?520:460);running=false;paused=false;pendingIntro=true;camera=0;ui.hideScreens();ui.setPlaying(true);ui.hud({level:current,runCoins,lives:player.lives,time:timeLeft,boss});ui.intro(config.theme);audio.startMusic(config.dimension,config.boss);if(config.boss)audio.play('boss');if(config.tutorial)setTimeout(()=>ui.toast(config.tutorial),2700);if(replay)ui.toast('Level restarted')
}
function quit(){running=false;paused=false;pendingIntro=false;audio.stopMusic();ui.setPlaying(false);ui.open('mainMenu');ui.renderAll()}
function togglePause(){if(!player||pendingIntro)return;paused=!paused;running=!paused;if(paused){ui.open('pauseScreen');audio.stopMusic()}else{ui.hideScreens();audio.startMusic(config.dimension,config.boss)}}

const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function activeHazard(h){return !h.cycle||((worldTime+h.offset)%h.cycle)<h.cycle*.62}
function spawnParticles(x,y,color,count=8){const limited=Math.min(count,save.data.settings.reducedMotion?5:24);for(let i=0;i<limited;i++)particles.push({x,y,vx:(Math.random()-.5)*6,vy:-Math.random()*6-1,life:30+Math.random()*25,color,size:2+Math.random()*5})}
function spawnProjectile(x,y,vx,owner='enemy'){projectiles.push({x,y,w:owner==='fall'?18:14,h:owner==='fall'?26:8,vx,vy:owner==='fall'?3.2:0,owner,life:260})}
function hurt(reason='hazard'){
  const result=player.damage();if(!result)return;shake=save.data.settings.screenShake?12:0;audio.play('hurt');spawnParticles(player.x+17,player.y+25,'#ff5263',14);
  if(result==='dead'){save.data.stats.deaths++;save.commit();finish(false);return}setTimeout(()=>{if(running)player.respawn()},220);ui.toast(result==='shield'?'Shield absorbed the hit':reason==='fall'?'A life was lost':'Runner damaged')
}
function finish(win){running=false;audio.stopMusic();ui.setPlaying(false);const elapsed=(performance.now()-startTime)/1000;if(win){const base=20+config.dimension*8+config.stage*3,bossReward=config.boss?100+config.dimension*35:0,timeBonus=Math.max(0,Math.floor(timeLeft/5)),mult=1+(save.data.upgrades.multiplier||0)*.25,reward=Math.floor((runCoins+base+bossReward)*mult)+timeBonus;save.addCoins(reward);save.unlockLevel(Math.min(100,current+1));save.recordLevel(current,elapsed,runCoins);if(config.boss)save.data.stats.bosses++;save.commit();audio.play('win');ui.result(true,{level:current,boss:config.boss,reward,bonus:timeBonus,elapsed})}else ui.result(false,{level:current,reward:0,bonus:0,elapsed})
}
function updateMovingPlatforms(dt){for(const p of platforms){p.dx=p.dy=0;if(p.type==='moving'){const beforeX=p.renderX,beforeY=p.renderY,phase=worldTime*p.speed*.025+p.offset;if(p.axis==='y')p.renderY=p.y+Math.sin(phase)*p.range;else p.renderX=p.x+Math.sin(phase)*p.range;p.dx=(p.renderX-beforeX)/dt;p.dy=(p.renderY-beforeY)/dt}else if(p.type==='phase')p.hidden=(Math.floor((worldTime+p.x*.01)/85)%2)===1}}
function update(dt){
  if(!running||paused||!player)return;worldTime+=dt;timeLeft-=dt/60;if(timeLeft<=0){timeLeft=0;hurt('Time expired');timeLeft=25}
  updateMovingPlatforms(dt);player.update(dt,input,config.theme,platforms.filter(p=>!p.hidden));if(input.jumpPressed===false&&player.vy<0)audio.playedJump=false;if(player.vy<0&&!audio.playedJump){audio.play('jump');audio.playedJump=true}
  if(player.y>800){hurt('fall');return}
  updateEnemies(enemies,dt,player,platforms.filter(p=>!p.hidden),spawnProjectile);updateBoss(boss,dt,player,spawnProjectile);
  fireCooldown-=dt;if(input.fire&&config.boss&&fireCooldown<=0){spawnProjectile(player.x+(player.facing>0?player.w:0),player.y+21,player.facing*9,'player');audio.play('shoot');fireCooldown=13}
  for(const c of coins){c.phase+=.06*dt;if(!c.collected&&Math.hypot(player.x+17-c.x,player.y+26-c.y)<34){c.collected=true;runCoins++;audio.play('coin');spawnParticles(c.x,c.y,config.theme.accent,8)}}
  for(let i=0;i<config.checkpoints.length;i++){const cp=config.checkpoints[i];if(i>checkpoint&&player.x>cp.x){checkpoint=i;player.spawnX=cp.x;player.spawnY=cp.y-20;ui.toast('Checkpoint secured')}}
  for(const h of hazards){if(activeHazard(h)&&overlap(player.rect,h)){hurt();return}}
  for(const e of enemies){if(e.dead||!overlap(player.rect,e))continue;if(player.vy>2&&player.y+player.h<e.y+e.h*.7){e.dead=true;player.vy=-10;audio.play('stomp');spawnParticles(e.x+e.w/2,e.y,'#ffffff',10)}else{hurt('enemy');return}}
  if(boss&&!boss.dead&&overlap(player.rect,boss)){if(player.vy>4&&player.y+player.h<boss.y+35){if(hitBoss(boss)){player.vy=-12;audio.play('stomp');spawnParticles(boss.x+boss.w/2,boss.y,boss.accent,16)}}else hurt('boss')}
  for(const p of projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.owner==='fall')p.vy+=.15*dt;p.life-=dt;if(p.owner==='player'&&boss&&!boss.dead&&overlap(p,boss)){p.life=0;if(hitBoss(boss)){spawnParticles(p.x,p.y,boss.accent,7);shake=save.data.settings.screenShake?3:0}}else if(p.owner!=='player'&&overlap(p,player.rect)){p.life=0;hurt('projectile')}}projectiles=projectiles.filter(p=>p.life>0&&p.y<800&&p.x>-100&&p.x<config.width+100);
  if(boss?.dead&&!goal){spawnParticles(boss.x+boss.w/2,boss.y+boss.h/2,boss.accent,24);goal={x:config.width-260,y:495,w:46,h:125};ui.toast('Guardian defeated — reach the rift!')}
  if(goal&&overlap(player.rect,goal))finish(true);
  camera+=(Math.max(0,Math.min(config.width-width/scale,player.x-width/scale*.36))-camera)*.095*dt;ui.hud({level:current,runCoins,lives:player.lives,time:timeLeft,boss});input.jumpPressed=false;
}

function drawBackground(theme){const g=ctx.createLinearGradient(0,0,0,720);g.addColorStop(0,theme.sky[0]);g.addColorStop(1,theme.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,width/scale,720);const vw=width/scale,dim=config?.dimension??0;ctx.globalAlpha=.18;for(let i=0;i<12;i++){const x=((i*317-camera*.12)%(vw+300))-120,y=100+(i*83)%360;ctx.fillStyle=i%2?theme.accent:'#fff';ctx.beginPath();ctx.arc(x,y,dimensionOrb(i),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;if(dim===7||dim===9){ctx.fillStyle='#fff';for(let i=0;i<55;i++){const x=(i*179-camera*.03)%vw,y=(i*73)%520;ctx.fillRect(x,y,i%5===0?2:1,i%5===0?2:1)}}}
const dimensionOrb=i=>(config?.dimension??0)===0?35+i%3*8:config.dimension===1?4+i%4:config.dimension===7?2:12+i%5*4;
function drawWorld(){
  for(const p of platforms){if(p.hidden)continue;const x=p.renderX-camera;if(x+p.w<0||x>width/scale)continue;ctx.fillStyle=config.theme.edge;ctx.fillRect(x,p.renderY,p.w,8);ctx.fillStyle=config.theme.ground;ctx.fillRect(x,p.renderY+8,p.w,p.h-8);if(p.type==='moving'){ctx.strokeStyle=config.theme.accent;ctx.lineWidth=2;ctx.strokeRect(x+2,p.renderY+2,p.w-4,p.h-4)}if(p.type==='phase'){ctx.globalAlpha=.5+.25*Math.sin(worldTime*.05);ctx.fillStyle=config.theme.accent;ctx.fillRect(x,p.renderY,p.w,4);ctx.globalAlpha=1}}
  for(const h of hazards){const x=h.x-camera;if(x+h.w<0||x>width/scale||!activeHazard(h))continue;ctx.fillStyle=config.theme.hazard;if(['laser','crusher','turret'].includes(h.type)){ctx.shadowColor=config.theme.hazard;ctx.shadowBlur=15;ctx.fillRect(x,h.y,h.w,h.h);ctx.shadowBlur=0}else{ctx.beginPath();const count=Math.max(1,Math.floor(h.w/16));for(let i=0;i<count;i++){ctx.moveTo(x+i*h.w/count,h.y+h.h);ctx.lineTo(x+(i+.5)*h.w/count,h.y);ctx.lineTo(x+(i+1)*h.w/count,h.y+h.h)}ctx.fill()}}
  for(const cp of config.checkpoints){const x=cp.x-camera;ctx.fillStyle='#d8e6ff';ctx.fillRect(x,cp.y,4,70);ctx.fillStyle=config.theme.accent;ctx.fillRect(x+4,cp.y,24,14)}
}
function drawCollectibles(){for(const c of coins){if(c.collected)continue;const x=c.x-camera,y=c.y+Math.sin(c.phase)*4;if(x<-20||x>width/scale+20)continue;ctx.save();ctx.translate(x,y);ctx.scale(.55+.45*Math.abs(Math.sin(c.phase*.7)),1);ctx.fillStyle=config.theme.accent;ctx.shadowColor=config.theme.accent;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff8bd';ctx.fillRect(-2,-6,4,12);ctx.restore()}}
function drawEnemies(){for(const e of enemies){if(e.dead)continue;const x=e.x-camera;if(x<-80||x>width/scale+80)continue;ctx.save();ctx.translate(x,e.y);ctx.fillStyle=config.theme.enemy;ctx.fillRect(0,7,e.w,e.h-7);ctx.fillStyle='#1b1026';if(e.type==='flyer'){ctx.fillRect(-9,13,12,5);ctx.fillRect(e.w-3,13,12,5)}if(e.type==='hopper'){ctx.fillRect(4,e.h-2,7,8);ctx.fillRect(e.w-11,e.h-2,7,8)}ctx.fillStyle='#fff';ctx.fillRect(6,11,7,7);ctx.fillRect(e.w-13,11,7,7);ctx.fillStyle=config.theme.accent;ctx.fillRect(9,13,3,3);ctx.fillRect(e.w-11,13,3,3);ctx.restore()}}
function drawBoss(){if(!boss||boss.dead)return;const x=boss.x-camera;if(x<-200||x>width/scale+200)return;ctx.save();ctx.translate(x,boss.y);if(boss.inv>0&&Math.floor(boss.inv/2)%2)ctx.globalAlpha=.35;ctx.shadowColor=boss.accent;ctx.shadowBlur=15+boss.phase*5;ctx.fillStyle=boss.color;ctx.fillRect(12,22,boss.w-24,boss.h-22);ctx.fillStyle=boss.accent;ctx.fillRect(22,38,boss.w-44,24);ctx.fillStyle='#111';ctx.fillRect(20,5,boss.w-40,35);ctx.fillStyle=boss.accent;ctx.fillRect(29,15,14,8);ctx.fillRect(boss.w-43,15,14,8);ctx.fillStyle=boss.color;for(let i=0;i<=boss.index%4;i++){const ox=8+i*(boss.w-16)/Math.max(1,boss.index%4);ctx.beginPath();ctx.moveTo(ox,22);ctx.lineTo(ox+9,-8-boss.phase*3);ctx.lineTo(ox+18,22);ctx.fill()}if(boss.index>=5){ctx.strokeStyle=boss.accent;ctx.lineWidth=5;ctx.beginPath();ctx.arc(boss.w/2,boss.h*.65,18+boss.index,0,Math.PI*2);ctx.stroke()}ctx.shadowBlur=0;ctx.restore()}
function drawGoal(){if(!goal)return;const x=goal.x-camera;ctx.strokeStyle='#dceaff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,goal.y+goal.h);ctx.lineTo(x,goal.y);ctx.stroke();ctx.fillStyle=config.theme.accent;ctx.shadowColor=config.theme.accent;ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(x+3,goal.y);ctx.lineTo(x+46,goal.y+17);ctx.lineTo(x+3,goal.y+34);ctx.fill();ctx.shadowBlur=0}
function drawPlayer(){if(!player)return;const x=player.x-camera,y=player.y,skin=skinById(save.data.equipped.skin);if(player.inv>0&&Math.floor(player.inv/5)%2===0)return;if(save.data.equipped.trail!=='none'&&Math.abs(player.vx)>2){ctx.fillStyle=save.data.equipped.trail==='trail-ember'?'#ff7048':'#56eeff';ctx.globalAlpha=.45;for(let i=0;i<3;i++)ctx.fillRect(x-player.facing*(10+i*8),y+28+i*4,7,7);ctx.globalAlpha=1}ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x+17,player.onGround?player.y+58:622,22,6,0,0,Math.PI*2);ctx.fill();const leg=Math.sin(player.runPhase)*4;ctx.fillStyle=skin.accent;ctx.fillRect(x+4,y+42+leg,10,16);ctx.fillRect(x+20,y+42-leg,10,16);ctx.fillStyle=skin.body;ctx.fillRect(x+3,y+17,28,31);ctx.fillStyle=skin.head;ctx.fillRect(x+4,y,26,23);ctx.fillStyle='#fff';ctx.fillRect(x+(player.facing>0?18:7),y+7,7,7);ctx.fillStyle='#17202b';ctx.fillRect(x+(player.facing>0?22:7),y+9,3,3);if(player.shields>0){ctx.strokeStyle='#61efff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+17,y+28,34,0,Math.PI*2);ctx.stroke()}}
function drawProjectiles(){for(const p of projectiles){ctx.fillStyle=p.owner==='player'?'#6ff6ff':'#ff4d70';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.fillRect(p.x-camera,p.y,p.w,p.h)}ctx.shadowBlur=0}
function drawParticles(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.13*dt;p.life-=dt;ctx.globalAlpha=Math.max(0,p.life/55);ctx.fillStyle=p.color;ctx.fillRect(p.x-camera,p.y,p.size,p.size)}ctx.globalAlpha=1;particles=particles.filter(p=>p.life>0)}
function draw(dt){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#080b18';ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(shake?(Math.random()-.5)*shake:0,shake?(Math.random()-.5)*shake:0);ctx.scale(scale,scale);drawBackground(config?.theme||DIMENSIONS[0]);if(config){drawWorld();drawCollectibles();drawEnemies();drawBoss();drawProjectiles();drawGoal();drawPlayer();drawParticles(dt);if(config.dimension===8){const grad=ctx.createRadialGradient(player.x-camera,player.y,90,player.x-camera,player.y,330);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.84)');ctx.fillStyle=grad;ctx.fillRect(0,0,width/scale,720)}}ctx.restore();shake*=.82;if(shake<.2)shake=0}

function loop(now){let dt=(now-last)/16.6667;last=now;dt=Math.min(1.8,Math.max(0,dt));update(dt);draw(dt);requestAnimationFrame(loop)}requestAnimationFrame(loop);

function key(e,down){const map={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'sprint',ShiftRight:'sprint',KeyX:'fire'};if(map[e.code])input[map[e.code]]=down;if(down&&['Space','ArrowUp','KeyW'].includes(e.code)){input.jumpPressed=true;e.preventDefault()}if(down&&e.code==='Escape'&&player)togglePause()}
addEventListener('keydown',e=>key(e,true));addEventListener('keyup',e=>key(e,false));addEventListener('blur',()=>{input.left=input.right=input.sprint=input.fire=false});
document.querySelectorAll('[data-control]').forEach(b=>{const c=b.dataset.control;const on=e=>{e.preventDefault();if(c==='jump')input.jumpPressed=true;else input[c]=true};const off=e=>{e.preventDefault();if(c!=='jump')input[c]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
canvas.addEventListener('pointerdown',()=>{if(config?.boss)input.fire=true});canvas.addEventListener('pointerup',()=>input.fire=false);

// Small read-only hook for automated smoke tests and debugging.
globalThis.BLOCK_RYNNER={version:'2.0.0',getState:()=>({running,paused,current,levels:LEVELS.length,dimensions:DIMENSIONS.length,bosses:BOSSES.length,coins:save.data.coins,highestLevel:save.data.highestLevel})};
