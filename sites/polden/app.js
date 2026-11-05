/* Полдень — солнечная механика, квартал, мини-карта двора, календарь, норма, сравнение, PDF. */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RAD=Math.PI/180,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),norm360=v=>((Math.round(v)%360)+360)%360;
const easeIO=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mix=(a,b,t)=>{const h=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)),A=h(a),B=h(b); return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`;};
const MNOM='январь февраль март апрель май июнь июль август сентябрь октябрь ноябрь декабрь'.split(' '),MSHORT=MNOM.map(m=>m.slice(0,3)),MLEN=[31,28,31,30,31,30,31,31,30,31,30,31];
const dayName=N=>{let m=0,d=N; while (d>MLEN[m]) {d-=MLEN[m]; m++;} const n=MNOM[m]; return `${d} ${/[ьй]$/.test(n)?n.slice(0,-1)+'я':n+'а'}`;};
const fmtH=min=>{const h=Math.floor(min/60),m=Math.round(min%60); return h?`${h}\u00a0ч${m?' '+m+'\u00a0мин':''}`:`${m}\u00a0мин`;}; // nbsp перед единицами
const pad=v=>String(v).padStart(2,'0'),fmtT=min=>`${pad(Math.floor(min/60))}:${pad(min%60)}`;
const fmt1=v=>v.toFixed(1).replace('.',','),fmtN=v=>Math.round(v).toLocaleString('ru-RU');
const dirFull=az=>'север,северо-восток,восток,юго-восток,юг,юго-запад,запад,северо-запад'.split(',')[Math.round(az/45)%8];
const sideName=az=>az>=45&&az<135?'утренняя сторона':az>=135&&az<225?'обеденная сторона':az>=225&&az<=315?'вечерняя сторона':'северная сторона, прямого солнца почти нет';
const G=px=>`${px}px "Golos Text"`,rect4=b=>[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]];
function hull(pts) {// выпуклая оболочка для контуров теней
  const p=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
  for (const q of p) {while (lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0) lo.pop(); lo.push(q);}
  for (let i=p.length-1; i>=0; i--) {const q=p[i]; while (up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0) up.pop(); up.push(q);}
  return lo.slice(0,-1).concat(up.slice(0,-1));
}
const shadowOf=(pts,sA,cA,L)=>hull(pts.concat(pts.map(q=>[q[0]-sA*L,q[1]-cA*L]))); // тень: контур крыши, сдвинутый вдоль (−sinA, −cosA)

// --- появление по прокрутке, count-up, навигация ---
const revealAll=()=>{const h=innerHeight; $$('.reveal:not(.in)').forEach(el=>{if (el.getBoundingClientRect().top<h*.92) {el.classList.add('in'); $$('.num[data-count]',el).forEach(countUp);}});};
addEventListener('scroll',revealAll,{passive: true}); addEventListener('resize',revealAll); setTimeout(revealAll,60); setTimeout(revealAll,600);
function countUp(el) {if (el.dataset.done||reduced) return; el.dataset.done=1; const to=+el.dataset.count,t0=performance.now(); const step=now=>{const p=Math.min(1,(now-t0)/900); el.textContent=Math.round(to*(1-Math.pow(1-p,3))); if (p<1) requestAnimationFrame(step);}; requestAnimationFrame(step);}
const nav=$('#nav'),burger=$('#burger');
burger.onclick=()=>{const open=nav.classList.toggle('open'); burger.setAttribute('aria-expanded',open); burger.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');};
$$('#menu a').forEach(a=>a.onclick=()=>{nav.classList.remove('open'); burger.setAttribute('aria-expanded','false');});
$('#year').textContent=new Date().getFullYear();

// --- солнечная механика: функции без замыканий, их текст уходит в Web Worker ---
function solarPos(N,t,lat,lon,tz) {// день года, минуты → высота h, азимут A (0 север, 90 восток)
  const R=Math.PI/180,B=360/365*(N-81)*R,d=23.44*R*Math.sin(B),E=9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);
  const H=15*((t+4*(lon-15*tz)+E)/60-12)*R,f=lat*R;
  const h=Math.asin(Math.sin(f)*Math.sin(d)+Math.cos(f)*Math.cos(d)*Math.cos(H));
  return {h: h/R,A: (Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(f)-Math.tan(d)*Math.cos(f))/R+540)%360};
}
function isBlocked(nb,ox,oy,z0,sA,cA,tanh) {// slab-метод: расстояние до дома, закрывающего луч, или -1
  const dx=sA||1e-9,dy=cA||1e-9;
  for (let i=0; i<nb.length; i++) {
    const b=nb[i]; let t1=(b.x-ox)/dx,t2=(b.x+b.w-ox)/dx,u1=(b.y-oy)/dy,u2=(b.y+b.h-oy)/dy,s;
    if (t1>t2) {s=t1; t1=t2; t2=s;} if (u1>u2) {s=u1; u1=u2; u2=s;}
    const tin=Math.max(t1,u1,0); if (Math.min(t2,u2)>=tin&&z0+tin*tanh<b.f*3) return tin;
 }
  return -1;
}
function computeYear(c) {// минуты солнца и самая длинная серия на каждый день года
  const R=Math.PI/180,z0=(c.floor-1)*c.fh+1.5,from=c.from||1,to=c.to||365,days=new Int16Array(365),runs=new Int16Array(365);
  const k=10.2/Math.max(Math.abs(Math.sin(c.az*R)),Math.abs(Math.cos(c.az*R))),ox=Math.sin(c.az*R)*k,oy=Math.cos(c.az*R)*k;
  for (let N=from; N<=to; N++) {
    let sum=0,run=0,best=0;
    for (let t=300; t<=1260; t+=10) {
      const p=solarPos(N,t,c.lat,c.lon,c.tz); let lit=false;
      if (p.h>1) {let da=Math.abs(p.A-c.az); if (da>180) da=360-da; if (da<=85) lit=isBlocked(c.nb,ox,oy,z0,Math.sin(p.A*R),Math.cos(p.A*R),Math.tan(p.h*R))<0;}
      if (lit) {sum+=10; run+=10; if (run>best) best=run;} else run=0;
   }
    days[N-1]=sum; runs[N-1]=best;
 }
  return {days,runs};
}
const calc=(()=>{// воркер из текста функций, иначе главный поток
  const jobs=new Map(); let id=0,worker=null;
  try {
    worker=new Worker(URL.createObjectURL(new Blob([[solarPos,isBlocked,computeYear].map(f=>f.toString()).join('\n')+'\nonmessage=e=>{const r=computeYear(e.data.c);postMessage({id:e.data.id,days:r.days,runs:r.runs},[r.days.buffer,r.runs.buffer])}'],{type: 'text/javascript'})));
    worker.onmessage=e=>{const j=jobs.get(e.data.id); jobs.delete(e.data.id); j&&j.cb(e.data);};
    worker.onerror=()=>{worker=null; jobs.forEach(j=>j.cb(computeYear(j.c))); jobs.clear();};
 } catch (e) {worker=null;}
  return (c,cb)=>{if (worker) {jobs.set(++id,{c,cb}); worker.postMessage({id,c});} else setTimeout(()=>cb(computeYear(c)),0);};
})();
const mkCfg=(az,floor,nb,city)=>({az,floor,fh: 3,nb,...cityOf(city)});
const all=(items,mk,done)=>{const out=[]; let n=0; items.forEach((p,i)=>calc(mk(p),r=>{out[i]=r; if (++n===items.length) done(out);}));};
function summarize(r,az) {
  const months=[]; let i=0,total=0;
  for (let m=0; m<12; m++) {let s=0; for (let k=0; k<MLEN[m]; k++,i++) s+=r.days[i]; months.push(s/MLEN[m]/60); total+=s;}
  let worst=81,worstRun=1e9; for (let N=81; N<=265; N++) if (r.runs[N-1]<worstRun) {worstRun=r.runs[N-1]; worst=N;}
  const avg3=ms=>ms.reduce((a,m)=>a+months[m],0)/3;
  return {months,total: total/60,avg: total/365/60,mx: months.indexOf(Math.max(...months)),mn: months.indexOf(Math.min(...months)),ok: worstRun>=150,worst,worstRun,az,summer: avg3([5,6,7]),winter: avg3([11,0,1])};
}

// --- компас: drag с инерцией (затухание 0,9), клавиатура ---
function compass(el,o) {
  el.classList.add(o.cls||'md'); let v=o.value||0,vel=0,last=null,raf=0,drag=false;
  el.innerHTML=`<svg viewBox="0 0 100 100"><circle class="ring" cx="50" cy="50" r="48"/><circle class="tick" cx="50" cy="50" r="45" stroke-width="5" stroke-dasharray="1 ${2*Math.PI*45/36-1}"/><circle class="tick major" cx="50" cy="50" r="43" stroke-width="9" stroke-dasharray="1.2 ${2*Math.PI*43/4-1.2}"/><text x="50" y="13">С</text><text x="88" y="50">В</text><text x="50" y="88">Ю</text><text x="12" y="50">З</text><g class="rot"><rect class="house" x="41" y="41" width="18" height="18"/><line class="win" x1="45" y1="41" x2="55" y2="41"/><path class="needle" d="M50 17l5 10h-10z"/></g></svg>`;
  const rot=$('.rot',el);
  const set=(nv,fire)=>{v=((nv%360)+360)%360; rot.setAttribute('transform',`rotate(${v} 50 50)`); el.setAttribute('aria-valuenow',Math.round(v)); el.setAttribute('aria-valuetext',`${Math.round(v)}°, ${dirFull(v)}`); fire&&o.onInput(norm360(v));};
  const ang=e=>{const r=el.getBoundingClientRect(); return Math.atan2(e.clientX-r.left-r.width/2,-(e.clientY-r.top-r.height/2))/RAD;};
  el.addEventListener('pointerdown',e=>{drag=true; vel=0; cancelAnimationFrame(raf); last={a: ang(e),t: e.timeStamp}; el.setPointerCapture(e.pointerId); e.preventDefault();});
  el.addEventListener('pointermove',e=>{if (!drag) return; const a=ang(e),d=((a-last.a+540)%360)-180; vel=d/Math.max(1,e.timeStamp-last.t)*16; last={a,t: e.timeStamp}; set(v+d,true);});
  const end=()=>{if (!drag) return; drag=false; if (reduced) return; const spin=()=>{if (Math.abs(vel)<.05) return; set(v+vel,true); vel*=.9; raf=requestAnimationFrame(spin);}; spin();};
  el.onpointerup=el.onpointercancel=end;
  el.addEventListener('keydown',e=>{const k={ArrowRight: 1,ArrowUp: 1,ArrowLeft: -1,ArrowDown: -1}[e.key]; if (k) {e.preventDefault(); set(v+k*(e.shiftKey?10:1),true);}});
  set(v); return {set: nv=>set(nv,false)};
}

// --- hero: изометрический квартал, солнце по дуге за 6 с, тени покадрово ---
(function hero() {
  const cv=$('#hero-canvas'),ctx=cv.getContext('2d');
  const NB=[{x: 3,y: -62,w: 30,h: 16,f: 25},{x: -58,y: -40,w: 16,h: 30,f: 14},{x: 40,y: 2,w: 20,h: 26,f: 9},{x: -44,y: 36,w: 30,h: 14,f: 4}];
  const C={lat: 55.75,lon: 37.62,tz: 3},st={az: 160,N: 81,time: 720,glow: 0,hours: 0,shown: 0,px: 0,py: 0,rise: 360,set: 1140,manual: 0};
  const timeIn=$('#hero-time'),clock=$('#hero-clock'),hoursOut=$('#hero-hours'),dateIn=$('#hero-date');
  let W=0,Hh=0,K=2.4,cx=0,cy=0,dirty=1,more=false,lastNow=0,t0=performance.now(),resume=0;
  const P=(x,y,z)=>[cx+(x-y)*.866*K+st.px,cy+(x+y)*.5*K-z*K+st.py]; // локальные метры → пиксели
  const rot=(x,y,inv)=>{const r=(inv?-1:1)*(90-st.az)*RAD,c=Math.cos(r),s=Math.sin(r); return [x*c+y*s,y*c-x*s];}; // мир ↔ локаль
  const poly=pts=>{ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();};
  const glowAt=(x,y,r,a)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(255,217,138,${a})`); g.addColorStop(1,'rgba(255,217,138,0)'); ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);};
  function resize() {const r=cv.getBoundingClientRect(),d=devicePixelRatio||1; W=r.width; Hh=r.height; cv.width=Math.round(W*d); cv.height=Math.round(Hh*d); ctx.setTransform(d,0,0,d,0,0); K=2.4*Math.min(1,W/480,Hh/460); cx=W/2; cy=Hh*.62; dirty=1;}
  function day() {// восход, закат, часы солнца в окне
    let rise=1260,set=300; for (let t=240; t<=1320; t+=10) if (solarPos(st.N,t,C.lat,C.lon,C.tz).h>0) {rise=Math.min(rise,t); set=Math.max(set,t);}
    st.rise=clamp(rise-30,300,1260); st.set=clamp(set+30,300,1260);
    st.hours=computeYear({...C,az: st.az,floor: 3,fh: 3,nb: NB,from: st.N,to: st.N}).days[st.N-1];
    $('#hero-badge').textContent='Москва · '+dayName(st.N); dirty=1;
 }
  function box(b,sA,cA,up,tanh,all) {// коробка дома; у центрального — окно и тень соседей на фасаде
    const n=b.pts.length; let area=0; for (let i=0; i<n; i++) {const a=b.pts[i],c=b.pts[(i+1)%n]; area+=a[0]*c[1]-c[0]*a[1];} const o=area>0?1:-1;
    ctx.lineWidth=1;
    for (let i=0; i<n; i++) {
      const a=b.pts[i],c=b.pts[(i+1)%n],len=Math.hypot(c[0]-a[0],c[1]-a[1]),nx=o*(c[1]-a[1])/len,ny=-o*(c[0]-a[0])/len;
      if (nx+ny<=0) continue;
      const lit=up&&nx*sA+ny*cA>0,base=b.center?'#FFF8EA':'#DAD5C9',face=[P(a[0],a[1],0),P(c[0],c[1],0),P(c[0],c[1],b.h),P(a[0],a[1],b.h)];
      ctx.fillStyle=lit?base:mix(base,'#1C2742',.25); ctx.strokeStyle='rgba(28,39,66,.4)'; poly(face); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='rgba(28,39,66,.14)'; ctx.beginPath(); for (let z=3; z<b.h; z+=3) {const p0=P(a[0],a[1],z),p1=P(c[0],c[1],z); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]);} ctx.stroke();
      if (!b.center) continue;
      const q=u=>[a[0]+(c[0]-a[0])*u,a[1]+(c[1]-a[1])*u]; ctx.strokeStyle='rgba(28,39,66,.45)';
      for (let k=0; k<6; k++) for (const u of [.09,.39,.69]) {// окна 3×6, одно — окно квартиры
        const hot=i===1&&k===2&&u===.39,p0=q(u),p1=q(u+.22),z0=k*3+.6,z1=k*3+2.7;
        ctx.fillStyle=hot?mix('#55607A','#FFD98A',st.glow):'rgba(28,39,66,.12)'; poly([P(p0[0],p0[1],z0),P(p1[0],p1[1],z0),P(p1[0],p1[1],z1),P(p0[0],p0[1],z1)]); ctx.fill(); ctx.stroke();
        if (hot&&st.glow>.02) {const m=q(.5),g=P(m[0],m[1],7.65); glowAt(g[0],g[1],12*K+8,.85*st.glow);}
     }
      const dot=nx*sA+ny*cA; if (!lit||dot<.05) continue;
      ctx.save(); poly(face); ctx.clip(); ctx.fillStyle='rgba(28,39,66,.18)'; const na=nx*a[0]+ny*a[1];
      all.forEach(q=>{if (q.center) return; const pts=[]; for (const p of q.pts) {const t=(nx*p[0]+ny*p[1]-na)/dot; if (t<=0) {pts.length=0; break;} const x=p[0]-t*sA,y=p[1]-t*cA; pts.push(P(x,y,-t*tanh),P(x,y,q.h-t*tanh));} if (pts.length) {poly(hull(pts)); ctx.fill();}});
      ctx.restore();
   }
    ctx.fillStyle=b.center?'#F4ECDA':'#E9E4D9'; ctx.strokeStyle='rgba(28,39,66,.4)'; poly(b.pts.map(q=>P(q[0],q[1],b.h))); ctx.fill(); ctx.stroke();
 }
  function draw(dt) {
    const p=solarPos(st.N,st.time,C.lat,C.lon,C.tz),up=p.h>0,Al=(p.A+90-st.az)*RAD,sA=Math.sin(Al),cA=Math.cos(Al),tanh=Math.tan(Math.max(p.h,.6)*RAD),sh=Math.sin(p.h*RAD);
    const dusk=clamp(1-p.h/12,0,1),g=ctx.createLinearGradient(0,0,0,Hh); g.addColorStop(0,mix('#BFD8E8','#F2C7A0',dusk*.85)); g.addColorStop(1,mix('#F7EFDF','#F4D4B4',dusk*.7)); ctx.fillStyle=g; ctx.fillRect(0,0,W,Hh);
    const top=cy-80*K-30+st.py*.5; // горизонт солнца — над верхней вершиной ромба земли; x — по азимуту, высота — по углу над горизонтом
    if (p.h>-5) {const sx=cx+(sA-cA)*.3*W-st.px*.5,sy=top-sh*(top-30); ctx.globalAlpha=clamp(1+p.h/5,0,1); glowAt(sx,sy,90,.8); ctx.fillStyle='#E8A33D'; ctx.beginPath(); ctx.arc(sx,sy,14,0,7); ctx.fill(); ctx.globalAlpha=1;}
    const ground=[P(-80,-80,0),P(80,-80,0),P(80,80,0),P(-80,80,0)]; ctx.fillStyle='#F0E7D4'; poly(ground); ctx.fill();
    ctx.strokeStyle='rgba(28,39,66,.08)'; ctx.lineWidth=1; ctx.beginPath(); for (let i=-80; i<=80; i+=10) {let a=P(i,-80,0),b=P(i,80,0); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); a=P(-80,i,0); b=P(80,i,0); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]);} ctx.stroke();
    const boxes=NB.map(b=>({pts: rect4(b).map(q=>rot(q[0],q[1])),h: b.f*3})); boxes.push({pts: [[-10,-10],[10,-10],[10,10],[-10,10]],h: 18,center: true});
    if (up) {ctx.save(); poly(ground); ctx.clip(); ctx.fillStyle='rgba(28,39,66,.18)'; boxes.forEach(b=>{poly(shadowOf(b.pts,sA,cA,Math.min(b.h/tanh,300)).map(q=>P(q[0],q[1],0))); ctx.fill();}); ctx.restore();}
    const w=rot(10.3,0,true); let da=Math.abs(p.A-st.az); if (da>180) da=360-da;
    const lit=p.h>1&&da<=85&&isBlocked(NB,w[0],w[1],7.5,Math.sin(p.A*RAD),Math.cos(p.A*RAD),Math.tan(p.h*RAD))<0,target=lit?1:0;
    st.glow+=(target-st.glow)*Math.min(1,dt/300); if (Math.abs(st.glow-target)<.01) st.glow=target;
    const depth=b=>b.pts.reduce((s,q)=>s+q[0]+q[1],0); boxes.sort((a,b)=>depth(a)-depth(b)).forEach(b=>box(b,sA,cA,up,tanh,boxes));
    st.shown+=(st.hours-st.shown)*Math.min(1,dt/160); if (Math.abs(st.shown-st.hours)<1) st.shown=st.hours;
    const ht=fmtH(Math.round(st.shown)); if (hoursOut.textContent!==ht) hoursOut.textContent=ht;
    return st.glow!==target||st.shown!==st.hours;
 }
  function frame(now) {
    const dt=Math.min(64,now-(lastNow||now)); lastNow=now;
    if (!reduced&&!st.manual) {const t=Math.round((st.rise+(st.set-st.rise)*easeIO(((now-t0)/6000)%1))/10)*10; if (t!==st.time) {st.time=t; timeIn.value=t; clock.textContent=fmtT(t); dirty=1;}}
    if (dirty||more) {more=draw(dt); dirty=0;}
    requestAnimationFrame(frame);
 }
  resize(); addEventListener('resize',resize);
  compass($('#hero-compass'),{value: st.az,onInput: v=>{st.az=v; $('#hero-az').textContent=`${dirFull(v)} · ${v}°`; day();}});
  dateIn.oninput=()=>{st.N=+dateIn.value; $('#hero-date-label').textContent=dayName(st.N); day();};
  timeIn.oninput=()=>{st.manual=1; st.time=+timeIn.value; clock.textContent=fmtT(st.time); dirty=1; clearTimeout(resume); resume=setTimeout(()=>{st.manual=0; t0=performance.now();},3000);};
  cv.addEventListener('pointermove',e=>{if (e.pointerType!=='mouse') return; const r=cv.getBoundingClientRect(); st.px=((e.clientX-r.left)/r.width-.5)*12; st.py=((e.clientY-r.top)/r.height-.5)*12; dirty=1;});
    day(); document.fonts.ready.then(()=>{dirty=1;}); requestAnimationFrame(frame);
})();

// --- демо: состояние, ввод, хеш в URL, localStorage ---
const citySel=$('#city'),CITIES=$$('option',citySel).map(o=>({code: o.value,name: o.textContent,lat: +o.dataset.lat,lon: +o.dataset.lon,tz: +o.dataset.tz}));
const cityOf=code=>CITIES.find(c=>c.code===code)||CITIES[0];
const nbOf=a=>a.map(([x,y,w,h,f])=>({x,y,w,h,f})),copyNb=a=>a.map(b=>({...b}));
const PRESETS=[['msk',135,7,[[20,-58,30,16,25],[-70,-30,18,44,9]]],['soc',270,3,[[-86,-22,16,44,5]]],['spb',0,12,[]],['kzn',180,2,[[-26,-40,52,14,9]]]].map(([city,az,floor,nb])=>({city,az,floor,nb: nbOf(nb)}));
const state={city: 'msk',az: 135,floor: 7,fh: 3,win: 1.4,nb: copyNb(PRESETS[0].nb),sel: -1};
const cfg=()=>({az: state.az,floor: state.floor,fh: state.fh,nb: state.nb,...cityOf(state.city)});
{const q=new URLSearchParams(location.hash.slice(1)); if (q.get('c')) {// #c=msk&a=135&f=7&h=3&w=1.4&n=x,y,w,h,этажи;…
  state.city=cityOf(q.get('c')).code; state.az=norm360(+q.get('a')||0); state.floor=clamp(Math.round(+q.get('f'))||1,1,40); state.fh=clamp(+q.get('h')||3,2.5,4); state.win=clamp(+q.get('w')||1.4,.6,3);
  state.nb=nbOf((q.get('n')||'').split(';').filter(Boolean).map(s=>s.split(',').map(Number))).filter(b=>b.w>=6&&b.h>=6).slice(0,8);
}}
const writeHash=()=>{try {history.replaceState(null,'',`#c=${state.city}&a=${state.az}&f=${state.floor}&h=${state.fh}&w=${state.win}&n=${state.nb.map(b=>[b.x,b.y,b.w,b.h,b.f].join(',')).join(';')}`);} catch (e) {}};
const KEY='polden:projects',loadP=()=>{try {return JSON.parse(localStorage.getItem(KEY))||[];} catch (e) {return [];}},saveP=list=>{try {localStorage.setItem(KEY,JSON.stringify(list));} catch (e) {}};
const azIn=$('#az'),azName=()=>{const f=dirFull(state.az); $('#az-name').textContent=`${f[0].toUpperCase()}${f.slice(1)} · ${sideName(state.az)}`;};
const demoCompass=compass($('#demo-compass'),{value: state.az,cls: 'lg',onInput: v=>{state.az=v; azIn.value=v; azName(); drawMap(); schedule();}});
azIn.oninput=()=>{state.az=norm360(+azIn.value); demoCompass.set(state.az); azName(); drawMap(); schedule();}; azIn.onchange=()=>{azIn.value=state.az;};
const numIn=(id,a,b,round)=>{const el=$('#'+id); el.oninput=()=>{const v=+el.value; if (el.value===''||!isFinite(v)) return; state[id]=clamp(round?Math.round(v):v,a,b); drawMap(); schedule();}; el.onchange=()=>{el.value=state[id];};};
numIn('floor',1,40,true); numIn('fh',2.5,4); numIn('win',.6,3); $('#params').onsubmit=e=>e.preventDefault();
citySel.onchange=()=>{state.city=citySel.value; drawMap(); schedule();};
function syncInputs() {citySel.value=state.city; azIn.value=state.az; demoCompass.set(state.az); azName(); $('#floor').value=state.floor; $('#fh').value=state.fh; $('#win').value=state.win; state.sel=-1; selSync(); drawMap();}
function applyState(p) {state.city=p.city; state.az=p.az; state.floor=p.floor; state.win=p.win||1.4; state.fh=p.fh||3; state.nb=copyNb(p.neighbors||p.nb||[]); syncInputs(); run(true);}
const onPreset=e=>{const b=e.target.closest('[data-preset]'); if (b) {applyState(PRESETS[+b.dataset.preset]); $('#calc').scrollIntoView({behavior: reduced?'auto':'smooth'});}};
$('#presets').onclick=onPreset; $('#examples-grid').onclick=onPreset;
function renderProjects() {const list=loadP(),box=$('#projects'); box.innerHTML=list.length?'':'<span class="hint">Пока пусто.</span>'; list.forEach(p=>{const b=document.createElement('button'); b.className='chip'; b.type='button'; b.dataset.id=p.id; b.textContent=p.name; b.insertAdjacentHTML('beforeend','<span class="x" title="Удалить" aria-hidden="true">×</span>'); box.appendChild(b);});}
$('#save').onclick=()=>{const name=$('#pname').value.trim()||`${cityOf(state.city).name}, ${dirFull(state.az)}, ${state.floor} эт.`; const list=loadP().filter(p=>p.name!==name); list.unshift({id: Date.now(),name,city: state.city,az: state.az,floor: state.floor,win: state.win,fh: state.fh,neighbors: state.nb}); saveP(list.slice(0,12)); $('#pname').value=''; renderProjects(); status(`Сохранено: «${name}».`);};
$('#projects').onclick=e=>{const b=e.target.closest('[data-id]'),p=b&&loadP().find(p=>p.id===+b.dataset.id); if (!p) return; if (e.target.closest('.x')) {saveP(loadP().filter(q=>q.id!==p.id)); renderProjects(); status(`Удалён расчёт «${p.name}».`);} else {applyState(p); status(`Открыт расчёт «${p.name}».`);}};
renderProjects();
function status(t,flash) {const el=$('#status'); el.textContent=t; if (flash) {el.classList.remove('status-flash'); void el.offsetWidth; el.classList.add('status-flash');}}

// --- мини-карта двора: 1 px = 1 м, дома таскаются и тянутся за углы ---
const map=$('#map'),mctx=map.getContext('2d'); let mapDate=81,mapTime=720,mdrag=null,sweep=0;
const toC=(x,y)=>[160+x,160-y];
function selSync() {const b=state.nb[state.sel]; $('#nb-floors').disabled=$('#nb-del').disabled=!b; if (b) $('#nb-floors').value=b.f; $('#nb-count').textContent=`${state.nb.length} из 8`; $('#add-house').disabled=state.nb.length>=8;}
function drawMap() {
  const d=devicePixelRatio||1; if (map.width!==Math.round(320*d)) map.width=map.height=Math.round(320*d); mctx.setTransform(d,0,0,d,0,0);
  const c=mctx,city=cityOf(state.city),p=solarPos(mapDate,mapTime,city.lat,city.lon,city.tz),up=p.h>0,sA=Math.sin(p.A*RAD),cA=Math.cos(p.A*RAD),tanh=Math.tan(Math.max(p.h,.6)*RAD);
  c.fillStyle='#FFF8EA'; c.fillRect(0,0,320,320); c.lineWidth=1;
  [[10,'rgba(28,39,66,.08)'],[50,'rgba(28,39,66,.18)']].forEach(([step,col])=>{c.strokeStyle=col; c.beginPath(); for (let i=10; i<320; i+=step) {c.moveTo(i+.5,0); c.lineTo(i+.5,320); c.moveTo(0,i+.5); c.lineTo(320,i+.5);} c.stroke();});
  c.fillStyle='#1C2742'; c.font='500 '+G(13); c.textAlign='center'; c.textBaseline='middle'; [['С',160,10],['В',310,160],['Ю',160,310],['З',10,160]].forEach(([l,x,y])=>c.fillText(l,x,y));
  if (up) {c.fillStyle='rgba(28,39,66,.18)'; state.nb.concat([{x: -10,y: -10,w: 20,h: 20,f: Math.max(state.floor,5)}]).forEach(b=>{c.beginPath(); shadowOf(rect4(b),sA,cA,Math.min(b.f*3/tanh,500)).forEach((q,i)=>{const r=toC(q[0],q[1]); i?c.lineTo(r[0],r[1]):c.moveTo(r[0],r[1]);}); c.fill();});}
  state.nb.forEach((b,i)=>{const [x,y]=toC(b.x,b.y+b.h),sel=i===state.sel,l=b.f+' эт.',tw=c.measureText(l).width+10,tag=b.w<tw+2||b.h<18,ty=y<22?y+b.h+2:y-19; c.fillStyle='#D9D4C8'; c.fillRect(x,y,b.w,b.h); c.strokeStyle=sel?'#E8A33D':'#1C2742'; c.lineWidth=sel?2:1; c.strokeRect(x+.5,y+.5,b.w-1,b.h-1); if (tag) {c.fillStyle='#FFF8EA'; c.lineWidth=1; c.fillRect(x+b.w/2-tw/2,ty,tw,17); c.strokeRect(x+b.w/2-tw/2+.5,ty+.5,tw-1,16);} c.fillStyle='#1C2742'; c.fillText(l,x+b.w/2,tag?ty+9:y+b.h/2);}); // бирка этажности над малым домом
  c.fillStyle='#FFF8EA'; c.fillRect(150,150,20,20); c.strokeStyle='#1C2742'; c.lineWidth=1.5; c.strokeRect(150.5,150.5,19,19);
  const k=10/Math.max(Math.abs(Math.sin(state.az*RAD)),Math.abs(Math.cos(state.az*RAD))),wx=Math.sin(state.az*RAD)*k,wy=Math.cos(state.az*RAD)*k,[px,py]=toC(wx,wy);
  let lit=false,bd=-1,why=up?'солнце с другой стороны дома':'солнце за горизонтом';
  if (up) {let da=Math.abs(p.A-state.az); if (da>180) da=360-da; if (p.h>1&&da<=85) {bd=isBlocked(state.nb,wx*1.02,wy*1.02,(state.floor-1)*state.fh+1.5,sA,cA,tanh); lit=bd<0; why=lit?'окно на солнце':'окно в тени соседнего дома';}}
  if (lit||bd>0) {const len=lit?150:bd; c.strokeStyle=lit?'#E8A33D':'#C8552C'; c.lineWidth=1.5; c.setLineDash(lit?[]:[4,3]); c.beginPath(); c.moveTo(px,py); c.lineTo(px+sA*len,py-cA*len); c.stroke(); c.setLineDash([]);}
  c.fillStyle=lit?'#E8A33D':'#1C2742'; c.beginPath(); c.arc(px,py,5,0,7); c.fill(); c.strokeStyle='#1C2742'; c.lineWidth=1; c.stroke();
  if (up) {c.fillStyle='#E8A33D'; c.beginPath(); c.arc(160+sA*150,160-cA*150,7,0,7); c.fill();}
  if (state.sel>=0) {c.fillStyle='#1C2742'; rect4(state.nb[state.sel]).forEach(q=>{const r=toC(q[0],q[1]); c.fillRect(r[0]-4,r[1]-4,8,8);});}
  $('#map-time-label').textContent=fmtT(mapTime); $('#map-status').textContent=`${dayName(mapDate)}, ${fmtT(mapTime)} · ${why}`;
}
const mpt=e=>{const r=map.getBoundingClientRect(); return [(e.clientX-r.left)*320/r.width-160,160-(e.clientY-r.top)*320/r.height];};
map.addEventListener('pointerdown',e=>{
  const [x,y]=mpt(e); e.preventDefault(); map.setPointerCapture(e.pointerId);
  if (state.sel>=0) {const b=state.nb[state.sel],h=rect4(b).findIndex(q=>Math.abs(q[0]-x)<7&&Math.abs(q[1]-y)<7); if (h>=0) {mdrag={type: 'size',b,ex: h===1||h===2,ey: h>=2}; return;}}
  for (let i=state.nb.length-1; i>=0; i--) {const b=state.nb[i]; if (x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h) {state.sel=i; mdrag={type: 'move',b,dx: x-b.x,dy: y-b.y}; selSync(); drawMap(); return;}}
  state.sel=-1; mdrag=null; selSync(); drawMap();
});
map.addEventListener('pointermove',e=>{
  if (!mdrag) return; const [x,y]=mpt(e),b=mdrag.b;
  if (mdrag.type==='move') {b.x=clamp(Math.round(x-mdrag.dx),-160,160-b.w); b.y=clamp(Math.round(y-mdrag.dy),-160,160-b.h);}
  else {let x1=b.x,x2=b.x+b.w,y1=b.y,y2=b.y+b.h; if (mdrag.ex) x2=clamp(Math.round(x),x1+6,160); else x1=clamp(Math.round(x),-160,x2-6); if (mdrag.ey) y2=clamp(Math.round(y),y1+6,160); else y1=clamp(Math.round(y),-160,y2-6); b.x=x1; b.w=x2-x1; b.y=y1; b.h=y2-y1;}
  drawMap(); schedule();
});
map.onpointerup=map.onpointercancel=()=>{mdrag=null;};
map.addEventListener('keydown',e=>{// клавиатура: 1–8 выбор, стрелки — сдвиг, Shift — размер, Delete, Esc
  const b=state.nb[state.sel],d={ArrowLeft: [-1,0],ArrowRight: [1,0],ArrowUp: [0,1],ArrowDown: [0,-1]}[e.key];
  if (/^[1-8]$/.test(e.key)&&state.nb[e.key-1]) {state.sel=e.key-1; selSync(); drawMap();}
  else if (e.key==='Escape'&&b) {state.sel=-1; selSync(); drawMap();}
  else if (e.key==='Delete'&&b) $('#nb-del').click();
  else if (d&&b) {if (e.shiftKey) {b.w=clamp(b.w+d[0],6,160-b.x); b.h=clamp(b.h+d[1],6,160-b.y);} else {b.x=clamp(b.x+d[0],-160,160-b.w); b.y=clamp(b.y+d[1],-160,160-b.h);} drawMap(); schedule();}
  else return; e.preventDefault();
});
$('#add-house').onclick=()=>{if (state.nb.length>=8) return; const s=[[-15,30],[-15,-60],[40,-8],[-70,-8],[40,40],[-70,40],[40,-60],[-70,-60]][state.nb.length]; state.nb.push({x: s[0],y: s[1],w: 30,h: 15,f: 9}); state.sel=state.nb.length-1; selSync(); drawMap(); schedule();};
$('#nb-del').onclick=()=>{if (state.sel<0) return; state.nb.splice(state.sel,1); state.sel=-1; selSync(); drawMap(); schedule();};
$('#nb-floors').oninput=e=>{const b=state.nb[state.sel]; if (b) {b.f=clamp(Math.round(+e.target.value)||1,1,60); drawMap(); schedule();}};
$('#map-time').oninput=e=>{mapTime=+e.target.value; cancelAnimationFrame(sweep); drawMap();};
$('#map-date').oninput=e=>{// солнце пробегает день и возвращается к выбранному часу
  mapDate=+e.target.value; $('#map-date-label').textContent=dayName(mapDate); if (reduced) {drawMap(); return;}
  const t0=performance.now(),back=+$('#map-time').value; cancelAnimationFrame(sweep);
  const step=now=>{const q=Math.min(1,(now-t0)/1400); mapTime=q<1?Math.round((300+960*easeIO(q))/10)*10:back; drawMap(); if (q<1) sweep=requestAnimationFrame(step);}; sweep=requestAnimationFrame(step);
};

// --- результат: календарь, норма, сторона ---
const calHTML=(months,cls='cal')=>{const max=Math.max(...months,.1); return `<div class="${cls}" role="img" aria-label="Часы солнца по месяцам: ${months.map((v,i)=>`${MSHORT[i]} ${fmt1(v)}`).join(', ')}">${months.map((v,i)=>`<i style="--h:${Math.max(1.5,v/max*100)}%;--i:${i}" data-v="${MSHORT[i]} · ${fmt1(v)}\u00a0ч"${v<2.5?' class="lo"':''}></i>`).join('')}</div><div class="cal-lbl${cls==='cal'?'':' mini'}" aria-hidden="true">${MSHORT.map(m=>`<span>${m}</span>`).join('')}</div>`;};
const normText=(S,short)=>S.ok?'Норма выполняется'+(short?'':': 2,5 ч подряд каждый день с 22 марта по 22 сентября'):`Норма не выполняется: ${dayName(S.worst)} — ${S.worstRun?fmtH(S.worstRun)+(short?'':' подряд вместо 2 ч 30 мин'):'солнца нет'}`;
const cardStats=S=>`<p class="total">${fmtN(S.total)}\u00a0ч в\u00a0год</p><p class="hint">${fmtH(S.avg*60)} в день · лето ${fmt1(S.summer)}\u00a0ч · зима ${fmt1(S.winter)}\u00a0ч</p><p class="${S.ok?'ok':'bad'}">${normText(S,true)}</p>`;
const miniCard=(el,S)=>{el.innerHTML=calHTML(S.months,'mini-cal')+cardStats(S); animateBars(el);};
function animateBars(root) {if (reduced) return; const bars=$$('.cal i, .mini-cal i',root); bars.forEach(b=>b.style.transform='scaleY(0)'); requestAnimationFrame(()=>requestAnimationFrame(()=>bars.forEach(b=>b.style.transform='')));}
let S=null,timer=0;
const schedule=()=>{clearTimeout(timer); timer=setTimeout(run,150);};
function run(flash) {
  const c=cfg(); writeHash();
  calc(c,r=>{
    S=summarize(r,c.az); const body=$('#result-body');
    body.innerHTML=`<p class="result-big"><b>${fmtH(S.avg*60)}</b><span>прямого солнца в день, в среднем за год · ${fmtN(S.total)}\u00a0ч в\u00a0год</span></p>${calHTML(S.months)}
      <p class="cal-cap"><span>Больше всего — ${MNOM[S.mx]}, ${fmt1(S.months[S.mx])}\u00a0ч в день</span><span>Меньше всего — ${MNOM[S.mn]}, ${fmt1(S.months[S.mn])}\u00a0ч</span></p>
      <p class="norm-row${S.ok?'':' bad'}">${normText(S)}</p>
      <p class="side-row"><span>Сторона: <b>${dirFull(S.az)}, ${S.az}° — ${sideName(S.az)}</b></span><span>Лето: <b>${fmt1(S.summer)}\u00a0ч/день</b></span><span>Зима: <b>${fmt1(S.winter)}\u00a0ч/день</b></span></p>`;
    animateBars(body); drawReport($('#report-canvas'),S,2);
    status(`${cityOf(state.city).name}, ${state.floor} этаж, окно на ${dirFull(S.az)}: ${fmtH(S.avg*60)} в день, норма ${S.ok?'':'не '}выполняется.`,flash);
    if (!$('#compare').hidden) runCompare();
 });
}
$('#run').onclick=()=>run(true);
$('#share').onclick=()=>{writeHash(); const url=location.href,fail=()=>status('Скопируйте из адресной строки: '+url,true),w=navigator.clipboard&&navigator.clipboard.writeText(url); w?w.then(()=>status('Ссылка скопирована: '+url,true),fail):fail();};

// --- отчёт: страница A4 на canvas (превью и печать) ---
const reportInfo=()=>`${cityOf(state.city).name} · окно на ${dirFull(state.az)} (${state.az}°) · ${state.floor} этаж по ${fmt1(state.fh)} м · окно ${fmt1(state.win)} м · домов рядом: ${state.nb.length} · ${new Date().toLocaleDateString('ru-RU')}`;
function drawReport(cv,S,k,draft) {// логическая страница 420×594 (A4), k — плотность
  cv.width=420*k; cv.height=594*k; const c=cv.getContext('2d'); c.setTransform(k,0,0,k,0,0); const NV='#1C2742',MU='#4A5470';
  const line=(y,col,x1=30,x2=390)=>{c.strokeStyle=col||'rgba(28,39,66,.3)'; c.lineWidth=1; c.beginPath(); c.moveTo(x1,y); c.lineTo(x2,y); c.stroke();};
  const text=(t,x,y,font,col,align)=>{c.font=font; c.fillStyle=col||NV; c.textAlign=align||'left'; c.fillText(t,x,y);};
  const wrap=(t,x,y,font,col,lh,w=360)=>{let l=''; c.font=font; t.split(' ').forEach(q=>{if (c.measureText(l+' '+q).width>w&&l) {text(l,x,y,font,col); y+=lh; l=q;} else l=l?l+' '+q:q;}); text(l,x,y,font,col);};
  c.fillStyle='#fff'; c.fillRect(0,0,420,594); c.textBaseline='alphabetic';
  text('Полдень · Отчёт об инсоляции',30,44,'22px Oranienbaum'); wrap(reportInfo(),30,62,G(10),MU,13); line(92);
  text(fmtH(S.avg*60),30,130,'36px Oranienbaum'); text('прямого солнца в день, в среднем за год',30,146,G(10),MU); text(`${fmtN(S.total)} часов в год · лето ${fmt1(S.summer)} ч/день · зима ${fmt1(S.winter)} ч/день`,30,160,G(10),MU);
  const by=198,bh=100,max=Math.max(...S.months,.1); text('ЧАСЫ СОЛНЦА ПО МЕСЯЦАМ',30,by-12,'500 '+G(8.5),MU);
  S.months.forEach((v,i)=>{const x=30+i*30,h=v/max*(bh-16),lo=v<2.5; c.fillStyle=lo?'rgba(200,85,44,.35)':'#E8A33D'; c.fillRect(x+4,by+bh-h,22,h); if (lo) {c.strokeStyle='#C8552C'; c.lineWidth=1; c.strokeRect(x+4.5,by+bh-h+.5,21,Math.max(1,h-1));} text(fmt1(v),x+15,by+bh-h-4,G(9),NV,'center'); text(MSHORT[i],x+15,by+bh+13,G(9),MU,'center');});
  line(by+bh+.5,NV);
  const ny=330; c.strokeStyle=S.ok?'#4F8A5B':'#C8552C'; c.lineWidth=1; c.strokeRect(30.5,ny+.5,359,36); wrap(normText(S),40,ny+16,'500 '+G(10),S.ok?'#386B43':'#AD4620',13,340);
  const ty=400; text('ПО СЕЗОНАМ',30,ty-10,'500 '+G(8.5),MU);
  [['Зима',[11,0,1]],['Весна',[2,3,4]],['Лето',[5,6,7]],['Осень',[8,9,10]]].forEach(([n,ms],i)=>{const y=ty+8+i*18,avg=ms.reduce((a,m)=>a+S.months[m],0)/3; line(y+6,'rgba(28,39,66,.15)',30,210); text(n,30,y,G(11)); text(`${fmt1(avg)} ч в день`,210,y,G(11),NV,'right');});
  text('СТОРОНА',30,ty+98,'500 '+G(8.5),MU); text(`${dirFull(S.az)}, ${S.az}°`,30,ty+117,'16px Oranienbaum'); wrap(sideName(S.az),30,ty+132,G(10),MU,12,200);
  // схема двора, автомасштаб
  const mx=240,my=ty-2,mw=140,ext=Math.max(24,...state.nb.flatMap(b=>[-b.x,b.x+b.w,-b.y,b.y+b.h]))+8,ms=mw/2/ext,q=(x,y)=>[mx+mw/2+x*ms,my+mw/2-y*ms];
  text('СХЕМА ДВОРА',mx,ty-10,'500 '+G(8.5),MU); c.fillStyle='#FFFCF4'; c.fillRect(mx,my,mw,mw); c.strokeStyle='rgba(28,39,66,.3)'; c.strokeRect(mx+.5,my+.5,mw-1,mw-1); text('С',mx+mw/2,my+11,'500 '+G(8),MU,'center');
  state.nb.forEach(b=>{const [x,y]=q(b.x,b.y+b.h),w=b.w*ms,h=b.h*ms,inside=w>=18&&h>=11; c.fillStyle='#E4DED2'; c.fillRect(x,y,w,h); c.strokeStyle=NV; c.strokeRect(x+.5,y+.5,w-1,h-1); text(b.f,x+w/2,inside?y+h/2+3:y-2,G(8),NV,'center');});
  const [hx,hy]=q(-10,10),hs=20*ms; c.fillStyle='#FFF8EA'; c.fillRect(hx,hy,hs,hs); c.strokeStyle=NV; c.strokeRect(hx+.5,hy+.5,hs-1,hs-1);
  const kk=10/Math.max(Math.abs(Math.sin(S.az*RAD)),Math.abs(Math.cos(S.az*RAD))),[wx,wy]=q(Math.sin(S.az*RAD)*kk,Math.cos(S.az*RAD)*kk); c.fillStyle='#E8A33D'; c.beginPath(); c.arc(wx,wy,3,0,7); c.fill(); c.strokeRect(wx-3,wy-3,6,6);
  text(`${Math.round(ext*2)} м по стороне · цифры — этажи · точка — окно`,mx+mw,my+mw+11,G(7.5),MU,'right');
  line(556); wrap($('#print').dataset.caveat,30,568,G(8.5),MU,11);
  if (draft) {c.save(); c.translate(210,320); c.rotate(-.55); c.globalAlpha=.07; text('ЧЕРНОВИК',0,0,'96px Oranienbaum',NV,'center'); c.restore();}
}
const pdf=()=>{if (!S) return; drawReport($('#print-canvas'),S,3,true); status('Сохраните как PDF.'); window.print();};
$('#pdf').onclick=pdf; $('#pdf2').onclick=pdf;

// --- сравнение двух квартир: карточки из <template> ---
const cmp=[{name: 'Квартира А',az: 135,floor: 7},{name: 'Квартира Б',az: 315,floor: 12}]; let cmpTimer=0;
const scheduleCmp=()=>{clearTimeout(cmpTimer); cmpTimer=setTimeout(runCompare,150);};
function buildCompare() {
  cmp.forEach(c=>{
    if (c.el) return; const node=$('#cmp-tpl').content.cloneNode(true),el=c.el={}; ['name','az','floor','out','compass'].forEach(k=>el[k]=$(`[data-k="${k}"]`,node));
    el.name.textContent=c.name; el.compass=compass(el.compass,{value: c.az,cls: 'sm',onInput: v=>{c.az=v; el.az.value=v; scheduleCmp();}});
    el.az.oninput=()=>{c.az=norm360(+el.az.value); el.compass.set(c.az); scheduleCmp();};
    el.floor.oninput=()=>{c.floor=clamp(Math.round(+el.floor.value)||1,1,40); scheduleCmp();};
    $('#cmp-grid').appendChild(node);
 });
  cmp.forEach(c=>{c.el.az.value=c.az; c.el.floor.value=c.floor; c.el.compass.set(c.az);});
}
function runCompare() {cmp.forEach(c=>calc({...cfg(),az: c.az,floor: c.floor},r=>{c.S=summarize(r,c.az); miniCard(c.el.out,c.S); renderDiff();}));}
function renderDiff() {const [a,b]=cmp; if (!a.S||!b.S) return; const d=a.S.total-b.S.total,w=d>0?a:b,l=d>0?b:a; $('#cmp-diff').textContent=Math.abs(d)<1?'Поровну.':`${w.name} получает на ${fmtN(Math.abs(d))} ч в год больше, чем ${l.name} — ${fmt1(Math.abs(d)/365)} ч в день.`;}
function compareOn(on,scroll) {
  const btn=$('#compare-toggle'); $('#compare').hidden=!on; $('#compare').classList.add('in'); btn.setAttribute('aria-pressed',on); btn.textContent=on?'Скрыть сравнение':'Сравнить две квартиры'; if (!on) return;
  buildCompare(); runCompare(); if (scroll) $('#compare').scrollIntoView({behavior: reduced?'auto':'smooth'});
}
$('#compare-toggle').onclick=()=>{if ($('#compare').hidden) Object.assign(cmp[0],{az: state.az,floor: state.floor}); compareOn($('#compare').hidden);};
const INTRO=$$('#cmp-intro-grid .ex-card').map(el=>({el,az: +el.dataset.az,floor: +el.dataset.floor}));
$('#open-compare').onclick=()=>{applyState(PRESETS[0]); INTRO.forEach((p,i)=>Object.assign(cmp[i],{az: p.az,floor: p.floor})); compareOn(true,true);};
$$('a[href="#compare"]').forEach(a=>a.onclick=e=>{e.preventDefault(); compareOn(true,true);});
addEventListener('hashchange',()=>{const d=/^#\w+$/.test(location.hash)&&$(location.hash); if (d&&d.tagName==='DETAILS') d.open=true;}); // ссылки футера раскрывают <details>

// --- примеры расчётов, карточки сравнения, виджет ЖК ---
all(PRESETS,p=>mkCfg(p.az,p.floor,p.nb,p.city),rs=>$$('#examples-grid .ex-out').forEach((el,i)=>miniCard(el,summarize(rs[i],PRESETS[i].az))));
all(INTRO,p=>mkCfg(p.az,p.floor,PRESETS[0].nb,'msk'),rs=>{const s=rs.map((r,i)=>summarize(r,INTRO[i].az)),d=s[0].total-s[1].total; INTRO.forEach((p,i)=>miniCard($('.ex-out',p.el),s[i])); $('#intro-diff').textContent=`${d>0?'Квартира А':'Квартира Б'} получает на ${fmtN(Math.abs(d))} ч в год больше (${fmt1(Math.abs(d)/365)} ч в день).`;});
const APTS=$$('#widget-plan .apt'),WNB=nbOf([[-40,-70,60,14,16],[-80,-10,14,50,9]]); let wFloor=9;
function widgetCalc() {all(APTS,g=>mkCfg(+g.dataset.az,wFloor,WNB,'msk'),rs=>APTS.forEach((g,i)=>{const s=summarize(rs[i],0); g.classList.toggle('ok',s.ok); g.classList.toggle('bad',!s.ok); $('.v',g).textContent=`${fmt1(s.summer)} ч`;}));}
$('#widget-floors').onclick=e=>{const b=e.target.closest('[data-f]'); if (!b) return; wFloor=+b.dataset.f; $$('#widget-floors .chip').forEach(c=>c.setAttribute('aria-pressed',c===b)); widgetCalc();};
widgetCalc();

// --- старт ---
syncInputs(); run();
document.fonts.ready.then(()=>{drawMap(); if (S) drawReport($('#report-canvas'),S,2);});
})();
