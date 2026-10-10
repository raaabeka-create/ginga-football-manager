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
    const secondLeg = firstLeg.map((f, i) => ({id: "S" + f.id, round: f.round + 9, homeClubId: f.awayClubId, awayClubId: f.homeClubId, played: false, result: null}));
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
        career={version:1,clubId:selected.id,season:1,currentRound:1,fixtures:null,playerClubOverrides:{},balance:selected.finances.balance,transferBudget:selected.finances.transferBudget,tactics:{...selected.tactics},lastResult:null,news:[]};
    }
    if(!Array.isArray(career.fixtures)||!career.fixtures.length)career.fixtures=createFixtures();
    if(!career.playerClubOverrides)career.playerClubOverrides={};
    if(!career.tactics)career.tactics={...selected.tactics};
    Object.assign(selected.tactics,career.tactics);
    players.forEach(p=>{if(career.playerClubOverrides[p.id])p.club=career.playerClubOverrides[p.id]});
    const playedRounds=career.fixtures.filter(f=>f.played).map(f=>f.round);
    const firstUnplayed=career.fixtures.find(f=>!f.played);
    career.currentRound=firstUnplayed?firstUnplayed.round:19;
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
    document.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",()=>{activePage=el.dataset.page;shell()}));
    document.querySelectorAll("[data-tactic]").forEach(el=>el.addEventListener("change",handleTacticChange));
    const next=$("playRoundButton");if(next)next.addEventListener("click",playRound);
    const choose=$("changeClubButton");if(choose)choose.addEventListener("click",async()=>{if(confirm("Starting a different club will begin a new career for that club. Continue?")){location.href="./club-selection.html"}});
    document.querySelectorAll("[data-signout]").forEach(el=>el.addEventListener("click",signOut));
}
function renderPage(page) {
    const club=getClub(career.clubId), manager=getManager(), table=buildTable(), standing=table.find(t=>t.clubId===club.id), position=table.indexOf(standing)+1;
    const upcoming=career.fixtures.find(f=>!f.played);
    const recent=career.fixtures.filter(f=>f.played).slice(-5).reverse();
    const upcomingForClub=career.fixtures.find(f=>!f.played&&(f.homeClubId===club.id||f.awayClubId===club.id));
    const currentPlayers=players.filter(p=>clubForPlayer(p)===club.name);
    const formRating=player=>Math.round(Object.values(player.attributes).reduce((a,b)=>a+b,0)/Object.values(player.attributes).length);
    if(page==="dashboard")return '<div class="hero-panel"><div class="hero-copy"><p class="hero-kicker">THE TOUCHLINE IS YOURS</p><h1>Welcome back, '+safe(manager.manager_name||"Gaffer")+'.</h1><p>Build your team, make your decisions, and turn matchday into your advantage.</p><div class="hero-actions"><button class="game-btn" id="playRoundButton" '+(!upcoming?'disabled':'')+'>'+(upcoming?'Simulate Matchday '+upcoming.round:'Season complete')+' <span>→</span></button><button class="game-btn secondary" data-page="squad">View squad</button></div></div><div class="hero-emblem"><div class="big-crest">'+safe(club.name.split(/\s+/).map(w=>w[0]).join("").slice(0,3))+'</div><span>'+safe(club.city.toUpperCase())+' · GHANA</span></div></div><div class="metric-grid"><div class="metric-card"><span>LEAGUE POSITION</span><strong>#'+position+'</strong><small>'+standing.points+' points · '+standing.played+' played</small></div><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Available club funds</small></div><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Recruitment funds</small></div><div class="metric-card"><span>SQUAD SIZE</span><strong>'+currentPlayers.length+'</strong><small>Registered players</small></div></div><div class="content-grid"><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">MATCH CENTRE</p><h2>Next fixture</h2></div><span class="live-pill">SEASON '+career.season+'</span></div>'+(upcomingForClub?fixtureMarkup(upcomingForClub,club.id):'<p class="empty-state">Your club has completed its scheduled fixtures.</p>')+'<div class="panel-divider"></div><div class="panel-heading"><div><p class="panel-eyebrow">LATEST ACTION</p><h2>Recent results</h2></div><button class="text-btn" data-page="fixtures">All fixtures ↗</button></div>'+ (recent.length?recent.map(f=>fixtureMarkup(f,club.id)).join(""):'<p class="empty-state">The opening whistle is waiting. Simulate the first matchday to see results here.</p>')+'</section><section class="game-panel table-panel"><div class="panel-heading"><div><p class="panel-eyebrow">THE RACE</p><h2>League table</h2></div><button class="text-btn" data-page="league">Full table ↗</button></div>'+tableMarkup(table,club.id,true)+'</section></div>';
    if(page==="squad")return '<div class="view-intro"><p class="panel-eyebrow">FIRST TEAM</p><h1>Squad room</h1><p>Know your players. Build around their strengths.</p></div><section class="game-panel"><div class="panel-heading"><div><h2>'+safe(club.name)+' · First team</h2><p class="subtle">'+currentPlayers.length+' players currently registered in the pilot database</p></div><span class="live-pill">SQUAD</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>PLAYER</th><th>POS</th><th>AGE</th><th>OVR</th><th>FIT</th><th>FORM</th><th>MORALE</th></tr></thead><tbody>'+(currentPlayers.length?currentPlayers.map(p=>'<tr><td><strong>'+safe(p.name)+'</strong><small class="cell-sub">'+safe(p.club)+'</small></td><td><span class="position-chip">'+safe(p.position)+'</span></td><td>'+p.age+'</td><td><strong>'+formRating(p)+'</strong></td><td>'+p.fitness+'</td><td>'+p.form+'</td><td>'+p.morale+'</td></tr>').join(""):'<tr><td colspan="7">No player records are currently assigned to this club.</td></tr>')+'</tbody></table></div></section><div class="notice-line">Player attributes and condition use the existing Ginga FM player database.</div>';
    if(page==="tactics")return '<div class="view-intro"><p class="panel-eyebrow">MATCH PREPARATION</p><h1>Tactics board</h1><p>Choose the approach your team will take into the next match.</p></div><section class="game-panel"><div class="tactics-layout"><div class="pitch-visual"><div class="pitch-half"></div><div class="pitch-circle"></div><div class="pitch-box top"></div><div class="pitch-box bottom"></div><span class="pitch-label">GINGA FM · TOUCHLINE</span></div><div class="tactics-form"><label>Formation<select data-tactic="formation">'+options(["4-3-3","4-4-2","4-2-3-1","5-3-2","5-4-1"],career.tactics.formation)+'</select></label><label>Team mentality<select data-tactic="mentality">'+options(["Balanced","Attacking","Defensive"],career.tactics.mentality)+'</select></label><label>Tempo<select data-tactic="tempo">'+options(["Slow","Normal","Fast"],career.tactics.tempo)+'</select></label><label>Pressing<select data-tactic="pressing">'+options(["Low","Medium","High"],career.tactics.pressing)+'</select></label><label>Defensive line<select data-tactic="defensiveLine">'+options(["Deep","Normal","High"],career.tactics.defensiveLine)+'</select></label><p class="subtle">Changes are saved to your manager career and affect the club's match calculations.</p></div></div></section>';
    if(page==="transfers"){
        const market=players.filter(p=>clubForPlayer(p)!==club.name);
        return '<div class="view-intro"><p class="panel-eyebrow">RECRUITMENT</p><h1>Transfer market</h1><p>Strengthen your team with players already registered in the Ginga FM world.</p></div><div class="metric-grid compact"><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Available to spend</small></div><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Current funds</small></div></div><section class="game-panel"><div class="panel-heading"><div><h2>Available players</h2><p class="subtle">Fees are estimated from player attributes for this pilot.</p></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>PLAYER</th><th>POS</th><th>AGE</th><th>OVR</th><th>CURRENT CLUB</th><th>EST. FEE</th><th></th></tr></thead><tbody>'+market.map(p=>{const fee=transferFee(p);return '<tr><td><strong>'+safe(p.name)+'</strong></td><td>'+safe(p.position)+'</td><td>'+p.age+'</td><td>'+formRating(p)+'</td><td>'+safe(clubForPlayer(p))+'</td><td>'+money(fee)+'</td><td><button class="small-btn" data-action="buy-player" data-player="'+p.id+'" '+(fee>career.transferBudget?'disabled':'')+'>Sign</button></td></tr>'}).join("")+'</tbody></table></div></section>';
    }
    if(page==="fixtures")return '<div class="view-intro"><p class="panel-eyebrow">SEASON '+career.season+'</p><h1>Fixtures & results</h1><p>Every club plays home and away across an 18-matchday season.</p></div><section class="game-panel"><div class="panel-heading"><div><h2>Matchday '+Math.min(career.currentRound,18)+'</h2><p class="subtle">Simulate a matchday to play all five fixtures and update the table.</p></div><button class="game-btn" id="playRoundButton" '+(!upcoming?'disabled':'')+'>Play matchday →</button></div><div class="fixture-list">'+career.fixtures.map(f=>fixtureMarkup(f,club.id)).join("")+'</div></section>';
    if(page==="league")return '<div class="view-intro"><p class="panel-eyebrow">GHANA PREMIER DIVISION</p><h1>League table</h1><p>Points, goal difference, and goals scored determine the standings.</p></div><section class="game-panel"><div class="panel-heading"><div><h2>Season '+career.season+' standings</h2><p class="subtle">'+career.fixtures.filter(f=>f.played).length+' of '+career.fixtures.length+' fixtures completed</p></div></div>'+tableMarkup(table,club.id,false)+'</section>';
    if(page==="finances")return '<div class="view-intro"><p class="panel-eyebrow">CLUB ACCOUNTING</p><h1>Finances</h1><p>Track the money available to run and improve your club.</p></div><div class="metric-grid"><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Current available funds</small></div><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Player recruitment allocation</small></div><div class="metric-card"><span>WAGE BUDGET</span><strong>'+money(club.finances.wageBudget)+'</strong><small>Original weekly wage allowance</small></div></div><section class="game-panel"><div class="panel-heading"><div><h2>Season ledger</h2><p class="subtle">Matchday income and costs are recorded as you play.</p></div></div><div class="finance-line"><span>Starting balance</span><strong>'+money(club.finances.balance)+'</strong></div><div class="finance-line"><span>Matchday income / bonuses</span><strong class="positive">'+money(career.totalIncome||0)+'</strong></div><div class="finance-line"><span>Matchday operating costs</span><strong class="negative">−'+money(career.totalCosts||0)+'</strong></div><div class="finance-line total"><span>Current balance</span><strong>'+money(career.balance)+'</strong></div></section>';
    if(page==="board")return '<div class="view-intro"><p class="panel-eyebrow">CLUB LEADERSHIP</p><h1>Board expectations</h1><p>Deliver results and keep the club on a stable footing.</p></div><section class="game-panel"><div class="objective-card"><span class="objective-icon">🏆</span><div><strong>League performance</strong><p>Finish in the top half of the Ghana Premier Division.</p><small>Current position: '+position+' of '+clubs.length+'</small></div></div><div class="objective-card"><span class="objective-icon">₵</span><div><strong>Financial control</strong><p>Keep the club balance above zero while managing recruitment.</p><small>Current balance: '+money(career.balance)+'</small></div></div><div class="objective-card"><span class="objective-icon">⚽</span><div><strong>Build a competitive team</strong><p>Use tactics and recruitment to improve your results.</p><small>Squad size: '+currentPlayers.length+' registered players</small></div></div></section>';
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
    if(action==="buy-player"){
        const id=Number(event.currentTarget.dataset.player),player=players.find(p=>p.id===id);if(!player)return;
        const fee=transferFee(player);
        if(fee>career.transferBudget){showToast("This transfer is above your available budget.",true);return}
        if(!confirm("Sign "+player.name+" for "+money(fee)+"?"))return;
        career.playerClubOverrides[id]=getClub(career.clubId).name;player.club=getClub(career.clubId).name;
        career.balance-=fee;career.transferBudget-=fee;
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
        const result=simulateMatch(home,away);
        f.played=true;f.result={homeGoals:result.homeGoals,awayGoals:result.awayGoals,homeStrength:result.homeStrength,awayStrength:result.awayStrength};
        roundGoals+=result.homeGoals+result.awayGoals;
        if(home.id===career.clubId||away.id===career.clubId)selectedOutcome={fixture:f,home,away,result};
    });
    const club=getClub(career.clubId),match=selectedOutcome;
    const matchIncome=fixtures.reduce((total,f)=>total+(f.homeClubId===club.id?8000:(f.awayClubId===club.id?3000:0)),0);
    const matchCost=Math.round(club.finances.wageBudget*0.18);
    let bonus=0;
    if(match){const score=match.fixture.result;if((match.home.id===club.id&&score.homeGoals>score.awayGoals)||(match.away.id===club.id&&score.awayGoals>score.homeGoals))bonus=5000;else if(score.homeGoals===score.awayGoals)bonus=2000}
    career.totalIncome=Number(career.totalIncome||0)+matchIncome+bonus;career.totalCosts=Number(career.totalCosts||0)+matchCost;
    career.balance=Number(career.balance||0)+matchIncome+bonus-matchCost;
    career.transferBudget=Math.max(0,Number(career.transferBudget||0)+Math.round((matchIncome+bonus-matchCost)*0.15));
    career.currentRound=round+1;
    if(match){
        const res=match.fixture.result;
        career.lastResult={homeTeam:match.home.name,awayTeam:match.away.name,homeGoals:res.homeGoals,awayGoals:res.awayGoals,round:round};
        career.news.push({date:"MATCHDAY "+round,title:match.home.name+" "+res.homeGoals+"–"+res.awayGoals+" "+match.away.name,body:match.home.id===club.id?(res.homeGoals>res.awayGoals?"A home win puts points on the board.":res.homeGoals===res.awayGoals?"The points are shared at home.":"The team will need a response after this defeat."):(res.awayGoals>res.homeGoals?"A valuable away victory.":res.awayGoals===res.homeGoals?"A point earned on the road.":"A difficult away result for the squad.")});
    }
    if(!career.fixtures.some(f=>!f.played))career.news.push({date:"SEASON "+career.season,title:"Season complete",body:"All 90 league fixtures have been played. The final table is ready."});
    busy=false;
    try{await saveCareer("Matchday "+round+" complete. Results and finances saved.");activePage="dashboard";shell()}catch(e){showToast("Results were played, but saving failed. Keep this page open and retry: "+e.message,true);shell()}
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
        const status=$("worldStatus");if(status)status.textContent="Career save connected";
        document.body.classList.add("game-ready");
        shell();
        try{await saveCareer()}catch(e){console.warn("Initial career sync skipped:",e)}
    }catch(e){console.error(e);showToast("Could not load your saved career. Please sign in again.",true)}
}
init();
})();