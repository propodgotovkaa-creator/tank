import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSyllables,Round,CONSONANTS,VOWELS} from '../logic.js';
test('Точные наборы из ТЗ: 6 открытых, 6 закрытых, 12 смешанных',()=>{
 const s=new Set('МСЛАО');
 assert.deepEqual(new Set(makeSyllables(s,'open')),new Set(['МА','МО','СА','СО','ЛА','ЛО']));
 assert.deepEqual(new Set(makeSyllables(s,'closed')),new Set(['АМ','ОМ','АС','ОС','АЛ','ОЛ']));
 assert.equal(makeSyllables(s,'mixed').length,12);
});
test('Нет невыбранных букв, повторов и запрещённых открытых сочетаний',()=>{
 const s=new Set([...CONSONANTS,...VOWELS]),all=makeSyllables(s,'mixed');
 for(const bad of ['ЖЫ','ШЫ','ЧЯ','ЩЮ','ЧЫ','ЩЫ','ЧЮ','ЩЯ','ЖЯ','ШЯ','ЖЮ','ШЮ'])assert.ok(!all.includes(bad));
 assert.ok(all.includes('ЫЖ'));assert.equal(all.length,new Set(all).size);
 const subset=makeSyllables(new Set('ШИЫ'),'mixed');assert.deepEqual(new Set(subset),new Set(['ШИ','ИШ','ЫШ']));
 assert.equal(makeSyllables(new Set('МСР')).length,0);assert.equal(makeSyllables(new Set('АОУ')).length,0);
});
test('Раунд выдаёт каждый слог один раз, держит не более трёх танков и завершается после исчезновения',()=>{
 const source=makeSyllables(new Set('МСЛАО'),'mixed'),r=new Round(source),seen=[];
 let safety=100;while(!r.complete&&safety--){
  assert.ok(r.slots.filter(Boolean).length<=3);
  r.slots.forEach((t,i)=>{if(t){seen.push(t.syllable);assert.equal(r.hit(i),true);assert.equal(r.hit(i),false)}});
  assert.equal(r.complete,false);r.tick(1);assert.ok(r.slots.some(Boolean));r.tick(.56);
 }
 assert.ok(r.complete);assert.equal(r.read,source.length);assert.equal(new Set(seen).size,source.length);assert.equal(seen.length,source.length);
});
test('Без попадания танк остаётся в раунде; один или два слога не создают лишних танков',()=>{
 const r=new Round(['МА','МО']);const ids=r.slots.filter(Boolean).map(x=>x.id);r.tick(1000);assert.deepEqual(r.slots.filter(Boolean).map(x=>x.id),ids);assert.equal(r.read,0);assert.equal(r.complete,false);
 const single=new Round(['МА','МА']);assert.equal(single.total,1);assert.equal(single.slots.filter(Boolean).length,1);
});
