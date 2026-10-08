export const CONSONANTS=[...'БВГДЖЗКЛМНПРСТФХЦЧШЩ'];
export const VOWELS=[...'АОУЫЭИЕЁЮЯ'];
const FORBIDDEN=new Set(['ЖЫ','ШЫ','ЧЫ','ЩЫ','ЧЯ','ЩЯ','ЧЮ','ЩЮ','ЖЯ','ШЯ','ЖЮ','ШЮ']);
export function makeSyllables(selected,mode='open'){
 const result=[];
 for(const c of CONSONANTS)for(const v of VOWELS){
  if(!selected.has(c)||!selected.has(v))continue;
  if(mode!=='closed'&&!FORBIDDEN.has(c+v))result.push(c+v);
  if(mode!=='open')result.push(v+c);
 }
 return [...new Set(result)];
}
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
export const COUNTERATTACK_DELAY=12;
export function replacementEntry(previousDirection){const direction=-previousDirection;return {direction,x:direction===1?-.14:1.14};}
export class Counterattack{
 constructor(delay=COUNTERATTACK_DELAY){this.delay=delay;this.idle=0;this.elapsed=null;this.fired=false;}
 tick(dt,active=true){
  if(!active){this.cancel();return {started:false,fire:false,finished:false};}
  let started=false,fire=false,finished=false;
  if(this.elapsed===null){this.idle+=dt;if(this.idle>=this.delay){this.elapsed=0;this.fired=false;started=true;}}
  else {this.elapsed+=dt;if(this.elapsed>=1&&!this.fired){this.fired=true;fire=true;}if(this.elapsed>=2.5){this.elapsed=null;this.idle=0;finished=true;}}
  return {started,fire,finished};
 }
 cancel(){this.elapsed=null;this.idle=0;this.fired=false;}
 get active(){return this.elapsed!==null;}
}
export class Round{
 constructor(syllables){this.queue=shuffle([...new Set(syllables)]);this.total=this.queue.length;this.read=0;this.slots=[null,null,null];this.nextId=1;for(let i=0;i<3;i++)this.fill(i)}
 fill(lane){if(this.slots[lane]||!this.queue.length)return null;return this.slots[lane]={id:this.nextId++,syllable:this.queue.pop(),state:'moving',elapsed:0};}
 hit(lane){const t=this.slots[lane];if(!t||t.state!=='moving')return false;t.state='hit';t.elapsed=0;this.read++;return true;}
 tick(dt){const removed=[];for(let lane=0;lane<3;lane++){const t=this.slots[lane];if(t?.state==='hit'){t.elapsed+=dt;if(t.elapsed>=1.55){removed.push(lane);this.slots[lane]=null;this.fill(lane)}}}return removed;}
 get complete(){return this.read===this.total&&this.queue.length===0&&this.slots.every(t=>!t)}
}
