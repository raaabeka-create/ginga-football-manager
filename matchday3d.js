let THREE;
try {
  THREE = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
} catch (error) {
  const fallback = () => document.querySelectorAll("[data-matchday-3d]").forEach(stage => {
    if (!stage.querySelector(".matchday-3d-fallback")) stage.innerHTML = '<div class="matchday-3d-fallback"><strong>3D match view could not load</strong><p>Check your internet connection or allow the Three.js CDN to load, then refresh the matchday screen.</p></div>';
  });
  fallback();
  new MutationObserver(fallback).observe(document.body, { childList: true, subtree: true });
  console.error("Ginga FM 3D renderer could not load", error);
}
if (THREE) {

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
  const chestNumber=new THREE.Mesh(new THREE.SphereGeometry(.105,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));chestNumber.position.set(0,1.42,.348);root.add(chestNumber);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.205,10,8),skinMat);head.position.y=2.02;root.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.208,10,5,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0x24201d,roughness:1}));hair.position.y=2.06;root.add(hair);
  const shorts=new THREE.Mesh(new THREE.BoxGeometry(.54,.29,.37),shortsMat);shorts.position.y=.91;root.add(shorts);
  const limbs=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.17,.79,0);leg.userData.kind="leg";
    const thigh=new THREE.Mesh(new THREE.CylinderGeometry(.105,.12,.42,7),shortsMat);thigh.position.y=-.19;leg.add(thigh);
    const knee=new THREE.Group();knee.position.y=-.38;leg.add(knee);
    const shin=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.37,7),sockMat);shin.position.y=-.18;knee.add(shin);
    const boot=new THREE.Mesh(new THREE.BoxGeometry(.14,.1,.29),bootMat);boot.position.set(0,-.39,.075);knee.add(boot);
    root.add(leg);limbs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.37,1.53,0);arm.userData.kind="arm";
    const upperArm=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.43,7),shirtMat);upperArm.position.y=-.18;upperArm.rotation.z=side*.12;arm.add(upperArm);
    const forearm=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,.34,7),skinMat);forearm.position.set(side*.025,-.48,.015);forearm.rotation.z=side*.08;arm.add(forearm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.075,7,6),skinMat);hand.position.set(side*.035,-.66,.015);arm.add(hand);
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
  const panel=stage.closest(".matchday-3d-panel")||stage.parentElement;
  const loading=stage.querySelector(".matchday-3d-loading");
  const canvas=document.createElement("canvas");canvas.className="matchday-3d-canvas";canvas.setAttribute("aria-label","3D matchday stadium and animated players");stage.appendChild(canvas);
  const hud=document.createElement("div");hud.className="matchday-3d-hud";hud.innerHTML='<span class="matchday-3d-hud-pill">'+(data.stage==="FULLTIME"?"FULL TIME":"HALF TIME")+'</span><strong>'+Number(data.score?.home||0)+' — '+Number(data.score?.away||0)+'</strong><small>'+String(data.home?.name||"Home")+' vs '+String(data.away?.name||"Away")+'</small>';stage.appendChild(hud);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x111a22);scene.fog=new THREE.Fog(0x111a22,90,175);
  const camera=new THREE.PerspectiveCamera(43,1,.1,250);cameraTarget(camera,"broadcast");
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(stage.clientWidth||1000,stage.clientHeight||560,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
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
      human.userData.basePosition=new THREE.Vector3(entry.x,0,entry.z);
      human.userData.side=team.side;human.userData.index=index;human.userData.teamName=team.name;human.userData.playerId=entry.player.id;
      human.userData.isKeeper=entry.keeper;human.userData.runPhase=seeded(index+(isHome?5:50))*Math.PI*2;
      scene.add(human);all.push(human);
    });
  }
  const ball=makeBall(scene);
  const ballTrailPositions=new Float32Array(90*3);
  const trailGeometry=new THREE.BufferGeometry();trailGeometry.setAttribute("position",new THREE.BufferAttribute(ballTrailPositions,3));
  const trail=new THREE.Line(trailGeometry,new THREE.LineBasicMaterial({color:0xf6d36a,transparent:true,opacity:.68}));trail.visible=false;scene.add(trail);
  const resize=()=>{if(!stage.isConnected)return;const w=Math.max(320,stage.clientWidth),h=Math.max(300,stage.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
  const observer=new ResizeObserver(resize);observer.observe(stage);
  let paused=!!reducedMotion,elapsed=0,lastTime=0,selectedEventIndex=Math.max(0,(data.events||[]).length-1),currentCamera="broadcast",highlightStarted=-999,highlightEvent=null;
  const setEvent=index=>{
    const evs=data.events||[];if(!evs.length)return;
    selectedEventIndex=clamp(Number(index)||0,0,evs.length-1);highlightEvent=evs[selectedEventIndex];highlightStarted=elapsed;
    const ev=highlightEvent;const hudText=stage.querySelector(".matchday-3d-hud small");
    if(hudText)hudText.textContent=ev.minute+"′ · "+String(ev.type||"incident").toUpperCase()+" · "+(ev.player||ev.team||"Match incident");
    const pill=stage.querySelector(".matchday-3d-hud-pill");if(pill)pill.textContent="REPLAY · "+ev.minute+"′";
  };
  function onDocumentEvent(event){const button=event.target.closest&&event.target.closest("[data-3d-event]");if(button&&panel.contains(button))setEvent(button.getAttribute("data-3d-event"));}
  document.addEventListener("click",onDocumentEvent);
  panel.querySelectorAll("[data-3d-camera]").forEach(button=>button.addEventListener("click",()=>{
    currentCamera=button.getAttribute("data-3d-camera")||"broadcast";cameraTarget(camera,currentCamera);
    panel.querySelectorAll("[data-3d-camera]").forEach(b=>b.classList.toggle("active",b===button));
  }));
  panel.querySelectorAll("[data-3d-pause]").forEach(button=>{
    button.textContent=paused?"Play animation":"Pause animation";
    button.addEventListener("click",()=>{paused=!paused;button.textContent=paused?"Play animation":"Pause animation";});
  });
  const teamPlayers={home:all.filter(p=>p.userData.side==="home"),away:all.filter(p=>p.userData.side==="away")};
  const chooseCarrier=(side,phase)=>{
    const squad=teamPlayers[side].filter(p=>!p.userData.isKeeper);
    const preferred=squad.filter(p=>/ST|CF|LW|RW|AM|CM|LM|RM/i.test(p.userData.position));
    const pool=preferred.length?preferred:squad;
    const step=Math.floor(phase/3.15)%Math.max(1,pool.length);
    return pool[step]||squad[0]||null;
  };
  const dampVector=(object,target,lambda,dt)=>{object.position.x=THREE.MathUtils.damp(object.position.x,target.x,lambda,dt);object.position.z=THREE.MathUtils.damp(object.position.z,target.z,lambda,dt);};
  let lastBallPosition=new THREE.Vector3(0,.4,0);
  function animate(time){
    if(!stage.isConnected){dispose();return;}
    const dt=lastTime?Math.min(.04,(time-lastTime)/1000):0;lastTime=time;
    if(!paused)elapsed+=dt;
    const cycle=elapsed%26,phase=cycle%13,possessionSide=cycle<13?"home":"away",defendingSide=possessionSide==="home"?"away":"home";
    const attackSign=possessionSide==="home"?1:-1;
    const carrier=chooseCarrier(possessionSide,phase);
    const squad=teamPlayers[possessionSide].filter(p=>!p.userData.isKeeper);
    const carrierIndex=Math.max(0,squad.indexOf(carrier));
    const receiver=squad[(carrierIndex+2+Math.floor(phase/3))%Math.max(1,squad.length)]||carrier;
    const passOne=phase>=3.2&&phase<4.5,passTwo=phase>=7.2&&phase<8.55;
    const shotPhase=phase>=10.1&&phase<12.25;
    const replayActive=highlightEvent&&elapsed-highlightStarted<5.5;
    const replayType=replayActive?String(highlightEvent.type||"").toLowerCase():"";
    const replaySide=replayActive?(highlightEvent.team===data.home?.name?"home":highlightEvent.team===data.away?.name?"away":possessionSide):null;
    const replaySign=replaySide==="home"?1:-1;
    let ballTarget=carrier?new THREE.Vector3(carrier.position.x+attackSign*1.25,.4,carrier.position.z+.4):new THREE.Vector3(0,.4,0);
    if(passOne&&carrier&&receiver)ballTarget.copy(receiver.position).add(new THREE.Vector3(0,.4,0));
    if(passTwo&&receiver)ballTarget.copy(receiver.position).add(new THREE.Vector3(0,.4,0));
    if(shotPhase)ballTarget.set(attackSign*51,.42,carrier?carrier.position.z*.18:0);
    if(replayActive&&["goal","chance"].includes(replayType))ballTarget.set(replaySign*51,.45,replayType==="goal"?0:(carrier?carrier.position.z*.2:0));
    if(replayActive&&["red","yellow","card"].some(t=>replayType.includes(t)))ballTarget.copy(carrier?carrier.position:new THREE.Vector3(0,.4,0));
    all.forEach((player,i)=>{
      const base=player.userData.basePosition;
      const side=player.userData.side,sign=side==="home"?1:-1;
      const attacking=side===possessionSide;
      let tx=base.x,tz=base.z;
      // Teams compress and advance together rather than jittering around their starting spots.
      if(attacking){
        const progress=phase<3.2?.22:phase<7.2?.46:phase<10.1?.72:.92;
        tx=base.x+sign*(progress*18);
        tz=base.z+Math.sin(elapsed*.7+player.userData.runPhase)*2.2;
        if(/ST|CF|LW|RW|AM/i.test(player.userData.position)){tx+=sign*(phase>6?8:3);tz+=Math.sin(elapsed*.95+i)*4.5;}
        if(/CM|DM|LM|RM/i.test(player.userData.position)){tx+=sign*(phase>3?6:0);tz+=Math.sin(elapsed*.6+i)*3.2;}
        if(player===carrier){tx+=sign*(phase<3.2?5:phase<7.2?12:phase<10.1?20:24);tz+=Math.sin(elapsed*1.1)*2.5;}
        if(passOne&&player===carrier){tx-=sign*2;tz+=2;}
        if(passOne&&player===receiver){tx+=sign*6;tz-=3;}
        if(passTwo&&player===receiver){tx+=sign*10;tz+=Math.sin(elapsed)*3;}
        if(shotPhase&&/ST|CF|LW|RW/i.test(player.userData.position)){tx=sign*39;tz*=.45;}
      }else{
        const ballX=carrier?carrier.position.x:0,ballZ=carrier?carrier.position.z:0;
        tx=base.x+(ballX-base.x)*.20;
        tz=base.z+(ballZ-base.z)*.16;
        if(/CB|LB|RB|LWB|RWB/i.test(player.userData.position)){tx=base.x-sign*3;tz=base.z*.84;}
        if(i===0){tx=base.x-sign*1.5;}
        const distance=Math.hypot(tx-(carrier?carrier.position.x:0),tz-(carrier?carrier.position.z:0));
        if(distance<25&&!player.userData.isKeeper){tx+=(carrier?carrier.position.x-tx:0)*.17;tz+=(carrier?carrier.position.z-tz:0)*.17;}
      }
      if(player.userData.isKeeper){tx=sign*(47-(shotPhase&&side===defendingSide?2:0));tz=clamp((carrier?carrier.position.z:0)*.22,-3.5,3.5);}
      if(replayActive&&replayType==="goal"&&side===replaySide&&!player.userData.isKeeper){
        tx=replaySign*(38+(i%3)*2);tz=((i%5)-2)*2.2;
      }
      if(replayActive&&replayType==="goal"&&side!==replaySide&&player.userData.isKeeper){
        tx=replaySign===1? -47:47;tz=0;
      }
      tx=clamp(tx,-50,50);tz=clamp(tz,-31,31);
      const target=new THREE.Vector3(tx,0,tz);
      const distance=player.position.distanceTo(target);
      const movementRate=attacking?2.5:2.0;
      dampVector(player,target,movementRate,dt||.016);
      const moving=distance>.9&&!paused;
      const runSpeed=moving?(distance>7?1:0.68):.16;
      const legSwing=moving?Math.sin(elapsed*(distance>7?10.5:6.4)+player.userData.runPhase)*.72:Math.sin(elapsed*1.8+i)*.04;
      const limbs=player.userData.limbs||[];
      limbs.forEach((limb,j)=>{
        if(limb.userData.kind==="leg")limb.rotation.x=legSwing*(j%2===0?1:-1);
        else if(limb.userData.kind==="arm")limb.rotation.x=-legSwing*(j%2===0?-.45:.45);
      });
      player.position.y=moving?Math.abs(Math.sin(elapsed*(distance>7?10.5:6.4)+player.userData.runPhase))*.12:0;
      if(moving)player.rotation.y=THREE.MathUtils.damp(player.rotation.y,Math.atan2((target.z-player.position.z),(target.x-player.position.x)),3,dt||.016);
      // Pressing defender accelerates toward the carrier and attempts a tackle.
      if(side===defendingSide&&!player.userData.isKeeper&&carrier){
        const pressDistance=player.position.distanceTo(carrier.position);
        if(pressDistance<7&&pressDistance>1.2){player.rotation.y=THREE.MathUtils.damp(player.rotation.y,Math.atan2(carrier.position.z-player.position.z,carrier.position.x-player.position.x),8,dt||.016);}
      }
    });
    // Ball travels visibly to a teammate on passes, lifts on shots and follows the dribbler between actions.
    let ballFrom=carrier?new THREE.Vector3(carrier.position.x+attackSign*1.1,.4,carrier.position.z):new THREE.Vector3(0,.4,0);
    let target=ballTarget.clone();
    let flight=0;
    if(passOne||passTwo){
      const from=carrier?carrier.position:(new THREE.Vector3());
      const to=receiver?receiver.position:from;
      ballFrom.set(from.x,.4,from.z);target.set(to.x,.4,to.z);
      flight=passOne?clamp((phase-3.2)/1.3,0,1):clamp((phase-7.2)/1.35,0,1);
      target.x=ballFrom.x+(to.x-ballFrom.x)*flight;target.z=ballFrom.z+(to.z-ballFrom.z)*flight;
      target.y=.4+Math.sin(flight*Math.PI)*2.1;
      trail.visible=true;
    }else if(shotPhase||(replayActive&&["goal","chance"].includes(replayType))){
      const start=carrier?carrier.position:new THREE.Vector3(attackSign*20,0,0);
      const progress=shotPhase?clamp((phase-10.1)/2.15,0,1):clamp((elapsed-highlightStarted)/3.5,0,1);
      target.set(start.x+(attackSign*51-start.x)*progress,.4+Math.sin(progress*Math.PI)*5,start.z+(0-start.z)*progress);
      trail.visible=true;
      const keeper=teamPlayers[defendingSide].find(p=>p.userData.isKeeper);
      if(keeper){keeper.position.z=THREE.MathUtils.damp(keeper.position.z,progress>.3?(target.z>0?3.4:-3.4):0,progress>.3?4:1,dt||.016);keeper.rotation.z=progress>.3?Math.sign(target.z||1)*.8:0;}
    }else{
      target.copy(ballTarget);target.y=.4+Math.abs(Math.sin(elapsed*4))*.13;trail.visible=false;
    }
    ball.position.x=THREE.MathUtils.damp(ball.position.x,target.x,passOne||passTwo||shotPhase?5.5:4,dt||.016);
    ball.position.z=THREE.MathUtils.damp(ball.position.z,target.z,passOne||passTwo||shotPhase?5.5:4,dt||.016);
    ball.position.y=THREE.MathUtils.damp(ball.position.y,target.y,6,dt||.016);
    ball.rotation.x+=dt*7;ball.rotation.z+=dt*5;
    const bp=ball.position;
    for(let i=0;i<90;i++){const t=i/89;ballTrailPositions[i*3]=lastBallPosition.x+(bp.x-lastBallPosition.x)*t;ballTrailPositions[i*3+1]=Math.max(.1,lastBallPosition.y+(bp.y-lastBallPosition.y)*t);ballTrailPositions[i*3+2]=lastBallPosition.z+(bp.z-lastBallPosition.z)*t;}
    trailGeometry.attributes.position.needsUpdate=true;lastBallPosition.copy(bp);
    renderer.render(scene,camera);
    if(loading){loading.style.opacity="0";loading.style.pointerEvents="none";loading.setAttribute("aria-hidden","true");setTimeout(()=>{if(loading.isConnected)loading.remove();},180);}
  }
  function dispose(){renderer.setAnimationLoop(null);observer.disconnect();document.removeEventListener("click",onDocumentEvent);renderer.dispose();activeScenes.delete(dispose);}
  activeScenes.add(dispose);mounted.set(stage,dispose);resize();
  if(data.events&&data.events.length)setEvent(selectedEventIndex);
  else {const hudText=stage.querySelector(".matchday-3d-hud small");if(hudText)hudText.textContent="Live tactical movement · passes · runs · pressing";}
  renderer.setAnimationLoop(animate);
}
function scan(){
  document.querySelectorAll("[data-matchday-3d]").forEach(stage=>{if(!mounted.has(stage))initialize(stage);});
  for(const dispose of Array.from(activeScenes)){/* disposal occurs from animation loop when its mount is removed */}
}
const mutationObserver=new MutationObserver(scan);
function start(){scan();mutationObserver.observe(document.getElementById("view")||document.body,{childList:true,subtree:true});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();

}
