/* Раскладка — планировщик плитки: движок раскладки, живой hero, демо, умный старт, PNG/PDF, проекты.
   Тексты и каталоги — в index.html (#data), лист A4 — в #print-tpl. */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],E=id=>document.getElementById(id);
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>1-(1-t)**3;
const fmtN=n=>Math.round(n).toLocaleString('ru-RU'),fmtCm=v=>(Math.round(v*2)/2).toLocaleString('ru-RU'),fmt1=(v,d=1)=>v.toLocaleString('ru-RU',{maximumFractionDigits:d});
const D=JSON.parse(E('data').textContent),M=D.msg,T=(k,v={})=>M[k].replace(/\{(\w+)\}/g,(_,q)=>v[q]);
const pl=(n,[a,b,c])=>{const m=n%100,k=n%10;return m>10&&m<20?c:k===1?a:k>1&&k<5?b:c;},N=(n,w)=>fmtN(n)+' '+pl(n,w);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const INK='#2A2A2A',TEAL='#1E6F74',TEAL2='#175F64',AMBER='rgba(227,163,60,.85)',MILK='#F4ECDD',TERRA='#B8563B',FONT='Nunito, sans-serif',WALLS=['top','right','bottom','left'];
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d;}catch{return d;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
const on=(el,ev,fn,o)=>el.addEventListener(ev,fn,o),goDemo=()=>E('demo').scrollIntoView({behavior:RM?'auto':'smooth'});
const FORMATS=D.formats.map(([name,w,h,pack,m2,pat])=>({name,w,h,pack,m2,pat})),PATS=D.pats;

// ---------- появление, count-up, тост, меню ----------
$$('[data-stagger]').forEach(g=>[...g.children].forEach((el,i)=>el.style.setProperty('--i',i)));
function tween(a,b,ms,fn){if (RM) return fn(b);const t0=performance.now();const step=t=>{const k=clamp((t-t0)/ms,0,1);fn(a+(b-a)*ease(k));if (k<1) requestAnimationFrame(step);};requestAnimationFrame(step);}
const revealAll=()=>{const h=innerHeight;$$('.reveal:not(.in)').forEach(el=>{if (el.getBoundingClientRect().top<h*.92) el.classList.add('in');});};
on(window,'scroll',revealAll,{passive:true});on(window,'resize',revealAll);setTimeout(revealAll,400);
const countUp=el=>{if (el.dataset.done) return;el.dataset.done=1;tween(0,+el.dataset.count,600,v=>el.textContent=(v<-.5?'−':'')+fmtN(Math.abs(v)));};
new MutationObserver(ms=>ms.forEach(m=>{if (m.target.classList.contains('in')) $$('[data-count]',m.target).forEach(countUp);})).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
const toastEl=E('toast');let toastT;const toast=m=>{toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('show'),2800);};
const burger=E('burger'),menu=E('menu');
burger.onclick=()=>{const o=menu.classList.toggle('open');burger.setAttribute('aria-expanded',o);burger.setAttribute('aria-label',o?M.menuClose:M.menuOpen);};
menu.onclick=e=>{if (e.target.tagName==='A'){menu.classList.remove('open');burger.setAttribute('aria-expanded','false');}};

// ---------- геометрия: площадь, центроид, клиппинг Сазерленда–Ходжмана, комната ----------
const polyArea=p=>{let s=0;for (let i=0,n=p.length;i<n;i++){const a=p[i],b=p[(i+1)%n];s+=a[0]*b[1]-b[0]*a[1];}return Math.abs(s)/2;};
function centroid(p){let a=0,x=0,y=0;for (let i=0,n=p.length;i<n;i++){const [x0,y0]=p[i],[x1,y1]=p[(i+1)%n],c=x0*y1-x1*y0;a+=c;x+=(x0+x1)*c;y+=(y0+y1)*c;}return a?[x/(3*a),y/(3*a)]:p[0];}
function clipAxis(poly,ax,bound,keepGreater){
  const out=[],n=poly.length;
  for (let i=0;i<n;i++){
    const a=poly[i],b=poly[(i+1)%n],ia=keepGreater?a[ax]>=bound:a[ax]<=bound,ib=keepGreater?b[ax]>=bound:b[ax]<=bound;
    if (ia) out.push(a);
    if (ia!==ib){const t=(bound-a[ax])/(b[ax]-a[ax]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
 }
  return out;
}
function clipRect(poly,r){
  let p=clipAxis(poly,0,r.x,true);if (p.length>2) p=clipAxis(p,0,r.x+r.w,false);
  if (p.length>2) p=clipAxis(p,1,r.y,true);if (p.length>2) p=clipAxis(p,1,r.y+r.h,false);
  return p.length>2?p:null;
}
function region(w,h,holes=[]){
  const hs=holes.map(o=>({x:Math.max(0,o.x),y:Math.max(0,o.y),w:Math.min(w,o.x+o.w)-Math.max(0,o.x),h:Math.min(h,o.y+o.h)-Math.max(0,o.y),kind:o.kind})).filter(o=>o.w>0&&o.h>0);
  const xs=[...new Set([0,w,...hs.flatMap(o=>[o.x,o.x+o.w])])].sort((a,b)=>a-b),cells=[];
  for (let i=0;i<xs.length-1;i++){
    const x0=xs[i],x1=xs[i+1],xm=(x0+x1)/2;if (x1-x0<.01) continue;
    const ys=[...new Set([0,h,...hs.filter(o=>o.x<xm&&o.x+o.w>xm).flatMap(o=>[o.y,o.y+o.h])])].sort((a,b)=>a-b);
    for (let j=0;j<ys.length-1;j++){const y0=ys[j],y1=ys[j+1],ym=(y0+y1)/2;if (y1-y0<.01) continue;if (!hs.some(o=>o.x<xm&&o.x+o.w>xm&&o.y<ym&&o.y+o.h>ym)) cells.push({x:x0,y:y0,w:x1-x0,h:y1-y0});}
 }
  return{w,h,holes:hs,cells,area:cells.reduce((s,c)=>s+c.w*c.h,0)};
}

// ---------- решётки узоров (см) по охватывающему прямоугольнику bb ----------
function pitchOf(pat,tw,th,g){
  const L=Math.max(tw,th),W=Math.min(tw,th),n=Math.round(L/W),weave=pat==='checker'&&n>1&&Math.abs(L/W-n)<.03;
  return{n:weave?n:0,P:weave?Math.max(L,n*W+(n-1)*g)+g:th+g};
}
function*genTiles(pat,tw,th,g,bb){
  const pw=tw+g,ph=th+g,L=Math.max(tw,th),W=Math.min(tw,th),{n,P}=pitchOf(pat,tw,th,g);
  if (pat==='herring45'||pat==='herring90'){
    const Lp=L+g,Wp=W+g,cs=[[bb.x0,bb.y0],[bb.x1,bb.y0],[bb.x0,bb.y1],[bb.x1,bb.y1]],as=cs.map(([x,y])=>(x+y)/(2*Lp)),bs=cs.map(([x,y])=>(y-x)/(2*Wp));
    for (let b=Math.floor(Math.min(...bs))-1;b<=Math.ceil(Math.max(...bs))+1;b++) for (let a=Math.floor(Math.min(...as))-1;a<=Math.ceil(Math.max(...as))+1;a++){const x=a*Lp-b*Wp,y=a*Lp+b*Wp;yield{x,y,w:L,h:W,row:b,col:a,rot:0};yield{x:x+Lp,y,w:W,h:L,row:b,col:a,rot:90};}
    return;
 }
  if (n){
    for (let J=Math.floor(bb.y0/P)-1;J<=Math.ceil(bb.y1/P);J++) for (let I=Math.floor(bb.x0/P)-1;I<=Math.ceil(bb.x1/P);I++) for (let k=0;k<n;k++)
      yield (I+J)&1?{x:I*P+k*(W+g),y:J*P,w:W,h:L,row:J,col:I,rot:90}:{x:I*P,y:J*P+k*(W+g),w:L,h:W,row:J,col:I,rot:0};
    return;
 }
  const m=pat==='half'?2:pat==='third'?3:1;
  for (let j=Math.floor(bb.y0/ph)-1;j<=Math.ceil(bb.y1/ph);j++){
    const shift=((j%m)+m)%m*pw/m;
    for (let i=Math.floor((bb.x0-shift)/pw)-1;i<=Math.ceil((bb.x1-shift)/pw);i++) yield{x:i*pw+shift,y:j*ph,w:tw,h:th,row:j,col:i,rot:pat==='checker'?((i+j)&1)*90:0};
 }
}

// ---------- раскладка: клиппинг каждой плитки; целая ≥ 99% площади, иначе подрезка ----------
function layout(reg,tile,g,pat,origin,light){
  const th=(pat==='diag'||pat==='herring45')?Math.PI/4:0,c=Math.cos(th),s=Math.sin(th),tA=tile.w*tile.h;
  const inv=(x,y)=>[(x-origin.x)*c+(y-origin.y)*s,-(x-origin.x)*s+(y-origin.y)*c];
  const cs=[[0,0],[reg.w,0],[0,reg.h],[reg.w,reg.h]].map(p=>inv(p[0],p[1])),xs=cs.map(p=>p[0]),ys=cs.map(p=>p[1]);
  const bb={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)},tiles=[],cutTiles=[];let whole=0,narrow=0,covered=0;
  for (const t of genTiles(pat,tile.w,tile.h,g,bb)){
    const q=[[t.x,t.y],[t.x+t.w,t.y],[t.x+t.w,t.y+t.h],[t.x,t.y+t.h]].map(([x,y])=>[origin.x+x*c-y*s,origin.y+x*s+y*c]);
    let qx0=1e9,qy0=1e9,qx1=-1e9,qy1=-1e9;for (const p of q){qx0=Math.min(qx0,p[0]);qx1=Math.max(qx1,p[0]);qy0=Math.min(qy0,p[1]);qy1=Math.max(qy1,p[1]);}
    if (qx1<=0||qy1<=0||qx0>=reg.w||qy0>=reg.h) continue;
    let A=0;const parts=[];
    for (const cell of reg.cells){if (qx1<=cell.x||qx0>=cell.x+cell.w||qy1<=cell.y||qy0>=cell.y+cell.h) continue;const p=clipRect(q,cell);if (p){const a=polyArea(p);if (a>.5){A+=a;parts.push(p);}}}
    if (!A) continue;
    covered+=A;
    let X0=1e9,Y0=1e9,X1=-1e9,Y1=-1e9;for (const p of parts) for (const [X,Y] of p){X0=Math.min(X0,X);X1=Math.max(X1,X);Y0=Math.min(Y0,Y);Y1=Math.max(Y1,Y);}
    const o={parts:light?null:parts,rb:[X0,Y0,X1,Y1],row:t.row,col:t.col,rot:t.rot,cut:A<.99*tA,dims:t.rot?[t.h,t.w]:[t.w,t.h]};
    if (o.cut){
      let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
      for (const p of parts) for (const [X,Y] of p){const [u,v]=inv(X,Y);x0=Math.min(x0,u);x1=Math.max(x1,u);y0=Math.min(y0,v);y1=Math.max(y1,v);}
      const bw=Math.min(t.w,Math.round((x1-x0)*2)/2),bh=Math.min(t.h,Math.round((y1-y0)*2)/2),cx=bw<t.w-.3,cy=bh<t.h-.3;
      o.dims=t.rot?[bh,bw]:[bw,bh];
      if (cx!==cy){o.len=cx?bw:bh;o.T=cx?t.w:t.h;if (o.len>=o.T/3) o.key=t.row+(cx?'x':'y')+t.rot;o.narrow=o.len<5;}
      else{o.len=A;o.T=tA*.95;if (A>=tA/3) o.key=t.row+'d';o.narrow=Math.min(bw,bh)<5;}
      if (o.narrow) narrow++;
      cutTiles.push(o);
   }else whole++;
    tiles.push(o);
 }
  const groups={};for (const t of cutTiles) if (t.key) (groups[t.key]||=[]).push(t);
  let reused=0;
  for (const k in groups){const arr=groups[k].sort((a,b)=>a.len-b.len);let i=0,j=arr.length-1;while (i<j){if (arr[i].len+arr[j].len<=arr[i].T){reused++;i++;j--;}else j--;}}
  const pieces=whole+cutTiles.length-reused,rows=[...new Set(tiles.map(t=>t.row))].sort((a,b)=>a-b);
  return{tiles,whole,cuts:cutTiles.length,reused,pieces,narrow,covered,rowNo:new Map(rows.map((r,i)=>[r,i+1])),waste:pieces?Math.max(0,1-covered/(pieces*tA)):0,geo:{o:origin,a:th,pat,tile,g}};
}
function cutList(res,prefix){
  const m=new Map();
  for (const t of res.tiles) if (t.cut){const k=prefix+res.rowNo.get(t.row)+'|'+t.dims[0]+'|'+t.dims[1]+'|'+(t.narrow?1:0);m.set(k,(m.get(k)||0)+1);}
  return [...m].map(([k,n])=>{const [row,a,b,w]=k.split('|');return{row,a:+a,b:+b,n,narrow:w==='1'};}).sort((p,q)=>p.row.localeCompare(q.row,'ru',{numeric:true})||q.n-p.n);
}
function startAt(kind,reg,tile,g,door,wall){
  const cx=reg.w/2-tile.w/2,cy=reg.h/2-tile.h/2,byDoor=kind==='door'&&door,w=byDoor?door.wall:kind==='wall'?wall:'',m=byDoor?door.pos+door.width/2:0,ax=byDoor?m-tile.w/2:cx,ay=byDoor?m-tile.h/2:cy;
  return w==='top'?{x:ax,y:0}:w==='bottom'?{x:ax,y:reg.h+g}:w==='left'?{x:0,y:ay}:w==='right'?{x:reg.w+g,y:ay}:{x:cx,y:cy};
}
function edgeDiff(res,reg,wall){
  const horiz=wall==='top'||wall==='bottom',ax=horiz?0:1,ext=t=>horiz?t.rb[2]-t.rb[0]:t.rb[3]-t.rb[1];
  const touch=res.tiles.filter(t=>t.cut&&(wall==='top'?t.rb[1]<.5:wall==='bottom'?t.rb[3]>reg.h-.5:wall==='left'?t.rb[0]<.5:t.rb[2]>reg.w-.5)).sort((a,b)=>a.rb[ax]-b.rb[ax]);
  return touch.length<2?0:Math.abs(ext(touch[0])-ext(touch[touch.length-1]));
}
const OPP={top:'bottom',bottom:'top',left:'right',right:'left'};


function smart(reg,tile,g,pat,door){
  const lim=clamp(Math.round(2e4*tile.w*tile.h/reg.area),2,10),cand=(len,p)=>{const st=Math.max(5,p/lim),a=((len+g)%p)/2,s=new Set([a,(a+p/2)%p].map(v=>Math.round(v*10)/10));for (let d=0;d<p-.01;d+=st) s.add(Math.round(d*10)/10);return [...s];};
  let best=null;
  for (const dy of cand(reg.h,tile.h+g)) for (const dx of cand(reg.w,tile.w+g)){
    const r=layout(reg,tile,g,pat,{x:dx,y:dy},true),sym=door?edgeDiff(r,reg,OPP[door.wall])+edgeDiff(r,reg,door.wall):0,pen=10*r.narrow+.3*sym+r.cuts;
    if (!best||pen<best.pen-1e-9||(Math.abs(pen-best.pen)<1e-9&&r.pieces<best.pieces)) best={pen,origin:{x:dx,y:dy},pieces:r.pieces,narrow:r.narrow,sym};
 }
  return best;
}

// ---------- схемы: имена и чипы (пиктограммы в #data нарисованы этим же движком) ----------
const patName=id=>(PATS.find(p=>p[0]===id)||PATS[0])[1];
function makeChips(el,list,cur,onPick){
  el.innerHTML=list.map(([id,name])=>`<button type="button" class="chip" data-id="${id}" aria-pressed="${id===cur}" title="${name}" aria-label="${name}">${D.icons[id]}</button>`).join('');
  el.onclick=e=>{const b=e.target.closest('.chip');if (!b) return;$$('.chip',el).forEach(c=>c.setAttribute('aria-pressed',c===b));onPick(b.dataset.id);};
}

// ---------- рисование: canvas под DPR, плитки, подписи, номера рядов, двери ----------
function fit(cv){
  const dpr=Math.min(devicePixelRatio||1,2),w=cv.clientWidth||300,h=cv.clientHeight||150;
  if (cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
  const ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return{ctx,w,h};
}
const mapFor=(w,h,cw,ch,pad)=>{const s=Math.min((w-pad*2)/cw,(h-pad*2)/ch);return{s,ox:(w-cw*s)/2,oy:(h-ch*s)/2};};
function pointIn(p,x,y){let c=false;for (let i=0,j=p.length-1;i<p.length;j=i++){const [xi,yi]=p[i],[xj,yj]=p[j];if ((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) c=!c;}return c;}
function hitTile(res,x,y){for (const t of res.tiles){if (x<t.rb[0]||x>t.rb[2]||y<t.rb[1]||y>t.rb[3]) continue;for (const p of t.parts) if (pointIn(p,x,y)) return t;}return null;}
const doorSeg=(reg,d)=>d.wall==='bottom'?[[d.pos,reg.h],[d.pos+d.width,reg.h]]:d.wall==='top'?[[d.pos,0],[d.pos+d.width,0]]:d.wall==='left'?[[0,d.pos],[0,d.pos+d.width]]:[[reg.w,d.pos],[reg.w,d.pos+d.width]];
function rowEdge(res,reg,row){
  const{o,a,pat,tile,g}=res.geo,herr=pat.startsWith('herr'),{P}=pitchOf(pat,tile.w,tile.h,g);
  if (!a&&!herr){const y0=Math.max(0,o.y+row*P),y1=Math.min(reg.h,o.y+row*P+P-g),y=(y0+y1)/2;return{x:0,y,e:0,k:y};}
  const c=Math.cos(a),s=Math.sin(a),L=Math.max(tile.w,tile.h),W=Math.min(tile.w,tile.h),p0=herr?[-row*(W+g)+(L+g+W)/2,row*(W+g)+L/2]:[0,row*P+(P-g)/2],d=herr?[1,1]:[1,0];
  const vx=d[0]*c-d[1]*s,vy=d[0]*s+d[1]*c,hit=(px,py)=>{
    if (Math.abs(vx)>1e-6){const y=py-px*vy/vx;if (y>=0&&y<=reg.h) return{x:0,y,e:0,k:y};}
    if (Math.abs(vy)>1e-6){const x=px-py*vx/vy;if (x>=0&&x<=reg.w) return{x,y:0,e:1,k:x};}
    return null;
 };
  let q=hit(o.x+p0[0]*c-p0[1]*s,o.y+p0[0]*s+p0[1]*c);
  if (!q){const ts=res.tiles.filter(t=>t.row===row);let mx=0,my=0;for (const t of ts){mx+=(t.rb[0]+t.rb[2])/2;my+=(t.rb[1]+t.rb[3])/2;}q=hit(mx/ts.length,my/ts.length);}
  return q;
}

function drawReg(ctx,reg,res,map,dx,dy,o){
  const s=map.s,P=(x,y)=>[map.ox+(x+dx)*s,map.oy+(y+dy)*s],bg=o.bg||MILK,fs=o.fs||clamp(Math.round(s*4),12,14),bs=fs+6,font=(w,z)=>ctx.font=`${w} ${z}px ${FONT}`;
  const C=t=>P((t.rb[0]+t.rb[2])/2,(t.rb[1]+t.rb[3])/2);
  ctx.fillStyle=INK;for (const c of reg.cells){const [X,Y]=P(c.x,c.y);ctx.fillRect(X,Y,c.w*s,c.h*s);}
  const labels=[],path=t=>{for (const p of t.parts){p.forEach(([x,y],j)=>{const [X,Y]=P(x,y);j?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.closePath();}},col=t=>t.cut?AMBER:(t.col+t.row+(t.rot?1:0))&1?TEAL2:TEAL;
  ctx.strokeStyle=INK;ctx.lineWidth=1;
  if (o.anim) res.tiles.forEach((t,i)=>{
    const st=o.anim.order[i]*o.anim.step,k=clamp((o.anim.t-st)/180,0,1);if (k<=0) return;
    const [cx,cy]=C(t);
    ctx.save();
    if (k<1){const sc=1.06-.06*ease(k);ctx.translate(cx,cy);ctx.transform(sc,0,Math.tan(.035*(1-k)),sc,0,0);ctx.translate(-cx,-cy);}
    ctx.beginPath();path(t);ctx.fillStyle=col(t);ctx.fill();ctx.stroke();
    const q=(o.anim.t-st)/300;if (q>0&&q<1){ctx.clip();const r=Math.hypot(t.rb[2]-t.rb[0],t.rb[3]-t.rb[1])*s;ctx.translate(cx,cy);ctx.rotate(-Math.PI/4);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-r+q*2*r-r*.12,-r,r*.24,2*r);}
    ctx.restore();
    if (k===1&&t.cut&&o.labels) labels.push(t);
  });
  else{// статика: заливка пачками по 64 плитки на цвет — быстро даже для 15 000 плиток
    const grp={};for (const t of res.tiles){(grp[col(t)]||=[]).push(t);if (t.cut&&o.labels) labels.push(t);}
    for (const c in grp){ctx.fillStyle=c;const a=grp[c];for (let i=0;i<a.length;i+=64){ctx.beginPath();a.slice(i,i+64).forEach(path);ctx.fill();ctx.stroke();}}
    if (o.hover){ctx.beginPath();path(o.hover);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fill();}
  }

  ctx.strokeStyle=INK;ctx.lineWidth=2;const [X0,Y0]=P(0,0),W0=reg.w*s,H0=reg.h*s;ctx.strokeRect(X0,Y0,W0,H0);
  ctx.textAlign='center';ctx.textBaseline='middle';font(700,fs);
  for (const h of reg.holes){
    const [X,Y]=P(h.x,h.y),W=h.w*s,H=h.h*s;ctx.fillStyle=bg;ctx.fillRect(X-1.5,Y-1.5,W+3,H+3);
    if (!h.kind){ctx.strokeRect(X,Y,W,H);continue;}
    ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.strokeRect(X,Y,W,H);ctx.setLineDash([]);ctx.lineWidth=2;const tw=ctx.measureText(h.kind).width+6;ctx.fillStyle=INK;
    if (W>=tw&&H>fs+4) ctx.fillText(h.kind,X+W/2,Y+H/2);else if (H>=tw&&W>fs+4){ctx.save();ctx.translate(X+W/2,Y+H/2);ctx.rotate(-Math.PI/2);ctx.fillText(h.kind,0,0);ctx.restore();}
 }
  if (o.doors) o.doors.forEach((d,i)=>{
    const [a,b]=doorSeg(reg,d),A=P(...a),B=P(...b),r=d.width*s,ang={bottom:[-Math.PI/2,0],top:[0,Math.PI/2],left:[0,Math.PI/2],right:[Math.PI/2,Math.PI]}[d.wall],la=d.wall==='bottom'?-Math.PI/2:d.wall==='top'?Math.PI/2:d.wall==='left'?0:Math.PI;
    ctx.strokeStyle=bg;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);ctx.stroke();
    const leaf=(c,w)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(A[0],A[1],r,ang[0],ang[1]);ctx.moveTo(...A);ctx.lineTo(A[0]+Math.cos(la)*r,A[1]+Math.sin(la)*r);ctx.stroke();};
    leaf(MILK,6);leaf(i===o.sel?INK:TERRA,i===o.sel?3:2);
 });

  for (const t of labels){
    const txt=fmtCm(t.dims[0])+'×'+fmtCm(t.dims[1]),part=t.parts.reduce((a,p)=>polyArea(p)>polyArea(a)?p:a),[gx,gy]=centroid(part),tw=ctx.measureText(txt).width+8,th=fs+6;
    const fits=(w,h)=>[[-w,-h],[w,-h],[w,h],[-w,h]].every(([u,v])=>pointIn(part,gx+u/s/2,gy+v/s/2)),rot=fits(tw,th)?0:fits(th,tw)?-Math.PI/2:null;
    if (rot===null) continue;
    ctx.save();ctx.translate(...P(gx,gy));ctx.rotate(rot);ctx.fillStyle='rgba(227,163,60,.9)';ctx.fillRect(-tw/2,-th/2,tw,th);ctx.fillStyle=INK;ctx.fillText(txt,0,1);ctx.restore();
 }
  if (o.rows){
    const pts=[];for (const [row,no] of res.rowNo){const q=rowEdge(res,reg,row);if (q) pts.push({...q,no});}
    const last=[-1e9,-1e9];font(800,fs-1);
    pts.sort((a,b)=>a.e-b.e||a.k-b.k).forEach(p=>{
      const need=last[p.e]+bs+2-p.k*s;if (need>4) return;const sh=Math.max(0,need);last[p.e]=p.k*s+sh;const [X,Y]=P(p.x,p.y),bx=p.e?X+sh-bs/2:X-bs-3,by=p.e?Y-bs-3:Y+sh-bs/2;
      ctx.fillStyle=INK;ctx.fillRect(bx,by,bs,bs);ctx.fillStyle=MILK;ctx.fillText(p.no,bx+bs/2,by+bs/2+1);
   });
 }
  ctx.fillStyle=INK;font(700,fs);
  if (o.dims){ctx.fillText(`${fmtCm(reg.w)} см`,X0+W0/2,Y0+H0+13);ctx.save();ctx.translate(X0+W0+13,Y0+H0/2);ctx.rotate(-Math.PI/2);ctx.fillText(`${fmtCm(reg.h)} см`,0,0);ctx.restore();}
  if (o.title){ctx.textAlign='left';ctx.fillText(ctx.measureText(o.title[0]).width<=W0?o.title[0]:o.title[1],X0,Y0+H0+13);}
  if (o.note){const [X,Y]=P(o.note.x,reg.h);ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X,Y+3);ctx.lineTo(X,Y+12);ctx.stroke();ctx.fillText(o.note.text,X,Y+17+fs/2);}
}
const waveOrder=tiles=>{const rank=[];tiles.map((t,i)=>[Math.hypot(t.rb[0]+t.rb[2],t.rb[1]+t.rb[3]),i]).sort((a,b)=>a[0]-b[0]).forEach(([,i],k)=>rank[i]=k);return rank;};
function tipAt(tip,cv,map,res,e,dx=0,dy=0){
  const r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,t=res&&hitTile(res,(px-map.ox)/map.s-dx,(py-map.oy)/map.s-dy);
  tip.hidden=!t;if (t){tip.textContent=(t.cut?M.cut+' ':'')+fmtCm(t.dims[0])+' × '+fmtCm(t.dims[1])+T('tipRow',{r:res.rowNo.get(t.row)});tip.style.left=px+'px';tip.style.top=py+'px';}
  return t;
}
function bindHover(cv,tip,get,draw){
  let cur=null;
  on(cv,'pointermove',e=>{const st=get(e);if (!st) return;const t=tipAt(tip,cv,st.map,st.res,e,st.dx,st.dy);if (t!==cur){cur=t;draw(t);}});
  on(cv,'pointerleave',()=>{tip.hidden=true;cur=null;draw(null);});
}

// ---------- hero: пол 240 × 180, волна укладки по видимости, блик глазури, счётчик ----------
const hero={cv:E('hero-floor'),tip:E('hero-tip'),reg:region(240,180),door:{wall:'bottom',pos:80,width:80},tile:{w:60,h:30},g:2,pat:'half',res:null,anim:null,hover:null,map:null,shown:{}};
function heroLayout(animate){
  const g=hero.g/10;hero.res=layout(hero.reg,hero.tile,g,hero.pat,smart(hero.reg,hero.tile,g,hero.pat,hero.door).origin);
  const v={pieces:hero.res.pieces,packs:Math.ceil(hero.res.pieces/6),waste:Math.round(hero.res.waste*100)};
  $$('#hero-counter b').forEach(b=>{const k=b.dataset.n,from=hero.shown[k]||0;hero.shown[k]=v[k];tween(from,v[k],600,x=>b.textContent=Math.round(x));});
  E('w-pieces').textContent=pl(v.pieces,D.plt);E('w-packs').textContent=pl(v.packs,D.upk);
  E('hero-live').textContent=T('line0',{n:N(v.pieces,D.plt),p:N(v.packs,D.upk),k:'',w:v.waste});
  if (animate) heroWave();else heroDraw();
}
const heroWave=()=>{hero.anim=RM?null:{t:0,order:waveOrder(hero.res.tiles),step:18,t0:performance.now()};heroDraw();};
function heroDraw(){
  const{ctx,w,h}=fit(hero.cv);hero.map=mapFor(w,h,hero.reg.w,hero.reg.h,16);
  ctx.fillStyle=MILK;ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(42,42,42,.06)';ctx.lineWidth=1;ctx.beginPath();
  for (let x=.5;x<w;x+=24){ctx.moveTo(x,0);ctx.lineTo(x,h);}for (let y=.5;y<h;y+=24){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
  if (hero.anim) hero.anim.t=performance.now()-hero.anim.t0;
  drawReg(ctx,hero.reg,hero.res,hero.map,0,0,{anim:hero.anim,hover:hero.hover,labels:true,doors:[hero.door],sel:-1});
  if (hero.anim){if (hero.anim.t<hero.res.tiles.length*18+300) requestAnimationFrame(heroDraw);else hero.anim=null;}
}
makeChips(E('hero-pats'),D.heroPats,'half',id=>{hero.pat=id;heroLayout(true);});
on(E('hero-grout'),'input',e=>{hero.g=+e.target.value;E('hero-grout-v').textContent=hero.g+' мм';heroLayout(false);});
bindHover(hero.cv,hero.tip,()=>({map:hero.map,res:hero.res}),t=>{hero.hover=t;if (!hero.anim) heroDraw();});

// ---------- демо: состояние ↔ форма ----------
const S={mode:'floor',w:200,l:185,shape:'rect',corner:'tl',cw:60,cl:80,fmt:0,tw:600,th:600,pack:4,rot:false,g:2,pat:'straight',start:'wall',wall:'top',z:5,price:0,dw:80,win:false,bath:true,doors:[{wall:'bottom',pos:60,width:80}],sel:0};
const BIND=[['w','room-w',60,1200],['l','room-l',60,1200],['corner','cut-corner'],['cw','cut-w',10,1180],['cl','cut-l',10,1180],['dw','door-w',40,200],['win','opt-window'],['bath','opt-bath'],['fmt','tile-sel',0,6],['tw','tile-w',20,3000],['th','tile-h',20,3000],['pack','tile-pack',1,500],['g','grout',1,10],['z','reserve',0,15],['price','price',0,1e7],['wall','start-wall']];
const OK={mode:['floor','walls'],shape:['rect','l'],start:['center','wall','door','smart'],corner:['tl','tr','br','bl'],wall:WALLS,pat:PATS.map(p=>p[0])};
E('tile-sel').innerHTML=FORMATS.map((f,i)=>`<option value="${i}">${f.name} · ${f.pack} шт/уп</option>`).join('')+`<option value="6">${M.custom}</option>`;
const tileOf=()=>{const f=S.fmt<6?FORMATS[S.fmt]:{w:S.tw/10,h:S.th/10,pack:S.pack,m2:S.pack*S.tw*S.th/1e6};return{w:S.rot?f.h:f.w,h:S.rot?f.w:f.h,pack:f.pack,m2:f.m2};};
const tileName=()=>S.fmt<6?FORMATS[S.fmt].name:`${S.tw} × ${S.th}`;
const floorRegion=()=>{const c=S.corner;return region(S.w,S.l,S.shape==='l'?[{x:c==='tr'||c==='br'?S.w-S.cw:0,y:c==='br'||c==='bl'?S.l-S.cl:0,w:S.cw,h:S.cl}]:[]);};
const wallLen=wall=>wall==='top'||wall==='bottom'?S.w:S.l;
const labels=()=>{E('grout-v').textContent=S.g+' мм';E('reserve-v').textContent=S.z+'%';E('pat-name').textContent=patName(S.pat);E('custom-fields').hidden=S.fmt!==6;};
function syncForm(){
  BIND.forEach(([k,id])=>{const el=E(id);if (el.type==='checkbox') el.checked=S[k];else el.value=k==='price'&&!S.price?'':S[k];});
  $$('[data-mode],[data-shape],[data-start]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===S.mode||b.dataset.shape===S.shape||b.dataset.start===S.start));
  $$('#pats .chip').forEach(c=>c.setAttribute('aria-pressed',c.dataset.id===S.pat));E('tile-rot').setAttribute('aria-pressed',S.rot);
  E('l-fields').hidden=S.shape!=='l';E('door-fields').hidden=S.mode!=='floor';E('wall-opts').hidden=S.mode!=='walls';E('wall-field').hidden=S.start!=='wall';labels();
}
function readForm(){
  BIND.forEach(([k,id,lo,hi])=>{const el=E(id);if (el.type==='checkbox') S[k]=el.checked;else if (lo!==undefined){const v=+el.value;if (!isNaN(v)) S[k]=clamp(v,lo,hi);}else S[k]=el.value;});
  S.cw=Math.min(S.cw,S.w-20);S.cl=Math.min(S.cl,S.l-20);if (S.doors[S.sel]) S.doors[S.sel].width=S.dw;labels();
}
makeChips(E('pats'),PATS,S.pat,id=>{S.pat=id;labels();update();});
const form=E('form');
on(form,'input',()=>{readForm();update();});
on(form,'submit',e=>{e.preventDefault();readForm();update();});
on(form,'click',e=>{
  const b=e.target.closest('[data-mode],[data-shape],[data-start],#tile-rot,#door-del,#door-add');if (!b) return;
  if (b.dataset.mode) S.mode=b.dataset.mode;else if (b.dataset.shape) S.shape=b.dataset.shape;else if (b.dataset.start) S.start=b.dataset.start;else if (b.id==='tile-rot') S.rot=!S.rot;
  else if (b.id==='door-add'){
    if (S.doors.length>=3) toast(M.doorMax);
    else{const wall=['bottom','top','left','right'].find(w=>!S.doors.some(d=>d.wall===w))||'bottom';S.doors.push({wall,pos:(wallLen(wall)-S.dw)/2,width:S.dw});S.sel=S.doors.length-1;toast(M.doorAdded);}
 }else if (S.doors.length){S.doors.splice(S.sel>=0?S.sel:S.doors.length-1,1);S.sel=S.doors.length-1;toast(S.doors.length?M.doorGone:M.noDoors);}
  syncForm();update();
});

// ---------- демо: расчёт пола или стен, умный старт отложенно, числа и подрезки ----------
const sc={cv:E('scene'),tip:E('scene-tip'),map:null,scene:null,hover:null,drag:null,out:null,key:null,force:false};
const memo=new Map();let smartT;
function smartOf(reg,tile,g,pat,door){
  const k=[reg.w,reg.h,JSON.stringify(reg.holes),tile.w,tile.h,g,pat,door&&door.wall].join('|');let v=memo.get(k);
  if (!v&&sc.force){v=smart(reg,tile,g,pat,door);memo.set(k,v);}
  if (!v){clearTimeout(smartT);smartT=setTimeout(()=>{sc.force=true;sc.key=null;update();},250);}
  return v;
}
function wallItems(tile,g){
  const items=[],d0=S.doors[0],winWall=d0?WALLS.indexOf(OPP[d0.wall]):0,bathWall=S.l>=S.w?1:0,two=sc.cv.clientWidth<700,GX=48,GY=70,mx=Math.max(S.w,S.l);let dx=0;
  WALLS.forEach((wall,i)=>{
    const len=wallLen(wall),holes=S.doors.filter(d=>d.wall===wall).map(d=>({x:wall==='bottom'?S.w-d.pos-d.width:wall==='left'?S.l-d.pos-d.width:d.pos,y:40,w:d.width,h:210,kind:M.door}));
    if (S.win&&i===winWall) holes.push({x:len/2-40,y:60,w:80,h:100,kind:M.window});
    if (S.bath&&i===bathWall) holes.push({x:0,y:192,w:Math.min(170,len),h:58,kind:M.bath});
    const reg=region(len,250,holes),dh=holes[0]?.kind===M.door?holes[0]:null,door=dh&&{wall:'bottom',pos:dh.x,width:dh.w},sm=smartOf(reg,tile,g,S.pat,door);
    const origin=S.start==='smart'&&sm?sm.origin:{x:S.start==='door'&&door?door.pos+door.width/2-tile.w/2:S.start==='center'?len/2-tile.w/2:0,y:250+g};
    items.push({reg,res:layout(reg,tile,g,S.pat,origin),dx:two?(i%2)*(mx+GX):dx,dy:two?(i>>1)*(250+GY):0,title:[T('wall',{i:i+1,l:len}),`${i+1} · ${len} см`],smart:sm});dx+=len+GX;
 });
  return{items,w:two?mx*2+GX:dx-GX,h:two?500+GY:250};
}
function compute(){
  const tile=tileOf(),g=S.g/10,key=[S.mode,S.w,S.l,S.shape,S.corner,S.cw,S.cl,tile.w,tile.h,g,S.pat,S.start,S.wall,S.win,S.bath,S.sel,S.doors.map(d=>d.wall+d.pos+':'+d.width)].join('|');
  if (key!==sc.key){
    let scene,sm,base,sym=0;
    if (S.mode==='floor'){
      const reg=floorRegion(),door=S.doors[S.sel]||S.doors[0],best=smartOf(reg,tile,g,S.pat,door);
      const res=layout(reg,tile,g,S.pat,S.start==='smart'&&best?best.origin:startAt(S.start==='smart'?'wall':S.start,reg,tile,g,door,S.wall));
      scene={items:[{reg,res,dx:0,dy:0}],w:reg.w,h:reg.h};sm=best;base=S.start==='smart'?layout(reg,tile,g,S.pat,startAt('wall',reg,tile,g,door,S.wall),true).pieces:res.pieces;
      if (door) sym=edgeDiff(res,reg,door.wall)+edgeDiff(res,reg,OPP[door.wall]);
   }else{scene=wallItems(tile,g);sm=scene.items.every(it=>it.smart)&&{pieces:scene.items.reduce((s,it)=>s+it.smart.pieces,0),narrow:scene.items.reduce((s,it)=>s+it.smart.narrow,0),sym:0};base=scene.items.reduce((s,it)=>s+it.res.pieces,0);}
    const sum=f=>scene.items.reduce((s,it)=>s+f(it),0);
    sc.scene=scene;sc.key=key;sc.geo={tile,pieces:sum(it=>it.res.pieces),area:sum(it=>it.reg.area)/1e4,covered:sum(it=>it.res.covered),smart:sm,base,sym,cuts:sum(it=>it.res.cuts),reused:sum(it=>it.res.reused),narrow:sum(it=>it.res.narrow)};
 }
  const o=sc.geo,packs=Math.ceil(o.pieces*(1+S.z/100)/tile.pack);
  sc.out={...o,packs,waste:o.pieces?Math.max(0,1-o.covered/(o.pieces*tile.w*tile.h)):0,cost:S.price?packs*tile.m2*S.price:0};sc.force=false;
}
const shown={},setStat=(id,v,fmt)=>{const el=E(id),from=shown[id]??v;shown[id]=v;tween(from,v,600,x=>el.textContent=fmt(x));};
const cutRows=()=>sc.scene.items.flatMap((it,i)=>cutList(it.res,S.mode==='walls'?T('wallRow',{i:i+1}):M.row));
function noteHtml(o){
  const m=o.smart;if (!m) return `<span>${M.calc}</span>`;
  const d=o.base-m.pieces,n=N(o.pieces,D.plt),ap=`<button type="button" class="chip-text" id="apply-smart">${M.apply}</button>`;
  if (S.start==='smart') return `<span>${T('smartOn',{n,tail:d>0?T('smartLess',{b:o.base,d}):M.smartSame,nar:o.narrow?'':M.noNarrow})}</span>`;
  const k=d>0?'willLess':o.narrow>m.narrow?'willNarrow':o.sym>m.sym+.5?'willSym':'best';
  return `<span>${T(k,{n,s:N(m.pieces,D.plt),c:o.pieces,d,w:pl(o.pieces,D.plt),u:N(o.narrow-m.narrow,D.nar),t:o.narrow,a:fmtCm(m.sym),b:fmtCm(o.sym)})}</span>${ap}`;
}
function render(){
  const o=sc.out,t=o.tile;
  setStat('s-pieces',o.pieces,fmtN);setStat('s-packs',o.packs,fmtN);setStat('s-area',o.area,fmt1);setStat('s-waste',o.waste*100,v=>Math.round(v)+'%');
  E('w-s-pieces').textContent=pl(o.pieces,D.plt);E('s-packs-sub').innerHTML=T('packsSub',{w:pl(o.packs,D.upk),k:t.pack,m:fmt1(o.packs*t.m2,2)});
  if (o.cost) setStat('s-cost',o.cost,v=>fmtN(v)+' ₽');else{E('s-cost').textContent='—';delete shown['s-cost'];}
  E('stats-live').textContent=line();
  const n=E('smart-note');n.className='smart-note'+(S.start==='smart'||o.smart&&o.base<=o.smart.pieces?' ok':'');n.innerHTML=noteHtml(o);
  const apb=E('apply-smart');if (apb) apb.onclick=()=>{S.start='smart';syncForm();update();};
  const rows=cutRows();
  E('cuts-body').innerHTML=rows.slice(0,14).map(r=>`<tr${r.narrow?' class="warn"':''}><td>${r.row}</td><td>${fmtCm(r.a)} × ${fmtCm(r.b)}${r.narrow?' · '+D.nar2[0]:''}</td><td>${r.n}</td></tr>`).join('')+(rows.length>14?`<tr class="more"><td colspan="3">${T('more',{n:rows.length-14})}</td></tr>`:'')||`<tr><td colspan="3" class="muted">${M.noCuts}</td></tr>`;
  E('cuts-sum').textContent=T('cutsSum',{c:o.cuts,r:o.reused,w:pl(o.reused,D.cov)})+(o.narrow?', '+N(o.narrow,D.nar2):'');
  sc.cv.style.aspectRatio=clamp(sc.scene.w/sc.scene.h,sc.cv.clientWidth<700?.75:1,S.mode==='walls'?2.4:1.5);
  sceneDraw();
}
function sceneDraw(){
  const{ctx,w,h}=fit(sc.cv),scene=sc.scene;ctx.fillStyle=MILK;ctx.fillRect(0,0,w,h);sc.map=mapFor(w,h,scene.w,scene.h,Math.max(24,w*.05));
  for (const it of scene.items) drawReg(ctx,it.reg,it.res,sc.map,it.dx,it.dy,{hover:sc.hover,labels:true,rows:true,dims:S.mode==='floor',title:it.title,doors:S.mode==='floor'?S.doors:null,sel:S.sel});
}
let pending=0,hashT;
function update(){if (pending) return;pending=requestAnimationFrame(()=>{pending=0;compute();render();clearTimeout(hashT);hashT=setTimeout(syncHash,400);});}

const sceneXY=e=>{const r=sc.cv.getBoundingClientRect();return [(e.clientX-r.left-sc.map.ox)/sc.map.s,(e.clientY-r.top-sc.map.oy)/sc.map.s];};
const nearWall=(x,y,tol)=>{let best=null;for (const [wall,d,p,len] of [['top',y,x,S.w],['bottom',S.l-y,x,S.w],['left',x,y,S.l],['right',S.w-x,y,S.l]]) if (Math.abs(d)<=tol&&p>=-tol&&p<=len+tol&&(!best||Math.abs(d)<best.d)) best={wall,d:Math.abs(d),pos:p,len};return best;};
const doorAt=(x,y,tol)=>S.doors.findIndex(d=>{const horiz=d.wall==='top'||d.wall==='bottom',along=horiz?x:y,perp=horiz?(d.wall==='top'?y:S.l-y):(d.wall==='left'?x:S.w-x);return Math.abs(perp)<=tol&&along>=d.pos-3&&along<=d.pos+d.width+3;});
on(sc.cv,'pointerdown',e=>{
  if (S.mode!=='floor'||!sc.map) return;const [x,y]=sceneXY(e),tol=12/sc.map.s,i=doorAt(x,y,tol);
  if (i>=0){S.sel=i;S.dw=S.doors[i].width;E('door-w').value=S.dw;sc.drag=i;sc.cv.setPointerCapture(e.pointerId);update();return;}
  const wl=nearWall(x,y,tol);if (!wl) return;
  if (S.doors.length>=3) return toast(M.doorMax);
  S.doors.push({wall:wl.wall,pos:clamp(wl.pos-S.dw/2,0,wl.len-S.dw),width:S.dw});S.sel=S.doors.length-1;update();toast(M.doorAdded);
});
on(sc.cv,'pointermove',e=>{if (sc.drag===null||!sc.map) return;const [x,y]=sceneXY(e),d=S.doors[sc.drag],horiz=d.wall==='top'||d.wall==='bottom';d.pos=clamp((horiz?x:y)-d.width/2,0,wallLen(d.wall)-d.width);update();});
const dragEnd=()=>{sc.drag=null;syncHash();};
on(sc.cv,'pointerup',dragEnd);on(sc.cv,'pointercancel',dragEnd);
bindHover(sc.cv,sc.tip,e=>{if (!sc.map||sc.drag!==null) return null;const [x,y]=sceneXY(e),it=sc.scene.items.find(it=>x>=it.dx&&x<=it.dx+it.reg.w&&y>=it.dy&&y<=it.dy+it.reg.h)||sc.scene.items[0];return{map:sc.map,res:it.res,dx:it.dx,dy:it.dy};},t=>{sc.hover=t;sceneDraw();});
on(sc.cv,'keydown',e=>{
  const d=S.doors[S.sel],k=e.key,step=k==='ArrowLeft'||k==='ArrowUp'?-5:k==='ArrowRight'||k==='ArrowDown'?5:0;if (S.mode!=='floor'||!d) return;
  if (k==='Delete'||k==='Backspace'){S.doors.splice(S.sel,1);S.sel=S.doors.length-1;}else if (step) d.pos=clamp(d.pos+step,0,wallLen(d.wall)-d.width);else return;
  e.preventDefault();update();
});

// ---------- параметры в ссылке (с проверкой границ), проекты в localStorage ----------
const HK=['mode','w','l','shape','corner','cw','cl','fmt','tw','th','pack','rot','g','pat','start','wall','z','price','win','bath'];
const toHash=()=>{const p=new URLSearchParams();HK.forEach(k=>p.set(k,typeof S[k]==='boolean'?+S[k]:S[k]));p.set('d',S.doors.map(d=>`${d.wall}:${Math.round(d.pos)}:${d.width}`).join(';'));return p.toString();};
function fromHash(h){
  const p=new URLSearchParams(h.replace(/^#/,''));if (!p.has('w')) return;
  HK.forEach(k=>{if (!p.has(k)) return;const v=p.get(k),b=BIND.find(x=>x[0]===k);if (typeof S[k]==='boolean') S[k]=v==='1';else if (typeof S[k]==='number'){if (v!==''&&!isNaN(+v)) S[k]=b&&b[2]!==undefined?clamp(+v,b[2],b[3]):+v;}else if (OK[k].includes(v)) S[k]=v;});
  S.doors=(p.get('d')||'').split(';').filter(Boolean).map(s=>{const [wall,pos,width]=s.split(':'),w=clamp(+width||80,40,200);return{wall,pos:clamp(+pos||0,0,Math.max(0,wallLen(wall)-w)),width:w};}).filter(d=>WALLS.includes(d.wall)).slice(0,3);S.sel=S.doors.length-1;
}
const syncHash=()=>{try{history.replaceState(null,'','#'+toHash());}catch{}};
E('link').onclick=()=>{syncHash();const url=location.href;(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast(M.linkOk),()=>prompt(M.linkPrompt,url));};
const PKEY='raskladka:projects',projList=E('projects');
const renderProjects=()=>projList.innerHTML=LS.get(PKEY,[]).map(p=>T('projLi',{n:esc(p.name),w:p.w,l:p.l,t:esc(p.tile),p:patName(p.pat),id:p.id})).join('');
E('save').onclick=()=>{
  const name=E('proj-name').value.trim()||T('projFrom',{d:new Date().toLocaleDateString('ru-RU')}),list=LS.get(PKEY,[]);
  list.unshift({...S,id:Date.now(),name,tile:tileName()});LS.set(PKEY,list.slice(0,20));E('proj-name').value='';renderProjects();toast(T('saved',{n:name}));
};
projList.onclick=e=>{
  const b=e.target.closest('button');if (!b) return;const list=LS.get(PKEY,[]);
  if (b.dataset.del){LS.set(PKEY,list.filter(p=>p.id!==+b.dataset.del));renderProjects();return toast(M.deleted);}
  const p=list.find(x=>x.id===+b.dataset.open);if (!p) return;
  HK.forEach(k=>{if (p[k]!==undefined) S[k]=p[k];});S.doors=p.doors||[];S.sel=S.doors.length-1;syncForm();update();toast(T('opened',{n:p.name}));goDemo();
};

// ---------- PNG схемы и лист A4 ----------
const title=()=>T('title',{m:S.mode==='floor'?M.floor:M.walls,w:S.w,l:S.l,t:tileName(),p:patName(S.pat),g:S.g});
const line=()=>{const o=sc.out;return T('line0',{n:N(o.pieces,D.plt),p:N(o.packs,D.upk),k:T('perPack',{k:o.tile.pack}),w:Math.round(o.waste*100)})+T('line1',{a:fmt1(o.area),z:S.z})+(o.cost?` · ${fmtN(o.cost)} ₽`:'');};
function exportCanvas(wm){
  const scene=sc.scene,W=1600,pad=100,s=Math.min((W-pad*2)/scene.w,1000/scene.h),H=Math.round(scene.h*s+pad*2+40),cv=document.createElement('canvas');
  cv.width=W;cv.height=H;const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  const map={s,ox:(W-scene.w*s)/2,oy:pad+40};
  for (const it of scene.items) drawReg(ctx,it.reg,it.res,map,it.dx,it.dy,{labels:true,rows:true,dims:S.mode==='floor',title:it.title,doors:S.mode==='floor'?S.doors:null,sel:-1,bg:'#fff',fs:22});
  ctx.fillStyle=INK;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font='700 28px '+FONT;ctx.fillText(title(),pad,52);ctx.font='600 20px '+FONT;ctx.fillText(line(),pad,86);
  if (wm){ctx.fillStyle='rgba(42,42,42,.4)';ctx.font='800 22px '+FONT;ctx.textAlign='right';ctx.fillText(M.wm,W-pad,H-28);}
  return cv;
}
E('png').onclick=()=>{const a=document.createElement('a');a.download='raskladka.png';a.href=exportCanvas(true).toDataURL('image/png');a.click();toast(M.png);};
function printSheet(){
  const o=sc.out,f=E('print-tpl').content.cloneNode(true),sheet=E('print-sheet');
  $('h1',f).textContent=E('brand').value.trim()||M.brand;$('.brand span',f).textContent=new Date().toLocaleDateString('ru-RU');$('.t',f).textContent=title();
  $('.buy',f).innerHTML=T('buy',{p:N(o.packs,D.upk),n:o.pieces,w:o.pieces-o.cuts+o.reused,c:o.cuts,r:o.reused,z:S.z});
  $('img',f).src=exportCanvas(false).toDataURL('image/png');
  $('table',f).insertAdjacentHTML('beforeend',cutRows().map(r=>`<tr><td>${r.row}</td><td>${fmtCm(r.a)} × ${fmtCm(r.b)}</td><td>${r.n}</td></tr>`).join(''));
  sheet.replaceChildren(f);sheet.setAttribute('aria-hidden','false');toast(M.print);setTimeout(()=>window.print(),300);
}
on(window,'afterprint',()=>E('print-sheet').setAttribute('aria-hidden','true'));
E('pdf').onclick=printSheet;E('pro-pdf').onclick=printSheet;E('buy-pdf').onclick=()=>{goDemo();printSheet();};
E('buy-pro').onclick=()=>{S.mode='walls';syncForm();update();goDemo();toast(M.pro);};
E('brand').value=LS.get('raskladka:brand','');on(E('brand'),'input',e=>LS.set('raskladka:brand',e.target.value));

// ---------- умный старт: до/после, ванная 200 × 185, керамогранит 600 × 600 прямой укладкой ----------
const ba={reg:region(200,185),tile:{w:60,h:60},door:{wall:'bottom',pos:60,width:80}};
ba.before=layout(ba.reg,ba.tile,.2,'straight',startAt('wall',ba.reg,ba.tile,.2,ba.door,'top'));
ba.after=layout(ba.reg,ba.tile,.2,'straight',smart(ba.reg,ba.tile,.2,'straight',ba.door).origin);
{
  const bottom=r=>r.tiles.filter(t=>t.rb[3]>ba.reg.h-.5).sort((a,b)=>a.rb[0]-b.rb[0]),bb=bottom(ba.before),ab=bottom(ba.after),strip=fmtCm(Math.min(...bb.map(t=>t.rb[3]-t.rb[1])));
  const sym=!ba.after.narrow&&edgeDiff(ba.after,ba.reg,'bottom')<.3,d=ba.before.pieces-ba.after.pieces;
  ba.note={x:ba.reg.w-36,text:T('strips',{h:strip})};
  E('ba-before-txt').textContent=T('baBefore',{n:N(ba.before.pieces,D.plt),s:N(ba.before.narrow,D.strip),h:strip});
  E('ba-after-txt').textContent=T('baAfter',{n:N(ba.after.pieces,D.plt),h:fmtCm(Math.max(...ab.map(t=>t.rb[3]-t.rb[1]))),e:ab[0].cut?T('edges',{e:fmtCm(ab[0].rb[2]-ab[0].rb[0])}):M.whole});
  E('ba-delta').textContent=(d>0?'−':'')+d;E('ba-delta-txt').textContent=pl(d,D.plt)+(sym?M.sym:M.noSym);
}
const baDraw=()=>[['ba-before',ba.before,ba.note],['ba-after',ba.after]].forEach(([id,res,note])=>{const{ctx,w,h}=fit(E(id));ctx.fillStyle=MILK;ctx.fillRect(0,0,w,h);drawReg(ctx,ba.reg,res,mapFor(w,h-22,ba.reg.w,ba.reg.h,22),0,0,{labels:true,doors:[ba.door],sel:-1,note});});

// ---------- каталог и салоны ----------
E('fmt-grid').onclick=e=>{const b=e.target.closest('[data-use]');if (!b) return;S.fmt=+b.dataset.use;S.rot=false;S.pat=FORMATS[S.fmt].pat;syncForm();update();goDemo();toast(T('fmtUsed',{n:FORMATS[S.fmt].name}));};
const salons=city=>{E('cities').innerHTML=D.cities.map((c,i)=>`<button type="button" class="chip-text" data-c="${i}" aria-pressed="${i===city}">${c}</button>`).join('');E('salons').innerHTML=D.salons.filter(s=>s[0]===city).map(s=>`<li><span>${s[1]}</span><span class="muted">${s[2]}</span></li>`).join('');};
E('cities').onclick=e=>{const b=e.target.closest('button');if (b) salons(+b.dataset.c);};

// ---------- старт ----------
try{fromHash(location.hash);}catch{}
syncForm();renderProjects();update();heroLayout(false);baDraw();salons(0);revealAll();
if (!RM) new IntersectionObserver((es,io)=>{if (es[0].isIntersecting){io.disconnect();heroWave();}},{threshold:.4}).observe(hero.cv);
const redraw=()=>{if (!hero.anim) heroDraw();if (sc.scene){sc.key=null;update();}baDraw();};
let rz;on(window,'resize',()=>{cancelAnimationFrame(rz);rz=requestAnimationFrame(redraw);});
document.fonts.ready.then(redraw);
