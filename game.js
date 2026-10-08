import * as T from './vendor/three.module.min.js';
import {CONSONANTS,VOWELS,makeSyllables,Round} from './logic.js';
import {makeTank,makeGun} from './models.js';
import {AudioEngine} from './audio.js';
const $=s=>document.querySelector(s),field=$('#field'),canvas=$('#scene'),labels=$('#labels');
const selected=new Set();let mode='open',state='menu',round=null,actors=[],time=0,previous=performance.now(),width=1,height=1,shotTime=-10;
let renderer;
try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch{$('#error').hidden=false;throw new Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.6;renderer.autoClear=false;
const scene=new T.Scene(),camera=new T.OrthographicCamera(-16,16,9,-9,.1,150);camera.position.set(0,12,26);camera.lookAt(0,0,0);camera.updateMatrixWorld();
scene.add(new T.HemisphereLight(0xf4f5e7,0x7e8754,2.5));
const sun=new T.DirectionalLight(0xfff3d8,3.5);sun.position.set(-10,22,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:70});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun);
const ground=new T.Mesh(new T.PlaneGeometry(150,150),new T.ShadowMaterial({color:0x263521,opacity:.25}));ground.rotation.x=-Math.PI/2;ground.position.y=-.009;ground.receiveShadow=true;scene.add(ground);
// Soft contact shadow keeps every model grounded even on low-resolution screens.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=64;const sctx=shadowCanvas.getContext('2d');const gradient=sctx.createRadialGradient(64,32,3,64,32,63);gradient.addColorStop(0,'rgba(18,28,15,.36)');gradient.addColorStop(1,'rgba(18,28,15,0)');sctx.fillStyle=gradient;sctx.fillRect(0,0,128,64);const shadowTexture=new T.CanvasTexture(shadowCanvas);
const gunScene=new T.Scene(),gunCamera=new T.PerspectiveCamera(42,16/9,.1,20);gunScene.add(new T.HemisphereLight(0xe7f5fd,0x59663c,2.5));const gunLight=new T.DirectionalLight(0xffffff,3);gunLight.position.set(-3,5,2);gunScene.add(gunLight);const gun=makeGun();gunScene.add(gun.root);gun.root.position.set(0,-.85,-2.0);gun.root.rotation.x=-.12;
const audio=new AudioEngine(),aim={x:.5,y:.5},ray=new T.Raycaster(),groundPlane=new T.Plane(new T.Vector3(0,1,0),0),point=new T.Vector3();
const LANES=[{y:.40,scale:.70,speed:.043},{y:.60,scale:.87,speed:.036},{y:.81,scale:1.02,speed:.030}];
function planePoint(x,y){ray.setFromCamera(new T.Vector2(x*2-1,1-y*2),camera);ray.ray.intersectPlane(groundPlane,point);return point.clone();}
function buildLetterGroup(id,letters){for(const l of letters){const b=document.createElement('button');b.className='letter';b.textContent=l;b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',l);b.addEventListener('click',()=>{if(selected.has(l))selected.delete(l);else if(selected.size<15)selected.add(l);updateSelection();});$(id).append(b);}}
buildLetterGroup('#consonants',CONSONANTS);buildLetterGroup('#vowels',VOWELS);
function updateSelection(){document.querySelectorAll('.letter').forEach(b=>{const on=selected.has(b.textContent);b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));b.disabled=!on&&selected.size>=15});$('#selected-count').innerHTML=`Выбрано: <b>${selected.size} / 15</b>`;const count=makeSyllables(selected,mode).length;$('#start').disabled=count===0;$('#syllable-count').innerHTML=count?`Будет <b>${count}</b> ${word(count)}`:selected.size?'Добавьте подходящую<br>согласную и гласную':'Выберите согласную<br>и гласную';}
function word(n){return n%10===1&&n%100!==11?'слог':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'слога':'слогов'}
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('.mode').forEach(m=>{const on=m===b;m.classList.toggle('selected',on);m.setAttribute('aria-checked',String(on));});updateSelection();}));
$('#reset').addEventListener('click',()=>{selected.clear();updateSelection()});
$('#sound').addEventListener('click',()=>{const on=audio.toggle();$('#sound-icon').textContent=on?'♪':'♩';$('#sound-text').textContent=on?'Звук вкл.':'Звук выкл.';$('#sound').setAttribute('aria-label',on?'Выключить звук':'Включить звук');$('#sound').setAttribute('aria-pressed',String(on));});
function removeActor(a){if(!a)return;scene.remove(a.model.root,a.shadow);a.label?.remove();a.model.dispose();a.shadow.geometry.dispose();a.shadow.material.dispose();}
function clearActors(){actors.forEach(removeActor);actors=[];}
function makeActor(lane,record,preview=false){
 const variant=preview?1:Math.floor(Math.random()*4),model=makeTank(variant),settings=LANES[lane];
 const shadow=new T.Mesh(new T.PlaneGeometry(5.4,2.7),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;scene.add(shadow,model.root);
 let label=null;if(!preview){label=document.createElement('button');label.className='tank-label';label.textContent=record.syllable;label.setAttribute('aria-label',`Танк ${record.syllable}`);label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fireAtActor(lane)}});labels.append(label)}
 const a={model,shadow,label,lane,id:record?.id,preview,x:preview?.77:[.22,.69,.42][lane],dir:Math.random()<.5?1:-1,turn:0,scale:preview?1.50:settings.scale};
 if(preview)a.dir=-1;
 model.root.scale.setScalar(a.scale);shadow.scale.setScalar(a.scale);model.root.rotation.y=a.dir===1?-.16:Math.PI+.16;actors[lane]=a;placeActor(a);return a;
}
function placeActor(a){const y=a.preview?.73:LANES[a.lane].y;a.model.root.position.copy(planePoint(a.x,y));a.shadow.position.copy(a.model.root.position);a.shadow.position.y=.012;if(a.label){const top=a.model.root.position.clone();top.y+=2.80*a.scale;top.project(camera);a.label.style.left=`${Math.min(width-35,Math.max(35,(top.x+1)/2*width))}px`;a.label.style.top=`${(1-top.y)/2*height}px`;}}
function showPreview(){clearActors();makeActor(1,null,true);}
function start(){const syllables=makeSyllables(selected,mode);if(!syllables.length)return;audio.unlock();clearActors();round=new Round(syllables);state='playing';time=0;shotTime=-10;$('#menu').hidden=true;$('#finish').hidden=true;$('#hud').hidden=false;document.body.classList.add('playing');round.slots.forEach((r,l)=>{if(r)makeActor(l,r)});updateProgress();setAim(.5,.5);audio.moving(true);}
function menu(){state='menu';round=null;$('#menu').hidden=false;$('#finish').hidden=true;$('#hud').hidden=true;document.body.classList.remove('playing');audio.moving(false);showPreview();$('#start').focus({preventScroll:true});}
function updateProgress(){$('#progress').textContent=`Прочитано: ${round.read} / ${round.total}`;}
function finish(){state='finished';audio.moving(false);audio.win();$('#finish-count').textContent=`Прочитано: ${round.total} из ${round.total}`;$('#finish').hidden=false;document.body.classList.remove('playing');$('#again').focus({preventScroll:true});}
$('#start').addEventListener('click',start);$('#again').addEventListener('click',start);$('#menu-button').addEventListener('click',menu);$('#finish-menu').addEventListener('click',menu);
function setAim(x,y){aim.x=T.MathUtils.clamp(x,0,1);aim.y=T.MathUtils.clamp(y,0,1);$('#reticle').style.left=`${aim.x*100}%`;$('#reticle').style.top=`${aim.y*100}%`;}
function pointer(e){const r=field.getBoundingClientRect();setAim((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);}
field.addEventListener('pointermove',e=>{if(state==='playing')pointer(e)});
field.addEventListener('pointerdown',e=>{if(state!=='playing'||e.button!==0||e.target.closest('#hud'))return;e.preventDefault();pointer(e);shoot(e.target.closest('.tank-label'));});
function shoot(label=null){if(state!=='playing')return;audio.unlock();shotTime=time;audio.shot();let hitActor=null;
 if(label)hitActor=actors.find(a=>a?.label===label);
 if(!hitActor){ray.setFromCamera(new T.Vector2(aim.x*2-1,1-aim.y*2),camera);const hits=ray.intersectObjects(actors.filter(Boolean).map(a=>a.model.root),true);if(hits.length){hitActor=actors.find(a=>{let o=hits[0].object;while(o){if(o===a?.model.root)return true;o=o.parent}return false})}}
 if(hitActor&&round.hit(hitActor.lane)){audio.hit();updateProgress();const spark=$('#spark');spark.style.left=`${aim.x*100}%`;spark.style.top=`${aim.y*100}%`;spark.classList.remove('flash');void spark.offsetWidth;spark.classList.add('flash');hitActor.label.setAttribute('aria-label',`${hitActor.label.textContent} — прочитано`);}
}
function fireAtActor(lane){const a=actors[lane];if(!a||state!=='playing')return;setAim(a.x,LANES[lane].y-.06);shoot(a.label)}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state!=='menu')menu()});
function resize(){width=field.clientWidth;height=field.clientHeight;renderer.setSize(width,height,false);gunCamera.aspect=width/height;gunCamera.updateProjectionMatrix();actors.forEach(a=>a&&placeActor(a));}
new ResizeObserver(resize).observe(field);resize();showPreview();updateSelection();
document.addEventListener('visibilitychange',()=>{previous=performance.now();audio.moving(!document.hidden&&state==='playing')});
function animate(now){requestAnimationFrame(animate);const dt=document.hidden?0:Math.min((now-previous)/1000,.05);previous=now;time+=dt;
 if(state==='playing'){
  for(const a of actors){if(!a)continue;const record=round.slots[a.lane];if(!record)continue;const brake=record.state==='hit'?Math.max(0,1-record.elapsed/.3):1;
   if(a.turn>0&&brake>0){a.turn=Math.max(0,a.turn-dt);const from=a.dir===1?Math.PI+.16:-.16,to=a.dir===1?Math.PI*2-.16:Math.PI+.16;const ease=1-Math.pow(a.turn/.65,2);a.model.root.rotation.y=from+(to-from)*ease;}
   else {a.x+=a.dir*LANES[a.lane].speed*dt*brake;if(a.x>.82||a.x<.18){a.x=T.MathUtils.clamp(a.x,.18,.82);a.dir*=-1;a.turn=.65;}}
   a.model.animate(dt,brake*(a.turn>0?.22:1.1),time);const opacity=record.state==='hit'?Math.min(1,Math.max(0,(1.55-record.elapsed)/.45)):1;a.model.fade(opacity);a.shadow.material.opacity=opacity;a.label.style.opacity=opacity;placeActor(a);
  }
  for(const lane of round.tick(dt)){removeActor(actors[lane]);actors[lane]=null;if(round.slots[lane])makeActor(lane,round.slots[lane])}
  audio.moving(round.slots.some(r=>r?.state==='moving'));
  if(round.complete)finish();
 }else if(state==='menu')actors.forEach(a=>a?.model.animate(dt,0,time));
 const kick=Math.max(0,1-(time-shotTime)/.17);gun.root.position.set(.10+(aim.x-.5)*.16,-.91-kick*.04,-2.55+kick*.10);const targetX=(aim.y-.5)*.26-.10,targetY=.12-(aim.x-.5)*.48;gun.root.rotation.x=T.MathUtils.damp(gun.root.rotation.x,targetX+kick*.06,18,dt);gun.root.rotation.y=T.MathUtils.damp(gun.root.rotation.y,targetY,18,dt);gun.glow.visible=time-shotTime<.055&&state==='playing';
 renderer.clear();renderer.render(scene,camera);if(state==='playing'||state==='finished'){renderer.clearDepth();renderer.render(gunScene,gunCamera)}
}
requestAnimationFrame(animate);
