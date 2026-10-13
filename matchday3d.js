import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const mounted = new WeakMap();
const activeScenes = new Set();
const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function readData(stage) {
  try { return JSON.parse(stage.getAttribute("data-matchday-3d") || "{}"); }
  catch (_) { return {}; }
}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function seeded(index){const n=Math.sin(index*127.1+311.7)*43758.5453;return n-Math.floor(n);}
function textSprite(text,color="#ffffff"){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=96;
  const ctx=canvas.getContext("2d");ctx.clearRect(0,0,512,96);
  ctx.font="bold 42px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.lineWidth=8;ctx.strokeStyle="rgba(0,0,0,.72)";ctx.strokeText(String(text||""),256,48);
  ctx.fillStyle=color;ctx.fillText(String(text||""),256,48);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});
  const sprite=new THREE.Sprite(material);sprite.scale.set(5.5,1.05,1);return sprite;
}
function cylinderBetween(a,b,radius,material,segments=8){
  const direction=new THREE.Vector3().subVectors(b,a);const length=direction.length();
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,segments),material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  return mesh;
}
function buildHuman(teamColor,accentColor,number,name,position){
  const root=new THREE.Group();root.userData={name,number,position};
  const shirtMat=new THREE.MeshStandardMaterial({color:teamColor,roughness:.78});
  const shortsMat=new THREE.MeshStandardMaterial({color:accentColor,roughness:.85});
  const skinMat=new THREE.MeshStandardMaterial({color:0x9a694d,roughness:.9});
  const sockMat=new THREE.MeshStandardMaterial({color:teamColor,roughness:.8});
  const bootMat=new THREE.MeshStandardMaterial({color:0x16191d,roughness:.55});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.36,.52,3,7),shirtMat);torso.position.y=1.35;root.add(torso);
  const chestNumber=new THREE.Mesh(new THREE.SphereGeometry(.105,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));
  chestNumber.position.set(0,1.42,.348);root.add(chestNumber);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.205,10,8),skinMat);head.position.y=2.02;root.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.208,10,5,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0x24201d,roughness:1}));hair.position.y=2.06;root.add(hair);
  const shorts=new THREE.Mesh(new THREE.BoxGeometry(.54,.29,.37),shortsMat);shorts.position.y=.91;root.add(shorts);
  const limbs=[];
  for(let side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.17,.79,0);
    const upper=new THREE.Mesh(new THREE.CylinderGeometry(.105,.12,.42,7),shortsMat);upper.position.y=-.19;leg.add(upper);
    const lower=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.39,7),sockMat);lower.position.y=-.56;leg.add(lower);
    const boot=new THREE.Mesh(new THREE.BoxGeometry(.14,.1,.29),bootMat);boot.position.set(0,-.79,.075);leg.add(boot);
    root.add(leg);limbs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.37,1.53,0);
    const upperArm=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.43,7),shirtMat);upperArm.position.y=-.18;upperArm.rotation.z=side*.12;arm.add(upperArm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.075,7,6),skinMat);hand.position.set(side*.035,-.42,.015);arm.add(hand);
    root.add(arm);limbs.push(arm);
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.42,12),new THREE.MeshBasicMaterial({color:0x07130d,transparent:true,opacity:.3,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;shadow.scale.set(1.2,.75,1);root.add(shadow);
  const label=textSprite(name.length>16?name.slice(0,15)+"…":name,"#ffffff");label.position.y=2.52;root.add(label);
  root.userData.limbs=limbs;root.userData.baseY=0;root.userData.ballCarrier=false;
  return root;
}
function buildPitch(scene){
  const turf=new THREE.Mesh(new THREE.PlaneGeometry(108,72),new THREE.MeshStandardMaterial({color:0x1d7045,roughness:1}));
  turf.rotation.x=-Math.PI/2;turf.position.y=0;scene.add(turf);
  const stripes=new THREE.Group();
  for(let i=0;i<10;i++){
    const stripe=new THREE.Mesh(new THREE.PlaneGeometry(10.8,68),new THREE.MeshBasicMaterial({color:i%2?0x1c6b41:0x237b4c,transparent:true,opacity:.46,side:THREE.DoubleSide}));
    stripe.rotation.x=-Math.PI/2;stripe.position.set(-48.6+i*10.8,.012,0);stripes.add(stripe);
  }
  scene.add(stripes);
  const lineMat=new THREE.LineBasicMaterial({color:0xe6f0e7,transparent:true,opacity:.9});
  const addLine=(points,closed=false)=>{const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],.04,p[1])));const line=closed?new THREE.LineLoop(geo,lineMat):new THREE.Line(geo,lineMat);scene.add(line);};
  addLine([[-52,-33],[52,-33],[52,33],[-52,33]],true);addLine([[0,-33],[0,33]]);
  const circle=[];for(let i=0;i<80;i++){const a=i/80*Math.PI*2;circle.push([9.15*Math.cos(a),9.15*Math.sin(a)]);}addLine(circle,true);
  const addBox=(x1,z1,x2,z2)=>addLine([[x1,z1],[x2,z1],[x2,z2],[x1,z2]],true);
  addBox(-52,-20,-36,20);addBox(-52,-10,-44,10);addBox(36,-20,52,20);addBox(44,-10,52,10);
  const spot=new THREE.Mesh(new THREE.CircleGeometry(.65,20),new THREE.MeshBasicMaterial({color:0xe6f0e7}));spot.rotation.x=-Math.PI/2;spot.position.set(0,.045,0);scene.add(spot);
  function goal(x,dir){
    const mat=new THREE.MeshStandardMaterial({color:0xe8edf0,metalness:.28,roughness:.45});
    const z1=-3.7,z2=3.7,y=2.45,back=x+dir*2.8;
    [[x,0,z1],[x,y,z1],[x,y,z2],[x,0,z2],[x,y,z1],[x,y,z2],[back,y,z1],[back,y,z2],[back,0,z1],[back,0,z2]].forEach((p,i,a)=>{if(i%2===0&&a[i+1])scene.add(cylinderBetween(new THREE.Vector3(...p),new THREE.Vector3(...a[i+1]),.075,mat,6));});
    const netMat=new THREE.LineBasicMaterial({color:0xdfe8e8,transparent:true,opacity:.28});
    for(let z=-3;z<=3;z+=1){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(back,0,z),new THREE.Vector3(back,y,z)]);scene.add(new THREE.Line(geo,netMat));}
    for(let h=.5;h<y;h+=.5){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(back,h,-3.7),new THREE.Vector3(back,h,3.7)]);scene.add(new THREE.Line(geo,netMat));}
  }
  goal(-52,-1);goal(52,1);
}
function buildStadium(scene){
  const concrete=new THREE.MeshStandardMaterial({color:0x4a535b,roughness:.9});
  const dark=new THREE.MeshStandardMaterial({color:0x202b32,roughness:.95});
  const crowdColors=[0xd3d8dd,0x9da7af,0x8d2835,0x2c73a4,0xe0bd58,0x35443e];
  for(let tier=0;tier<3;tier++){
    const zNear=38+tier*4.1;
    for(const side of [-1,1]){
      const stand=new THREE.Mesh(new THREE.BoxGeometry(112,3.8,3.4),tier%2?dark:concrete);
      stand.position.set(0,2.5+tier*2.3,side*zNear);scene.add(stand);
      const crowdGeo=new THREE.BufferGeometry(),positions=[],colors=[];
      for(let i=0;i<260;i++){
        positions.push((seeded(i+tier*1000+side*9)-.5)*108,4+tier*2.3+seeded(i*2+tier)*1.4,side*(zNear-.4));
        const c=new THREE.Color(crowdColors[Math.floor(seeded(i*7+tier*11)*crowdColors.length)]);colors.push(c.r,c.g,c.b);
      }
      crowdGeo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));crowdGeo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
      scene.add(new THREE.Points(crowdGeo,new THREE.PointsMaterial({size:.45,vertexColors:true,sizeAttenuation:true})));
    }
  }
  for(const side of [-1,1]){
    for(let tier=0;tier<2;tier++){
      const stand=new THREE.Mesh(new THREE.BoxGeometry(3.4,4.2,72),tier?dark:concrete);stand.position.set(side*(57+tier*3.8),3+tier*2.4,0);scene.add(stand);
      const positions=[],colors=[];
      for(let i=0;i<160;i++){positions.push(side*(55+tier*3.8),4+tier*2.3+seeded(i+88)*1.4,(seeded(i*3+tier)-.5)*68);const c=new THREE.Color(crowdColors[Math.floor(seeded(i*13+tier)*crowdColors.length)]);colors.push(c.r,c.g,c.b);}
      const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
      scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:.4,vertexColors:true,sizeAttenuation:true})));
    }
  }
  const roofMat=new THREE.MeshStandardMaterial({color:0x202830,metalness:.22,roughness:.6});
  for(const side of [-1,1]){
    const roof=new THREE.Mesh(new THREE.BoxGeometry(114,1.2,5),roofMat);roof.position.set(0,12.2,side*48);scene.add(roof);
  }
  const poleMat=new THREE.MeshStandardMaterial({color:0x7c8790,metalness:.45,roughness:.45});
  const lampMat=new THREE.MeshBasicMaterial({color:0xfff3c5});
  for(const x of [-48,-16,16,48])for(const side of [-1,1]){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,17,6),poleMat);pole.position.set(x,8.5,side*43);scene.add(pole);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(2.4,.35,.6),lampMat);lamp.position.set(x,17,side*42);scene.add(lamp);
    const glow=new THREE.PointLight(0xffe6b5,.42,45);glow.position.set(x,16,side*41);scene.add(glow);
  }
}
function formationPositions(team){
  const shape={"4-3-3":[4,3,3],"4-4-2":[4,4,2],"4-2-3-1":[4,5,1],"5-3-2":[5,3,2],"5-4-1":[5,4,1]}[team.formation]||[4,3,3];
  const side=team.side,sign=side==="home"?-1:1;
  const rows=[{count:shape[0],x:sign*31,types:["CB","LB","RB","LWB","RWB"]},{count:shape[1],x:sign*16,types:["DM","CM","AM","LM","RM"]},{count:shape[2],x:sign*5,types:["ST","CF","LW","RW"]}];
  const list=(team.players||[]).slice();if(!list.length)return [];
  const keeper=list.find(p=>String(p.position).toUpperCase()==="GK")||list[0];
  const used=new Set([keeper.id]);const output=[{player:keeper,x:sign*47,z:0,keeper:true}];
  let cursor=0;
  for(const row of rows){
    const chosen=list.filter(p=>!used.has(p.id)&&row.types.includes(String(p.position).toUpperCase())).slice(0,row.count);
    while(chosen.length<row.count){const p=list.find(item=>!used.has(item.id));if(!p)break;chosen.push(p);}
    chosen.forEach((p,i)=>{used.add(p.id);const spread=chosen.length>1?((i/(chosen.length-1))-.5)*40:0;output.push({player:p,x:row.x,z:spread,keeper:false});cursor++;});
  }
  list.filter(p=>!used.has(p.id)).forEach((p,i)=>output.push({player:p,x:sign*(10+i%3*3),z:-22+(i%7)*7,keeper:false}));
  return output.slice(0,11);
}
function makeBall(scene){
  const ball=new THREE.Group();
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(.36,16,12),new THREE.MeshStandardMaterial({color:0xf6f5ef,roughness:.5}));
  ball.add(sphere);
  const patchMat=new THREE.MeshStandardMaterial({color:0x20242a,roughness:.7});
  for(let i=0;i<5;i++){const patch=new THREE.Mesh(new THREE.SphereGeometry(.11,7,5),patchMat);patch.position.set(Math.cos(i*1.256)*.27,.05,Math.sin(i*1.256)*.27);ball.add(patch);}
  ball.position.set(0,.42,0);scene.add(ball);return ball;
}
function cameraTarget(camera,preset){
  if(preset==="tactical"){camera.position.set(0,58,2);camera.lookAt(0,0,0);}
  else if(preset==="goal"){camera.position.set(-61,13,0);camera.lookAt(0,0,0);}
  else{camera.position.set(0,49,61);camera.lookAt(0,0,0);}
}
function initialize(stage){
  if(mounted.has(stage))return;
  const data=readData(stage);
  stage.innerHTML="";
  const panel=stage.closest(".matchday-3d-panel")||stage.parentElement;
  const canvas=document.createElement("canvas");canvas.className="matchday-3d-canvas";canvas.setAttribute("aria-label","3D matchday stadium and animated players");stage.appendChild(canvas);
  const hud=document.createElement("div");hud.className="matchday-3d-hud";hud.innerHTML='<span class="matchday-3d-hud-pill">'+(data.stage==="FULLTIME"?"FULL TIME":"HALF TIME")+'</span><strong>'+Number(data.score?.home||0)+' — '+Number(data.score?.away||0)+'</strong><small>'+String(data.home?.name||"Home")+' vs '+String(data.away?.name||"Away")+'</small>';stage.appendChild(hud);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x111a22);scene.fog=new THREE.Fog(0x111a22,90,175);
  const camera=new THREE.PerspectiveCamera(43,1,.1,250);cameraTarget(camera,"broadcast");
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.setSize(stage.clientWidth||1000,stage.clientHeight||560,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  scene.add(new THREE.HemisphereLight(0xd8e8ff,0x1b3525,2.05));
  const keyLight=new THREE.DirectionalLight(0xffe8c3,2.6);keyLight.position.set(-25,50,20);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);scene.add(keyLight);
  buildPitch(scene);buildStadium(scene);
  const all=[];
  for(const team of [{...data.home,side:"home"},{...data.away,side:"away"}]){
    const isHome=team.side==="home";const positions=formationPositions(team);
    positions.forEach((entry,index)=>{
      const color=entry.keeper?0xd9b83f:(isHome?0x982738:0x1769b3);
      const accent=entry.keeper?0x2d3028:(isHome?0x202126:0xe7eaf0);
      const human=buildHuman(color,accent,entry.player.number,entry.player.name,entry.player.position);
      human.position.set(entry.x,0,entry.z);human.rotation.y=isHome?Math.PI/2:-Math.PI/2;
      human.userData.basePosition=new THREE.Vector3(entry.x,0,entry.z);human.userData.side=team.side;human.userData.index=index;human.userData.teamName=team.name;human.userData.playerId=entry.player.id;
      scene.add(human);all.push(human);
    });
  }
  const ball=makeBall(scene);
  const spotlights=[];
  const resize=()=>{if(!stage.isConnected)return;const w=Math.max(320,stage.clientWidth),h=Math.max(300,stage.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
  const observer=new ResizeObserver(resize);observer.observe(stage);
  let paused=reducedMotion,elapsed=0,lastTime=0,selectedEventIndex=Math.max(0,(data.events||[]).length-1),currentCamera="broadcast";
  const setEvent=index=>{const evs=data.events||[];if(!evs.length)return;selectedEventIndex=clamp(Number(index)||0,0,evs.length-1);const ev=evs[selectedEventIndex];const hudText=stage.querySelector(".matchday-3d-hud small");if(hudText)hudText.textContent=ev.minute+"′ · "+String(ev.type||"incident").toUpperCase()+" · "+(ev.player||ev.team||"Match incident");};
  function onDocumentEvent(event){const button=event.target.closest&&event.target.closest("[data-3d-event]");if(button&&stage.contains(button))setEvent(button.getAttribute("data-3d-event"));}
  document.addEventListener("click",onDocumentEvent);
  panel.querySelectorAll("[data-3d-camera]").forEach(button=>button.addEventListener("click",()=>{currentCamera=button.getAttribute("data-3d-camera")||"broadcast";cameraTarget(camera,currentCamera);panel.querySelectorAll("[data-3d-camera]").forEach(b=>b.classList.toggle("active",b===button));}));
  panel.querySelectorAll("[data-3d-pause]").forEach(button=>button.addEventListener("click",()=>{paused=!paused;button.textContent=paused?"Play animation":"Pause animation";}));
  function animate(time){
    if(!stage.isConnected){dispose();return;}
    const dt=lastTime?Math.min(.05,(time-lastTime)/1000):0;lastTime=time;
    if(!paused)elapsed+=dt;
    const phase=elapsed*.52,ev=(data.events||[])[selectedEventIndex]||null;
    let carrier=all.length?all[Math.floor(elapsed/3.4)%all.length]:null;
    if(ev&&ev.player){const match=all.find(p=>String(p.userData.name)===ev.player&&p.userData.teamName===ev.team);if(match)carrier=match;}
    all.forEach((player,i)=>{
      const base=player.userData.basePosition,sideSign=player.userData.side==="home"?1:-1;
      let x=base.x+Math.sin(phase+i*.91)*(.9+(i%3)*.32),z=base.z+Math.cos(phase*.8+i*1.13)*(.75+(i%4)*.3);
      if(player===carrier){x+=sideSign*(4.8+Math.sin(phase*1.4)*2.2);z+=Math.sin(phase*1.8)*2.8;player.userData.ballCarrier=true;}
      else{player.userData.ballCarrier=false;if(carrier&&player.userData.side===carrier.userData.side&&Math.abs(player.position.x-carrier.position.x)<20){x+=sideSign*1.2;z+=Math.sin(phase+i)*1.5;}}
      if(ev&&["goal","chance"].includes(ev.type)&&carrier&&player.userData.side===(ev.team===data.home.name?"home":"away")){x=clamp(x+sideSign*5,-50,50);}
      player.position.x=THREE.MathUtils.damp(player.position.x,x,paused?0:2.1,dt||.016);
      player.position.z=THREE.MathUtils.damp(player.position.z,z,paused?0:2.1,dt||.016);
      const run=paused?0:Math.sin(elapsed*8+i*1.7)*.48;
      player.userData.limbs.forEach((limb,j)=>{limb.rotation.x=run*(j<2?1:-.6)+(j%2?-.12:.12);});
      player.rotation.y+=(Math.atan2((carrier?.position.z||0)-player.position.z,(carrier?.position.x||0)-player.position.x)-player.rotation.y)*.035;
    });
    if(carrier){
      const attackingSign=carrier.userData.side==="home"?1:-1;
      let targetX=carrier.position.x+attackingSign*3.1,targetZ=carrier.position.z+Math.sin(phase*1.2)*1.1;
      if(ev&&ev.type==="goal"){targetX=attackingSign*53;targetZ=0;}
      else if(ev&&ev.type==="chance"){targetX=attackingSign*43;targetZ=carrier.position.z*.35;}
      ball.position.x=THREE.MathUtils.damp(ball.position.x,targetX,paused?0:3.2,dt||.016);
      ball.position.z=THREE.MathUtils.damp(ball.position.z,targetZ,paused?0:3.2,dt||.016);
      ball.position.y=.38+Math.abs(Math.sin(elapsed*4))*.18;
      ball.rotation.x+=dt*4;ball.rotation.z+=dt*3;
    }
    renderer.render(scene,camera);
  }
  function dispose(){renderer.setAnimationLoop(null);observer.disconnect();document.removeEventListener("click",onDocumentEvent);renderer.dispose();activeScenes.delete(dispose);}
  activeScenes.add(dispose);mounted.set(stage,dispose);resize();renderer.setAnimationLoop(animate);
  if(data.events&&data.events.length)setEvent(selectedEventIndex);
  else {const hudText=stage.querySelector(".matchday-3d-hud small");if(hudText)hudText.textContent="Tactical shape · scripted open-play movement";}
}
function scan(){
  document.querySelectorAll("[data-matchday-3d]").forEach(stage=>{if(!mounted.has(stage))initialize(stage);});
  for(const dispose of Array.from(activeScenes)){/* disposal occurs from animation loop when its mount is removed */}
}
const mutationObserver=new MutationObserver(scan);
function start(){scan();mutationObserver.observe(document.getElementById("view")||document.body,{childList:true,subtree:true});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
