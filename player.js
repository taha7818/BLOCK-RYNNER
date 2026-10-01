export class Player{
  constructor(upgrades={}){this.w=34;this.h=54;this.upgrades=upgrades;this.reset(110,400);this.lives=3+(upgrades.extraLife||0);this.shields=upgrades.shield||0}
  reset(x,y){this.x=x;this.y=y;this.spawnX=x;this.spawnY=y;this.vx=0;this.vy=0;this.onGround=false;this.coyote=0;this.jumpBuffer=0;this.jumps=0;this.inv=0;this.facing=1;this.runPhase=0}
  respawn(){this.x=this.spawnX;this.y=this.spawnY;this.vx=0;this.vy=0;this.inv=100}
  update(dt,input,world,platforms){
    const speed=(input.sprint?7.1:4.7)*(1+(this.upgrades.speed||0)*.04),accel=this.onGround?.32:.18;
    const target=((input.right?1:0)-(input.left?1:0))*speed;this.vx+=(target-this.vx)*accel*dt;this.vx+=world.wind*dt;if(Math.abs(target)<.01)this.vx*=Math.pow(.82,dt);
    if(input.jumpPressed)this.jumpBuffer=9;else this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.coyote=this.onGround?8:Math.max(0,this.coyote-dt);
    if(this.jumpBuffer>0&&(this.coyote>0||this.jumps<2)){this.vy=this.jumps===0?-14.6:-12.4;this.jumps++;this.onGround=false;this.coyote=0;this.jumpBuffer=0;input.jumpPressed=false}
    this.vy+=world.gravity*dt;this.vy=Math.min(this.vy,19);if(input.left)this.facing=-1;if(input.right)this.facing=1;
    const oldY=this.y;this.x+=this.vx*dt;this.x=Math.max(0,this.x);this.y+=this.vy*dt;this.onGround=false;
    for(const p of platforms){const px=p.renderX??p.x,py=p.renderY??p.y;if(this.x+this.w>px&&this.x<px+p.w&&oldY+this.h<=py+4&&this.y+this.h>=py&&this.vy>=0){this.y=py-this.h;this.vy=0;this.onGround=true;this.jumps=0;if(p.type==='moving'){this.x+=(p.dx||0)*dt;this.y+=(p.dy||0)*dt}}}
    this.runPhase+=Math.abs(this.vx)*.09*dt;if(this.inv>0)this.inv-=dt;
  }
  damage(){if(this.inv>0)return false;if(this.shields>0){this.shields--;this.inv=80;return 'shield'}this.lives--;this.inv=95;return this.lives<=0?'dead':'hurt'}
  get rect(){return {x:this.x,y:this.y,w:this.w,h:this.h}}
}
