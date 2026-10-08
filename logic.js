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
export class Round{
 constructor(syllables){this.queue=shuffle([...new Set(syllables)]);this.total=this.queue.length;this.read=0;this.slots=[null,null,null];this.nextId=1;for(let i=0;i<3;i++)this.fill(i)}
 fill(lane){if(this.slots[lane]||!this.queue.length)return null;return this.slots[lane]={id:this.nextId++,syllable:this.queue.pop(),state:'moving',elapsed:0};}
 hit(lane){const t=this.slots[lane];if(!t||t.state!=='moving')return false;t.state='hit';t.elapsed=0;this.read++;return true;}
 tick(dt){const removed=[];for(let lane=0;lane<3;lane++){const t=this.slots[lane];if(t?.state==='hit'){t.elapsed+=dt;if(t.elapsed>=1.55){removed.push(lane);this.slots[lane]=null;this.fill(lane)}}}return removed;}
 get complete(){return this.read===this.total&&this.queue.length===0&&this.slots.every(t=>!t)}
}
