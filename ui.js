import {DIMENSIONS} from './dimensions.js';
import {SHOP_ITEMS,purchase} from './shop.js';

const $=id=>document.getElementById(id);
export class UI{
  constructor(save){this.save=save;this.handlers={};this.shopTab='cosmetic';this.bindNavigation();this.renderAll()}
  on(name,fn){this.handlers[name]=fn}
  emit(name,...args){this.handlers[name]?.(...args)}
  bindNavigation(){
    document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>this.open(b.dataset.open)));
    $('playButton').onclick=()=>this.emit('play',this.save.data.highestLevel);
    $('pauseButton').onclick=()=>this.emit('pause');$('resumeButton').onclick=()=>this.emit('pause');$('quitButton').onclick=()=>this.emit('quit');
    $('replayButton').onclick=()=>this.emit('replay');$('nextButton').onclick=()=>this.emit('next');$('pauseShopButton').onclick=()=>this.open('shopScreen');$('resultShopButton').onclick=()=>this.open('shopScreen');$('resultMenuButton').onclick=()=>this.emit('quit');
    document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{this.shopTab=b.dataset.tab;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));this.renderShop()});
    for(const id of ['musicVolume','sfxVolume']){$(id).value=Math.round(this.save.data.settings[id==='musicVolume'?'music':'sfx']*100);$(id).oninput=e=>{const key=id==='musicVolume'?'music':'sfx';this.save.data.settings[key]=e.target.value/100;$(`${key}Value`).textContent=e.target.value+'%';this.save.commit();this.emit('settings')}}
    $('screenShake').checked=this.save.data.settings.screenShake;$('reducedMotion').checked=this.save.data.settings.reducedMotion;
    for(const id of ['screenShake','reducedMotion'])$(id).onchange=e=>{this.save.data.settings[id]=e.target.checked;this.save.commit();this.emit('settings')};
    $('fullscreenButton').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
    $('resetButton').onclick=()=>{if(confirm('Reset all levels, shards, purchases and settings? This cannot be undone.')){this.save.reset();location.reload()}};
    $('musicValue').textContent=Math.round(this.save.data.settings.music*100)+'%';$('sfxValue').textContent=Math.round(this.save.data.settings.sfx*100)+'%';
  }
  open(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');if(id==='levelSelect')this.renderLevels();if(id==='shopScreen')this.renderShop()}
  hideScreens(){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'))}
  setPlaying(value){$('hud').classList.toggle('hidden',!value);$('mobileControls').classList.toggle('playing',value);if(!value)$('mobileControls').classList.add('hidden');else $('mobileControls').classList.remove('hidden')}
  renderAll(){$('menuCoins').textContent=this.save.data.coins;$('menuProgress').textContent=`${this.save.data.highestLevel} / 100`;this.renderLevels();this.renderShop()}
  renderLevels(){const grid=$('levelGrid');grid.innerHTML=DIMENSIONS.map((d,di)=>`<section class="dimension-group"><div class="dimension-label"><h3>${String(di+1).padStart(2,'0')} · ${d.name}</h3><span>${d.range} · ${d.mechanic}</span></div><div class="level-row">${Array.from({length:10},(_,i)=>{const n=di*10+i+1,locked=n>this.save.data.highestLevel;return `<button class="level-button ${i===9?'boss':''} ${locked?'locked':''}" data-level="${n}" ${locked?'disabled':''}>${i===9?'★ ':''}${n}</button>`}).join('')}</div></section>`).join('');grid.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>this.emit('play',Number(b.dataset.level)))}
  renderShop(){
    $('shopCoins').textContent=this.save.data.coins;const items=SHOP_ITEMS.filter(x=>x.type===this.shopTab);$('shopGrid').innerHTML=items.map(item=>{const cosmetic=item.type==='cosmetic',owned=cosmetic&&this.save.data.purchased.includes(item.id),equipped=cosmetic&&this.save.data.equipped[item.slot]===item.id,rank=!cosmetic?(this.save.data.upgrades[item.id]||0):0,cost=cosmetic?item.price:item.price*(rank+1),maxed=!cosmetic&&rank>=item.max;return `<article class="shop-card">${cosmetic?`<div class="shop-preview"><i class="preview-runner skin-${item.id}"></i></div>`:''}<h3>${item.name}</h3><p>${item.description}</p>${!cosmetic?`<span class="stock">RANK ${rank} / ${item.max}</span>`:''}<div class="shop-price">${equipped?'EQUIPPED':owned?'OWNED':maxed?'MAXIMUM':`◆ ${cost}`}</div><button data-buy="${item.id}" class="${equipped?'equipped':owned?'owned':''}" ${equipped||maxed?'disabled':''}>${owned&&!equipped?'EQUIP':equipped?'EQUIPPED':maxed?'MAXED':'PURCHASE'}</button></article>`}).join('');$('shopGrid').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const item=SHOP_ITEMS.find(x=>x.id===b.dataset.buy),result=purchase(this.save,item);this.toast(result.ok?(result.equipped?'Equipped!':'Purchase complete!'):result.reason);this.emit(result.ok?'purchase':'error');this.renderAll()})
  }
  hud(state){$('hudLevel').textContent=state.level;$('hudCoins').textContent=state.runCoins;$('hudLives').textContent=state.lives;$('hudTime').textContent=`${Math.floor(state.time/60)}:${String(Math.max(0,Math.ceil(state.time%60))).padStart(2,'0')}`;$('bossBar').classList.toggle('hidden',!state.boss);if(state.boss){$('bossName').textContent=state.boss.name;$('bossHealth').style.width=(100*state.boss.hp/state.boss.maxHp)+'%'}}
  intro(d){$('dimensionName').textContent=d.name;$('dimensionDesc').textContent=d.description;this.open('dimensionIntro');setTimeout(()=>{if($('dimensionIntro').classList.contains('active')){this.hideScreens();this.emit('introDone')}},2450)}
  result(win,data){$('resultEyebrow').textContent=win?'RIFT STABILIZED':'RUN ENDED';$('resultTitle').textContent=win?(data.boss?'GUARDIAN DEFEATED':'LEVEL COMPLETE'):'TRY AGAIN';$('resultStats').innerHTML=`<div><span>SHARDS</span><b>+${data.reward||0}</b></div><div><span>TIME</span><b>${Math.ceil(data.elapsed)}s</b></div><div><span>BONUS</span><b>${data.bonus||0}</b></div>`;$('nextButton').style.display=win&&data.level<100?'block':'none';this.open('resultScreen');this.renderAll()}
  toast(text){const t=$('toast');t.textContent=text;t.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}
}
