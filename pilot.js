(function () {
"use strict";
const $ = id => document.getElementById(id);
let authUser = null;
let career = null;
let activePage = "dashboard";
let busy = false;
const money = n => "GH₵ " + Math.round(Number(n || 0)).toLocaleString("en-GH");
const safe = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getClub = id => clubs.find(c => Number(c.id) === Number(id));
const getManager = () => authUser && authUser.user_metadata ? authUser.user_metadata : {};
const clubForPlayer = player => career.playerClubOverrides && career.playerClubOverrides[player.id] ? career.playerClubOverrides[player.id] : player.club;
function createFixtures() {
    const ids = clubs.map(c => c.id);
    const firstLeg = [];
    let rotation = ids.slice();
    for (let round = 1; round <= ids.length - 1; round++) {
        const matches = [];
        for (let i = 0; i < ids.length / 2; i++) {
            let home = rotation[i], away = rotation[ids.length - 1 - i];
            if ((round + i) % 2 === 0) { const temp = home; home = away; away = temp; }
            matches.push({id: "R" + round + "M" + (i + 1), round: round, homeClubId: home, awayClubId: away, played: false, result: null});
        }
        firstLeg.push.apply(firstLeg, matches);
        rotation = [rotation[0], rotation[rotation.length - 1]].concat(rotation.slice(1, rotation.length - 1));
    }
    const secondLeg = firstLeg.map((f, i) => ({id: "S" + f.id, round: f.round + (ids.length - 1), homeClubId: f.awayClubId, awayClubId: f.homeClubId, played: false, result: null}));
    return firstLeg.concat(secondLeg);
}
function buildTable() {
    const table = clubs.map(c => ({clubId:c.id,club:c.name,played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,points:0}));
    career.fixtures.filter(f => f.played && f.result).forEach(f => {
        const result=f.result, home=table.find(t=>t.clubId===f.homeClubId), away=table.find(t=>t.clubId===f.awayClubId);
        if(!home||!away)return;
        home.played++;away.played++;home.goalsFor+=result.homeGoals;home.goalsAgainst+=result.awayGoals;away.goalsFor+=result.awayGoals;away.goalsAgainst+=result.homeGoals;
        if(result.homeGoals>result.awayGoals){home.wins++;home.points+=3;away.losses++}
        else if(result.awayGoals>result.homeGoals){away.wins++;away.points+=3;home.losses++}
        else{home.draws++;away.draws++;home.points++;away.points++}
    });
    return table.sort((a,b)=>b.points-a.points||((b.goalsFor-b.goalsAgainst)-(a.goalsFor-a.goalsAgainst))||b.goalsFor-a.goalsFor);
}
function initCareer() {
    const meta=getManager(), selected=getClub(meta.club_id);
    if (!selected) { location.replace("./club-selection.html"); return false; }
    career=meta.ginga_career || {};
    if (Number(career.clubId)!==Number(selected.id)) {
        career={version:2,clubId:selected.id,season:1,currentRound:1,fixtures:null,playerClubOverrides:{},startingXI:[],playerStates:{},contracts:{},youthPlayers:[],balance:selected.finances.balance,transferBudget:selected.finances.transferBudget,tactics:{...selected.tactics},lastResult:null,news:[],boardConfidence:70};
    }
    if(!Array.isArray(career.fixtures)||career.fixtures.length !== clubs.length * (clubs.length - 1)) career.fixtures=createFixtures();
    if(!career.playerClubOverrides)career.playerClubOverrides={};
    if(!career.startingXI)career.startingXI=[];
    if(!career.playerStates)career.playerStates={};
    if(!career.contracts)career.contracts={};
    if(!Array.isArray(career.youthPlayers))career.youthPlayers=[];
    if(!career.boardConfidence)career.boardConfidence=70;
    career.youthPlayers.forEach(y=>{if(!players.some(p=>Number(p.id)===Number(y.id)))players.push({...y})});
    if(!career.tactics)career.tactics={...selected.tactics};
    Object.assign(selected.tactics,career.tactics);
    players.forEach(p=>{
        if(career.playerClubOverrides[p.id])p.club=career.playerClubOverrides[p.id];
        const state=career.playerStates[p.id];
        if(state&&clubForPlayer(p)===selected.name){["fitness","morale","form","injuryWeeks","age","appearances","goals"].forEach(k=>{if(state[k]!==undefined)p[k]=state[k]});if(state.attributes)p.attributes={...state.attributes}}
    });
    const ownSquad=players.filter(p=>clubForPlayer(p)===selected.name);
    ownSquad.forEach(p=>{if(!career.contracts[p.id])career.contracts[p.id]={wage:estimateWage(p),years:2}});
    if(!Array.isArray(career.startingXI)||career.startingXI.length!==11||career.startingXI.some(id=>!ownSquad.some(p=>Number(p.id)===Number(id)&&Number(p.injuryWeeks||0)<=0)))career.startingXI=bestStartingXI(selected).map(p=>p.id);
    const playedRounds=career.fixtures.filter(f=>f.played).map(f=>f.round);
    const firstUnplayed=career.fixtures.find(f=>!f.played);
    career.currentRound=firstUnplayed?firstUnplayed.round:(clubs.length * 2 - 1);
    if(!career.news)career.news=[];
    return true;
}
async function saveCareer(message) {
    if(!authUser)return;
    const meta={...(authUser.user_metadata||{}),club_id:career.clubId,club_name:getClub(career.clubId).name,ginga_career:career};
    const {data,error}=await supabaseClient.auth.updateUser({data:meta});
    if(error)throw error;
    authUser=data.user||authUser;
    if(message)showToast(message);
}
function showToast(message,isError) {
    const el=$("toast");if(!el)return;
    el.textContent=message;el.className="toast visible"+(isError?" error":"");
    window.clearTimeout(showToast.timer);showToast.timer=window.setTimeout(()=>el.className="toast",3500);
}
function shell() {
    const meta=getManager(), club=getClub(career.clubId);
    $("managerLabel").textContent=meta.manager_name||"Manager";
    $("clubLabel").textContent=club.name;
    $("seasonLabel").textContent="SEASON "+career.season;
    $("view").innerHTML=renderPage(activePage);
    document.querySelectorAll("[data-action]").forEach(el=>el.addEventListener("click",handleAction));
    document.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",()=>{activePage=el.dataset.page;document.querySelectorAll(".sidebar .nav-button").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===activePage));shell()}));
    document.querySelectorAll("[data-tactic]").forEach(el=>el.addEventListener("change",handleTacticChange));
    document.querySelectorAll("[data-lineup-player]").forEach(el=>el.addEventListener("change",async()=>{
        const id=Number(el.dataset.lineupPlayer),next=new Set(career.startingXI||[]);
        if(el.checked&&next.size>=11){el.checked=false;showToast("Choose no more than 11 starting players.",true);return}
        if(el.checked)next.add(id);else next.delete(id);career.startingXI=Array.from(next);
        try{await saveCareer("Starting XI saved.");shell()}catch(e){showToast("Could not save your lineup: "+e.message,true)}
    }));
    const next=$("playRoundButton");if(next)next.addEventListener("click",career.fixtures.some(f=>!f.played)?playRound:startNextSeason);
    const choose=$("changeClubButton");if(choose)choose.addEventListener("click",async()=>{if(confirm("Starting a different club will begin a new career for that club. Continue?")){location.href="./club-selection.html"}});
    document.querySelectorAll("[data-signout]").forEach(el=>el.addEventListener("click",signOut));
}
function playerOverall(player){
    const a=player.attributes||{},pos=String(player.position||"").toUpperCase();
    if(pos==="GK")return Math.round(Number(a.goalkeeping||40)*0.5+Number(a.composure||50)*0.15+Number(a.passing||45)*0.1+Number(a.physical||50)*0.1+Number(a.defending||30)*0.15);
    const keys=["CB","LB","RB"].includes(pos)?["defending","physical","pace","passing","stamina","composure"]:["CM","DM","AM","LM","RM"].includes(pos)?["passing","stamina","dribbling","composure","defending","pace"]:["shooting","pace","dribbling","composure","passing","physical"];
    return Math.round(keys.reduce((sum,k)=>sum+Number(a[k]||45),0)/keys.length);
}
function estimateWage(player){return Math.max(250,Math.round((playerOverall(player)*17+Math.max(0,Number(player.age||22)-22)*12)/50)*50)}
function bestStartingXI(club){
    const squad=players.filter(p=>clubForPlayer(p)===club.name&&Number(p.injuryWeeks||0)<=0).slice().sort((a,b)=>playerOverall(b)-playerOverall(a)),selected=[];
    const take=group=>{const p=squad.find(x=>!selected.some(y=>y.id===x.id)&&(group==="GK"?x.position==="GK":group==="DEF"?["CB","LB","RB"].includes(x.position):group==="MID"?["CM","DM","AM","LM","RM"].includes(x.position):["ST","CF","LW","RW"].includes(x.position)));if(p)selected.push(p)};
    take("GK");for(let i=0;i<4;i++)take("DEF");for(let i=0;i<3;i++)take("MID");for(let i=0;i<3;i++)take("ATT");for(const p of squad)if(selected.length<11&&!selected.some(x=>x.id===p.id))selected.push(p);return selected.slice(0,11);
}
function persistPlayerStates(club){players.filter(p=>clubForPlayer(p)===club.name).forEach(p=>{career.playerStates[p.id]={fitness:p.fitness,morale:p.morale,form:p.form,injuryWeeks:Number(p.injuryWeeks||0),age:p.age,appearances:Number(p.appearances||0),goals:Number(p.goals||0),attributes:{...(p.attributes||{})}}})}
function updatePlayerCondition(match){
    if(!match)return;const club=getClub(career.clubId),result=match.result,ids=new Set((club.id===match.home.id?result.homeLineup:result.awayLineup)||[]);
    const won=(club.id===match.home.id&&result.homeGoals>result.awayGoals)||(club.id===match.away.id&&result.awayGoals>result.homeGoals),drew=result.homeGoals===result.awayGoals;
    players.filter(p=>clubForPlayer(p)===club.name).forEach(p=>{
        if(Number(p.injuryWeeks||0)>0){p.injuryWeeks=Math.max(0,Number(p.injuryWeeks)-1);p.fitness=Math.min(100,Number(p.fitness||0)+3);return}
        if(ids.has(p.id)){p.fitness=Math.max(25,Number(p.fitness||90)-(6+Math.floor(Math.random()*6)));p.appearances=Number(p.appearances||0)+1;p.morale=Math.max(20,Math.min(100,Number(p.morale||50)+(won?4:drew?1:-4)));p.form=Math.max(20,Math.min(100,Number(p.form||50)+(won?3:drew?1:-3)));
            p.goals=Number(p.goals||0)+(result.events||[]).filter(e=>e.type==="goal"&&Number(e.playerId)===Number(p.id)).length;
            if(Math.random()<0.018){p.injuryWeeks=1+Math.floor(Math.random()*4);p.fitness=Math.max(20,p.fitness-12);career.news.push({date:"MATCHDAY "+career.currentRound,title:"Injury concern: "+p.name,body:p.name+" has picked up an injury and is expected to miss "+p.injuryWeeks+" matchday(s)."})}
        }else{p.fitness=Math.min(100,Number(p.fitness||75)+5);p.morale=Math.max(20,Math.min(100,Number(p.morale||50)+(won?1:0)))}
    });
    persistPlayerStates(club);if(career.startingXI.some(id=>{const p=players.find(x=>Number(x.id)===Number(id));return !p||Number(p.injuryWeeks||0)>0}))career.startingXI=bestStartingXI(club).map(p=>p.id);
}
function renderPage(page) {
    const club=getClub(career.clubId), manager=getManager(), table=buildTable(), standing=table.find(t=>t.clubId===club.id), position=table.indexOf(standing)+1;
    const upcoming=career.fixtures.find(f=>!f.played);
    const recent=career.fixtures.filter(f=>f.played).slice(-5).reverse();
    const upcomingForClub=career.fixtures.find(f=>!f.played&&(f.homeClubId===club.id||f.awayClubId===club.id));
    const currentPlayers=players.filter(p=>clubForPlayer(p)===club.name);
    const formRating=player=>Math.round(Object.values(player.attributes).reduce((a,b)=>a+b,0)/Object.values(player.attributes).length);
    if(page==="dashboard")return '<div class="hero-panel"><div class="hero-copy"><p class="hero-kicker">THE TOUCHLINE IS YOURS</p><h1>Welcome back, '+safe(manager.manager_name||"Gaffer")+'.</h1><p>Build your team, make your decisions, and turn matchday into your advantage.</p><div class="hero-actions"><button class="game-btn" id="playRoundButton">'+(upcoming?'Simulate Matchday '+upcoming.round:'Start next season')+' <span>→</span></button><button class="game-btn secondary" data-page="squad">View squad</button></div></div><div class="hero-emblem"><div class="big-crest">'+safe(club.name.split(/\s+/).map(w=>w[0]).join("").slice(0,3))+'</div><span>'+safe(club.city.toUpperCase())+' · '+safe((club.country||'Ghana').toUpperCase())+'</span></div></div><div class="metric-grid"><div class="metric-card"><span>LEAGUE POSITION</span><strong>#'+position+'</strong><small>'+standing.points+' points · '+standing.played+' played</small></div><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Available club funds</small></div><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Recruitment funds</small></div><div class="metric-card"><span>SQUAD SIZE</span><strong>'+currentPlayers.length+'</strong><small>Registered players</small></div></div><div class="content-grid"><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">MATCH CENTRE</p><h2>Next fixture</h2></div><span class="live-pill">SEASON '+career.season+'</span></div>'+(upcomingForClub?fixtureMarkup(upcomingForClub,club.id):'<p class="empty-state">Your club has completed its scheduled fixtures.</p>')+'<div class="panel-divider"></div><div class="panel-heading"><div><p class="panel-eyebrow">LATEST ACTION</p><h2>Recent results</h2></div><button class="text-btn" data-page="fixtures">All fixtures ↗</button></div>'+ (recent.length?recent.map(f=>fixtureMarkup(f,club.id)).join(""):'<p class="empty-state">The opening whistle is waiting. Simulate the first matchday to see results here.</p>')+'</section><section class="game-panel table-panel"><div class="panel-heading"><div><p class="panel-eyebrow">THE RACE</p><h2>League table</h2></div><button class="text-btn" data-page="league">Full table ↗</button></div>'+tableMarkup(table,club.id,true)+'</section></div>';
    if(page==="squad"){
        const starting=new Set(career.startingXI||[]);
        return '<div class="view-intro"><p class="panel-eyebrow">FIRST TEAM</p><h1>Squad room</h1><p>Choose your starting eleven. Fitness, morale and injuries affect performance.</p></div><section class="game-panel"><div class="panel-heading"><div><h2>'+safe(club.name)+' · Starting XI</h2><p class="subtle">'+starting.size+' of 11 selected · '+currentPlayers.filter(p=>Number(p.injuryWeeks||0)>0).length+' unavailable through injury</p></div><button class="game-btn secondary" data-action="auto-lineup">Auto-pick best XI</button></div><p class="subtle">Tick exactly 11 available players. The match engine uses this selection for your club.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>XI</th><th>PLAYER</th><th>POS</th><th>AGE</th><th>OVR</th><th>FIT</th><th>FORM</th><th>MORALE</th><th>STATUS</th><th></th></tr></thead><tbody>'+(currentPlayers.length?currentPlayers.map(p=>'<tr><td><input type="checkbox" data-lineup-player="'+p.id+'" '+(starting.has(p.id)?'checked':'')+' '+(Number(p.injuryWeeks||0)>0?'disabled':'')+' aria-label="Select '+safe(p.name)+' for starting eleven"></td><td><strong>'+safe(p.name)+'</strong><small class="cell-sub">'+safe(p.club)+'</small></td><td><span class="position-chip">'+safe(p.position)+'</span></td><td>'+p.age+'</td><td><strong>'+playerOverall(p)+'</strong></td><td>'+Math.round(p.fitness||0)+'</td><td>'+Math.round(p.form||0)+'</td><td>'+Math.round(p.morale||0)+'</td><td>'+(Number(p.injuryWeeks||0)>0?'<span class="fixture-state scheduled">Injured · '+p.injuryWeeks+' MD</span>':'<span class="fixture-state played">Available</span>')+'</td><td><button class="small-btn" data-action="sell-player" data-player="'+p.id+'" '+(currentPlayers.length<=11?'disabled':'')+'>Sell</button></td></tr>').join(""):'<tr><td colspan="10">No players are registered to this club.</td></tr>')+'</tbody></table></div></section><section class="game-panel"><div class="panel-heading"><div><h2>Squad contracts</h2><p class="subtle">Estimated weekly wages against the club allowance.</p></div></div><div class="finance-line"><span>Estimated weekly squad wages</span><strong>'+money(currentPlayers.reduce((sum,p)=>sum+Number((career.contracts[p.id]||{}).wage||estimateWage(p)),0))+'</strong></div><div class="finance-line"><span>Weekly wage budget</span><strong>'+money(club.finances.wageBudget)+'</strong></div></section>';
    }
    if(page==="tactics")return '<div class="view-intro"><p class="panel-eyebrow">MATCH PREPARATION</p><h1>Tactics board</h1><p>Choose the approach your team will take into the next match.</p></div><section class="game-panel"><div class="tactics-layout"><div class="pitch-visual"><div class="pitch-half"></div><div class="pitch-circle"></div><div class="pitch-box top"></div><div class="pitch-box bottom"></div><span class="pitch-label">GINGA FM · TOUCHLINE</span></div><div class="tactics-form"><label>Formation<select data-tactic="formation">'+options(["4-3-3","4-4-2","4-2-3-1","5-3-2","5-4-1"],career.tactics.formation)+'</select></label><label>Team mentality<select data-tactic="mentality">'+options(["Balanced","Attacking","Defensive"],career.tactics.mentality)+'</select></label><label>Tempo<select data-tactic="tempo">'+options(["Slow","Normal","Fast"],career.tactics.tempo)+'</select></label><label>Pressing<select data-tactic="pressing">'+options(["Low","Medium","High"],career.tactics.pressing)+'</select></label><label>Defensive line<select data-tactic="defensiveLine">'+options(["Deep","Normal","High"],career.tactics.defensiveLine)+'</select></label><p class="subtle">Changes are saved to your manager career and affect the club match calculations.</p></div></div></section>';
    if(page==="transfers"){
        const market=players.filter(p=>clubForPlayer(p)!==club.name);
        return '<div class="view-intro"><p class="panel-eyebrow">RECRUITMENT</p><h1>Transfer market</h1><p>Strengthen your team with players already registered in the Ginga FM world.</p></div><div class="metric-grid compact"><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Available to spend</small></div><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Current funds</small></div></div><section class="game-panel"><div class="panel-heading"><div><h2>Available players</h2><p class="subtle">Fees are estimated from player attributes for this pilot.</p></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>PLAYER</th><th>POS</th><th>AGE</th><th>OVR</th><th>CURRENT CLUB</th><th>EST. FEE</th><th></th></tr></thead><tbody>'+market.map(p=>{const fee=transferFee(p);return '<tr><td><strong>'+safe(p.name)+'</strong></td><td>'+safe(p.position)+'</td><td>'+p.age+'</td><td>'+formRating(p)+'</td><td>'+safe(clubForPlayer(p))+'</td><td>'+money(fee)+'</td><td><button class="small-btn" data-action="buy-player" data-player="'+p.id+'" '+(fee>career.transferBudget?'disabled':'')+'>Sign</button></td></tr>'}).join("")+'</tbody></table></div></section>';
    }
    if(page==="fixtures")return '<div class="view-intro"><p class="panel-eyebrow">SEASON '+career.season+'</p><h1>Fixtures & results</h1><p>Every club plays home and away across '+(clubs.length*2-2)+' matchdays.</p></div><section class="game-panel"><div class="panel-heading"><div><h2>Matchday '+Math.min(career.currentRound,clubs.length*2-2)+'</h2><p class="subtle">Simulate a matchday to play all '+(clubs.length/2)+' fixtures and update the table.</p></div><button class="game-btn" id="playRoundButton">Play matchday / next season →</button></div><div class="fixture-list">'+career.fixtures.map(f=>fixtureMarkup(f,club.id)).join("")+'</div></section>';
    if(page==="league")return '<div class="view-intro"><p class="panel-eyebrow">GINGA INTERNATIONAL LEAGUE</p><h1>League table</h1><p>Points, goal difference, and goals scored determine the standings.</p></div><section class="game-panel"><div class="panel-heading"><div><h2>Season '+career.season+' standings</h2><p class="subtle">'+career.fixtures.filter(f=>f.played).length+' of '+career.fixtures.length+' fixtures completed</p></div></div>'+tableMarkup(table,club.id,false)+'</section>';
    if(page==="finances")return '<div class="view-intro"><p class="panel-eyebrow">CLUB ACCOUNTING</p><h1>Finances</h1><p>Track the money available to run and improve your club.</p></div><div class="metric-grid"><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Current available funds</small></div><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Player recruitment allocation</small></div><div class="metric-card"><span>WAGE BUDGET</span><strong>'+money(club.finances.wageBudget)+'</strong><small>Original weekly wage allowance</small></div></div><section class="game-panel"><div class="panel-heading"><div><h2>Season ledger</h2><p class="subtle">Matchday income and costs are recorded as you play.</p></div></div><div class="finance-line"><span>Starting balance</span><strong>'+money(club.finances.balance)+'</strong></div><div class="finance-line"><span>Matchday income / bonuses</span><strong class="positive">'+money(career.totalIncome||0)+'</strong></div><div class="finance-line"><span>Matchday operating costs</span><strong class="negative">−'+money(career.totalCosts||0)+'</strong></div><div class="finance-line total"><span>Current balance</span><strong>'+money(career.balance)+'</strong></div></section>';
    if(page==="board")return '<div class="view-intro"><p class="panel-eyebrow">CLUB LEADERSHIP</p><h1>Board expectations</h1><p>Results and financial discipline affect the board\'s confidence in your management.</p></div><section class="game-panel"><div class="metric-card"><span>BOARD CONFIDENCE</span><strong>'+Math.round(career.boardConfidence||70)+'%</strong><small>'+(career.boardConfidence>=75?'The board is pleased with progress.':career.boardConfidence>=45?'The board expects improvement.':'Pressure is increasing after recent results.')+'</small></div><div class="objective-card"><span class="objective-icon">🏆</span><div><strong>League performance</strong><p>Finish in the top half of the league.</p><small>Current position: '+position+' of '+clubs.length+'</small></div></div><div class="objective-card"><span class="objective-icon">₵</span><div><strong>Financial control</strong><p>Keep the club balance above zero while managing recruitment.</p><small>Current balance: '+money(career.balance)+'</small></div></div><div class="objective-card"><span class="objective-icon">⚽</span><div><strong>Build a competitive team</strong><p>Develop your squad and make purposeful recruitment decisions.</p><small>Squad size: '+currentPlayers.length+' registered players</small></div></div></section>';
    if(page==="staff")return '<div class="view-intro"><p class="panel-eyebrow">TECHNICAL AREA</p><h1>Manager profile</h1><p>Your coaching identity travels with you throughout your career.</p></div><section class="game-panel"><div class="profile-top"><div class="profile-avatar">'+safe((manager.manager_name||"M").split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase())+'</div><div><h2>'+safe(manager.manager_name||"Manager")+'</h2><p class="subtle">'+safe(manager.nationality||"Nationality not set")+' · '+safe(manager.coaching_licence||"Licence not set")+'</p><span class="live-pill">'+safe(manager.management_style||"Balanced")+' manager</span></div></div><div class="skill-grid">'+[["Tactical knowledge",manager.tactical_knowledge],["Man management",manager.man_management],["Youth development",manager.youth_development],["Motivational ability",manager.motivational_ability],["Discipline",manager.discipline],["Recruitment & scouting",manager.recruitment_scouting]].map(a=>'<div class="skill"><div><span>'+safe(a[0])+'</span><strong>'+Number(a[1]||50)+'</strong></div><div class="skill-track"><i style="width:'+Math.max(1,Math.min(100,Number(a[1]||50)))+'%"></i></div></div>').join("")+'</div><button class="game-btn secondary" data-action="edit-profile">Edit manager profile</button></section>';
    if(page==="news")return '<div class="view-intro"><p class="panel-eyebrow">AROUND THE CLUB</p><h1>Club news</h1><p>Updates from your season so far.</p></div><section class="game-panel">'+(career.news.length?career.news.slice().reverse().map(n=>'<article class="news-item"><span class="news-dot"></span><div><small>'+safe(n.date||"SEASON "+career.season)+'</small><h3>'+safe(n.title)+'</h3><p>'+safe(n.body)+'</p></div></article>').join(""):'<article class="news-item"><span class="news-dot"></span><div><small>SEASON '+career.season+'</small><h3>A new chapter begins</h3><p>'+safe(club.name)+' have appointed '+safe(manager.manager_name||"their new manager")+'. Supporters are ready for the opening matchday.</p></div></article>')+'</section>';
    return '<section class="game-panel"><h2>Ginga FM</h2><p>Choose a section from the menu to continue.</p></section>';
}
function options(values,current){return values.map(v=>'<option value="'+safe(v)+'" '+(v===current?'selected':'')+'>'+safe(v)+'</option>').join("")}
function fixtureMarkup(f,selectedId){
    const home=getClub(f.homeClubId),away=getClub(f.awayClubId),r=f.result;
    const selected=Number(f.homeClubId)===Number(selectedId)||Number(f.awayClubId)===Number(selectedId);
    return '<div class="fixture-row '+(selected?'your-fixture':'')+'"><span class="round-tag">MD '+f.round+'</span><div class="fixture-team home"><span class="mini-crest">'+safe(home.name.split(/\s+/).map(w=>w[0]).join("").slice(0,2))+'</span><strong>'+safe(home.name)+'</strong></div><div class="fixture-score">'+(f.played&&r?r.homeGoals+' <i>–</i> '+r.awayGoals:'<span>vs</span>')+'</div><div class="fixture-team away"><strong>'+safe(away.name)+'</strong><span class="mini-crest">'+safe(away.name.split(/\s+/).map(w=>w[0]).join("").slice(0,2))+'</span></div><span class="fixture-state '+(f.played?'played':'scheduled')+'">'+(f.played?'FT':'Scheduled')+'</span></div>';
}
function tableMarkup(table,selectedId,compact){
    return '<div class="table-scroll"><table class="data-table league-table"><thead><tr><th>#</th><th>CLUB</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>'+table.map((t,i)=>'<tr class="'+(t.clubId===selectedId?'your-row':'')+'"><td>'+(i+1)+'</td><td><span class="table-club"><span class="mini-crest">'+safe(t.club.split(/\s+/).map(w=>w[0]).join("").slice(0,2))+'</span><strong>'+safe(t.club)+'</strong></span></td><td>'+t.played+'</td><td>'+t.wins+'</td><td>'+t.draws+'</td><td>'+t.losses+'</td><td>'+(t.goalsFor-t.goalsAgainst>0?"+":"")+(t.goalsFor-t.goalsAgainst)+'</td><td><strong>'+t.points+'</strong></td></tr>').join("")+'</tbody></table></div>';
}
function transferFee(player){const overall=Math.round(Object.values(player.attributes).reduce((a,b)=>a+b,0)/Object.values(player.attributes).length);return Math.round((overall*1100+player.age*250)/500)*500}
async function handleTacticChange(event){
    const key=event.target.dataset.tactic;if(!key)return;
    career.tactics[key]=event.target.value;Object.assign(getClub(career.clubId).tactics,career.tactics);
    try{await saveCareer("Tactics saved.");}catch(e){showToast("Could not save tactics: "+e.message,true)}
}
async function handleAction(event){
    const action=event.currentTarget.dataset.action;
    if(action==="edit-profile"){location.href="./manager.html";return}
    if(action==="auto-lineup"){career.startingXI=bestStartingXI(getClub(career.clubId)).map(p=>p.id);try{await saveCareer("Best available starting XI selected.");shell()}catch(e){showToast("Could not save lineup: "+e.message,true)}return}
    if(action==="sell-player"){
        const id=Number(event.currentTarget.dataset.player),player=players.find(p=>Number(p.id)===id),club=getClub(career.clubId),squad=players.filter(p=>clubForPlayer(p)===club.name);
        if(!player||squad.length<=11){showToast("Keep at least 11 registered players.",true);return}
        const fee=Math.round(transferFee(player)*0.7);
        if(!confirm("Sell "+player.name+" for "+money(fee)+"? This removes the player from your squad."))return;
        const other=clubs.filter(c=>c.id!==club.id).sort((a,b)=>players.filter(p=>p.club===a.name).length-players.filter(p=>p.club===b.name).length)[0];
        if(!other){showToast("No destination club is available.",true);return}
        career.playerClubOverrides[id]=other.name;player.club=other.name;career.balance+=fee;career.transferBudget+=Math.round(fee*0.25);career.contracts[id]={wage:0,years:0};career.startingXI=(career.startingXI||[]).filter(pid=>Number(pid)!==id);
        career.news.push({date:"MATCHDAY "+career.currentRound,title:"Player sold",body:player.name+" has been sold to "+other.name+" for "+money(fee)+"."});
        try{persistPlayerStates(club);await saveCareer(player.name+" sold.");shell()}catch(e){showToast("Sale could not be saved: "+e.message,true)}return
    }
    if(action==="buy-player"){
        const id=Number(event.currentTarget.dataset.player),player=players.find(p=>p.id===id);if(!player)return;
        const fee=transferFee(player),club=getClub(career.clubId),wage=estimateWage(player),squad=players.filter(p=>clubForPlayer(p)===club.name);
        const weeklyWages=squad.reduce((sum,p)=>sum+Number((career.contracts[p.id]||{}).wage||estimateWage(p)),0);
        if(fee>career.transferBudget||fee>career.balance){showToast("This transfer exceeds your available funds.",true);return}
        if(weeklyWages+wage>club.finances.wageBudget){showToast("The player's estimated wage would exceed your weekly wage budget.",true);return}
        if(squad.length>=30){showToast("Your squad has reached the 30-player limit. Sell a player first.",true);return}
        if(!confirm("Sign "+player.name+" for "+money(fee)+" and an estimated weekly wage of "+money(wage)+"?"))return;
        career.playerClubOverrides[id]=club.name;player.club=club.name;career.contracts[id]={wage,years:3};career.balance-=fee;career.transferBudget-=fee;
        career.news.push({date:"MATCHDAY "+career.currentRound,title:"New signing confirmed",body:player.name+" has joined "+getClub(career.clubId).name+" for "+money(fee)+"."});
        try{await saveCareer(player.name+" signed successfully.");shell()}catch(e){showToast("Signing could not be saved: "+e.message,true)}
    }
}
async function playRound(){
    if(busy)return;
    const round=career.fixtures.find(f=>!f.played)?.round;
    if(!round){showToast("The season is complete.");return}
    const fixtures=career.fixtures.filter(f=>f.round===round&&!f.played);
    if(!fixtures.length){showToast("No fixtures found for this matchday.",true);return}
    busy=true;const button=$("playRoundButton");if(button){button.disabled=true;button.textContent="Simulating matchday…"}
    let selectedOutcome=null,roundGoals=0;
    fixtures.forEach(f=>{
        const home=getClub(f.homeClubId),away=getClub(f.awayClubId);
        const result=simulateMatch(home,away,{homeLineup:home.id===career.clubId?career.startingXI:undefined,awayLineup:away.id===career.clubId?career.startingXI:undefined});
        f.played=true;f.result={homeGoals:result.homeGoals,awayGoals:result.awayGoals,homeStrength:result.homeStrength,awayStrength:result.awayStrength,homeShots:result.homeShots,awayShots:result.awayShots,homePossession:result.homePossession,awayPossession:result.awayPossession};
        roundGoals+=result.homeGoals+result.awayGoals;
        if(home.id===career.clubId||away.id===career.clubId)selectedOutcome={fixture:f,home,away,result};
    });
    const club=getClub(career.clubId),match=selectedOutcome;
    const matchIncome=fixtures.reduce((total,f)=>total+(f.homeClubId===club.id?Math.round(5000+club.finances.balance*0.004):(f.awayClubId===club.id?2200:0)),0);
    const squadWages=players.filter(p=>clubForPlayer(p)===club.name).reduce((sum,p)=>sum+Number((career.contracts[p.id]||{}).wage||estimateWage(p)),0);
    const matchCost=Math.round(Math.max(club.finances.wageBudget*0.12,squadWages*0.7));
    let bonus=0;
    if(match){const score=match.fixture.result;if((match.home.id===club.id&&score.homeGoals>score.awayGoals)||(match.away.id===club.id&&score.awayGoals>score.homeGoals))bonus=5000;else if(score.homeGoals===score.awayGoals)bonus=2000}
    career.totalIncome=Number(career.totalIncome||0)+matchIncome+bonus;career.totalCosts=Number(career.totalCosts||0)+matchCost;
    career.balance=Number(career.balance||0)+matchIncome+bonus-matchCost;
    career.transferBudget=Math.max(0,Number(career.transferBudget||0)+Math.round((matchIncome+bonus-matchCost)*0.15));
    career.currentRound=round+1;
    if(match){
        const res=match.fixture.result,engineResult=match.result;
        updatePlayerCondition(match);
        const scorers=(engineResult.events||[]).filter(e=>e.type==="goal").map(e=>e.minute+"' "+e.player).slice(0,6);
        career.lastResult={homeTeam:match.home.name,awayTeam:match.away.name,homeGoals:res.homeGoals,awayGoals:res.awayGoals,round:round,homeShots:res.homeShots,awayShots:res.awayShots,homePossession:res.homePossession,awayPossession:res.awayPossession,events:(engineResult.events||[]).slice(0,30),scorers};
        const won=(match.home.id===club.id?res.homeGoals>res.awayGoals:res.awayGoals>res.homeGoals);
        career.boardConfidence=Math.max(0,Math.min(100,Number(career.boardConfidence||70)+(res.homeGoals===res.awayGoals?0:won?3:-4)));
        career.news.push({date:"MATCHDAY "+round,title:match.home.name+" "+res.homeGoals+"–"+res.awayGoals+" "+match.away.name,body:"Shots "+(res.homeShots||0)+"–"+(res.awayShots||0)+" · Possession "+(res.homePossession||50)+"%–"+(res.awayPossession||50)+"%. "+(scorers.length?"Goals: "+scorers.join(", ")+".":"No goals were scored.")});
    }
    if(!career.fixtures.some(f=>!f.played))career.news.push({date:"SEASON "+career.season,title:"Season complete",body:"All "+(clubs.length*(clubs.length-1))+" league fixtures have been played. The final table is ready."});
    busy=false;
    try{await saveCareer("Matchday "+round+" complete. Results and finances saved.");activePage="dashboard";shell()}catch(e){showToast("Results were played, but saving failed. Keep this page open and retry: "+e.message,true);shell()}
}
async function startNextSeason(){
    if(busy||career.fixtures.some(f=>!f.played))return;
    if(!confirm("Start a new season? Your current season summary will remain in club news."))return;
    const finalTable=buildTable(),finalStanding=finalTable.find(t=>t.clubId===career.clubId),finalPosition=finalTable.indexOf(finalStanding)+1,club=getClub(career.clubId);
    career.news.push({date:"SEASON "+career.season+" FINAL",title:"Season "+career.season+" completed",body:club.name+" finished "+finalPosition+" in the league with "+finalStanding.points+" points."});
    players.filter(p=>clubForPlayer(p)===club.name).forEach(p=>{
        p.age=Number(p.age||20)+1;
        if(p.age<=23){const key=["pace","shooting","passing","dribbling","defending","physical","stamina","composure"][Math.floor(Math.random()*8)];p.attributes[key]=Math.min(99,Number(p.attributes[key]||45)+1+Math.floor(Math.random()*2))}
        else if(p.age>=32)["pace","stamina","physical"].forEach(k=>p.attributes[k]=Math.max(20,Number(p.attributes[k]||50)-1));
        p.fitness=Math.min(100,Number(p.fitness||80)+15);p.morale=Math.max(25,Math.min(100,Number(p.morale||50)+2));p.injuryWeeks=0;
    });
    persistPlayerStates(club);
    const positions=["GK","CB","LB","RB","CM","DM","AM","LW","RW","ST"],first=["Kofi","Kwame","Daniel","Samuel","Michael","Abdul","Emmanuel","Isaac","Nana","Joseph","Bright","Kojo"],last=["Mensah","Boateng","Asare","Owusu","Addo","Tetteh","Osei","Antwi","Adu","Frimpong","Yeboah","Sarpong"];
    let nextId=Math.max(0,...players.map(p=>Number(p.id)||0))+1;
    for(let i=0;i<3;i++){
        const position=positions[Math.floor(Math.random()*positions.length)],attributes={};
        ["pace","shooting","passing","dribbling","defending","physical","stamina","composure"].forEach(k=>attributes[k]=40+Math.floor(Math.random()*26));
        if(position==="GK")attributes.goalkeeping=45+Math.floor(Math.random()*26);
        const youth={id:nextId++,name:first[Math.floor(Math.random()*first.length)]+" "+last[Math.floor(Math.random()*last.length)]+" "+(career.season+1),club:club.name,position,age:16+Math.floor(Math.random()*3),nationality:"Ghanaian",attributes,fitness:100,morale:70,form:60,injuryWeeks:0,appearances:0,goals:0};
        career.youthPlayers.push(youth);players.push({...youth});
    }
    career.season=Number(career.season||1)+1;career.fixtures=createFixtures();career.currentRound=1;career.lastResult=null;career.startingXI=bestStartingXI(club).map(p=>p.id);
    career.news.push({date:"SEASON "+career.season,title:"A new season begins",body:"The league table has reset. Three academy prospects have joined the club, and the squad has completed its seasonal development."});
    try{await saveCareer("Season "+career.season+" is ready.");activePage="dashboard";shell()}catch(e){showToast("Could not save the new season: "+e.message,true)}
}
async function signOut(){await supabaseClient.auth.signOut();location.replace("./login.html")}
async function init(){
    try{
        const {data,error}=await supabaseClient.auth.getUser();if(error)throw error;
        authUser=data.user;
        if(!authUser){location.replace("./login.html");return}
        if(!getManager().manager_name){location.replace("./manager.html");return}
        if(!getManager().club_id){location.replace("./club-selection.html");return}
        if(!initCareer())return;
        const status=$("worldStatus");if(status)status.textContent="Syncing career save…";
        document.body.classList.add("game-ready");
        shell();
        try{await saveCareer();if(status)status.textContent="Career save connected"}catch(e){console.warn("Initial career sync skipped:",e);if(status)status.textContent="Save needs attention";showToast("Your career loaded, but its first save failed: "+e.message,true)}
    }catch(e){console.error(e);showToast("Could not load your saved career. Please sign in again.",true)}
}
init();
})();