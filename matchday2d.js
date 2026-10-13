/* Ginga FM 2D match replay.
Adapted from the supplied canvas simulation and integrated as a presentation-only view.
It reads the real matchday lineups and score; it never writes to the career save or changes results. */
(function(){
"use strict";
const mounted=new WeakMap();
const reducedMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fmt=seconds=>{const n=Math.max(0,Math.floor(seconds));return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")};
function safeParse(canvas){try{return JSON.parse(canvas.getAttribute("data-matchday-2d")||"{}")}catch(_){return {}}}
function formation(team,side){
 const list=(team.players||[]).slice(0,11);if(!list.length)return [];
 const keeper=list.find(p=>String(p.position||"").toUpperCase()==="GK")||list[0],out=[];
 function add(p,x,y,role){out.push({id:p.id,name:p.name||"Player",number:p.number||out.length+1,position:p.position||role,role,team:side,x,y,bx:x,by:y,speed:48+Math.random()*18,phase:Math.random()*Math.PI*2})}
 add(keeper,side==="home"?.075:.925,.5,"gk");
 const rest=list.filter(p=>p!==keeper),used=new Set([keeper.id]);
 const rows=[
  {role:"def",count:4,x:.22,types:/CB|LB|RB|WB|DEF/i},
  {role:"mid",count:3,x:.41,types:/DM|CM|AM|LM|RM|MID/i},
  {role:"att",count:3,x:.64,types:/ST|CF|LW|RW|ATT|FW/i}
 ];
 for(const row of rows){
  let selected=rest.filter(p=>!used.has(p.id)&&row.types.test(String(p.position||"")));
  selected.forEach(p=>used.add(p.id));
  while(selected.length<row.count){const next=rest.find(p=>!used.has(p.id)&&!selected.includes(p));if(!next)break;selected.push(next);used.add(next.id)}
  selected=selected.slice(0,row.count);
  selected.forEach((p,i)=>{const y=.18+(i/Math.max(1,selected.length-1))*.64;add(p,side==="home"?row.x:1-row.x,y,row.role)});
 }
 rest.filter(p=>!used.has(p.id)).forEach((p,i)=>add(p,side==="home"?.52:.48,.18+(i%7)*.1,"mid"));
 return out.slice(0,11);
}
function init(canvas){
 if(mounted.has(canvas))return;
 const data=safeParse(canvas),ctx=canvas.getContext("2d");if(!ctx)return;
 const W=900,H=600,P={x:40,y:30,w:820,h:540};
 const home={primary:"#1a4d8c"},away={primary:"#c41e3a"};
 const homeTeam=formation(data.home||{},"home"),awayTeam=formation(data.away||{},"away"),players=[...homeTeam,...awayTeam];
 const state={running:!reducedMotion,speed:1,elapsed:0,last:0,owner:null,passFrom:null,passTo:null,passStart:0,shot:false,shotStart:0,shotFrom:null,shotTeam:null,ball:{x:W/2,y:H/2}};
 const panel=canvas.closest(".matchday-visual-view");
 const start=panel&&panel.querySelector("[data-2d-start]"),pause=panel&&panel.querySelector("[data-2d-pause]"),reset=panel&&panel.querySelector("[data-2d-reset]"),slider=panel&&panel.querySelector("[data-2d-speed]"),clock=panel&&panel.querySelector("[data-2d-time]");
 function setClock(){if(clock)clock.textContent=fmt(state.elapsed)}
 function resetState(){
  state.elapsed=0;state.owner=homeTeam.find(p=>p.role==="mid")||homeTeam[1]||homeTeam[0]||null;state.passFrom=null;state.passTo=null;state.passStart=0;state.shot=false;state.shotStart=0;state.shotFrom=null;state.shotTeam=null;
  players.forEach(p=>{p.px=P.x+p.bx*P.w;p.py=P.y+p.by*P.h;p.tx=p.px;p.ty=p.py;p.x=p.px;p.y=p.py});
  state.ball.x=state.owner?state.owner.x+10:W/2;state.ball.y=state.owner?state.owner.y:H/2;setClock();draw();
 }
 function chooseShot(){
  if(!state.owner)return;
  state.shot=true;state.shotStart=state.elapsed;state.shotTeam=state.owner.team;
  state.shotFrom={x:state.owner.x,y:state.owner.y};state.owner=null;state.passFrom=null;state.passTo=null;
 }
 function choosePass(){
  if(!state.owner||state.shot)return;
  const owner=state.owner,team=owner.team==="home"?homeTeam:awayTeam,dir=owner.team==="home"?1:-1;
  const candidates=team.filter(p=>p!==owner&&p.role!=="gk").sort((a,b)=>dir*(b.x-a.x));
  const pool=candidates.slice(0,Math.min(5,candidates.length));
  state.passFrom=owner;state.passTo=pool[Math.floor(Math.random()*pool.length)]||candidates[0]||null;
  if(state.passTo){state.passStart=state.elapsed;state.owner=null}
 }
 function movePlayers(dt){
  const b=state.ball,attackTeam=state.owner?state.owner.team:(Math.floor(state.elapsed/8)%2===0?"home":"away"),dir=attackTeam==="home"?1:-1;
  players.forEach(p=>{
   let tx=P.x+p.bx*P.w,ty=P.y+p.by*P.h;
   const teamAttacks=p.team===attackTeam;
   tx+=teamAttacks?dir*(.025+((Math.sin(state.elapsed*.55+p.phase)+1)*.045))*P.w:0;
   const influence=p.role==="gk"?.025:(p===state.owner?.13:(teamAttacks?.08:.18));
   tx+=(b.x-tx)*influence;ty+=(b.y-ty)*influence;
   if(p.role==="gk"){tx=P.x+(p.team==="home"?.055:.945)*P.w;ty=clamp(b.y,P.y+.39*P.h,P.y+.61*P.h);if(state.shot&&p.team!==(state.shotTeam)){ty=clamp(b.y,P.y+.22*P.h,P.y+.78*P.h)}}
   if(p===state.owner){tx+=dir*12;ty+=Math.sin(state.elapsed*4+p.phase)*4}
   p.tx=clamp(tx,P.x+13,P.x+P.w-13);p.ty=clamp(ty,P.y+13,P.y+P.h-13);
   const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),step=p.speed*dt;
   if(d>1){p.x+=dx/d*Math.min(d,step);p.y+=dy/d*Math.min(d,step)}
  });
 }
 function advanceBall(){
  const b=state.ball;
  if(state.shot&&state.shotFrom){
   const progress=clamp((state.elapsed-state.shotStart)/1.35,0,1);
   const goalX=state.shotTeam==="home"?P.x+P.w-3:P.x+3;
   const goalY=H/2+Math.sin(state.shotStart*2.7)*23;
   b.x=state.shotFrom.x+(goalX-state.shotFrom.x)*progress;
   b.y=state.shotFrom.y+(goalY-state.shotFrom.y)*progress-Math.sin(progress*Math.PI)*17;
   if(progress>=1){
    const defending=state.shotTeam==="home"?awayTeam:homeTeam;
    state.owner=defending.find(p=>p.role==="gk")||defending[1]||null;
    state.shot=false;state.shotFrom=null;state.shotTeam=null;
   }
   return;
  }
  if(state.passTo&&state.passFrom){
   const duration=1.05/state.speed,progress=clamp((state.elapsed-state.passStart)/duration,0,1),from=state.passFrom,to=state.passTo;
   b.x=from.x+(to.x-from.x)*progress;b.y=from.y+(to.y-from.y)*progress-Math.sin(progress*Math.PI)*24;
   if(progress>=1){state.owner=to;state.passFrom=null;state.passTo=null}
   return;
  }
  if(state.owner){b.x=state.owner.x+(state.owner.team==="home"?10:-10);b.y=state.owner.y+3;return}
  const closest=players.filter(p=>p.role!=="gk").sort((a,b)=>Math.hypot(a.x-state.ball.x,a.y-state.ball.y)-Math.hypot(b.x-state.ball.x,b.y-state.ball.y))[0];
  if(closest){state.owner=closest}
 }
 function drawPitch(){
  ctx.fillStyle="#1d673e";ctx.fillRect(P.x,P.y,P.w,P.h);
  for(let i=0;i<10;i++)if(i%2===0){ctx.fillStyle="rgba(255,255,255,.045)";ctx.fillRect(P.x+i*P.w/10,P.y,P.w/10,P.h)}
  ctx.strokeStyle="rgba(255,255,255,.88)";ctx.lineWidth=2.2;ctx.strokeRect(P.x,P.y,P.w,P.h);
  ctx.beginPath();ctx.moveTo(W/2,P.y);ctx.lineTo(W/2,P.y+P.h);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,55,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(W/2,H/2,3,0,Math.PI*2);ctx.fill();
  const bw=105,bh=220,sw=44,sh=110;ctx.strokeRect(P.x,H/2-bh/2,bw,bh);ctx.strokeRect(P.x+P.w-bw,H/2-bh/2,bw,bh);ctx.strokeRect(P.x,H/2-sh/2,sw,sh);ctx.strokeRect(P.x+P.w-sw,H/2-sh/2,sw,sh);
  ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(P.x-13,H/2-37,13,74);ctx.fillRect(P.x+P.w,H/2-37,13,74);
  ctx.font="bold 11px system-ui";ctx.fillStyle="rgba(255,255,255,.9)";ctx.textAlign="left";ctx.fillText((data.home&&data.home.name)||"HOME",P.x+8,P.y+17);ctx.textAlign="right";ctx.fillText((data.away&&data.away.name)||"AWAY",P.x+P.w-8,P.y+17);
 }
 function drawPlayer(p){
  const kit=p.team==="home"?home:away;
  ctx.beginPath();ctx.ellipse(p.x,p.y+7,9,4,0,0,Math.PI*2);ctx.fillStyle="rgba(0,0,0,.3)";ctx.fill();
  ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fillStyle=p.role==="gk"?"#d2b338":kit.primary;ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle="#fff";ctx.stroke();
  ctx.fillStyle="#fff";ctx.font="bold 9px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(p.number).slice(0,2),p.x,p.y);
  ctx.font="bold 9px system-ui";ctx.textBaseline="top";ctx.fillStyle="#fff";const name=p.name.length>13?p.name.slice(0,12)+"…":p.name;ctx.fillText(name,p.x,p.y+12);
 }
 function drawBall(){
  ctx.beginPath();ctx.ellipse(state.ball.x,state.ball.y+5,5,2.5,0,0,Math.PI*2);ctx.fillStyle="rgba(0,0,0,.35)";ctx.fill();
  ctx.beginPath();ctx.arc(state.ball.x,state.ball.y,6,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle="#222";ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.arc(state.ball.x,state.ball.y,3.2,0,Math.PI*2);ctx.strokeStyle="#333";ctx.stroke();
 }
 function draw(){
  ctx.clearRect(0,0,W,H);drawPitch();[...awayTeam,...homeTeam].forEach(drawPlayer);drawBall();
  ctx.fillStyle="rgba(5,15,10,.72)";ctx.fillRect(W/2-125,6,250,18);ctx.fillStyle="#fff";ctx.font="bold 11px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("OFFICIAL SCORE  "+Number(data.score&&data.score.home||0)+" – "+Number(data.score&&data.score.away||0),W/2,15);
  if(!state.running){ctx.fillStyle="rgba(5,15,10,.32)";ctx.fillRect(P.x,P.y,P.w,P.h);ctx.fillStyle="#fff";ctx.font="900 20px system-ui";ctx.textAlign="center";ctx.fillText("PAUSED",W/2,H-15)}
 }
 function frame(timestamp){
  if(!canvas.isConnected){dispose();return}
  const dt=state.last?Math.min(.04,(timestamp-state.last)/1000):0;state.last=timestamp;
  if(state.running){const scaled=dt*state.speed;state.elapsed+=scaled;if(state.elapsed>2700)state.elapsed=0;movePlayers(scaled);if(state.owner){const closeToGoal=state.owner.team==="home"?state.owner.x>P.x+P.w-175:state.owner.x<P.x+175;if(closeToGoal&&Math.random()<.0035*state.speed)chooseShot();else if(Math.random()<.018*state.speed)choosePass()}advanceBall();setClock()}
  draw();state.raf=requestAnimationFrame(frame);
 }
 function dispose(){cancelAnimationFrame(state.raf);document.removeEventListener("click",clickHandler);mounted.delete(canvas)}
 function clickHandler(e){
  const tab=e.target.closest&&e.target.closest("[data-matchday-view]");
  if(tab){const root=tab.closest(".matchday-3d-panel");if(root){const view=tab.getAttribute("data-matchday-view");root.querySelectorAll("[data-matchday-view]").forEach(b=>{const active=b===tab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active))});root.querySelectorAll("[data-matchday-visual-view]").forEach(el=>el.classList.toggle("is-hidden",el.getAttribute("data-matchday-visual-view")!==view));}}
  const b=e.target.closest&&e.target.closest("[data-3d-event]");
  if(b&&panel&&panel.contains(b)){const idx=Number(b.getAttribute("data-3d-event")),ev=(data.events||[])[idx];if(ev){state.elapsed=Math.max(0,Number(ev.minute||0)*60);setClock();state.running=true;if(pause)pause.textContent="Pause"}}
 }
 document.addEventListener("click",clickHandler);
 if(start)start.addEventListener("click",()=>{state.running=true;if(pause)pause.textContent="Pause"});
 if(pause)pause.addEventListener("click",()=>{state.running=false;pause.textContent="Resume"});
 if(reset)reset.addEventListener("click",()=>{state.running=false;resetState();if(pause)pause.textContent="Resume"});
 if(slider)slider.addEventListener("input",()=>{state.speed=Number(slider.value)});
 const disposeFn=dispose;mounted.set(canvas,disposeFn);resetState();state.running=!reducedMotion;if(pause)pause.textContent=state.running?"Pause":"Resume";state.raf=requestAnimationFrame(frame);
}
function scan(){document.querySelectorAll("canvas[data-matchday-2d]").forEach(c=>{if(!mounted.has(c))init(c)})}
function start(){scan();new MutationObserver(scan).observe(document.getElementById("view")||document.body,{childList:true,subtree:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();