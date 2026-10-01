export function updateEnemies(enemies,dt,player,platforms,spawnProjectile){
  for(const e of enemies){if(e.dead)continue;e.t=(e.t||0)+dt;e.vx=e.vx??(1.05+e.level*.012)*(e.dir||1);e.vy=e.vy||0;
    if(e.type==='dasher'&&Math.abs(player.x-e.x)<310)e.vx=(player.x>e.x?1:-1)*(2.4+e.level*.018);
    if(e.type==='hopper'&&e.onGround&&e.t%95<dt)e.vy=-10;
    if(e.type==='flyer'){e.y=e.baseY+Math.sin(e.t*.045)*55;e.vx=(e.dir||1)*1.35;e.x+=e.vx*dt;continue}
    if(e.type==='stalker'&&Math.abs(player.x-e.x)<420)e.vx+=(player.x>e.x?.05:-.05)*dt;
    if(e.type==='turret'){e.vx=0;if(e.t%115<dt&&Math.abs(player.x-e.x)<700)spawnProjectile(e.x,e.y+12,player.x>e.x?5:-5,'enemy');continue}
    const oldY=e.y;e.vy+=.75*dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.onGround=false;
    for(const p of platforms){const px=p.renderX??p.x,py=p.renderY??p.y;if(e.x+e.w>px&&e.x<px+p.w&&oldY+e.h<=py+4&&e.y+e.h>=py&&e.vy>=0){e.y=py-e.h;e.vy=0;e.onGround=true;if(e.x<px+6||e.x+e.w>px+p.w-6)e.vx*=-1}}
    if(e.y>850)e.dead=true;
  }
}
export function makeEnemies(config){return config.enemies.map((e,i)=>({...e,w:e.type==='flyer'?42:34,h:e.type==='turret'?42:34,baseY:e.y,level:config.number,dead:false,id:i}))}
