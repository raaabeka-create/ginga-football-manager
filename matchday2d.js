/* Ginga FM 2D match presentation engine.
   Contextual, illustrative football movement using the actual matchday lineups.
   This presentation layer never changes the saved match result or career data. */
(function () {
"use strict";
const mounted = new WeakMap();
const reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const hypot = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const formatClock = s => { const n = Math.max(0, Math.floor(s)); return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0"); };
const rand = (a, b) => a + Math.random() * (b - a);
function readData(canvas) { try { return JSON.parse(canvas.getAttribute("data-matchday-2d") || "{}"); } catch (_) { return {}; } }
function posKind(raw) {
 const s = String(raw || "").toLowerCase();
 if (/goalkeeper|\bgk\b|keeper/.test(s)) return "gk";
 if (/centre.?back|center.?back|\bcb\b|defender|\bdef\b|\bdf\b|full.?back|wing.?back|\blb\b|\brb\b/.test(s)) return /full.?back|wing.?back|\blb\b|\brb\b/.test(s) ? "wideDef" : "def";
 if (/winger|\blw\b|\brw\b|striker|forward|\bst\b|\bcf\b|\bfw\b/.test(s)) return /winger|\blw\b|\brw\b/.test(s) ? "wing" : "att";
 if (/attacking mid|\bam\b|\bcam\b/.test(s)) return "attMid";
 if (/defensive mid|\bdm\b|\bcdm\b/.test(s)) return "defMid";
 if (/midfielder|\bcm\b|\bcmf\b|\bmid\b|\blm\b|\brm\b/.test(s)) return "mid";
 return "unknown";
}
function formationRows(raw) {
 const nums = String(raw || "4-3-3").match(/\d+/g);
 let rows = nums && nums.length >= 2 ? nums.map(Number).filter(n => n > 0) : [4, 3, 3];
 if (rows.length > 3) rows = rows.slice(0, 3);
 while (rows.length < 3) rows.push(3);
 let total = rows.reduce((a,b)=>a+b,0);
 while (total > 10) { const i = rows.indexOf(Math.max(...rows)); rows[i]--; total--; }
 while (total < 10) { rows[1]++; total++; }
 return rows;
}
function makeTeam(team, side) {
 const list = (team && Array.isArray(team.players) ? team.players : []).slice(0, 11);
 if (!list.length) return [];
 const keeper = list.find(p => posKind(p.position) === "gk") || list[0];
 const out = [];
 const dir = side === "home" ? 1 : -1;
 const add = (p, x, y, role, row, lane) => out.push({
  id:p.id, name:String(p.name || "Player"), number:Number(p.number || out.length + 1),
  position:String(p.position || ""), team:side, role, row, lane,
  bx:side === "home" ? x : 1 - x, by:y,
  x:0,y:0,tx:0,ty:0,vx:0,vy:0,
  pace:rand(86,126), phase:rand(0,Math.PI*2), action:"idle", facing:dir, kick:0
 });
 add(keeper, .055, .5, "gk", -1, 0);
 const field = list.filter(p => p !== keeper);
 const rows = formationRows(team && team.formation);
 const slots = [];
 const xs = rows.length === 3 ? [.23,.43,.68] : [.20,.39,.58,.75];
 rows.forEach((count, rowIndex) => {
  for (let lane=0; lane<count; lane++) {
   const y = count === 1 ? .5 : .13 + lane * (.74 / (count - 1));
   const x = xs[rowIndex] || .5;
   const role = rowIndex === 0 ? (lane===0 || lane===count-1 ? "wideDef" : "def") :
    rowIndex === rows.length-1 ? (lane===0 || lane===count-1 ? "wing" : "att") :
    (rowIndex === 1 && rows.length===3 ? "mid" : (lane===0 || lane===count-1 ? "wideMid" : "mid"));
   slots.push({x,y,role,row:rowIndex,lane});
  }
 });
 const remaining = field.slice();
 slots.forEach(slot => {
  if (!remaining.length) return;
  let bestIndex = 0, bestScore = Infinity;
  remaining.forEach((p,i) => {
   const k = posKind(p.position);
   const preference = k === "unknown" ? 2 : (
    (slot.role==="def" && (k==="def"||k==="wideDef")) ||
    (slot.role==="wideDef" && (k==="wideDef"||k==="def")) ||
    (slot.role==="mid" && (k==="mid"||k==="defMid"||k==="attMid")) ||
    (slot.role==="wideMid" && (k==="wing"||k==="wideDef"||k==="mid")) ||
    (slot.role==="wing" && (k==="wing"||k==="att")) ||
    (slot.role==="att" && (k==="att"||k==="attMid")) ? 0 : 4);
   const score = preference + i * .0001;
   if (score < bestScore) { bestScore = score; bestIndex = i; }
  });
  const p = remaining.splice(bestIndex,1)[0];
  add(p,slot.x,slot.y,slot.role,slot.row,slot.lane);
 });
 remaining.forEach((p,i)=>add(p,.5,.2+(i%6)*.12,"mid",1,i));
 return out.slice(0,11);
}
function init(canvas) {
 if (mounted.has(canvas)) return;
 const data = readData(canvas), ctx = canvas.getContext("2d");
 if (!ctx) return;
 const W=900,H=600,P={x:35,y:28,w:830,h:544};
 const homeTeam=makeTeam(data.home||{},"home"), awayTeam=makeTeam(data.away||{},"away");
 const teams={home:homeTeam,away:awayTeam}, players=[...homeTeam,...awayTeam];
 const panel=canvas.closest(".matchday-visual-view");
 const start=panel&&panel.querySelector("[data-2d-start]");
 const pause=panel&&panel.querySelector("[data-2d-pause]");
 const reset=panel&&panel.querySelector("[data-2d-reset]");
 const slider=panel&&panel.querySelector("[data-2d-speed]");
 const clock=panel&&panel.querySelector("[data-2d-time]");
 const state={
  running:!reducedMotion,speed:1,elapsed:0,last:0,raf:0,owner:null,
  action:null,decision:0,turnoverCooldown:0,shotCooldown:0,ball:{x:W/2,y:H/2,z:0},
  lastTouch:"home",lastAction:"Kick-off",flash:"",flashUntil:0
 };
 const teamDir=side=>side==="home"?1:-1;
 const clampPitch=(x,y)=>({x:clamp(x,P.x+12,P.x+P.w-12),y:clamp(y,P.y+12,P.y+P.h-12)});
 function fieldX(norm){return P.x+norm*P.w}
 function fieldY(norm){return P.y+norm*P.h}
 function teamHasBall(side){return state.owner?state.owner.team===side:(state.action?state.action.team===side:state.lastTouch===side)}
 function clockText(){if(clock)clock.textContent=formatClock(state.elapsed)}
 function setFlash(text){state.flash=text;state.flashUntil=state.elapsed+2.1}
 function resetState(){
  state.elapsed=0;state.action=null;state.owner=homeTeam.find(p=>p.role==="mid")||homeTeam[1]||homeTeam[0]||null;
  state.decision=rand(.65,1.2);state.turnoverCooldown=0;state.shotCooldown=0;state.lastTouch="home";state.lastAction="Kick-off";state.flash="";
  players.forEach(p=>{p.x=fieldX(p.bx);p.y=fieldY(p.by);p.tx=p.x;p.ty=p.y;p.vx=0;p.vy=0;p.kick=0;p.facing=teamDir(p.team)});
  state.ball.x=state.owner?state.owner.x+teamDir(state.owner.team)*10:W/2;state.ball.y=state.owner?state.owner.y:H/2;state.ball.z=0;
  clockText();draw();
 }
 function opponent(side){return side==="home"?"away":"home"}
 function nearestDefender(x,y,side,except) {
  let best=null,bestD=Infinity;
  teams[opponent(side)].filter(p=>p.role!=="gk").forEach(p=>{if(p===except)return;const d=Math.hypot(p.x-x,p.y-y);if(d<bestD){best=p;bestD=d}});
  return {player:best,distance:bestD};
 }
 function distanceToGoal(p){return p.team==="home"?(P.x+P.w-p.x):(p.x-P.x)}
 function passCandidates(owner) {
  const side=owner.team,dir=teamDir(side),team=teams[side];
  return team.filter(p=>p!==owner&&p.role!=="gk").map(p=>{
   const dx=(p.x-owner.x)*dir,dy=Math.abs(p.y-owner.y);
   const pressure=nearestDefender(p.x,p.y,side).distance;
   const ahead=dx>12,forwardValue=Math.min(dx,210);
   const laneRisk=nearestDefender((p.x+owner.x)/2,(p.y+owner.y)/2,side).distance;
   const separation=players.filter(q=>q.team===side&&q!==owner&&q!==p).reduce((min,q)=>Math.min(min,Math.hypot(q.x-p.x,q.y-p.y)),Infinity);
   let score=forwardValue*.34+Math.min(pressure,95)*.28+Math.min(laneRisk,85)*.18-Math.abs(dy)*.12;
   if(ahead)score+=16;
   if(p.role==="att"||p.role==="wing")score+=dx>25?12:-3;
   if(dx>150&&dy>155)score-=25;
   if(separation<30)score-=10;
   if(p.row===owner.row)score-=2;
   score+=rand(-9,9);
   return {player:p,score,dx,pressure,laneRisk};
  }).sort((a,b)=>b.score-a.score);
 }
 function startPass(target,kind) {
  if(!state.owner||!target||target===state.owner)return;
  const from=state.owner,side=from.team,dx=target.x-from.x,dy=target.y-from.y;
  const length=Math.hypot(dx,dy);
  state.action={kind:kind||"pass",team:side,from:{x:from.x,y:from.y},toPlayer:target,to:{x:target.x,y:target.y},elapsed:0,duration:clamp(length/(340*state.speed),.38,1.2),curve:rand(-22,22),interceptChecked:false};
  from.kick=.28;from.facing=Math.atan2(dy,dx);state.owner=null;state.lastTouch=side;state.lastAction=kind==="cross"?"Cross": "Pass";
  setFlash(kind==="cross"?"Cross into the box":"Pass played forward");
 }
 function startShot() {
  const shooter=state.owner;if(!shooter)return;
  const side=shooter.team,dir=teamDir(side),goalX=side==="home"?P.x+P.w-4:P.x+4;
  const goalY=H/2+rand(-45,45);
  const distance=Math.hypot(goalX-shooter.x,goalY-shooter.y);
  const keeper=teams[opponent(side)].find(p=>p.role==="gk");
  state.action={kind:"shot",team:side,shooter,from:{x:shooter.x,y:shooter.y},to:{x:goalX,y:goalY},elapsed:0,duration:clamp(distance/(560*state.speed),.42,.95),curve:rand(-15,15),saved:false,goalY,keeper,shotOutcome:Math.random()<(distance<210?.28:.09)?"goal":Math.random()<.62?"save":"miss"};
  shooter.kick=.4;state.owner=null;state.lastTouch=side;state.lastAction="Shot";state.shotCooldown=2.5;
  if(keeper){keeper.action="dive";keeper.tx=goalX+(side==="home"?-24:24);keeper.ty=clamp(goalY+rand(-20,20),P.y+P.h*.35,P.y+P.h*.65)}
  setFlash(distance<210?"Shot on goal":"Long-range effort");
 }
 function pickUpLooseBall() {
  const candidates=players.filter(p=>p.role!=="gk").map(p=>({p,d:Math.hypot(p.x-state.ball.x,p.y-state.ball.y)})).sort((a,b)=>a.d-b.d);
  if(!candidates.length)return;
  const closest=candidates[0];
  if(closest.d<30){state.owner=closest.p;state.lastTouch=closest.p.team;state.action=null;state.turnoverCooldown=.55;state.lastAction="Loose ball recovered";setFlash(closest.p.team==="home"?"Home team wins the loose ball":"Away team wins the loose ball")}
 }
 function resolveShot(action) {
  const defending=teams[opponent(action.team)],keeper=action.keeper;
  if(action.shotOutcome==="goal"){
   state.ball.x=action.to.x;state.ball.y=action.to.y;state.ball.z=0;state.owner=null;state.action={kind:"goalPause",team:action.team,elapsed:0,duration:1.15,from:{x:action.to.x,y:action.to.y},to:{x:action.to.x,y:action.to.y}};
   state.lastAction="Goal replay";setFlash("Goal animation — official score remains unchanged");
   return;
  }
  if(action.shotOutcome==="save"&&keeper){
   state.ball.x=keeper.x;state.ball.y=keeper.y;state.ball.z=0;state.owner=keeper;state.action=null;state.lastTouch=opponent(action.team);state.lastAction="Goalkeeper save";setFlash("Goalkeeper makes the save");
   return;
  }
  const reboundX=action.to.x+(action.team==="home"?-rand(35,110):rand(35,110));
  state.ball.x=clamp(reboundX,P.x+10,P.x+P.w-10);state.ball.y=clamp(action.to.y+rand(-75,75),P.y+10,P.y+P.h-10);state.ball.z=0;
  state.owner=null;state.action=null;state.lastTouch=action.team;state.lastAction="Rebound";setFlash("Rebound — players react to the loose ball");
 }
 function actionStep(dt) {
  const a=state.action;if(!a)return;
  a.elapsed+=dt;const t=clamp(a.elapsed/a.duration,0,1),smooth=t*t*(3-2*t);
  if(a.kind==="pass"||a.kind==="cross"){
   a.to.x=a.toPlayer.x;a.to.y=a.toPlayer.y;
   state.ball.x=lerp(a.from.x,a.to.x,smooth);
   state.ball.y=lerp(a.from.y,a.to.y,smooth)+Math.sin(t*Math.PI)*a.curve;
   state.ball.z=Math.sin(t*Math.PI)*(a.kind==="cross"?28:13);
   if(!a.interceptChecked&&t>.25){
    a.interceptChecked=true;
    const danger=nearestDefender(state.ball.x,state.ball.y,a.team);
    if(danger.player&&danger.distance<20&&Math.random()<.42){
     state.owner=danger.player;state.lastTouch=danger.player.team;state.action=null;state.turnoverCooldown=.7;setFlash("Pass intercepted");return;
    }
   }
   if(t>=1){state.ball.x=a.to.x;state.ball.y=a.to.y;state.ball.z=0;state.owner=a.toPlayer;state.lastTouch=a.team;state.action=null;state.decision=rand(.5,1.1);state.lastAction=a.kind==="cross"?"Cross received":"Pass received"}
  } else if(a.kind==="shot"){
   state.ball.x=lerp(a.from.x,a.to.x,smooth);state.ball.y=lerp(a.from.y,a.to.y,smooth)+Math.sin(t*Math.PI)*a.curve;state.ball.z=Math.sin(t*Math.PI)*22;
   if(a.keeper){const keeper=a.keeper;keeper.tx=clamp(state.ball.x+(a.team==="home"?-14:14),P.x+10,P.x+P.w-10);keeper.ty=clamp(state.ball.y,P.y+P.h*.34,P.y+P.h*.66);keeper.action="dive"}
   if(t>=1)resolveShot(a);
  } else if(a.kind==="goalPause"){
   state.ball.x=a.to.x;state.ball.y=a.to.y;state.ball.z=0;
   if(a.elapsed>=a.duration){state.action=null;state.owner=teams[opponent(a.team)].find(p=>p.role==="gk")||null;state.lastTouch=opponent(a.team);state.decision=.7}
  }
 }
 function tacticalTargets(dt) {
  const ball=state.ball;
  const possessionSide=state.owner?state.owner.team:(state.action?state.action.team:state.lastTouch);
  const attacking=teams[possessionSide],defending=teams[opponent(possessionSide)],dir=teamDir(possessionSide);
  const owner=state.owner;
  players.forEach(p=>{
   let bx=fieldX(p.bx),by=fieldY(p.by),tx=bx,ty=by;
   const teamAttacks=p.team===possessionSide;
   const relativeBall=(ball.x-P.x)/P.w;
   const ballSide=relativeBall-.5;
   const lateralPull=clamp((ball.y-H/2)/P.h,-.38,.38);
   if(p.role==="gk"){
    const ownGoalX=p.team==="home"?P.x+19:P.x+P.w-19;
    tx=ownGoalX;ty=clamp(ball.y,P.y+P.h*.34,P.y+P.h*.66);
    if(state.action&&state.action.kind==="shot"&&state.action.team!==p.team){tx=clamp(ball.x+(p.team==="home"?-12:12),P.x+8,P.x+P.w-8);ty=clamp(ball.y,P.y+P.h*.2,P.y+P.h*.8)}
   } else if(teamAttacks){
    const progress=owner&&owner.team===p.team?distanceToGoal(owner):distanceToGoal(p);
    const push=owner?clamp((240-progress)/240,0,1):.25;
    tx=bx+dir*(p.role==="def"?push*36:p.role==="mid"?push*68:p.role==="wideDef"?push*88:push*112);
    ty=by;
    // Teams shift laterally with the ball, but retain width and staggered support.
    ty+=lateralPull*P.h*(p.role==="wideDef"?.11:p.role==="wing"?.08:.16);
    if(owner&&p===owner){tx=owner.x+dir*(progress<200?20:7);ty=owner.y+Math.sin(state.elapsed*4+p.phase)*5}
    else if(owner){
     const dx=(owner.x-p.x)*dir,dy=Math.abs(owner.y-p.y);
     if((p.role==="att"||p.role==="wing")&&dx>20){tx+=dir*rand(18,38);ty+=Math.sign((p.y-H/2)||1)*rand(4,18)}
     else if(dx<75&&dy<100){tx-=dir*rand(8,24);ty+=Math.sign((p.y-H/2)||1)*rand(12,24)}
     if(p.role==="wideDef"&&Math.abs(p.y-H/2)>P.h*.2){ty=by}
    } else {tx+=dir*12*Math.sin(state.elapsed*.7+p.phase);ty+=Math.sin(state.elapsed*.55+p.phase)*13}
   } else {
    // Defensive block retreats and slides together; one presses, one covers, others mark lanes.
    const ownGoalX=p.team==="home"?P.x+P.w*.08:P.x+P.w*.92;
    const ballProgress=Math.abs(ball.x-(p.team==="home"?P.x:P.x+P.w))/P.w;
    const blockX=lerp(ownGoalX,P.x+P.w*.5,clamp(ballProgress*.82,.08,.84));
    tx=lerp(bx,blockX,.44);
    ty=by+lateralPull*P.h*.22;
    const defenders=defending.filter(q=>q.role!=="gk").sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y));
    const press=defenders.indexOf(p)===0,cover=defenders.indexOf(p)===1;
    if(press){tx=ball.x-dir*15;ty=ball.y; p.action="press"}
    else {
     p.action="idle";
     const likelyReceiver=attacking.filter(q=>q!==owner&&q.role!=="gk").sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0];
     if(likelyReceiver&&cover){tx=lerp(tx,likelyReceiver.x,.35);ty=lerp(ty,likelyReceiver.y,.35)}
     if(p.role==="def"||p.role==="wideDef"){tx=lerp(tx,ball.x-dir*75,.16);ty=lerp(ty,ball.y+(p.lane-1)*15,.12)}
    }
   }
   // During flight, nearby players attack the landing zone rather than freezing in formation.
   if(state.action&&(state.action.kind==="pass"||state.action.kind==="cross")){
    const a=state.action,landing=a.toPlayer;
    if(p===landing){tx=landing.x;ty=landing.y}
    else if(p.team===a.team&&p.role!=="gk"&&p!==owner){tx+=dir*10;ty+=Math.sign((p.y-a.to.y)||1)*8}
   }
   const bounded=clampPitch(tx,ty);p.tx=bounded.x;p.ty=bounded.y;
  });
 }
 function movePlayers(dt) {
  tacticalTargets(dt);
  players.forEach(p=>{
   const dx=p.tx-p.x,dy=p.ty-p.y,dist=Math.hypot(dx,dy);
   const maxSpeed=(p===state.owner?145:p.action==="press"?128: p.role==="gk"?96:105)*state.speed;
   const desiredX=dist>1?dx/dist*maxSpeed:0,desiredY=dist>1?dy/dist*maxSpeed:0;
   const accel=clamp(dt*4.2,0,1);
   p.vx=lerp(p.vx,desiredX,accel);p.vy=lerp(p.vy,desiredY,accel);
   const speed=Math.hypot(p.vx,p.vy);
   if(speed>maxSpeed){p.vx=p.vx/speed*maxSpeed;p.vy=p.vy/speed*maxSpeed}
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   const c=clampPitch(p.x,p.y);p.x=c.x;p.y=c.y;
   if(speed>8)p.facing=Math.atan2(p.vy,p.vx);
   if(p.kick>0)p.kick=Math.max(0,p.kick-dt);
  });
 }
 function playerDecision(dt) {
  state.decision-=dt;state.turnoverCooldown=Math.max(0,state.turnoverCooldown-dt);state.shotCooldown=Math.max(0,state.shotCooldown-dt);
  if(state.action){actionStep(dt);return}
  if(!state.owner){pickUpLooseBall();return}
  const p=state.owner,side=p.team,dir=teamDir(side),pressure=nearestDefender(p.x,p.y,side);
  // Ball carrier turns away from pressure and advances into available space.
  if(pressure.player&&pressure.distance<27&&state.turnoverCooldown<=0&&Math.random()<dt*.95){
   state.owner=pressure.player;state.lastTouch=pressure.player.team;state.turnoverCooldown=.8;state.lastAction="Tackle / possession won";setFlash("Defender wins possession");return;
  }
  const goalDistance=distanceToGoal(p);
  const shotLane=pressure.distance>22;
  if(state.shotCooldown<=0&&goalDistance<205&&Math.random()<dt*(shotLane?.32:.12)){startShot();return}
  if(state.decision<=0){
   const options=passCandidates(p);
   const best=options[0],crossTarget=options.find(o=>(o.player.role==="att"||o.player.role==="wing")&&o.dx>20&&Math.abs(o.player.y-H/2)<P.h*.36);
   if(best&&((pressure.distance<55)||Math.random()<.5)){
    const cross=goalDistance<240&&crossTarget&&Math.random()<.28;
    startPass(cross?crossTarget.player:best.player,cross?"cross":"pass");
   } else {
    state.decision=rand(.35,.85);
    // A short carry makes the dribbler commit defenders before the next action.
    const ahead=dir>0?P.x+P.w-p.x:p.x-P.x;
    const laneOffset=clamp((H/2-p.y)/H,-.18,.18);
    p.tx=clamp(p.x+dir*rand(24,55),P.x+12,P.x+P.w-12);
    p.ty=clamp(p.y+laneOffset*rand(18,42),P.y+14,P.y+P.h-14);
    p.action="dribble";state.lastAction="Dribble into space";
    if(ahead<85&&Math.random()<.4)startShot();
   }
  }
 }
 function drawPitch(){
  ctx.fillStyle="#1b633b";ctx.fillRect(P.x,P.y,P.w,P.h);
  for(let i=0;i<12;i++)if(i%2===0){ctx.fillStyle="rgba(255,255,255,.045)";ctx.fillRect(P.x+i*P.w/12,P.y,P.w/12,P.h)}
  ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineWidth=2;ctx.strokeRect(P.x,P.y,P.w,P.h);
  ctx.beginPath();ctx.moveTo(W/2,P.y);ctx.lineTo(W/2,P.y+P.h);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,57,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(W/2,H/2,3,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
  const bw=112,bh=224,sw=46,sh=112;
  ctx.strokeRect(P.x,H/2-bh/2,bw,bh);ctx.strokeRect(P.x+P.w-bw,H/2-bh/2,bw,bh);
  ctx.strokeRect(P.x,H/2-sh/2,sw,sh);ctx.strokeRect(P.x+P.w-sw,H/2-sh/2,sw,sh);
  ctx.beginPath();ctx.arc(P.x+bw,H/2,57,-.9,.9);ctx.stroke();ctx.beginPath();ctx.arc(P.x+P.w-bw,H/2,57,Math.PI-.9,Math.PI+.9);ctx.stroke();
  ctx.fillStyle="rgba(255,255,255,.22)";ctx.fillRect(P.x-12,H/2-37,12,74);ctx.fillRect(P.x+P.w,H/2-37,12,74);
  ctx.fillStyle="rgba(255,255,255,.9)";ctx.font="900 11px system-ui";ctx.textBaseline="top";ctx.textAlign="left";ctx.fillText(String(data.home&&data.home.name||"HOME").toUpperCase(),P.x+9,P.y+8);ctx.textAlign="right";ctx.fillText(String(data.away&&data.away.name||"AWAY").toUpperCase(),P.x+P.w-9,P.y+8);
 }
 function drawPlayer(p){
  const isHome=p.team==="home",kit=isHome?"#205da0":"#c52d42";
  const run=Math.hypot(p.vx,p.vy),step=Math.sin(state.elapsed*(run>.5?13:2.2)+p.phase);
  const lift=run>10?Math.abs(step)*2.4:0;
  ctx.save();ctx.translate(p.x,p.y-lift);
  ctx.beginPath();ctx.ellipse(0,9,10,4,0,0,Math.PI*2);ctx.fillStyle="rgba(0,0,0,.32)";ctx.fill();
  // Tiny directional legs and arms give each marker a visible running stride.
  ctx.strokeStyle="#f1d2b2";ctx.lineWidth=3;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(-3,4);ctx.lineTo(-5+step*3,11);ctx.moveTo(3,4);ctx.lineTo(5-step*3,11);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(-10-step*2,2);ctx.moveTo(6,-2);ctx.lineTo(10+step*2,2);ctx.stroke();
  ctx.beginPath();ctx.arc(0,-7,5.1,0,Math.PI*2);ctx.fillStyle="#e8b995";ctx.fill();
  ctx.beginPath();ctx.ellipse(0,0,9,11,0,0,Math.PI*2);ctx.fillStyle=p.role==="gk"?"#d5b52d":kit;ctx.fill();ctx.lineWidth=1.4;ctx.strokeStyle="#fff";ctx.stroke();
  ctx.fillStyle="#fff";ctx.font="900 8px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(p.number).slice(0,2),0,0);
  ctx.restore();
  ctx.fillStyle="rgba(0,0,0,.6)";ctx.font="bold 9px system-ui";ctx.textAlign="center";ctx.textBaseline="top";const name=p.name.length>13?p.name.slice(0,12)+"…":p.name;ctx.fillText(name,p.x+1,p.y+15);
  ctx.fillStyle="#fff";ctx.fillText(name,p.x,p.y+14);
 }
 function drawBall(){
  ctx.beginPath();ctx.ellipse(state.ball.x,state.ball.y+6,6,3,0,0,Math.PI*2);ctx.fillStyle="rgba(0,0,0,.4)";ctx.fill();
  const y=state.ball.y-state.ball.z;ctx.beginPath();ctx.arc(state.ball.x,y,6,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle="#202020";ctx.lineWidth=1.1;ctx.stroke();
  ctx.beginPath();ctx.moveTo(state.ball.x-3,y-2);ctx.lineTo(state.ball.x+3,y+2);ctx.moveTo(state.ball.x+3,y-2);ctx.lineTo(state.ball.x-3,y+2);ctx.stroke();
 }
 function draw(){
  ctx.clearRect(0,0,W,H);drawPitch();
  // A faint trail makes the ball's flight easier to follow.
  if(state.action&&(state.action.kind==="pass"||state.action.kind==="cross"||state.action.kind==="shot")){
   ctx.save();ctx.setLineDash([7,7]);ctx.strokeStyle=state.action.kind==="shot"?"rgba(255,225,90,.85)":"rgba(255,255,255,.45)";ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(state.action.from.x,state.action.from.y);ctx.lineTo(state.ball.x,state.ball.y);ctx.stroke();ctx.restore();
  }
  [...awayTeam,...homeTeam].sort((a,b)=>a.y-b.y).forEach(drawPlayer);drawBall();
  ctx.fillStyle="rgba(5,15,10,.78)";ctx.fillRect(W/2-139,5,278,23);ctx.fillStyle="#fff";ctx.font="900 11px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText("OFFICIAL SCORE  "+Number(data.score&&data.score.home||0)+" – "+Number(data.score&&data.score.away||0),W/2,16);
  if(state.flash&&state.elapsed<state.flashUntil){ctx.fillStyle="rgba(8,18,14,.8)";ctx.fillRect(W/2-150,H-48,300,27);ctx.fillStyle="#ffe66d";ctx.font="bold 11px system-ui";ctx.fillText(state.flash,W/2,H-34)}
  if(!state.running){ctx.fillStyle="rgba(5,15,10,.22)";ctx.fillRect(P.x,P.y,P.w,P.h);ctx.fillStyle="#fff";ctx.font="900 20px system-ui";ctx.fillText("PAUSED",W/2,H-13)}
 }
 function frame(timestamp){
  if(!canvas.isConnected){dispose();return}
  const dt=state.last?Math.min(.035,(timestamp-state.last)/1000):0;state.last=timestamp;
  if(state.running){
   const scaled=dt*state.speed;state.elapsed+=scaled;
   movePlayers(scaled);playerDecision(scaled);if(!state.action&&!state.owner)pickUpLooseBall();
   if(state.owner){state.ball.x=state.owner.x+teamDir(state.owner.team)*8;state.ball.y=state.owner.y+2;state.ball.z=0}
   else if(!state.action){state.ball.z=0}
   clockText();
  }
  draw();state.raf=requestAnimationFrame(frame);
 }
 function dispose(){cancelAnimationFrame(state.raf);document.removeEventListener("click",clickHandler);mounted.delete(canvas)}
 function clickHandler(e){
  const tab=e.target.closest&&e.target.closest("[data-matchday-view]");
  if(tab){
   const root=tab.closest(".matchday-3d-panel");
   if(root){const view=tab.getAttribute("data-matchday-view");root.querySelectorAll("[data-matchday-view]").forEach(b=>{const active=b===tab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active))});root.querySelectorAll("[data-matchday-visual-view]").forEach(el=>el.classList.toggle("is-hidden",el.getAttribute("data-matchday-visual-view")!==view));}
  }
  const eventButton=e.target.closest&&e.target.closest("[data-3d-event]");
  if(eventButton&&panel&&panel.contains(eventButton)){
   const index=Number(eventButton.getAttribute("data-3d-event")),ev=(data.events||[])[index];
   if(ev){state.elapsed=Math.max(0,Number(ev.minute||0)*60);state.running=true;if(pause)pause.textContent="Pause";setFlash("Incident selected — animation is illustrative");}
  }
 }
 document.addEventListener("click",clickHandler);
 if(start)start.addEventListener("click",()=>{state.running=true;if(pause)pause.textContent="Pause"});
 if(pause)pause.addEventListener("click",()=>{state.running=!state.running;pause.textContent=state.running?"Pause":"Resume"});
 if(reset)reset.addEventListener("click",()=>{state.running=false;resetState();if(pause)pause.textContent="Resume"});
 if(slider)slider.addEventListener("input",()=>{state.speed=Number(slider.value)});
 mounted.set(canvas,dispose);resetState();state.running=!reducedMotion;if(pause)pause.textContent=state.running?"Pause":"Resume";state.raf=requestAnimationFrame(frame);
}
function scan(){document.querySelectorAll("canvas[data-matchday-2d]").forEach(c=>{if(!mounted.has(c))init(c)})}
function start(){scan();new MutationObserver(scan).observe(document.getElementById("view")||document.body,{childList:true,subtree:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();