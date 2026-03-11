// ── CURSOR ──────────────────────────────────
const cur=document.getElementById('cur'),curR=document.getElementById('cur-r');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
(function lr(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;curR.style.left=rx+'px';curR.style.top=ry+'px';requestAnimationFrame(lr);})();
document.querySelectorAll('a,button,.proj-card,.domain-card,.exp-row').forEach(el=>{
  el.addEventListener('mouseenter',()=>{cur.style.transform='translate(-50%,-50%) scale(2.4)';curR.style.width='52px';curR.style.height='52px';});
  el.addEventListener('mouseleave',()=>{cur.style.transform='translate(-50%,-50%) scale(1)';curR.style.width='36px';curR.style.height='36px';});
});

// ── BG PARTICLE NETWORK — dynamic color shift ──
const PALETTES=[
  {dot:[0.0,0.90,0.63], line:[0.0,0.90,0.63]},   // emerald
  {dot:[0.27,0.35,1.0], line:[0.27,0.35,1.0]},   // electric blue
  {dot:[0.90,0.00,0.29],line:[0.90,0.00,0.29]},  // crimson
  {dot:[0.85,0.75,0.00],line:[0.85,0.75,0.00]},  // gold
  {dot:[0.60,0.20,1.0], line:[0.60,0.20,1.0]},   // violet
  {dot:[1.0,0.40,0.00], line:[1.0,0.40,0.00]},   // orange
  {dot:[0.0,0.75,1.0],  line:[0.0,0.75,1.0]},    // cyan
  {dot:[1.0,0.20,0.60], line:[1.0,0.20,0.60]},   // hot pink
];
function lerpC(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}

const c3=document.getElementById('bg');
const renderer=new THREE.WebGLRenderer({canvas:c3,alpha:true,antialias:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,0.1,1000);
camera.position.z=5;

const N=window.innerWidth<600?100:250;
const SPR={x:15,y:9.5};
const pos=new Float32Array(N*3);
const vel=[];
for(let i=0;i<N;i++){
  const x=(Math.random()-.5)*SPR.x,y=(Math.random()-.5)*SPR.y;
  pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=(Math.random()-.5)*2;
  vel.push({x:(Math.random()-.5)*.008,y:(Math.random()-.5)*.008,ox:x,oy:y});
}
const ptGeo=new THREE.BufferGeometry();
ptGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
const ptMat=new THREE.PointsMaterial({color:0x00e5a0,size:.055,transparent:true,opacity:.88,sizeAttenuation:true});
scene.add(new THREE.Points(ptGeo,ptMat));
const lMat=new THREE.LineBasicMaterial({color:0x00e5a0,transparent:true,opacity:.11});
let lObj=null;

function rebuildLines(){
  const lp=[];
  for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){
    const dx=pos[i*3]-pos[j*3],dy=pos[i*3+1]-pos[j*3+1],d=Math.sqrt(dx*dx+dy*dy);
    if(d<1.9)lp.push(pos[i*3],pos[i*3+1],pos[i*3+2],pos[j*3],pos[j*3+1],pos[j*3+2]);
  }
  if(lObj){scene.remove(lObj);lObj.geometry.dispose();}
  const lg=new THREE.BufferGeometry();
  lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(lp),3));
  lObj=new THREE.LineSegments(lg,lMat);scene.add(lObj);
}

// color state
let pi=0,ni=1,pt=0,ht=0,inT=false;
let lastT=performance.now();

function tickCol(dt){
  if(!inT){ht+=dt;if(ht>=3.5){ht=0;inT=true;pt=0;ni=(pi+1)%PALETTES.length;}}
  else{
    pt+=dt/4.5;if(pt>=1){pt=1;inT=false;pi=ni;}
    const dc=lerpC(PALETTES[pi].dot,PALETTES[ni].dot,pt);
    const lc=lerpC(PALETTES[pi].line,PALETTES[ni].line,pt);
    ptMat.color.setRGB(dc[0],dc[1],dc[2]);
    lMat.color.setRGB(lc[0],lc[1],lc[2]);
  }
}

let mouse3={x:9999,y:9999};let scrollY=0;
window.addEventListener('scroll',()=>{scrollY=window.scrollY;});
document.addEventListener('mousemove',e=>{
  mouse3.x=(e.clientX/window.innerWidth-.5)*SPR.x;
  mouse3.y=-(e.clientY/window.innerHeight-.5)*SPR.y;
});
const shockwaves=[];
document.addEventListener('click',e=>{
  shockwaves.push({x:(e.clientX/window.innerWidth-.5)*SPR.x,y:-(e.clientY/window.innerHeight-.5)*SPR.y,r:0,life:1});
});

let frame=0;
function animate(){
  requestAnimationFrame(animate);frame++;
  const now=performance.now(),dt=(now-lastT)/1000;lastT=now;
  tickCol(dt);

  for(let s=shockwaves.length-1;s>=0;s--){
    const sw=shockwaves[s];sw.r+=.12;sw.life-=.022;
    if(sw.life<=0){shockwaves.splice(s,1);continue;}
    for(let i=0;i<N;i++){
      const dx=pos[i*3]-sw.x,dy=pos[i*3+1]-sw.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<sw.r+.4&&d>sw.r-.15){const f=(1-d/(sw.r+.4))*.1*sw.life;vel[i].x+=dx/Math.max(d,.01)*f;vel[i].y+=dy/Math.max(d,.01)*f;}
    }
  }
  for(let i=0;i<N;i++){
    const mdx=pos[i*3]-mouse3.x,mdy=pos[i*3+1]-mouse3.y,md=Math.sqrt(mdx*mdx+mdy*mdy);
    if(md<1.3&&md>.01){const f=(1-md/1.3)*.007;vel[i].x+=mdx/md*f;vel[i].y+=mdy/md*f;}
    vel[i].x+=(vel[i].ox-pos[i*3])*.0004;vel[i].y+=(vel[i].oy-pos[i*3+1])*.0004;
    vel[i].x*=.96;vel[i].y*=.96;
    pos[i*3]+=vel[i].x;pos[i*3+1]+=vel[i].y;
    const bx=SPR.x*.5+.5,by=SPR.y*.5+.5;
    if(pos[i*3]>bx)pos[i*3]=-bx;if(pos[i*3]<-bx)pos[i*3]=bx;
    if(pos[i*3+1]>by)pos[i*3+1]=-by;if(pos[i*3+1]<-by)pos[i*3+1]=by;
  }
  ptGeo.attributes.position.needsUpdate=true;
  if(frame%3===0)rebuildLines();
  camera.position.y=-scrollY*.0018;
  camera.position.x+=(mouse3.x*.035-camera.position.x)*.03;
  camera.lookAt(scene.position);
  renderer.render(scene,camera);
}
animate();
window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});

// ── PROJECT MINI-CANVASES — dynamic color shift ──
const cPals=[
  [{d:'#00e5a0',l:'#00e5a0'},{d:'#4560ff',l:'#4560ff'},{d:'#e5004a',l:'#e5004a'},{d:'#d9bf00',l:'#d9bf00'}],
  [{d:'#e5004a',l:'#e5004a'},{d:'#992fff',l:'#992fff'},{d:'#ff6600',l:'#ff6600'},{d:'#00bfff',l:'#00bfff'}],
  [{d:'#992fff',l:'#992fff'},{d:'#ff3399',l:'#ff3399'},{d:'#00e5a0',l:'#00e5a0'},{d:'#d9bf00',l:'#d9bf00'}],
  [{d:'#d9bf00',l:'#d9bf00'},{d:'#00e5a0',l:'#00e5a0'},{d:'#ff3399',l:'#ff3399'},{d:'#4560ff',l:'#4560ff'}],
  [{d:'#0c98cb',l:'#e5004a'},{d:'#992fff',l:'#992fff'},{d:'#ff6600',l:'#ff6600'},{d:'#00bfff',l:'#00bfff'}],

];
const cBgs=[['#05100a','#091a10'],['#10050c','#1a0910'],['#070512','#10091a'],['#0c0a04','#18150a'],['#070512','#10091a']];

function lerpHex(a,b,t){
  const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);
  const ar=pa>>16&0xff,ag=pa>>8&0xff,ab=pa&0xff,br=pb>>16&0xff,bg=pb>>8&0xff,bb=pb&0xff;
  return'#'+[ar+(br-ar)*t,ag+(bg-ag)*t,ab+(bb-ab)*t].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
}

['pc1','pc2','pc3','pc4', 'pc5'].forEach((id,idx)=>{
  const c=document.getElementById(id);if(!c)return;
  const ctx=c.getContext('2d');
  function rsz(){c.width=c.offsetWidth||700;c.height=c.offsetHeight||280;}
  rsz();window.addEventListener('resize',rsz);
  const PN=55;
  const pp=Array.from({length:PN},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5}));
  const pals=cPals[idx];
  let ci=0,nxi=1,ct2=0,ht2=0,inT2=false,dot=pals[0].d,lin=pals[0].l,lt2=performance.now();
  function draw(){
    const now2=performance.now(),dt2=(now2-lt2)/1000;lt2=now2;
    if(!inT2){ht2+=dt2;if(ht2>=4.5){ht2=0;inT2=true;ct2=0;nxi=(ci+1)%pals.length;}}
    else{ct2+=dt2/5;if(ct2>=1){ct2=1;inT2=false;ci=nxi;}dot=lerpHex(pals[ci].d,pals[nxi].d,ct2);lin=lerpHex(pals[ci].l,pals[nxi].l,ct2);}
    ctx.clearRect(0,0,c.width,c.height);
    const g=ctx.createLinearGradient(0,0,c.width,c.height);
    g.addColorStop(0,cBgs[idx][0]);g.addColorStop(1,cBgs[idx][1]);
    ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);
    pp.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>c.width)p.vx*=-1;if(p.y<0||p.y>c.height)p.vy*=-1;});
    for(let i=0;i<PN;i++)for(let j=i+1;j<PN;j++){
      const dx=pp[i].x-pp[j].x,dy=pp[i].y-pp[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<115){ctx.beginPath();ctx.moveTo(pp[i].x,pp[i].y);ctx.lineTo(pp[j].x,pp[j].y);
      ctx.strokeStyle=lin+Math.floor((1-d/115)*40).toString(16).padStart(2,'0');ctx.lineWidth=.8;ctx.stroke();}
    }
    pp.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,Math.PI*2);ctx.fillStyle=dot;ctx.fill();});
    requestAnimationFrame(draw);
  }
  draw();
});

// ── SCROLL REVEAL ────────────────────────────
const io=new IntersectionObserver(e=>e.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);}}),{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
