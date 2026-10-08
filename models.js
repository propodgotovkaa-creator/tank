import * as T from './vendor/three.module.min.js';
const UP=new T.Vector3(0,1,0);
const temp=new T.Object3D();
const geo={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,12),sphere:new T.SphereGeometry(1,16,10)};
function material(color,metalness=.28,roughness=.68){return new T.MeshStandardMaterial({color,metalness,roughness})}
function box(parent,mat,x,y,z,sx,sy,sz){const m=new T.Mesh(geo.box,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,mat,x,y,z,radius,length,axis='y',endRadius=radius){let g=geo.cylinder;if(endRadius!==radius)g=new T.CylinderGeometry(endRadius/radius,1,1,16);const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.scale.set(radius,length,radius);if(axis==='x')m.rotation.z=-Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function bevelBox(parent,mat,x,y,z,sx,sy,sz,bevel=.12){const shape=new T.Shape();shape.moveTo(-sx/2,-sy/2);shape.lineTo(sx/2,-sy/2);shape.lineTo(sx/2,sy/2);shape.lineTo(-sx/2,sy/2);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:sz-2*bevel,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel});g.translate(0,0,-sz/2+bevel);const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function metalTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#aaaaaa';ctx.fillRect(0,0,128,128);let s=77;function rnd(){s=(s*1664525+1013904223)>>>0;return s/4294967296}for(let i=0;i<1800;i++){const b=120+Math.floor(rnd()*85);ctx.fillStyle=`rgb(${b},${b},${b})`;ctx.fillRect(rnd()*128,rnd()*128,1+rnd()*2,1)}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let armorTexture;
function beltPoint(distance){const a=1.58,r=.47,L=4*a+2*Math.PI*r;let d=((distance%L)+L)%L;if(d<2*a)return{x:-a+d,y:r,angle:0};d-=2*a;if(d<Math.PI*r){const theta=Math.PI/2-d/r;return{x:a+r*Math.cos(theta),y:r*Math.sin(theta),angle:theta-Math.PI/2}}d-=Math.PI*r;if(d<2*a)return{x:a-d,y:-r,angle:Math.PI};d-=2*a;const theta=-Math.PI/2-d/r;return{x:-a+r*Math.cos(theta),y:r*Math.sin(theta),angle:theta-Math.PI/2};}
export function makeTank(variant=0){
 armorTexture??=metalTexture();
 const green=[0x637441,0x425d3c,0x526846,0x6a7545][variant%4];
 const paint=material(green,.38,.62);paint.map=armorTexture;
 const darkPaint=material(new T.Color(green).multiplyScalar(.72),.4,.65);
 const edge=material(new T.Color(green).multiplyScalar(1.13),.48,.54);
 const steel=material(0x333b31,.65,.73),rubber=material(0x252c25,.1,.9),black=material(0x14241c,.35,.3);
 const root=new T.Group(),body=new T.Group();root.add(body);const mats=[paint,darkPaint,edge,steel,rubber,black];
 const wheels=[],belts=[];
 for(const side of [-1,1]){
  const z=side*1.04;
  box(root,rubber,0,.53,z,3.4,.86,.48);
  for(let i=0;i<7;i++){
   const x=-1.56+i*.52,r=i===0||i===6?.38:.405;
   const wheel=new T.Group();wheel.position.set(x,.55,z);root.add(wheel);wheels.push(wheel);
   cylinder(wheel,rubber,0,0,0,r,.49,'z');cylinder(wheel,paint,0,0,side*.27,r*.79,.07,'z');
   cylinder(wheel,steel,0,0,side*.32,.11,.08,'z');
   for(let b=0;b<3;b++){const a=b*Math.PI*2/3;cylinder(wheel,edge,Math.cos(a)*.20,Math.sin(a)*.20,side*.315,.035,.028,'z');}
  }
  const links=new T.InstancedMesh(new T.BoxGeometry(.18,.10,.58),steel,54);links.castShadow=true;links.receiveShadow=true;root.add(links);belts.push({mesh:links,z});
  box(body,paint,-.04,1.08,z,4.05,.13,.75);
  for(let k=0;k<4;k++){box(body,darkPaint,-1.4+k*.90,1.08,z+side*.035,.03,.17,.77);}
 }
 bevelBox(body,paint,0,1.17,0,3.85,.52,1.73,.12);
 const front=box(body,paint,1.76,1.34,0,.60,.22,1.68);front.rotation.z=-.26;
 box(body,darkPaint,-1.67,1.42,0,.80,.12,1.56);
 for(let i=0;i<8;i++)box(body,steel,-1.96+i*.092,1.495,0,.035,.035,1.0);
 for(const z of [-.70,.70]){
  cylinder(body,steel,1.99,1.14,z,.08,.14,'x');
  box(body,edge,1.47,1.56,z,.23,.13,.20);box(body,black,1.59,1.57,z,.015,.07,.13);
  box(body,darkPaint,-1.71,1.58,z,.45,.26,.32);
 }
 cylinder(body,darkPaint,-.04,1.58,0,.83,.15);
 const turret=new T.Group();turret.position.set(.02,1.68,0);body.add(turret);
 if(variant===0){
  const dome=new T.Mesh(geo.sphere,paint);dome.scale.set(1.10,.52,.91);dome.position.y=.25;dome.castShadow=true;turret.add(dome);
 }else if(variant===1){bevelBox(turret,paint,-.03,.29,0,1.91,.51,1.58,.17);box(turret,darkPaint,-.86,.27,0,.35,.43,1.77);}
 else if(variant===2){const m=cylinder(turret,paint,-.13,.23,0,.95,.59,'y',.72);m.scale.z*=.88;box(turret,darkPaint,-.92,.20,0,.4,.42,1.18);}
 else{bevelBox(turret,paint,-.10,.28,0,2.06,.53,1.76,.09);for(const z of [-.84,.84])for(let i=0;i<3;i++){const plate=box(turret,edge,-.58+i*.52,.24,z,.44,.32,.14);plate.rotation.x=z>0?.15:-.15;}}
 cylinder(turret,darkPaint,.03,.63,-.27,.32,.1);
 cylinder(turret,edge,.03,.70,-.27,.25,.05);
 box(turret,black,.05,.78,-.29,.26,.08,.11);
 cylinder(turret,paint,-.50,.56,.38,.23,.09);
 const barrelLength=[2.5,2.8,2.1,3.05][variant];
 cylinder(turret,darkPaint,.91,.30,0,.27,.50,'x');
 cylinder(turret,paint,1.10+barrelLength/2,.30,0,.09,barrelLength,'x',.065);
 cylinder(turret,edge,1.55,.30,0,.14,.30,'x');
 cylinder(turret,steel,1.10+barrelLength,.30,0,.12,.22,'x');
 cylinder(turret,black,1.22+barrelLength,.30,0,.076,.013,'x');
 if(variant===1||variant===3)box(turret,paint,1.10+barrelLength,.30,0,.32,.19,.21);
 const antenna=cylinder(turret,steel,-.62,1.10,-.54,.014,1.15);antenna.rotation.z=.08;
 box(turret,darkPaint,-.82,.48,.51,.22,.19,.31);
 for(const z of [-.90,.90])for(let i=0;i<6;i++)cylinder(body,edge,-1.3+i*.5,1.42,z,.032,.045,'z');
 let phase=0;
 function animate(dt,speed,time){phase+=dt*speed*2;const L=4*1.58+2*Math.PI*.47;for(const belt of belts){for(let i=0;i<54;i++){const p=beltPoint(i*L/54+phase);temp.position.set(p.x,p.y+.55,belt.z);temp.rotation.set(0,0,p.angle);temp.scale.set(1,1,1);temp.updateMatrix();belt.mesh.setMatrixAt(i,temp.matrix)}belt.mesh.instanceMatrix.needsUpdate=true;}for(const w of wheels)w.rotation.z=-phase/.4;body.position.y=Math.sin(time*5+variant)*.014*Math.min(Math.abs(speed),1);body.rotation.z=Math.sin(time*4+variant)*.008*Math.min(Math.abs(speed),1);}
 function fade(opacity){for(const m of mats){m.transparent=opacity<1;m.opacity=opacity;m.depthWrite=opacity>.1}root.visible=opacity>.01;}
 animate(0,0,0);root.userData.variant=variant;
 return {root,animate,fade,dispose(){root.traverse(o=>{if(o.isMesh&&o.geometry&&!Object.values(geo).includes(o.geometry))o.geometry.dispose()});mats.forEach(m=>m.dispose());}};
}
export function makeGun(){
 const root=new T.Group(),black=material(0x47534f,.42,.45),edge=material(0x65736a,.55,.38),green=material(0x455640,.3,.67),rubber=material(0x1c2422,.16,.83);
 bevelBox(root,black,0,0,.10,.24,.25,.88,.025);
 bevelBox(root,green,0,-.01,-.58,.23,.23,.55,.025);
 cylinder(root,black,0,.055,-1.17,.051,.75,'z');cylinder(root,edge,0,.055,-1.54,.069,.13,'z');
 box(root,black,0,.19,-1.18,.032,.24,.045);box(root,edge,0,.31,-1.18,.13,.033,.045);
 for(const x of [-.065,.065])box(root,black,x,.26,-1.18,.025,.12,.045);
 for(let i=0;i<12;i++)box(root,edge,0,.15,.40-i*.08,.17,.024,.032);
 for(let i=0;i<6;i++)box(root,rubber,0,-.01,-.38-i*.075,.245,.245,.022);
 box(root,black,.143,0,.17,.10,.045,.07);
 const grip=box(root,rubber,0,-.28,.32,.17,.48,.21);grip.rotation.x=-.24;
 const mag=bevelBox(root,black,0,-.32,-.06,.15,.52,.23,.02);mag.rotation.x=.14;
 bevelBox(root,green,0,-.04,.74,.25,.31,.51,.025);
 box(root,rubber,0,-.04,1.0,.29,.36,.07);
 box(root,black,0,.18,.3,.18,.04,.08);
 for(const x of [-.073,.073])box(root,black,x,.24,.3,.028,.14,.08);
 box(root,black,0,.31,.3,.17,.025,.08);
 for(const x of [-.13,.13])for(let i=0;i<3;i++)cylinder(root,edge,x,.015,.15-i*.18,.019,.015,'x');
 const glow=new T.Mesh(new T.SphereGeometry(.105,8,6),new T.MeshBasicMaterial({color:0xffedbe,transparent:true,opacity:.85}));glow.position.set(0,.055,-1.65);glow.scale.set(.7,.7,2);root.add(glow);glow.visible=false;
 return {root,glow};
}
