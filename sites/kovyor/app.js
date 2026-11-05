/* Ковёр — станок привычек: тайл из названия, ряд на день, челнок, год, PNG, карточка, постер. Всё в браузере. */
(()=>{
const {round,floor,ceil,max,min} = Math;
const $ = (s,r=document)=>r.querySelector(s),$$ = (s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches,DPR=min(devicePixelRatio || 1,3);
const clamp=(v,a,b)=>max(a,min(b,v)),now=()=>performance.now();
const plural=(n,a,b,c)=>{const m=n % 100,k=n % 10;return m > 10 && m < 20?c:k === 1?a:k > 1 && k < 5?b:c;};
const rows_=n=>`${n} ${plural(n, 'ряд', 'ряда', 'рядов')}`,days_=n=>`${n} ${plural(n, 'день', 'дня', 'дней')}`;
const num=n=>String(round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const on=(sel,ev,fn)=>$$(sel).forEach(el=>el.addEventListener(ev,fn));
const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},ctx=c=>c.getContext('2d');
const inkA=a=>`rgba(43,38,34,${a})`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0) + ';');

// --- цвета и палитра шерсти
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return `rgb(${A.map((v,i)=>round(v+(B[i]-v)*t)).join(',')})`;};
const dark=h=>mix(h, '#000000',.25),lite=h=>mix(h, '#F6F0E6',.4);
const LINEN = '#EFE6D8',CARD = '#F6F0E6',WEFT = '#E4DACA',INK = '#2B2622',SEAM=inkA(.08),FONT = '500 14px "Golos Text", sans-serif';
const PALETTE = 'C8553D 2C3E6B D9A441 3F6B4F 6E3B56 2B2622 8A3B2E 4C6A8F A86B2F 5D7B52 8E5A74 B0A48E 7A2E2E 1F3A5F C79A3B 2F5245 B5651D 3B5A7A 9C6B3C 6B7A3F 4A3A5E 8C8C78 A14E3B 223C3A'.split(' ').map(c=>'#'+c);
const NAMES = 'терракота|индиго|охра|бутылочный|сливовый|уголь|кирпич|стальной|рыжий|мох|вереск|серый лён|бордо|ночной|горчица|хвоя|корица|морской|карамель|оливковый|баклажан|пепел|сурик|малахит'.split('|');
const STITCHES=[['romb', 'ромб'],['krest', 'крест'],['zigzag', 'зигзаг'],['polosa', 'полоса']];
const PRESETS = 'вода|чтение|зарядка|сон до 23:00|без сахара|английский|прогулка|медитация'.split('|');

// --- даты
const pad=n=>String(n).padStart(2, '0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d);};
const daysBetween=(a,b)=>round((parse(b)-parse(a))/864e5);
const T=iso(new Date());
addEventListener('visibilitychange',()=>{if(!document.hidden && iso(new Date()) !== T) location.reload();});
const MON = 'янв фев мар апр мая июн июл авг сен окт ноя дек'.split(' '),WD = 'вс пн вт ср чт пт сб'.split(' ');
const fmt=s=>{const d=parse(s);return `${d.getDate()} ${MON[d.getMonth()]}`;};
const fmtLong=s=>`${WD[parse(s).getDay()]}, ${fmt(s)}`;

// --- тайл 8×8: FNV-1a → mulberry32 → зеркало → маска стежка
function fnv1a(s){let h=0x811c9dc5;for(const c of s){h ^= c.codePointAt(0);h=Math.imul(h,0x01000193);} return h >>> 0;}
function mulberry32(a){return ()=>{a |= 0;a=a+0x6D2B79F5 | 0;let t=Math.imul(a ^ a >>> 15,1 | a);t=t+Math.imul(t ^ t >>> 7,61 | t) ^ t;return ((t ^ t >>> 14) >>> 0)/4294967296;};}
const MASK={romb:(x,y)=>Math.abs(x-3.5)+Math.abs(y-3.5) <= 3,krest:(x,y)=>x === y || x+y === 7,zigzag:(x,y)=>(x+y) % 4 < 2,polosa:(x,y)=>y % 2 === 0};
const cache=new Map();
function tile(name,stitch){
  const key=name + '|'+stitch;
  if(!cache.has(key)){
    const r=mulberry32(fnv1a(name.trim().toLowerCase())),m=MASK[stitch] || MASK.romb,q=[],t=[];
    for(let y=0;y < 4;y++) q.push([0,0,0,0].map(()=>r() < .55?1:0));
    for(let y=0;y < 8;y++){t.push([]);for(let x=0;x < 8;x++) t[y][x]=q[y < 4?y:7-y][x < 4?x:7-x] & +m(x,y);}
    cache.set(key,t);
  }
  return cache.get(key);
}
function drawTile(g,t,col,x,y,cell){g.fillStyle=col;g.fillRect(x,y,cell*8,cell*8);g.fillStyle=lite(col);for(let yy=0;yy < 8;yy++) for(let xx=0;xx < 8;xx++) if(t[yy][xx]) g.fillRect(x+xx*cell,y+yy*cell,cell,cell);}
function pattern(g,h,size){ // основа цветом, мотив светлее
  const key = `${h.name}|${h.stitch}|${h.color}|${round(size)}`;
  if(!cache.has(key)){const c=cv(max(1,round(size)),max(1,round(size)));drawTile(ctx(c),tile(h.name,h.stitch),h.color,0,0,c.width/8);cache.set(key,g.createPattern(c, 'repeat'));}
  return cache.get(key);
}

// --- ряды: день = 6 px, окантовка с 7 дней, медальон на 30
function buildRows(st,end,run0){
  const n=max(1,daysBetween(st.start,end)+1),N=st.habits.length,run=run0?run0.slice():Array(N).fill(0),out=[];
  for(let i=0;i < n;i++){const date=addDays(st.start,i),src=st.days[date] || [],arr=[],s=[];for(let j=0;j < N;j++){arr[j]=src[j]?1:0;run[j]=arr[j]?run[j]+1:0;s[j]=run[j];} out.push({date,arr,st:s});}
  return out;
}
function drawRow(g,S,W,y,habits,arr,st,medals){
  const N=habits.length,yy=round(y*S),hh=round((y+6)*S)-yy;
  habits.forEach((h,j)=>{
    const x0=round(j*W/N*S),w=round((j+1)*W/N*S)-x0;
    if(arr[j]){
      g.save();g.translate(x0,yy);g.fillStyle=pattern(g,h,6*S);g.fillRect(0,0,w,hh);g.restore();
      const s=st?st[j]:0;
      if(s >= 7){g.strokeStyle=mix(h.color, '#000000',.45);g.lineWidth=max(1,S);g.strokeRect(x0+S/2,yy+S/2,w-S,hh-S);}
      if(s && s % 30 === 0 && medals) medals.push([x0+w/2,yy+hh/2,h.color]);
    }else{g.fillStyle=WEFT;g.fillRect(x0,yy,w,hh);}
  });
  g.fillStyle=SEAM;g.fillRect(0,yy+hh-max(1,S/2),round(W*S),max(1,S/2));
}
function drawMedal(g,S,x,y,col){ // диск в светлом кольце
  const lw=max(1,S);
  g.fillStyle=LINEN;g.beginPath();g.arc(x,y,5*S+lw,0,7);g.fill();
  g.fillStyle=dark(col);g.beginPath();g.arc(x,y,5*S,0,7);g.fill();
  g.strokeStyle=LINEN;g.lineWidth=lw;g.beginPath();g.moveTo(x-3*S,y);g.lineTo(x+3*S,y);g.moveTo(x,y-3*S);g.lineTo(x,y+3*S);g.stroke();
}
function renderCloth(S,W,habits,rows,bake=true){ // ряд 0 внизу; медальоны впекаем или отдаём в c.medals
  const c=cv(max(1,round(W*S)),max(1,round(rows.length*6*S))),g=ctx(c),medals=[];
  rows.forEach((r,i)=>drawRow(g,S,W,(rows.length-1-i)*6,habits,r.arr,r.st,medals));
  if(bake) medals.forEach(m=>drawMedal(g,S,...m));
  c.medals=medals;return c;
}
function overlay(w,h){ // ворс (шум, alpha 0,02) и виньетка 12%
  const c=cv(w,h),g=ctx(c),im=g.createImageData(w,h),d=im.data;
  for(let i=0;i < d.length;i += 4){d[i]=d[i+1]=d[i+2]=Math.random()*255 | 0;d[i+3]=5;}
  g.putImageData(im,0,0);const r=Math.hypot(w,h)/2,v=g.createRadialGradient(w/2,h/2,r*.35,w/2,h/2,r);v.addColorStop(0,inkA(0));v.addColorStop(1,inkA(.12));g.fillStyle=v;g.fillRect(0,0,w,h);return c;
}

// --- звук челнока
let audio,soundOn=true;
function tuk(){
  if(!soundOn) return;
  try{audio=audio || new AudioContext();if(audio.state === 'suspended') audio.resume();const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.frequency.value=160;g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+.08);}catch(e){}
}

// --- станок: полотно, челнок, линейка, зум
class Loom {
  constructor(o){
    Object.assign(this,{zoom:1,panY:0,hover:-1,rows:[],habits:[],dir:1},o);
    this.g=ctx(this.canvas);
    this.canvas.addEventListener('pointermove',e=>{if(!this.drag){const r=this.canvas.getBoundingClientRect();this.tipAt(e.clientX-r.left,e.clientY-r.top);} });
    this.canvas.onpointerleave=()=>this.tipAt(-1,-1);
    if(this.zoomable) this.bindZoom();
    this.visible=true;new IntersectionObserver(([e])=>{this.visible=e.isIntersecting;if(this.visible) this.wake();}).observe(this.canvas);
    this.wake();
  }
  size(w,h){
    this.W=w;this.H=h;const c=this.canvas;c.width=round(w*DPR);c.height=round(h*DPR);c.style.width=w + 'px';c.style.height=h + 'px';
    if(this.ruler){this.ruler.width=round(60*DPR);this.ruler.height=round((h+24)*DPR);}
    this.ov=overlay(c.width,c.height);this.dirty=true;this.draw(now());
  }
  get CH(){return this.rows.length*6;}
  get Wu(){return this.W/max(1,this.zoom);} // ширина в единицах тайла: зум >1 растит мотив
  minZoom(){return min(1,this.H/max(1,this.CH));}
  S(){const lvl=this.zoom <= 1?1:min(4,ceil(this.zoom));return min(DPR*lvl,max(DPR,8000/max(1,this.CH)));}
  setData(habits,rows){this.habits=habits;this.rows=rows;this.dirty=true;if(!this.zoomable) this.zoom=1;else if(this.zoom < this.minZoom()) this.zoom=this.minZoom();this.draw(now());}
  fit(){ // короткое полотно во всю раму (до 4×), длинное целиком
    const z=this.H/max(1,this.CH);this.setZoom(min(4,z >= 2?floor(z):z));
  }
  setZoom(z,px,py=this.H/2){ // ряд под курсором на месте
    z=clamp(z,this.minZoom(),8);const cy=(py-this.vy)/this.zoom;
    this.zoom=z;this.panY=py-cy*z;this.draw(now());if(this.onZoom) this.onZoom(z);
  }
  view(){ // <1 сжимает высоту, >1 растит ряд; панорама по вертикали
    const ch=this.CH*this.zoom;
    this.vx=0;this.vy=ch <= this.H?this.H-ch:clamp(this.panY,this.H-ch,0);this.canvas.classList.toggle('zoomed',ch > this.H);return [this.W,ch];
  }
  draw(t){
    const {g,W,H} = this;if(!W) return;
    const S=this.S(),Wu=this.Wu;if(this.dirty || !this.cloth || this.cS !== S || this.cWu !== Wu){this.cS=S;this.cWu=Wu;this.cloth=renderCloth(S,Wu,this.habits,this.rows,false);this.dirty=false;}
    const [cw]=this.view(),{vx:x,vy:y,zoom:z,rows:{length:n} } = this,rh=6*z,a=this.anim,cl=this.cloth,sway=this.sway && !RM;
    const swing=yy=>sway?Math.sin(t/600+yy/14):0; // колебание нитей ±1 px
    g.setTransform(DPR,0,0,DPR,0,0);g.fillStyle=WEFT;g.fillRect(0,0,W,H);
    if(y > 0){g.fillStyle=inkA(.13);for(let wx=1.5;wx < W;wx += 4) g.fillRect(wx,0,1,y);} // основа над полотном
    const shown=a && a.type === 'all'?floor(a.p*n):n,band=max(1,round(6/rh)),top=(n-shown)*6*S;
    g.imageSmoothingEnabled=z < 1;
    if(!sway){if(shown) g.drawImage(cl,0,top,cl.width,shown*6*S,x,y+(n-shown)*rh,cw,shown*rh);}
    else for(let i=n-shown;i < n;i += band){const k=min(band,n-i),yy=y+i*rh;g.drawImage(cl,0,i*6*S,cl.width,k*6*S,x+swing(yy),yy,cw,k*rh);}
    // медальоны поверх, радиус ≥ 4 px
    for(const [mx,my,col] of cl.medals) if(my >= top){const sy=y+my*z/S;drawMedal(g,max(.8,z),x+mx*max(1,z)/S+swing(sy),sy,col);}
    if(a && a.type === 'row'){ // новый ряд ложится за челноком
      const yy=y+(n-1-a.i)*rh,p=1-(1-a.p) ** 3,sx=a.dir > 0?-34+(W+34)*p:W-(W+34)*p;
      g.save();g.beginPath();if(a.dir > 0) g.rect(0,yy,sx+34,rh);else g.rect(sx,yy,W,rh);g.clip();g.drawImage(a.strip,x,yy,cw,rh);g.restore();
      if(a.p < 1) this.shuttle(sx,yy+rh/2,a.color);
    }
    if(a && a.type === 'all' && a.p < 1){const q=max(0,t-a.t0)/400 % 2;this.shuttle(q < 1?-34+(W+34)*q:W-(W+34)*(q-1),y+(n-shown)*rh-4,this.habits[floor(q*7) % this.habits.length].color);}
    if(this.hover >= 0){g.fillStyle = 'rgba(255,255,255,.22)';g.fillRect(x,y+(n-1-this.hover)*rh,cw,max(1,rh));}
    g.setTransform(1,0,0,1,0,0);g.drawImage(this.ov,0,0);this.drawRuler();
  }
  shuttle(sx,cy,col){const g=this.g,rr=(x,y,c)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,34,8,4);g.fill();};rr(sx+1,cy-2,inkA(.25));rr(sx,cy-4,col);g.fillStyle = 'rgba(255,255,255,.35)';g.fillRect(sx+6,cy-2,22,1);}
  drawRuler(){ // понедельники длиннее и с подписью
    const r=this.ruler;if(!r) return;const g=ctx(r),rh=6*this.zoom,n=this.rows.length,Hr=this.H+24,top=12+this.vy,every=max(1,ceil(18/(7*rh)));
    g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,60,Hr);g.fillStyle=INK;g.fillRect(0,12,1,this.H);g.font=FONT;g.textBaseline = 'middle';
    for(let i=0,w=0;i < n;i++){const yy=top+(n-1-i)*rh+rh/2,mon=parse(this.rows[i].date).getDay() === 1;if(yy >= 12 && yy <= Hr-12){if(rh >= 2.5 || mon) g.fillRect(0,round(yy),mon?9:4,1);if(mon && w % every === 0) g.fillText(fmt(this.rows[i].date),12,yy);} if(mon) w++;}
  }
  wake(){if(!this.raf) this.raf=requestAnimationFrame(t=>this.tick(t));}
  tick(t){ // кадры только при анимации или видимом колебании
    this.raf=0;const a=this.anim;
    if(a){a.p=a.dur?clamp((t-a.t0)/a.dur,0,1):1;if(a.p >= 1){this.anim=null;this.draw(t);if(a.done) a.done();} }
    if(this.anim || (this.sway && !RM && this.visible)){this.draw(t);this.wake();}
  }
  weaveAll(dur,done){this.anim={type: 'all',t0:now(),dur:RM?0:dur,p:0,done};this.wake();}
  weaveRow(i,color,done){ // полотно перерисуем, когда челнок доедет
    const S=this.cS || DPR,Wu=this.Wu,c=cv(round(Wu*S),round(6*S));
    drawRow(ctx(c),S,Wu,0,this.habits,this.rows[i].arr,this.rows[i].st);this.dirty=false;
    this.anim={type: 'row',i,strip:c,color,t0:now(),dur:RM?0:400,p:0,dir:this.dir,done:()=>{this.dirty=true;this.draw(now());if(done) done();} };this.dir *= -1;this.wake();
  }
  tipAt(px,py){
    const [cw]=this.view(),k=this.rows.length-1-floor((py-this.vy)/(6*this.zoom)),i=px >= this.vx && px <= this.vx+cw && k >= 0 && k < this.rows.length?k:-1;
    if(i !== this.hover){this.hover=i;if(!this.anim) this.draw(now());}
    const tip=this.tip;if(!tip) return;if(i < 0) return tip.classList.remove('show');
    const row=this.rows[i],names=this.habits.filter((h,j)=>row.arr[j]).map(h=>h.name),st=max(...row.st);
    tip.textContent = `${fmtLong(row.date)} · ${names.join(', ') || 'пустой ряд'} — ${names.length} из ${this.habits.length}${st >= 7?' · серия '+st:''}`;
    tip.style.left=(px+276 > tip.parentElement.clientWidth?max(0,px-244):px+26) + 'px';tip.style.top=py + 'px';tip.classList.add('show');
  }
  bindZoom(){ // колесо, перетаскивание, пинч
    const c=this.canvas,pts=new Map(),at=e=>{const r=c.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};let pinch=0;
    c.onwheel=e=>{if(!e.ctrlKey && !e.metaKey) return;e.preventDefault();this.setZoom(this.zoom*Math.exp(-e.deltaY*.0012),...at(e));}; // зум по Ctrl/⌘+колесо и пинчу, прокрутка свободна
    c.onpointerdown=e=>{pts.set(e.pointerId,at(e));c.setPointerCapture(e.pointerId);this.drag=at(e);};
    c.onpointermove=e=>{
      if(!pts.has(e.pointerId)) return;const p=at(e);pts.set(e.pointerId,p);
      if(pts.size === 2){const [a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch) this.setZoom(this.zoom*d/pinch,(a[0]+b[0])/2,(a[1]+b[1])/2);pinch=d;}
      else if(this.drag){this.panY=this.vy+p[1]-this.drag[1];this.drag=p;this.draw(now());}
    };
    c.onpointerup=c.onpointercancel=e=>{pts.delete(e.pointerId);pinch=0;this.drag=null;};
  }
}

// --- демо-год с автокорреляцией 0,85 / 0,55
function genYear(habits,start,end,seed){
  const days={},n=daysBetween(start,end)+1;
  habits.forEach((h,j)=>{const r=mulberry32((seed+fnv1a(h.name)) >>> 0);let prev=r() < .75;for(let i=0;i < n;i++){const d=addDays(start,i);(days[d]=days[d] || Array(habits.length).fill(0))[j]=prev?1:0;prev=r() < (prev?.85:.55);} });
  return days;
}
const DEMO=[['вода', '#2C3E6B', 'romb'],['чтение', '#C8553D', 'krest'],['зарядка', '#D9A441', 'zigzag'],['сон до 23:00', '#6E3B56', 'polosa'],['без сахара', '#3F6B4F', 'romb'],['прогулка', '#A86B2F', 'zigzag']].map(([name,color,stitch],i)=>({id: 'd'+i,name,color,stitch}));
const DEMO_START=addDays(T,-364),DEMO_DAYS=genYear(DEMO,DEMO_START,T,2026);

// --- катушки
function renderSpools(box,habits,arr,cb){
  box.innerHTML=habits.map((h,j)=>`<button class="spool" aria-pressed="${!!arr[j]}"><svg viewBox="0 0 44 28" style="--c:${h.color}" aria-hidden="true"><use href="#spool"/></svg><span>${esc(h.name)}</span></button>`).join('');
  $$('.spool',box).forEach((b,j)=>b.onclick=()=>{const on=b.getAttribute('aria-pressed') !== 'true';b.setAttribute('aria-pressed',on);if(!RM) b.firstChild.animate([{transform: 'translateY(-6px) scaleY(.92)',offset:.5}],150);tuk();cb(j,on);});
}

// --- hero
const heroToday=[1,0,1,0,0,0],hero=new Loom({canvas:$('#hero-loom'),ruler:$('#hero-ruler'),tip:$('#hero-tip'),sway:true});
const heroRows=()=>buildRows({habits:DEMO,start:addDays(T,1-floor(hero.H/6)),days:{ ...DEMO_DAYS,[T]: heroToday} },T);
function sizeHero(first){ // ширина от колонки: рама 24 + зазор 8 + линейка 60
  const w=clamp(($('#hero-stage').parentElement.clientWidth || 512)-92,220,420);hero.size(w,round(w*1.5));hero.setData(DEMO,heroRows());if(first) hero.weaveAll(3000);
}
renderSpools($('#hero-spools'),DEMO,heroToday,(j,on)=>{heroToday[j]=on?1:0;hero.rows=heroRows();hero.weaveRow(hero.rows.length-1,DEMO[j].color);});
const soundUI=()=>{$('#sound').setAttribute('aria-pressed',soundOn);$('#sound-label').textContent=soundOn?'звук: вкл':'звук: выкл';};
on('#sound', 'click',()=>{soundOn=!soundOn;soundUI();state.sound=soundOn;save();if(soundOn) tuk();});

// --- состояние демо (localStorage kovyor:v1)
const KEY = 'kovyor:v1',uid=()=>'h'+Math.random().toString(36).slice(2,8);
function sampleState(){const habits=DEMO.slice(0,3).map((h,i)=>({ ...h,id: 'h'+i})),start=addDays(T,-27);return {habits,start,days:genYear(habits,start,addDays(T,-1),7),name: 'Осень-2026',sample:true};}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s && s.habits.length && s.days && s.start) return s;}catch(e){} return null;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){} }
let state=load() || sampleState(),preview=null,mode=state.sample?'setup':'track',draft,rows=[];
const cur=()=>preview || state; // preview — демо-год на копии, не сохраняется
if(state.start > T) state.start=T;soundOn=state.sound !== false;soundUI();
const loom=new Loom({canvas:$('#demo-loom'),ruler:$('#demo-ruler'),tip:$('#demo-tip'),zoomable:true,onZoom:z=>{$('#zoom-val').textContent=round(z*100) + '%';} });
const status=msg=>{$('#status').textContent=msg;};
function sizeLoom(first){const w=max(200,$('#demo-stage').clientWidth-92),h=innerWidth < 480?400:innerWidth < 960?440:520;loom.size(w,h);refresh(first);}
function refresh(fit){ // ряды, статистика, карточка, постер
  const st=cur();rows=buildRows(st,T);loom.setData(st.habits,rows);if(fit) loom.fit();
  const n=rows.length,N=st.habits.length;let done=0,best=0,medals=0;
  rows.forEach(r=>r.st.forEach((s,j)=>{done += r.arr[j];best=max(best,s);if(s && s % 30 === 0) medals++;}));
  $('#st-rows').textContent=n;$('#st-fill').textContent=round(done/(n*N)*100) + '%';$('#st-streak').textContent=days_(best);$('#st-medals').textContent=medals;
  $('#loom-title').textContent = `${preview?'Демо-год':state.name} · ${rows_(n)}`;$('#unyear').hidden=!preview;loom.onZoom(loom.zoom);
  drawWeek();drawPoster();
}
function toggleDay(date,j,on){
  (state.days[date]=state.days[date] || Array(state.habits.length).fill(0))[j]=on?1:0;save();
  if(preview) preview.days[date]=state.days[date];
  rows=buildRows(cur(),T);loom.rows=rows;const i=daysBetween(cur().start,date);
  if(i >= 0 && i < rows.length) loom.weaveRow(i,state.habits[j].color,()=>refresh());else refresh();
}

// онбординг
function setStep(s){
  $$('#setup .step').forEach(el=>el.hidden=+el.dataset.step !== s);$$('#stepper li').forEach((li,k)=>{li.classList.toggle('cur',k+1 === s);li.classList.toggle('done',k+1 < s);});
  if(s === 1) renderPresets();if(s === 2) renderThreads();if(s === 3){$('#start').value=draft.start;$('#start').min=addDays(T,-730);$('#start').max=T;$('#cname').value=draft.name;}
}
function renderPresets(){
  const names=[...new Set([...PRESETS,...draft.habits.map(h=>h.name)])];
  $('#presets').innerHTML=names.map(n=>`<button class="chip" data-name="${esc(n)}" aria-pressed="${draft.habits.some(h=>h.name === n)}">${esc(n)}</button>`).join('');
  $$('#presets .chip').forEach(b=>b.onclick=()=>toggleHabit(b.dataset.name));$('#pick-count').textContent = `Выбрано ${draft.habits.length}`;
}
function toggleHabit(name){
  const k=draft.habits.findIndex(h=>h.name === name);
  if(k >= 0) draft.habits.splice(k,1);
  else if(draft.habits.length >= 6) return status('Максимум шесть нитей.');
  else{const used=draft.habits.map(h=>h.color);draft.habits.push({id:uid(),name,color:PALETTE.find(c=>!used.includes(c)) || PALETTE[0],stitch:STITCHES[draft.habits.length % 4][0]});}
  renderPresets();
}
on('#custom-form', 'submit',e=>{e.preventDefault();const v=$('#custom').value.replace(/[<>]/g, '').trim().slice(0,24);if(v && !draft.habits.some(h=>h.name === v)) toggleHabit(v);$('#custom').value = '';});
function renderThreads(){
  $('#threads').innerHTML=draft.habits.map(h=>{
    const nm=esc(h.name),sw=PALETTE.map((c,i)=>`<button class="sw" style="--c:${c}" aria-pressed="${c === h.color}" aria-label="цвет: ${NAMES[i]}"></button>`).join('');
    const st=STITCHES.map(([id,s])=>`<button class="stitch" aria-pressed="${id === h.stitch}"><svg viewBox="0 0 16 16" aria-hidden="true"><use href="#st-${id}"/></svg>${s}</button>`).join('');
    return `<div class="thread"><canvas width="${48*DPR}" height="${48*DPR}" aria-hidden="true"></canvas><div><b>${nm}</b><div class="swatches" role="group" aria-label="Цвет: ${nm}">${sw}</div><div class="stitches" role="group" aria-label="Стежок: ${nm}">${st}</div></div></div>`;
  }).join('');
  $$('.thread').forEach((el,k)=>{
    const h=draft.habits[k];drawTile(ctx(el.querySelector('canvas')),tile(h.name,h.stitch),h.color,0,0,6*DPR);
    $$('.sw',el).forEach((b,i)=>b.onclick=()=>{h.color=PALETTE[i];renderThreads();});
    $$('.stitch',el).forEach((b,i)=>b.onclick=()=>{h.stitch=STITCHES[i][0];renderThreads();});
  });
}
on('#to2', 'click',()=>draft.habits.length < 2?status('Нужно хотя бы две привычки.'):setStep(2));
on('#back1', 'click',()=>setStep(1));on('#to3', 'click',()=>setStep(3));on('#back2', 'click',()=>setStep(2));
on('#weave', 'click',()=>{
  const v=$('#start').value,lo=addDays(T,-730);draft.start=v && v <= T?(v < lo?lo:v):T;draft.name=$('#cname').value.trim() || 'Мой ковёр';
  const old=state.habits.map(h=>h.id),days={}; // отметки переносим по id
  for(const d in state.days) days[d]=draft.habits.map(h=>state.days[d][old.indexOf(h.id)] || 0);
  preview=null;state={ ...state,habits:draft.habits.map(h=>({ ...h})),start:draft.start,name:draft.name,days,sample:false};save();
  mode = 'track';renderPanel();refresh(true);loom.weaveAll(min(3000,200+rows.length*25));
  status(`Соткано: ${rows_(rows.length)}. Отмечай сегодня, вчера и позавчера.`);
});

// режим ткачества
function renderPanel(){
  $('#setup').hidden=mode !== 'setup';$('#track').hidden=mode !== 'track';
  if(mode === 'setup'){draft={habits:state.habits.map(h=>({ ...h})),start:state.start,name:state.name};return setStep(1);}
  const N=state.habits.length;
  $('#summary-text').textContent = `${state.name} · ${N} ${plural(N, 'привычка', 'привычки', 'привычек')} · с ${fmt(state.start)}`;
  $('#today-h').textContent = `Сегодня, ${fmtLong(T).slice(4)}`;
  renderSpools($('#demo-spools'),state.habits,state.days[T] || [],(j,on)=>toggleDay(T,j,on));
  $('#fix').innerHTML=[1,2].filter(b=>addDays(T,-b) >= state.start).map(b=>`<div class="fix-row"><span class="d">${b === 1?'Вчера':'Позавчера'}, ${fmt(addDays(T,-b))}</span><span class="n"></span><button class="btn btn-line btn-sm" aria-expanded="false" aria-controls="fix-${b}">исправить</button><div class="spools spools-demo" id="fix-${b}" hidden></div></div>`).join('');
  $$('#fix .fix-row').forEach((row,k)=>{
    const d=addDays(T,-1-k),box=row.querySelector('.spools'),cnt=()=>{row.querySelector('.n').textContent = `${(state.days[d] || []).filter(Boolean).length} из ${N}`;};cnt();
    renderSpools(box,state.habits,state.days[d] || [],(j,on)=>{toggleDay(d,j,on);cnt();});
    row.querySelector('.btn').onclick=e=>{box.hidden=!box.hidden;e.currentTarget.textContent=box.hidden?'исправить':'готово';e.currentTarget.setAttribute('aria-expanded',!box.hidden);};
  });
}
on('#edit', 'click',()=>{mode = 'setup';renderPanel();});
function showYear(){ // демо-год на копии, без save()
  const start=state.start > DEMO_START?DEMO_START:state.start,gen=genYear(state.habits,start,T,Math.random()*1e9 >>> 0);
  preview={ ...state,start,days:{ ...gen,...state.days,[T]: state.days[T] || []} };
  refresh(true);loom.weaveAll(3000);status(`Демо-год: ${rows_(rows.length)} сотканы правдоподобно, твои отметки целы. Зум: кнопки или Ctrl+колесо.`);
}
on('#year', 'click',showYear);on('#hero-year', 'click',()=>setTimeout(showYear,400));
on('#unyear', 'click',()=>{preview=null;refresh(true);status('Твой ковёр на месте.');});
function download(name,blob){
  if(!blob) return status('Слишком длинно для PNG.');
  const a=document.createElement('a'),u=URL.createObjectURL(blob);a.download=name;a.href=u;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);
}
const exportPNG=(width,m)=>{ // лимиты canvas: высота 16 000, площадь 24 Мпкс
  const W=loom.W,CH=rows.length*6,S=min(width/W,16000/CH,Math.sqrt(24e6/(W*CH)));
  renderCloth(S,W,cur().habits,rows).toBlob(b=>download(`kovyor-${T}-${m}x.png`,b));status('PNG сохраняется файлом.');
};
on('#png2', 'click',()=>exportPNG(1680,2));on('#png4', 'click',()=>exportPNG(3360,4));
on('#export', 'click',()=>{download(`kovyor-${T}.json`,new Blob([JSON.stringify(state,null,1)],{type: 'application/json'}));status('JSON сохраняется файлом.');});
on('#import', 'change',e=>{
  const f=e.target.files[0],r=new FileReader();if(!f) return;
  r.onload=()=>{
    try{
      const s=JSON.parse(r.result);if(!s.habits?.length || !s.days || !/^\d{4}-\d{2}-\d{2}$/.test(s.start)) throw 0;
      s.habits=s.habits.slice(0,6).map(h=>({id:String(h.id || uid()).slice(0,12),name:String(h.name).replace(/[<>]/g, '').slice(0,24) || 'нить',color: /^#[0-9a-f]{6}$/i.test(h.color)?h.color:PALETTE[0],stitch:MASK[h.stitch]?h.stitch:'romb'}));
      preview=null;state={habits:s.habits,days:s.days,sound:soundOn,name:String(s.name || 'Мой ковёр').replace(/[<>]/g,'').slice(0,28),sample:false,start:s.start > T?T:s.start};save();mode = 'track';renderPanel();refresh(true);status(`Импортировано: ${rows_(rows.length)}.`);
    }catch(err){status('Нужен JSON с habits, days и start.');}
  };
  r.readAsText(f);e.target.value = '';
});
on('#reset', 'click',()=>{preview=null;state=sampleState();state.sound=soundOn;save();mode = 'setup';renderPanel();refresh(true);status('Полотно распущено.');});
on('#zoom-in', 'click',()=>loom.setZoom(loom.zoom*1.5));on('#zoom-out', 'click',()=>loom.setZoom(loom.zoom/1.5));on('#zoom-fit', 'click',()=>loom.fit());

// --- карточка недели
function drawWeek(){ // без отметок за сегодня — 7 завершённых дней
  const g=ctx($('#week-card')),N=state.habits.length,today=(cur().days[T] || []).some(Boolean);
  let last=today?rows.slice(-7):rows.slice(-8,-1);if(!last.length) last=rows.slice(-7);
  while(last.length < 7) last.unshift({date:addDays(last[0].date,-1),arr:Array(N).fill(0),st:Array(N).fill(0)});
  const F=(n,d)=>`${d?400:500} ${n}px "${d?'Yeseva One':'Golos Text'}", ${d?'serif':'sans-serif'}`,txt=(s,x,y,font,col=INK,align = 'left')=>{g.font=font;g.fillStyle=col;g.textAlign=align;g.fillText(s,x,y);};
  g.setTransform(1,0,0,1,0,0);g.fillStyle=LINEN;g.fillRect(0,0,1080,1080);
  g.fillStyle=pattern(g,{name:state.name,stitch: 'romb',color:INK},24);g.globalAlpha=.18;g.fillRect(0,0,1080,24);g.fillRect(0,1056,1080,24);g.globalAlpha=1;
  txt('Моя неделя',72,130,F(64,1));txt(`${state.name} · ${fmt(last[0].date)} — ${fmt(last[6].date)}`,72,176,F(28), '#6B6058');
  g.drawImage(renderCloth(12,70,state.habits,last),150,220);
  last.forEach((r,i)=>{const d=parse(r.date);txt(WD[d.getDay()] + ' '+d.getDate(),134,264+(6-i)*72,F(24), '#6B6058', 'right');});
  let done=0,best=0;const per=state.habits.map((h,j)=>{let k=0;last.forEach(r=>{k += r.arr[j];best=max(best,r.st[j]);});done += k;return k;});
  const cols=N > 3?2:1,cw=936/cols;
  state.habits.forEach((h,j)=>{const x=72+(j % cols)*cw,y=780+floor(j/cols)*54;drawTile(g,tile(h.name,h.stitch),h.color,x,y-26,4);txt(`${h.name} — ${per[j]} из 7`,x+46,y,F(26));});
  const pct=round(done/(7*N)*100);
  txt(`${pct}% недели соткано`,72,1000,F(44,1));txt(`лучшая серия — ${days_(best)}`,72,1036,F(26), '#6B6058');txt('Ковёр',1008,1036,F(30,1), '#C8553D', 'right');
  $('#week-stats').innerHTML=state.habits.map((h,j)=>`<li><i style="--c:${h.color}"></i>${esc(h.name)} — ${per[j]} из 7</li>`).join('') + `<li><i style="--c:${INK}"></i>соткано ${pct}% недели, лучшая серия ${days_(best)}</li>`;
}
on('#week-dl', 'click',()=>$('#week-card').toBlob(b=>download(`kovyor-week-${T}.png`,b)));

// --- постер и заказ
const PAPER = 'бумага 300 г, тубус, доставка по РФ',FORMATS=[['A3', '297×420 мм',1990,280,396,PAPER],['A2', '420×594 мм',2990,322,455,PAPER],['Коврик', '60×90 см',1490,280,420, 'ворс 8 мм, нескользящая основа'],['Плед', '130×170 см',7990,336,440, 'жаккард, хлопок с шерстью']];
let format=FORMATS[0];
function renderFormats(){$('#formats').innerHTML=FORMATS.map(f=>`<button class="chip" aria-pressed="${f === format}">${f[0]} · ${num(f[2])} ₽</button>`).join('');$$('#formats .chip').forEach((b,k)=>b.onclick=()=>{format=FORMATS[k];renderFormats();drawPoster();});}
function drawPoster(){ // пропорция формата; в узкой комнате меньше
  const [name,size,price,w0,h0,note]=format,el=$('#poster'),c=$('#poster-canvas'),soft=name === 'Коврик' || name === 'Плед';
  const k=min(1,(el.parentElement.clientWidth-48)/w0),pw=round(w0*k),ph=round(h0*k);
  el.style.width=pw + 'px';el.style.height=ph + 'px';el.classList.toggle('rug',soft);
  const iw=soft?pw:pw-56,ih=soft?ph:ph-56,Wc=max(20,rows.length*6*iw/ih),S=iw*DPR/Wc,cloth=renderCloth(S,Wc,cur().habits,rows,false),g=ctx(c);
  c.width=cloth.width;c.height=cloth.height;g.drawImage(cloth,0,0);
  cloth.medals.forEach(([x,y,col])=>drawMedal(g,max(S,.6*DPR),x,y,col));
  $('#poster-size').textContent = `${name} · ${size}`;$('#order-price').textContent = `${num(price)} ₽`;$('#order-note').textContent=note;
}
renderFormats();
on('#order-form', 'submit',e=>{
  e.preventDefault();let orders=[];try{orders=JSON.parse(localStorage.getItem('kovyor:orders')) || [];}catch(err){}
  const phone=$('#o-phone').value.replace(/[^\d+]/g, '');
  if(phone.replace(/\D/g, '').length < 10) return $('#order-status').textContent = 'Проверь телефон: нужно хотя бы 10 цифр.';
  const o={n:1041+orders.length,format:format[0],price:format[2],name:$('#o-name').value.trim(),phone,addr:$('#o-addr').value.trim()};
  orders.push(o);try{localStorage.setItem('kovyor:orders',JSON.stringify(orders));}catch(err){}
  $('#order-status').textContent = `Заказ принят (демо): №K-${o.n}, ${o.format}, ${num(o.price)} ₽. Перезвоним на ${o.phone}, ${o.name}.`;e.target.reset();
});

// --- галерея: 12 грамматик одного года
function gallery(){
  const all=buildRows({habits:DEMO,start:DEMO_START,days:DEMO_DAYS},T),W=300,H=252,N=6,sw=W/N;
  $$('.gcard canvas').forEach((c,k)=>{
    c.width=W*DPR;c.height=H*DPR;const g=ctx(c),R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
    if(!k) return g.drawImage(renderCloth(DPR,W,DEMO,all.slice(-42)),0,0);// жаккард — штатный движок
    g.setTransform(DPR,0,0,DPR,0,0);R(0,0,W,H,LINEN);
    const rh=k === 3?7:k === 4?8:6,n=floor(H/rh),rs=all.slice(-n),rnd=mulberry32(7);
    rs.forEach((r,i)=>DEMO.forEach((h,j)=>{
      const x0=j*sw,y0=(n-1-i)*rh,on=r.arr[j],col=h.color,lt=lite(col),t=tile(h.name,h.stitch);
      switch(k){
        case 1:if(on){R(x0,y0,sw,6,col);g.fillStyle=lt;g.beginPath();g.moveTo(x0+1,y0+6);g.lineTo(x0+sw/2,y0);g.lineTo(x0+sw-1,y0+6);g.fill();R(x0,y0,1,6,LINEN);} break;// килим
        case 2:for(let x=x0;x < x0+sw-1;x += 6) R(x+.5,y0+.5,5,5,on?col:WEFT);break;// пиксель
        case 3:if(i % 7 === 0){const kk=rs.slice(i,i+7).reduce((a,q)=>a+q.arr[j],0),top=y0-42;R(x0,top,sw,49,kk?col:WEFT);if(kk >= 3) R(x0+sw*.22,top+11,sw*.56,27,lt);R(x0+sw*.4,top+20,sw*.2,10,kk >= 6?'#D9A441':WEFT);R(x0,top,sw,1,LINEN);R(x0,top,1,49,LINEN);} break;// бабушкин
        case 4:if(on){const c2=j % 2?'#C8553D':'#2C3E6B';R(x0,y0,sw,8,lite(c2));g.fillStyle=c2;for(let x=x0;x < x0+sw;x += 16) for(let yy=0;yy < 4;yy++) for(let xx=0;xx < 8;xx++) if(t[yy][xx] && x+xx*2+2 <= x0+sw) g.fillRect(x+xx*2,y0+yy*2,2,2);} break;// скандинавский
        case 5:if(on){g.globalAlpha=.45;R(x0+(rnd()-.5)*6,y0,sw,6,col);R(x0+(rnd()-.5)*6,y0,sw,6,col);g.globalAlpha=1;R(x0+3,y0+1,sw-6,4,col);} break;// икат
        case 6:if(!j){R(0,y0,W,6,WEFT);let x=0;DEMO.forEach((hh,q)=>{if(r.arr[q]){R(x,y0,sw,6,hh.color);R(x,y0+2,sw,1,lite(hh.color));x += sw;} });} break;// полоска
        case 7:if(!on) R(x0,y0,sw,6,WEFT);else{g.save();g.translate(x0,y0-(i % 7)*6);g.scale(1/DPR,1/DPR);g.fillStyle=pattern(g,h,12*DPR);g.fillRect(0,(i % 7)*6*DPR,sw*DPR,6*DPR);g.restore();if(i % 7 === 0) R(x0,y0+5,sw,1,inkA(.35));} break;// лоскут
        case 8:for(let x=x0;x < x0+sw-1;x += 6) if(on){g.strokeStyle=col;g.lineWidth=1.4;g.beginPath();g.moveTo(x+1,y0+1);g.lineTo(x+5,y0+5);g.moveTo(x+5,y0+1);g.lineTo(x+1,y0+5);g.stroke();}else R(x+2.5,y0+2.5,1,1,WEFT);break;// крестик
        case 9:if(!on) R(x0,y0,sw,6,WEFT);else{R(x0,y0,sw,6,col);if((i+j) % 2) for(let y=y0+1;y < y0+6;y += 2) R(x0+1,y,sw-2,1,lt);else for(let x=x0+1;x < x0+sw-1;x += 2) R(x,y0+1,1,4,lt);} break;// рогожка
        case 10:if(!on) R(x0,y0,sw,6,WEFT);else{R(x0,y0,sw,6,col);g.strokeStyle=lt;g.lineWidth=1.2;g.beginPath();for(let x=x0+1;x < x0+sw-5;x += 5){g.moveTo(x,y0+(i % 2?1:5));g.lineTo(x+4,y0+(i % 2?5:1));} g.stroke();} break;// ёлочка
        case 11:if(on){R(x0,y0,sw,6,r.st[j] >= 7?col:mix(col,LINEN,.78));g.strokeStyle=col;g.lineWidth=1;g.strokeRect(x0+.5,y0+.5,sw-1,5);} // контур
      }
    }));
  });
}

// --- мини-сцены
const minis={k:0};
function sizeMinis(){
  const w=max(200,$('#mini-row').parentElement.clientWidth || 240),h=round(w*.58);
  if(!minis.row){
    const hs=DEMO.slice(0,4),rnd=mulberry32(11),st={habits:hs,start:addDays(T,-40),days:genYear(hs,addDays(T,-40),T,5)};
    minis.row=new Loom({canvas:$('#mini-row')});minis.rowData=()=>buildRows(st,T);
    if(!RM) setInterval(()=>{st.days[T]=hs.map(()=>rnd() < .7?1:0);minis.row.rows=minis.rowData();minis.row.weaveRow(minis.row.rows.length-1,hs[floor(rnd()*4)].color);},1700);
  }
  minis.row.size(w,h);minis.row.setData(DEMO.slice(0,4),minis.rowData());
  ['#mini-thread', '#mini-streak'].forEach(s=>{const c=$(s);c.width=round(w*DPR);c.height=round(h*DPR);c.style.width=w + 'px';c.style.height=h + 'px';});
  minis.thread();minis.streak();
}
minis.streak=()=>{ // ряд 18 px: окантовка справа, медальон слева
  const c=$('#mini-streak'),g=ctx(c),w=c.width/DPR,h=c.height/DPR,n=floor(h/18),m=max(5,floor(n/2)),hs=DEMO.slice(0,3),start=addDays(T,1-n),days={};
  for(let i=0;i < n;i++) days[addDays(start,i)]=[1,i % 3 !== 2?1:0,1];
  const rows=buildRows({habits:hs,start,days},T,[29-m,0,3]),top=h-n*18,cw=w/3,ym=top+(n-1-m)*18+9,yb=top+(n-4)*18+9;
  g.setTransform(DPR,0,0,DPR,0,0);g.fillStyle=CARD;g.fillRect(0,0,w,h);g.imageSmoothingEnabled=false;
  g.drawImage(renderCloth(3*DPR,round(w/3),hs,rows),0,top,w,n*18);
  const chip=(s,x,y,right)=>{g.font=FONT;const tw=g.measureText(s).width+16,x0=right?x-tw:x;g.fillStyle=INK;g.fillRect(x0,y-11,tw,22);g.fillStyle=LINEN;g.textBaseline = 'middle';g.fillText(s,x0+8,y);};
  g.strokeStyle=INK;g.lineWidth=1.5;g.beginPath();g.moveTo(cw/2+18,ym);g.lineTo(cw+12,ym);g.moveTo(2*cw+3,yb);g.lineTo(2*cw-12,yb);g.stroke();
  chip('30 дней → медальон',cw+12,ym);chip('7 дней → окантовка',2*cw-12,yb,true);
};
minis.thread=()=>{
  const tc=$('#mini-thread'),g=ctx(tc),w=tc.width/DPR,h=tc.height/DPR,[id,nm]=STITCHES[minis.k % 4],cell=floor(min(h/11,w*.34/8)),x=cell*10.5;
  g.setTransform(DPR,0,0,DPR,0,0);g.fillStyle=CARD;g.fillRect(0,0,w,h);drawTile(g,tile('вода',id), '#2C3E6B',cell*1.5,(h-cell*8)/2,cell);
  g.fillStyle=INK;g.font=FONT;g.textBaseline = 'middle';g.fillText('seed: FNV-1a(«вода»)',x,h*.38);g.fillStyle = '#6B6058';g.fillText('4×4 → зеркало → '+nm,x,h*.62);
  $('#mini-thread-cap').textContent = 'вода · '+nm;
};
if(!RM) setInterval(()=>{minis.k++;minis.thread();},1400);

// --- орнаменты
function ornaments(){ // два тайла по 24 px, ячейка 3 px
  $$('.orn').forEach(el=>{
    const c=cv(48,24),g=ctx(c),s=el.dataset.seed || 'ковёр';
    [[tile(s, 'romb'),inkA(.55),0],[tile(s + ' ткань', 'romb'), 'rgba(200,85,61,.75)',24]].forEach(([t,col,x0])=>{g.fillStyle=col;for(let y=0;y < 8;y++) for(let x=0;x < 8;x++) if(t[y][x]) g.fillRect(x0+x*3,y*3,3,3);});
    el.style.backgroundImage = `url(${c.toDataURL()})`;
  });
}

// --- тарифы, count-up, появление, меню
const setPeriod=y=>{$('#per-m').setAttribute('aria-pressed',!y);$('#per-y').setAttribute('aria-pressed',y);$('#plus-price').textContent=y?'1 290 ₽':'199 ₽';$('#plus-per').textContent=y?'/год':'/мес';};
on('#per-m', 'click',()=>setPeriod(false));on('#per-y', 'click',()=>setPeriod(true));
function countUp(el){if(el.dataset.done) return;el.dataset.done=1;const to=+el.dataset.count,t0=now(),dur=RM?0:600;const f=t=>{const p=dur?clamp((t-t0)/dur,0,1):1;el.textContent=num(to*(1-(1-p) ** 3));if(p < 1) requestAnimationFrame(f);};requestAnimationFrame(f);}
function revealAll(){const h=innerHeight;$$('.reveal:not(.in)').forEach(el=>{if(el.getBoundingClientRect().top < h*.92) el.classList.add('in');});$$('[data-count]').forEach(el=>{if(el.getBoundingClientRect().top < h*.95) countUp(el);});}
function setupReveal(){ // появление по прокрутке
  addEventListener('scroll',revealAll,{passive:true});addEventListener('resize',revealAll);revealAll();setTimeout(revealAll,400);
  new MutationObserver(ms=>ms.forEach(m=>{if(m.target.classList.contains('in')) $$('[data-count]',m.target).forEach(countUp);})).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']}); // count-up по .in
}
const burger=$('#burger'),menu=$('#menu');
burger.onclick=()=>{const open=menu.classList.toggle('open');burger.setAttribute('aria-expanded',open);burger.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');};
on('#menu a', 'click',()=>{menu.classList.remove('open');burger.setAttribute('aria-expanded', 'false');});

// --- старт
ornaments();gallery();sizeMinis();renderPanel();sizeHero(true);sizeLoom(true);setupReveal();
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{sizeHero(false);sizeLoom();sizeMinis();},150);});
document.fonts.ready.then(()=>{drawWeek();minis.thread();hero.draw(now());loom.draw(now());});
})();
