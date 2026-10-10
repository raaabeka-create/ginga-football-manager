(function () {
"use strict";
const $ = id => document.getElementById(id);
let authUser = null;
let career = null;
let activePage = "dashboard";
let busy = false;
let marketSearch = "";
let marketPosition = "ALL";
let marketPage = 0;
let selectedPlayerId = null;
let playerProfileReturnPage = "squad";
let squadSearch = "";
let squadPosition = "ALL";
let squadAvailability = "ALL";
let squadSort = "position";
let trainingFocus = "balanced";
let fixtureRound = "NEXT";
let fixtureFilter = "ALL";
let newsSearch = "";
let newsCategory = "ALL";
let newsPage = 0;
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
        career={version:2,clubId:selected.id,season:1,currentRound:1,fixtures:null,playerClubOverrides:{},startingXI:[],playerStates:{},contracts:{},youthPlayers:[],balance:selected.finances.balance,transferBudget:selected.finances.transferBudget,tactics:{...selected.tactics},lastResult:null,news:[],boardConfidence:70,managerReputation:50,managerSalary:Math.round(selected.finances.wageBudget*0.025),jobOffers:[]};
    }
    if(!Array.isArray(career.fixtures)||career.fixtures.length !== clubs.length * (clubs.length - 1)) career.fixtures=createFixtures();
    if(!career.playerClubOverrides)career.playerClubOverrides={};
    if(!career.startingXI)career.startingXI=[];
    if(!career.playerStates)career.playerStates={};
    if(!career.contracts)career.contracts={};
    if(!Array.isArray(career.transferHistory))career.transferHistory=[];
    if(!Array.isArray(career.youthPlayers))career.youthPlayers=[];
    if(career.boardConfidence==null)career.boardConfidence=70;
    if(career.managerReputation==null)career.managerReputation=50;
    if(career.managerSalary==null)career.managerSalary=Math.round(selected.finances.wageBudget*0.025);
    if(!Array.isArray(career.jobOffers))career.jobOffers=[];
    career.youthPlayers.forEach(y=>{if(!players.some(p=>Number(p.id)===Number(y.id)))players.push({...y})});
    if(!career.tactics)career.tactics={...selected.tactics};
    Object.assign(selected.tactics,career.tactics);
    players.forEach(p=>{
        if(career.playerClubOverrides[p.id])p.club=career.playerClubOverrides[p.id];
        const state=career.playerStates[p.id];
        if(state&&clubForPlayer(p)===selected.name){["fitness","morale","form","injuryWeeks","age","appearances","goals","assists","minutesPlayed","yellowCards","redCards","cleanSheets","ratingTotal","ratedAppearances","potential"].forEach(k=>{if(state[k]!==undefined)p[k]=state[k]});if(state.attributes)p.attributes={...state.attributes};if(state.physicalDetails)p.physicalDetails={...state.physicalDetails};if(state.positions)p.positions=[...state.positions];if(state.developmentHistory)p.developmentHistory=[...state.developmentHistory]}
        ensurePlayerDetails(p);
    });
    // Migrate older career saves into the required 25-33 player range without deleting players.
    const registeredCount = clubName => players.filter(p=>!p.retired&&clubForPlayer(p)===clubName).length;
    clubs.forEach(target=>{
        let count=registeredCount(target.name);
        while(count<25){
            const donor=clubs.map(c=>({club:c,count:registeredCount(c.name)})).filter(x=>x.club.id!==target.id&&x.count>25).sort((a,b)=>b.count-a.count)[0];
            if(!donor)break;
            const candidate=players.filter(p=>!p.retired&&clubForPlayer(p)===donor.club.name).sort((a,b)=>Number(b.age||0)-Number(a.age||0))[0];
            if(!candidate)break;
            candidate.club=target.name;career.playerClubOverrides[candidate.id]=target.name;count++;
        }
        while(count>33){
            const recipient=clubs.map(c=>({club:c,count:registeredCount(c.name)})).filter(x=>x.club.id!==target.id&&x.count<33).sort((a,b)=>a.count-b.count)[0];
            if(!recipient)break;
            const candidate=players.filter(p=>!p.retired&&clubForPlayer(p)===target.name).sort((a,b)=>Number(b.age||0)-Number(a.age||0))[0];
            if(!candidate)break;
            candidate.club=recipient.club.name;career.playerClubOverrides[candidate.id]=recipient.club.name;count--;
        }
    });
    const ownSquad=players.filter(p=>!p.retired&&clubForPlayer(p)===selected.name);
    ownSquad.forEach(p=>{if(!career.contracts[p.id])career.contracts[p.id]={wage:estimateWage(p),years:2}});
    if(!Array.isArray(career.startingXI)||career.startingXI.length!==11||career.startingXI.some(id=>!ownSquad.some(p=>Number(p.id)===Number(id)&&Number(p.injuryWeeks||0)<=0)))career.startingXI=bestStartingXI(selected).map(p=>p.id);
    const playedRounds=career.fixtures.filter(f=>f.played).map(f=>f.round);
    const firstUnplayed=career.fixtures.find(f=>!f.played);
    career.currentRound=firstUnplayed?firstUnplayed.round:(clubs.length * 2 - 1);
    if(!career.news)career.news=[];
    if(!Number.isFinite(Number(career.newsSeenCount)))career.newsSeenCount=career.news.length;
    if(!Array.isArray(career.financialTransactions))career.financialTransactions=[];
    if(!Array.isArray(career.boardHistory))career.boardHistory=[];
    if(career.financialTotalsSeason==null)career.financialTotalsSeason=Number(career.season||1);
    return true;
}
async function saveCareer(message) {
    if(!authUser)return;
    if(Array.isArray(career.news)&&career.news.length>150){const removed=career.news.length-150;career.news=career.news.slice(-150);career.newsSeenCount=Math.max(0,Number(career.newsSeenCount||0)-removed);}
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
    document.querySelectorAll(".sidebar .nav-button").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===(activePage==="player-profile"?(playerProfileReturnPage||"squad"):activePage)));
    document.querySelectorAll("[data-action]").forEach(el=>el.addEventListener("click",handleAction));
    document.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",()=>{activePage=el.dataset.page;if(activePage==="news"){career.newsSeenCount=(career.news||[]).length;saveCareer().catch(e=>console.warn("Could not save news read state:",e))}document.querySelectorAll(".sidebar .nav-button").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===activePage));shell()}));
    document.querySelectorAll("[data-tactic]").forEach(el=>el.addEventListener("change",handleTacticChange));
    document.querySelectorAll("[data-lineup-player]").forEach(el=>el.addEventListener("change",async()=>{
        const id=Number(el.dataset.lineupPlayer),next=new Set(career.startingXI||[]);
        if(el.checked&&next.size>=11){el.checked=false;showToast("Choose no more than 11 starting players.",true);return}
        if(el.checked)next.add(id);else next.delete(id);career.startingXI=Array.from(next);
        try{await saveCareer("Starting XI saved.");shell()}catch(e){showToast("Could not save your lineup: "+e.message,true)}
    }));
    document.querySelectorAll("[data-market-search]").forEach(el=>el.addEventListener("input",()=>{
        const caret=el.selectionStart;marketSearch=el.value;marketPage=0;shell();const next=$("[data-market-search]");if(next){next.focus();try{next.setSelectionRange(caret,caret)}catch(_){}}
    }));
    document.querySelectorAll("[data-market-position]").forEach(el=>el.addEventListener("change",()=>{marketPosition=el.value;marketPage=0;shell()}));
    document.querySelectorAll("[data-squad-search]").forEach(el=>el.addEventListener("input",()=>{const caret=el.selectionStart;squadSearch=el.value;shell();const next=$("[data-squad-search]");if(next){next.focus();try{next.setSelectionRange(caret,caret)}catch(_){}}}));
    document.querySelectorAll("[data-squad-position]").forEach(el=>el.addEventListener("change",()=>{squadPosition=el.value;shell()}));
    document.querySelectorAll("[data-squad-availability]").forEach(el=>el.addEventListener("change",()=>{squadAvailability=el.value;shell()}));
    document.querySelectorAll("[data-squad-sort]").forEach(el=>el.addEventListener("change",()=>{squadSort=el.value;shell()}));
    document.querySelectorAll("[data-training-focus]").forEach(el=>el.addEventListener("change",()=>{trainingFocus=el.value}));
    document.querySelectorAll("[data-fixture-round]").forEach(el=>el.addEventListener("change",()=>{fixtureRound=el.value;shell()}));
    document.querySelectorAll("[data-fixture-filter]").forEach(el=>el.addEventListener("change",()=>{fixtureFilter=el.value;shell()}));
    document.querySelectorAll("[data-news-search]").forEach(el=>el.addEventListener("input",()=>{newsSearch=el.value;newsPage=0;const caret=el.selectionStart;shell();const next=$("[data-news-search]");if(next){next.focus();try{next.setSelectionRange(caret,caret)}catch(_){}}}));
    document.querySelectorAll("[data-news-category]").forEach(el=>el.addEventListener("change",()=>{newsCategory=el.value;newsPage=0;shell()}));
    const next=$("playRoundButton");if(next)next.addEventListener("click",career.fixtures.some(f=>!f.played)?playRound:startNextSeason);
    const choose=$("changeClubButton");if(choose)choose.addEventListener("click",async()=>{if(confirm("Starting a different club will begin a new career for that club. Continue?")){location.href="./club-selection.html"}});
    document.querySelectorAll("[data-signout]").forEach(el=>el.addEventListener("click",signOut));
}

function recordFinancialTransaction(type,description,amount){
    if(!Array.isArray(career.financialTransactions))career.financialTransactions=[];
    career.financialTransactions.unshift({season:Number(career.season||1),round:Number(career.currentRound||1),type,description,amount:Number(amount||0),balance:Number(career.balance||0)});
    if(career.financialTransactions.length>100)career.financialTransactions=career.financialTransactions.slice(0,100);
}
function newsCategoryFor(item){
    const text=[item.date,item.title,item.body].join(" ").toLowerCase();
    if(/transfer|signing|sold|joined|moved from|recruitment/.test(text))return "TRANSFERS";
    if(/training|fitness session|development/.test(text))return "TRAINING";
    if(/injur|return to fitness|unavailable/.test(text))return "SQUAD";
    if(/contract|renewal|wage/.test(text))return "CONTRACTS";
    if(/board|confidence|objective|managerial appointment|job offer/.test(text))return "BOARD";
    if(/matchday|match report|\d+–\d+|season complete|season \d+ completed/.test(text))return "MATCHES";
    if(/season|academy|youth|retired/.test(text))return "SEASON";
    return "OTHER";
}
function renderTacticalPitch(club){
    const formation=String(career.tactics.formation||"4-3-3");
    const shapes={"4-3-3":[4,3,3],"4-4-2":[4,4,2],"4-2-3-1":[4,5,1],"5-3-2":[5,3,2],"5-4-1":[5,4,1]};
    const shape=shapes[formation]||shapes["4-3-3"];
    const selected=(career.startingXI||[]).map(id=>players.find(p=>Number(p.id)===Number(id))).filter(p=>p&&clubForPlayer(p)===club.name).slice(0,11);
    const keeper=selected.find(p=>p.position==="GK")||selected[0];
    const rest=selected.filter(p=>p!==keeper);
    const groups=[
        {count:shape[2],top:25,items:rest.filter(p=>["ST","CF","LW","RW"].includes(p.position))},
        {count:shape[1],top:47,items:rest.filter(p=>["CM","DM","AM","LM","RM"].includes(p.position))},
        {count:shape[0],top:69,items:rest.filter(p=>["CB","LB","RB"].includes(p.position))}
    ];
    const placed=new Set(keeper?[keeper.id]:[]),dots=[];
    const addLine=(items,count,top)=>{
        const chosen=items.filter(p=>!placed.has(p.id)).slice(0,count);
        while(chosen.length<count){const fallback=rest.find(p=>!placed.has(p.id));if(!fallback)break;chosen.push(fallback)}
        chosen.forEach(p=>placed.add(p.id));
        chosen.forEach((pl,i)=>dots.push('<button type="button" class="pitch-player" style="left:'+((i+1)/(chosen.length+1)*100)+'%;top:'+top+'%" data-action="view-player" data-player="'+pl.id+'" title="'+safe(pl.name)+' · '+safe(pl.position)+' · OVR '+playerOverall(pl)+'"><span>'+safe(pl.position)+'</span><b>'+safe(pl.name.split(/\s+/).slice(-1)[0])+'</b></button>'));
    };
    if(keeper)dots.push('<button type="button" class="pitch-player pitch-keeper" style="left:50%;top:88%" data-action="view-player" data-player="'+keeper.id+'" title="'+safe(keeper.name)+' · Goalkeeper"><span>GK</span><b>'+safe(keeper.name.split(/\s+/).slice(-1)[0])+'</b></button>');
    groups.forEach(g=>addLine(g.items,g.count,g.top));
    rest.filter(pl=>!placed.has(pl.id)).forEach((pl,i,arr)=>dots.push('<button type="button" class="pitch-player" style="left:'+((i+1)/(arr.length+1)*100)+'%;top:57%" data-action="view-player" data-player="'+pl.id+'" title="'+safe(pl.name)+'"><span>'+safe(pl.position)+'</span><b>'+safe(pl.name.split(/\s+/).slice(-1)[0])+'</b></button>'));
    return '<div class="pitch-visual tactical-pitch"><div class="pitch-half"></div><div class="pitch-circle"></div><div class="pitch-box top"></div><div class="pitch-box bottom"></div>'+dots.join("")+'<span class="pitch-label">'+safe(formation)+' · '+selected.length+'/11 PLAYERS</span></div>';
}

function playerOverall(player){
    const a=player&&player.attributes||{},pos=String(player&&player.position||"").toUpperCase();
    const values=pos==="GK"?[["goalkeeping",0.45],["composure",0.12],["passing",0.10],["physical",0.10],["defending",0.10],["stamina",0.08],["pace",0.05]]:["CB","LB","RB"].includes(pos)?[["defending",0.25],["physical",0.18],["pace",0.14],["stamina",0.12],["passing",0.12],["composure",0.10],["dribbling",0.05],["shooting",0.04]]:["CM","DM","AM"].includes(pos)?[["passing",0.20],["stamina",0.16],["dribbling",0.15],["composure",0.14],["defending",0.12],["pace",0.10],["shooting",0.08],["physical",0.05]]:[["shooting",0.22],["pace",0.18],["dribbling",0.16],["composure",0.14],["passing",0.12],["physical",0.08],["stamina",0.06],["defending",0.04]];
    return Math.round(values.reduce((sum,item)=>sum+Number(a[item[0]]||0)*item[1],0));
}
function ensurePlayerAttributes(player){
    const a=player.attributes||(player.attributes={});
    const base=k=>Math.max(1,Math.min(99,Math.round(Number(a[k]||50))));
    const set=(key,value)=>{a[key]=Math.max(1,Math.min(99,Math.round(value)))};
    set("acceleration",base("pace")*0.72+base("dribbling")*0.28);
    set("agility",base("dribbling")*0.55+base("pace")*0.25+base("composure")*0.20);
    set("balance",base("physical")*0.35+base("dribbling")*0.40+base("composure")*0.25);
    set("crossing",base("passing")*0.62+base("dribbling")*0.23+base("pace")*0.15);
    set("heading",base("physical")*0.48+base("defending")*0.32+base("composure")*0.20);
    set("interceptions",base("defending")*0.68+base("composure")*0.17+base("stamina")*0.15);
    set("tackling",base("defending")*0.72+base("physical")*0.18+base("stamina")*0.10);
    set("vision",base("passing")*0.58+base("composure")*0.27+base("dribbling")*0.15);
    set("longShots",base("shooting")*0.65+base("composure")*0.20+base("physical")*0.15);
    set("reactions",base("goalkeeping")*0.58+base("composure")*0.22+base("agility")*0.20);
    if(String(player.position||"").toUpperCase()==="GK"){set("handling",base("goalkeeping")*0.82+base("composure")*0.18);set("reflexes",base("goalkeeping")*0.72+base("pace")*0.12+base("composure")*0.16);set("positioning",base("goalkeeping")*0.75+base("defending")*0.10+base("composure")*0.15)}
    else a.reactions=Math.round(base("pace")*0.25+base("composure")*0.35+base("agility")*0.40);
    Object.keys(a).forEach(key=>{const value=Number(a[key]);if(Number.isFinite(value))a[key]=Math.max(1,Math.min(99,Math.round(value)))});
}
function playerMarketValue(player){
    const overall=playerOverall(player),age=Number(player.age||22);
    const ageMultiplier=age<=21?1.35:age<=24?1.2:age<=27?1:age<=30?0.78:age<=33?0.52:0.3;
    const value=Math.max(10000,overall*overall*85*ageMultiplier);
    return Math.round(value/5000)*5000;
}
function estimateWage(player){return Math.max(250,Math.round((playerOverall(player)*17+Math.max(0,Number(player.age||22)-22)*12)/50)*50)}
function bestStartingXI(club){
    const squad=players.filter(p=>clubForPlayer(p)===club.name&&Number(p.injuryWeeks||0)<=0).slice().sort((a,b)=>playerOverall(b)-playerOverall(a)),selected=[];
    const formation=String((club.tactics||{}).formation||"4-3-3"),shape=formation==="4-4-2"?[4,4,2]:formation==="4-2-3-1"?[4,5,1]:formation==="5-3-2"?[5,3,2]:formation==="5-4-1"?[5,4,1]:[4,3,3];
    const take=group=>{const p=squad.find(x=>!selected.some(y=>y.id===x.id)&&(group==="GK"?x.position==="GK":group==="DEF"?["CB","LB","RB"].includes(x.position):group==="MID"?["CM","DM","AM","LM","RM"].includes(x.position):["ST","CF","LW","RW"].includes(x.position)));if(p)selected.push(p)};
    take("GK");for(let i=0;i<shape[0];i++)take("DEF");for(let i=0;i<shape[1];i++)take("MID");for(let i=0;i<shape[2];i++)take("ATT");for(const p of squad)if(selected.length<11&&!selected.some(x=>x.id===p.id))selected.push(p);return selected.slice(0,11);
}
function runAITransferWindow(){
    let completed=0;
    for(let i=0;i<6;i++){
        const counts=clubs.map(c=>({club:c,count:players.filter(p=>p.club===c.name&&!p.retired).length})).filter(x=>x.club.id!==career.clubId);
        const sellers=counts.filter(x=>x.count>25),buyers=counts.filter(x=>x.count<30);
        if(!sellers.length||!buyers.length)break;
        const seller=sellers[Math.floor(Math.random()*sellers.length)],buyerChoices=buyers.filter(x=>x.club.id!==seller.club.id);
        if(!buyerChoices.length)break;
        const buyer=buyerChoices[Math.floor(Math.random()*buyerChoices.length)];
        const pool=players.filter(p=>p.club===seller.club.name&&!p.retired).sort((a,b)=>Number(b.age||0)-Number(a.age||0));
        if(!pool.length)continue;
        const player=pool[Math.floor(Math.random()*Math.min(pool.length,Math.max(1,Math.ceil(pool.length/3))))];
        player.club=buyer.club.name;career.playerClubOverrides[player.id]=buyer.club.name;completed++;
        career.news.push({date:"TRANSFER WINDOW",title:"International transfer completed",body:player.name+" has moved from "+seller.club.name+" to "+buyer.club.name+"."});
    }
    return completed;
}
function persistPlayerStates(club){players.filter(p=>clubForPlayer(p)===club.name).forEach(p=>{career.playerStates[p.id]={fitness:p.fitness,morale:p.morale,form:p.form,injuryWeeks:Number(p.injuryWeeks||0),age:p.age,appearances:Number(p.appearances||0),goals:Number(p.goals||0),assists:Number(p.assists||0),minutesPlayed:Number(p.minutesPlayed||0),yellowCards:Number(p.yellowCards||0),redCards:Number(p.redCards||0),cleanSheets:Number(p.cleanSheets||0),ratingTotal:Number(p.ratingTotal||0),ratedAppearances:Number(p.ratedAppearances||0),potential:p.potential,attributes:{...(p.attributes||{})},physicalDetails:{...(p.physicalDetails||{})},positions:[...(p.positions||[])],developmentHistory:[...(p.developmentHistory||[])]}})}
function updatePlayerCondition(match){
    if(!match)return;const club=getClub(career.clubId),result=match.result,ids=new Set((club.id===match.home.id?result.homeLineup:result.awayLineup)||[]);
    const won=(club.id===match.home.id&&result.homeGoals>result.awayGoals)||(club.id===match.away.id&&result.awayGoals>result.homeGoals),drew=result.homeGoals===result.awayGoals;
    players.filter(p=>clubForPlayer(p)===club.name).forEach(p=>{
        if(Number(p.injuryWeeks||0)>0){p.injuryWeeks=Math.max(0,Number(p.injuryWeeks)-1);p.fitness=Math.min(100,Number(p.fitness||0)+3);return}
        if(ids.has(p.id)){p.fitness=Math.max(25,Number(p.fitness||90)-(6+Math.floor(Math.random()*6)));p.appearances=Number(p.appearances||0)+1;p.morale=Math.max(20,Math.min(100,Number(p.morale||50)+(won?4:drew?1:-4)));p.form=Math.max(20,Math.min(100,Number(p.form||50)+(won?3:drew?1:-3)));
            const events=result.events||[];p.goals=Number(p.goals||0)+events.filter(e=>e.type==="goal"&&Number(e.playerId)===Number(p.id)).length;p.assists=Number(p.assists||0)+events.filter(e=>e.type==="goal"&&Number(e.assistPlayerId)===Number(p.id)).length;p.yellowCards=Number(p.yellowCards||0)+events.filter(e=>e.type==="yellow"&&Number(e.playerId)===Number(p.id)).length;p.redCards=Number(p.redCards||0)+events.filter(e=>e.type==="red"&&Number(e.playerId)===Number(p.id)).length;p.minutesPlayed=Number(p.minutesPlayed||0)+90;const conceded=club.id===match.home.id?result.awayGoals:result.homeGoals;if(p.position==="GK"&&conceded===0)p.cleanSheets=Number(p.cleanSheets||0)+1;const performance=Math.max(4,Math.min(10,6.2+(won?0.8:drew?0.2:-0.5)+(events.some(e=>e.type==="goal"&&Number(e.playerId)===Number(p.id))?1.0:0)+(events.some(e=>e.type==="goal"&&Number(e.assistPlayerId)===Number(p.id))?0.6:0)+(events.some(e=>(e.type==="yellow"||e.type==="red")&&Number(e.playerId)===Number(p.id))?-0.7:0)));p.ratingTotal=Number(p.ratingTotal||0)+performance;p.ratedAppearances=Number(p.ratedAppearances||0)+1;
            if(Math.random()<0.018){p.injuryWeeks=1+Math.floor(Math.random()*4);p.fitness=Math.max(20,p.fitness-12);career.news.push({date:"MATCHDAY "+career.currentRound,title:"Injury concern: "+p.name,body:p.name+" has picked up an injury and is expected to miss "+p.injuryWeeks+" matchday(s)."})}
        }else{p.fitness=Math.min(100,Number(p.fitness||75)+5);p.morale=Math.max(20,Math.min(100,Number(p.morale||50)+(won?1:0)))}
    });
    persistPlayerStates(club);if(career.startingXI.some(id=>{const p=players.find(x=>Number(x.id)===Number(id));return !p||Number(p.injuryWeeks||0)>0}))career.startingXI=bestStartingXI(club).map(p=>p.id);
}

function ensurePlayerDetails(player){
    if(!player.physicalDetails)player.physicalDetails={heightCm:160+(Number(player.id||1)*7%31),weightKg:55+(Number(player.id||1)*11%31),preferredFoot:Number(player.id||1)%3===0?"Left":"Right",shirtNumber:1+(Number(player.id||1)*13%99)};
    if(!Array.isArray(player.positions)||!player.positions.length){const adjacent={GK:["GK"],CB:["CB","DM"],LB:["LB","LM"],RB:["RB","RM"],DM:["DM","CM"],CM:["CM","DM"],AM:["AM","CM"],LM:["LM","LW"],RM:["RM","RW"],LW:["LW","ST"],RW:["RW","ST"],CF:["CF","ST"],ST:["ST","CF"]};player.positions=adjacent[player.position]||[player.position||"CM"]}
    if(!Number.isFinite(Number(player.potential)))player.potential=Math.min(99,Math.max(playerOverall(player),playerOverall(player)+Math.max(0,26-Number(player.age||22))*2+4));
    if(!Array.isArray(player.developmentHistory))player.developmentHistory=[];
    ["assists","minutesPlayed","yellowCards","redCards","cleanSheets","ratingTotal","ratedAppearances"].forEach(k=>{if(!Number.isFinite(Number(player[k])))player[k]=0});
    if(!Array.isArray(player.transferHistory))player.transferHistory=[];
}
function playerDevelopmentTrend(player){const h=player.developmentHistory||[];if(h.length<2)return "No history yet";const d=Number(h[h.length-1].overall)-Number(h[h.length-2].overall);return d>0?"Improving":d<0?"Declining":"Stable"}

function renderPage(page) {
    const club=getClub(career.clubId), manager=getManager(), table=buildTable(), standing=table.find(t=>t.clubId===club.id), position=table.indexOf(standing)+1;
    const upcoming=career.fixtures.find(f=>!f.played);
    const recent=career.fixtures.filter(f=>f.played).slice(-5).reverse();
    const upcomingForClub=career.fixtures.find(f=>!f.played&&(f.homeClubId===club.id||f.awayClubId===club.id));
    const currentPlayers=players.filter(p=>clubForPlayer(p)===club.name);
    const formRating=player=>Math.round(Object.values(player.attributes).reduce((a,b)=>a+b,0)/Object.values(player.attributes).length);
    if(page==="dashboard")return renderDashboard({club,manager,table,standing,position,currentPlayers});
    if(page==="squad"){
        const starting=new Set(career.startingXI||[]);
        const registered=currentPlayers,available=registered.filter(p=>Number(p.injuryWeeks||0)<=0),wages=registered.reduce((sum,p)=>sum+Number((career.contracts[p.id]||{}).wage||estimateWage(p)),0),squadValue=registered.reduce((sum,p)=>sum+playerMarketValue(p),0);
        const depth=[["GK","Goalkeepers"],["DEF","Defenders"],["MID","Midfielders"],["ATT","Forwards"]].map(([g,label])=>({label,players:registered.filter(p=>g==="GK"?p.position==="GK":g==="DEF"?["CB","LB","RB"].includes(p.position):g==="MID"?["CM","DM","AM","LM","RM"].includes(p.position):!["GK","CB","LB","RB","CM","DM","AM","LM","RM"].includes(p.position))}));
        const sortedPlayers=registered.filter(p=>(!squadSearch||[p.name,p.position,p.nationality||""].join(" ").toLowerCase().includes(squadSearch.toLowerCase()))&&(squadPosition==="ALL"||p.position===squadPosition)&&(squadAvailability==="ALL"||(squadAvailability==="INJURED"?Number(p.injuryWeeks||0)>0:squadAvailability==="LOW"?Number(p.injuryWeeks||0)<=0&&Number(p.fitness||0)<50:Number(p.injuryWeeks||0)<=0&&Number(p.fitness||0)>=50)));
        const sorters={position:(a,b)=>String(a.position).localeCompare(String(b.position))||playerOverall(b)-playerOverall(a),name:(a,b)=>String(a.name).localeCompare(String(b.name)),overall:(a,b)=>playerOverall(b)-playerOverall(a),age:(a,b)=>Number(a.age||0)-Number(b.age||0),value:(a,b)=>playerMarketValue(b)-playerMarketValue(a),fitness:(a,b)=>Number(b.fitness||0)-Number(a.fitness||0),form:(a,b)=>Number(b.form||0)-Number(a.form||0)};sortedPlayers.sort(sorters[squadSort]||sorters.position);
        return '<div class="view-intro"><p class="panel-eyebrow">FIRST TEAM</p><h1>Squad room</h1><p>Manage squad balance, availability, contracts and match selection.</p></div><div class="metric-grid squad-overview"><div class="metric-card"><span>REGISTERED PLAYERS</span><strong>'+registered.length+'</strong><small>Squad limit: 25–33</small></div><div class="metric-card"><span>AVAILABLE PLAYERS</span><strong>'+available.length+'</strong><small>'+registered.filter(p=>Number(p.injuryWeeks||0)>0).length+' injured</small></div><div class="metric-card"><span>SQUAD MARKET VALUE</span><strong>'+money(squadValue)+'</strong><small>Estimated in-game value</small></div><div class="metric-card"><span>WEEKLY WAGES</span><strong>'+money(wages)+'</strong><small>'+Math.round(wages/Math.max(1,club.finances.wageBudget)*100)+'% of budget</small></div></div><section class="game-panel"><div class="panel-heading"><div><h2>'+safe(club.name)+' · Starting XI</h2><p class="subtle">'+starting.size+' of 11 selected · '+currentPlayers.filter(p=>Number(p.injuryWeeks||0)>0).length+' unavailable through injury</p></div><button class="game-btn secondary" data-action="auto-lineup">Auto-pick best XI</button></div><p class="subtle">Tick exactly 11 available players. The match engine uses this selection for your club.</p><div class="squad-filters"><input type="search" data-squad-search value="'+safe(squadSearch)+'" placeholder="Search name, position or nationality"><select data-squad-position>'+options(["ALL","GK","CB","LB","RB","CM","DM","AM","LM","RM","LW","RW","CF","ST"],squadPosition).replace('>ALL</option>','>All positions</option>')+'</select><select data-squad-availability>'+options(["ALL","FIT","LOW","INJURED"],squadAvailability).replace('>ALL</option>','>All availability</option>').replace('>FIT</option>','>Fit to play</option>').replace('>LOW</option>','>Low fitness</option>').replace('>INJURED</option>','>Injured</option>')+'</select><select data-squad-sort>'+options(["position","name","overall","age","value","fitness","form"],squadSort).replace('>position</option>','>Position</option>').replace('>name</option>','>Name</option>').replace('>overall</option>','>Overall</option>').replace('>age</option>','>Age</option>').replace('>value</option>','>Market value</option>').replace('>fitness</option>','>Fitness</option>').replace('>form</option>','>Form</option>')+'</select></div><div class="table-scroll"><table class="data-table"><thead><tr><th>XI</th><th>PLAYER</th><th>POS</th><th>AGE</th><th>OVR</th><th>MARKET VALUE</th><th>FIT</th><th>FORM</th><th>MORALE</th><th>STATUS / CONTRACT</th><th></th></tr></thead><tbody>'+(sortedPlayers.length?sortedPlayers.map(p=>'<tr><td><input type="checkbox" data-lineup-player="'+p.id+'" '+(starting.has(p.id)?'checked':'')+' '+(Number(p.injuryWeeks||0)>0?'disabled':'')+' aria-label="Select '+safe(p.name)+' for starting eleven"></td><td><button type="button" class="player-name-link" data-action="view-player" data-player="'+p.id+'" aria-label="Open profile for '+safe(p.name)+'">'+safe(p.name)+'</button><small class="cell-sub">'+safe(p.nationality||"Nationality not listed")+'</small></td><td><span class="position-chip">'+safe(p.position)+'</span></td><td>'+p.age+'</td><td><strong>'+playerOverall(p)+'</strong></td><td>'+money(playerMarketValue(p))+'</td><td><span class="fitness-status '+(Number(p.injuryWeeks||0)>0?'fitness-injured':Number(p.fitness||0)<50?'fitness-unfit':'fitness-fit')+'" title="'+(Number(p.injuryWeeks||0)>0?'Injured — unavailable for '+p.injuryWeeks+' matchday(s)':Number(p.fitness||0)<50?'Unfit to play — low fitness':'Fit to play')+'">'+(Number(p.injuryWeeks||0)>0?'🩹':Number(p.fitness||0)<50?'⚠️':'✓')+' '+Math.round(Number(p.fitness||0))+'</span><div class="fitness-track"><i style="width:'+Math.max(0,Math.min(100,Number(p.fitness||0)))+'%"></i></div></td><td>'+Math.round(p.form||0)+'</td><td>'+Math.round(p.morale||0)+'</td><td>'+(Number(p.injuryWeeks||0)>0?'<span class="fitness-status fitness-injured">🩹 Injured · '+p.injuryWeeks+' MD</span>':Number(p.fitness||0)<50?'<span class="fitness-status fitness-unfit">⚠️ Unfit to play</span>':'<span class="fitness-status fitness-fit">✓ Fit to play</span>')+'<small class="cell-sub">'+money((career.contracts[p.id]||{}).wage||estimateWage(p))+' / week · Exp. '+Number((career.contracts[p.id]||{}).expirySeason||career.season+1)+'</small></td><td><button class="small-btn" data-action="sell-player" data-player="'+p.id+'" '+(currentPlayers.length<=25?'disabled':'')+'>Sell</button></td></tr>').join(""):'<tr><td colspan="11">No players match these filters.</td></tr>')+'</tbody></table></div></section><section class="game-panel"><div class="panel-heading"><div><h2>Position-by-position depth</h2><p class="subtle">Registered players and currently available options</p></div></div><div class="squad-depth-grid">'+depth.map(d=>'<div class="depth-card"><span>'+d.label+'</span><strong>'+d.players.length+'</strong><small>'+d.players.filter(p=>Number(p.injuryWeeks||0)<=0).length+' available</small></div>').join("")+'</div></section><section class="game-panel"><div class="panel-heading"><div><h2>Squad contracts</h2><p class="subtle">Estimated weekly wages against the club allowance.</p></div></div><div class="finance-line"><span>Estimated weekly squad wages</span><strong>'+money(currentPlayers.reduce((sum,p)=>sum+Number((career.contracts[p.id]||{}).wage||estimateWage(p)),0))+'</strong></div><div class="finance-line"><span>Weekly wage budget</span><strong>'+money(club.finances.wageBudget)+'</strong></div></section><section class="game-panel"><div class="panel-heading"><div><h2>Bench and reserves</h2><p class="subtle">Top available players outside the selected starting XI. In-match substitutions are not yet simulated.</p></div></div><div class="bench-grid">'+currentPlayers.filter(p=>Number(p.injuryWeeks||0)<=0&&!(career.startingXI||[]).some(id=>Number(id)===Number(p.id))).sort((a,b)=>playerOverall(b)-playerOverall(a)).slice(0,7).map(p=>'<button class="bench-player" data-action="view-player" data-player="'+p.id+'"><strong>'+safe(p.name)+'</strong><span>'+safe(p.position)+' · OVR '+playerOverall(p)+'</span><small>'+Math.round(Number(p.fitness||0))+' fitness</small></button>').join("")+'</div></section><section class="game-panel"><div class="panel-heading"><div><h2>Training and development</h2><p class="subtle">Training focus affects player attributes, fitness or morale.</p></div></div><div class="training-controls"><label>Training focus<select data-training-focus>'+options(["balanced","technical","physical","defending","attacking","fitness","morale"],trainingFocus).replace('>balanced</option>','>Balanced</option>').replace('>technical</option>','>Technical</option>').replace('>physical</option>','>Physical</option>').replace('>defending</option>','>Defending</option>').replace('>attacking</option>','>Attacking</option>').replace('>fitness</option>','>Fitness recovery</option>').replace('>morale</option>','>Morale</option>')+'</select></label><button class="game-btn" data-action="train-squad">Run training session</button></div><p class="subtle">'+(career.trainingLog&&career.trainingLog.length?safe(career.trainingLog[career.trainingLog.length-1].summary):'No training sessions recorded yet.')+'</p></section>';
    }
    if(page==="player-profile"){
        const player=players.find(p=>Number(p.id)===Number(selectedPlayerId));
        if(!player){activePage=playerProfileReturnPage||"squad";return '<section class="game-panel"><h2>Player not found</h2><button class="game-btn" data-action="back-to-squad">Back</button></section>'}
        ensurePlayerDetails(player);
        const a=player.attributes||{},details=player.physicalDetails||{},contract=career.contracts[player.id]||{wage:estimateWage(player),years:2,expirySeason:career.season+1};
        const groups=[{name:"Technical",keys:["shooting","passing","dribbling","crossing","heading","longShots"]},{name:"Physical",keys:["pace","acceleration","agility","balance","physical","stamina"]},{name:"Mental",keys:["composure","vision","interceptions","tackling","defending"]},{name:"Goalkeeping",keys:["goalkeeping","reactions","handling","reflexes","positioning"]}];
        const attrMarkup=groups.map(g=>{const keys=g.keys.filter(k=>Number.isFinite(Number(a[k]))&&(g.name==="Goalkeeping"?player.position==="GK":k!=="goalkeeping"));return keys.length?'<div class="attribute-group"><h3>'+g.name+'</h3><div class="skill-grid">'+keys.map(k=>'<div class="skill"><div><span>'+safe(k.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()))+'</span><strong>'+Math.round(Number(a[k])||0)+'</strong></div><div class="skill-track"><i style="width:'+Math.max(0,Math.min(100,Number(a[k])||0))+'%"></i></div></div>').join("")+'</div></div>':''}).join("");
        const rated=Number(player.ratedAppearances||0),average=rated?Number(player.ratingTotal||0)/rated:0;
        const history=(career.transferHistory||[]).filter(h=>Number(h.playerId)===Number(player.id));
        return '<div class="view-intro"><p class="panel-eyebrow">PLAYER PROFILE</p><h1>'+safe(player.name)+'</h1><p>Player identity, attributes, development, contract and recorded career statistics.</p></div><section class="game-panel"><div class="profile-top"><div class="profile-avatar">'+safe(String(player.position||"P").slice(0,2))+'</div><div><h2>'+safe(player.name)+'</h2><p class="subtle">'+safe(player.nationality||"Nationality not listed")+' · '+safe((player.positions||[player.position]).join(" / "))+'</p><span class="live-pill">'+safe(clubForPlayer(player))+'</span></div></div><div class="metric-grid"><div class="metric-card"><span>OVERALL</span><strong>'+playerOverall(player)+'</strong><small>Shared position-adjusted rating</small></div><div class="metric-card"><span>POTENTIAL</span><strong>'+Number(player.potential||playerOverall(player))+'</strong><small>'+safe(playerDevelopmentTrend(player))+'</small></div><div class="metric-card"><span>MARKET VALUE</span><strong>'+money(playerMarketValue(player))+'</strong><small>In-game estimate</small></div><div class="metric-card"><span>APPEARANCES</span><strong>'+Number(player.appearances||0)+'</strong><small>Recorded</small></div><div class="metric-card"><span>GOALS / ASSISTS</span><strong>'+Number(player.goals||0)+' / '+Number(player.assists||0)+'</strong><small>Recorded contributions</small></div><div class="metric-card"><span>AVERAGE RATING</span><strong>'+(average?average.toFixed(1):"—")+'</strong><small>'+rated+' rated appearances</small></div></div><div class="panel-divider"></div><h2>Personal and physical information</h2><div class="player-details-grid"><div><span>Age</span><strong>'+Number(player.age||0)+'</strong></div><div><span>Nationality</span><strong>'+safe(player.nationality||"Not recorded")+'</strong></div><div><span>Height</span><strong>'+details.heightCm+' cm</strong></div><div><span>Weight</span><strong>'+details.weightKg+' kg</strong></div><div><span>Preferred foot</span><strong>'+safe(details.preferredFoot)+'</strong></div><div><span>Shirt number</span><strong>'+details.shirtNumber+'</strong></div><div><span>Primary position</span><strong>'+safe(player.position)+'</strong></div><div><span>Secondary positions</span><strong>'+safe((player.positions||[]).filter(x=>x!==player.position).join(", ")||"None")+'</strong></div></div><div class="panel-divider"></div><h2>Biography</h2><p class="subtle" style="font-size:13px;line-height:1.8">'+safe(player.bio||(player.name+" is a "+Number(player.age||22)+"-year-old "+(player.nationality||"football")+" player at "+clubForPlayer(player)+"."))+'</p><div class="panel-divider"></div><h2>Attributes</h2>'+attrMarkup+'<div class="panel-divider"></div><h2>Condition and career statistics</h2><div class="finance-line"><span>Availability</span><strong>'+(Number(player.injuryWeeks||0)>0?'🩹 Injured · '+Number(player.injuryWeeks)+' matchday(s)':Number(player.fitness||0)<50?'⚠ Low fitness · available':'✓ Fit to play')+'</strong></div><div class="fitness-track profile-fitness"><i style="width:'+Math.max(0,Math.min(100,Number(player.fitness||0)))+'%"></i></div><div class="finance-line"><span>Fitness</span><strong>'+Math.round(Number(player.fitness||0))+'/100</strong></div><div class="finance-line"><span>Form / morale</span><strong>'+Math.round(Number(player.form||0))+' / '+Math.round(Number(player.morale||0))+'</strong></div><div class="finance-line"><span>Minutes played</span><strong>'+Number(player.minutesPlayed||0)+'</strong></div><div class="finance-line"><span>Yellow / red cards</span><strong>'+Number(player.yellowCards||0)+' / '+Number(player.redCards||0)+'</strong></div><div class="finance-line"><span>Clean sheets</span><strong>'+Number(player.cleanSheets||0)+'</strong></div><div class="panel-divider"></div><h2>Contract and valuation</h2><div class="finance-line"><span>Weekly wage</span><strong>'+money(contract.wage||0)+'</strong></div><div class="finance-line"><span>Contract expiry</span><strong>'+(Number(contract.years||0)<=0?'Expires now':'Season '+Number(contract.expirySeason||career.season+Number(contract.years||0)-1))+'</strong></div><div class="finance-line"><span>Market value</span><strong>'+money(playerMarketValue(player))+'</strong></div><div class="panel-divider"></div><h2>Transfer history</h2>'+(history.length?history.slice().reverse().map(h=>'<div class="finance-line"><span>Season '+Number(h.season||career.season)+' · '+safe(h.type||"Transfer")+'<small class="cell-sub">'+safe(h.from||"Unknown club")+' → '+safe(h.to||"Unknown club")+'</small></span><strong>'+money(h.fee||0)+'</strong></div>').join(""):'<p class="subtle">No transfer history recorded.</p>')+'<button class="game-btn secondary" data-action="back-to-squad">← Back to '+safe(playerProfileReturnPage==="transfers"?"transfer market":playerProfileReturnPage==="training"?"training":"squad")+'</button></section>';
    }
    if(page==="tactics"){
        const formation=String(career.tactics.formation||"4-3-3");
        const selected=(career.startingXI||[]).map(id=>players.find(p=>Number(p.id)===Number(id))).filter(p=>p&&clubForPlayer(p)===club.name);
        const available=currentPlayers.filter(p=>Number(p.injuryWeeks||0)<=0);
        const shape={"4-3-3":"4 defenders · 3 midfielders · 3 forwards","4-4-2":"4 defenders · 4 midfielders · 2 forwards","4-2-3-1":"4 defenders · 5 midfielders · 1 forward","5-3-2":"5 defenders · 3 midfielders · 2 forwards","5-4-1":"5 defenders · 4 midfielders · 1 forward"};
        return '<div class="view-intro"><p class="panel-eyebrow">MATCH PREPARATION</p><h1>Tactics board</h1><p>Set your formation and team approach. Changes are saved to this manager career.</p></div><div class="metric-grid compact"><div class="metric-card"><span>FORMATION</span><strong>'+safe(formation)+'</strong><small>'+safe(shape[formation]||shape["4-3-3"])+'</small></div><div class="metric-card"><span>STARTING XI</span><strong>'+selected.length+' / 11</strong><small>'+available.length+' players available · '+currentPlayers.filter(p=>Number(p.injuryWeeks||0)>0).length+' injured</small></div></div><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">TACTICAL SHAPE</p><h2>Starting formation</h2><p class="subtle">Select a player on the pitch to open their profile. Choose your XI in Squad.</p></div><button class="game-btn secondary" data-page="squad">Manage starting XI</button></div><div class="tactics-layout">'+renderTacticalPitch(club)+'<div class="tactics-form"><label>Formation<select data-tactic="formation">'+options(["4-3-3","4-4-2","4-2-3-1","5-3-2","5-4-1"],formation)+'</select></label><label>Team mentality<select data-tactic="mentality">'+options(["Balanced","Attacking","Defensive"],career.tactics.mentality)+'</select></label><label>Tempo<select data-tactic="tempo">'+options(["Slow","Normal","Fast"],career.tactics.tempo)+'</select></label><label>Pressing<select data-tactic="pressing">'+options(["Low","Medium","High"],career.tactics.pressing)+'</select></label><label>Defensive line<select data-tactic="defensiveLine">'+options(["Deep","Normal","High"],career.tactics.defensiveLine)+'</select></label><p class="subtle">Formation affects lineup selection and match-strength calculations. Other settings are applied by the match engine where supported.</p></div></div></section><section class="game-panel"><div class="panel-heading"><div><h2>Selected players</h2><p class="subtle">Current starting XI, condition and role.</p></div><button class="text-btn" data-action="auto-lineup">Auto-pick best XI ↗</button></div><div class="table-scroll"><table class="data-table"><thead><tr><th>PLAYER</th><th>POSITION</th><th>OVERALL</th><th>FITNESS</th><th>AVAILABILITY</th></tr></thead><tbody>'+selected.map(pl=>'<tr><td><button class="player-name-link" data-action="view-player" data-player="'+pl.id+'">'+safe(pl.name)+'</button></td><td>'+safe(pl.position)+'</td><td>'+playerOverall(pl)+'</td><td>'+Math.round(Number(pl.fitness||0))+'/100</td><td>'+(Number(pl.injuryWeeks||0)>0?'<span class="fitness-status fitness-injured">Injured</span>':Number(pl.fitness||0)<50?'<span class="fitness-status fitness-unfit">Low fitness</span>':'<span class="fitness-status fitness-fit">Fit to play</span>')+'</td></tr>').join("")+'</tbody></table></div></section>';
    }
    if(page==="transfers"){
        const market=players.filter(p=>!p.retired&&clubForPlayer(p)!==club.name&&(!marketSearch||[p.name,p.club,p.nationality||""].join(" ").toLowerCase().includes(marketSearch.toLowerCase()))&&(marketPosition==="ALL"||p.position===marketPosition)).sort((a,b)=>playerOverall(b)-playerOverall(a));
        const pageSize=40,pages=Math.max(1,Math.ceil(market.length/pageSize));marketPage=Math.min(marketPage,pages-1);
        const shown=market.slice(marketPage*pageSize,(marketPage+1)*pageSize);
        return '<div class="view-intro"><p class="panel-eyebrow">RECRUITMENT</p><h1>Transfer market</h1><p>Search the international player pool and recruit within your transfer and wage budgets.</p></div><div class="metric-grid compact"><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Available to spend</small></div><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Current funds</small></div></div><section class="game-panel"><div class="panel-heading"><div><h2>Available players</h2><p class="subtle">Estimated fees and wages · '+market.length+' players match your filters</p></div></div><div class="market-filters"><input type="search" data-market-search value="'+safe(marketSearch)+'" placeholder="Search player, club or nationality" aria-label="Search transfer market"><select data-market-position aria-label="Filter by position">'+options(["ALL","GK","CB","LB","RB","CM","DM","AM","LM","RM","LW","RW","CF","ST"],marketPosition).replace('>ALL</option>','>All positions</option>')+'</select></div><div class="table-scroll"><table class="data-table"><thead><tr><th>PLAYER</th><th>POS</th><th>AGE</th><th>OVR</th><th>MARKET VALUE</th><th>CURRENT CLUB</th><th>EST. FEE</th><th>EST. WEEKLY WAGE</th><th></th></tr></thead><tbody>'+(shown.length?shown.map(p=>{const fee=transferFee(p),wage=estimateWage(p),sellerCount=players.filter(x=>!x.retired&&clubForPlayer(x)===clubForPlayer(p)).length,ownCount=players.filter(x=>!x.retired&&clubForPlayer(x)===club.name).length,ownWages=players.filter(x=>!x.retired&&clubForPlayer(x)===club.name).reduce((sum,x)=>sum+Number((career.contracts[x.id]||{}).wage||estimateWage(x)),0),canSign=fee<=career.transferBudget&&fee<=career.balance&&ownCount<33&&sellerCount>25&&ownWages+wage<=Number(club.finances.wageBudget||0);return '<tr><td><button type="button" class="player-name-link" data-action="view-player" data-player="'+p.id+'" aria-label="Open profile for '+safe(p.name)+'">'+safe(p.name)+'</button><small class="cell-sub">'+safe(p.nationality||"Nationality not listed")+'</small></td><td>'+safe(p.position)+'</td><td>'+p.age+'</td><td>'+playerOverall(p)+'</td><td>'+money(playerMarketValue(p))+'</td><td>'+safe(clubForPlayer(p))+'</td><td>'+money(fee)+'</td><td>'+money(wage)+'</td><td><button class="small-btn" data-action="buy-player" data-player="'+p.id+'" '+(!canSign?'disabled':'')+' title="'+(sellerCount<=25?'Seller must retain 25 players':ownCount>=33?'Squad limit reached':ownWages+wage>Number(club.finances.wageBudget||0)?'Wage budget exceeded':fee>career.transferBudget||fee>career.balance?'Insufficient funds':'Sign player')+'">Sign</button></td></tr>'}).join(""):'<tr><td colspan="9">No players match these filters.</td></tr>')+'</tbody></table></div><div class="panel-heading" style="margin-top:16px;margin-bottom:0"><span class="subtle">Page '+(marketPage+1)+' of '+pages+'</span><div><button class="small-btn" data-action="market-prev" '+(marketPage===0?'disabled':'')+'>Previous</button> <button class="small-btn" data-action="market-next" '+(marketPage>=pages-1?'disabled':'')+'>Next</button></div></div></section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">DEALS COMPLETED</p><h2>Recent transfer history</h2></div><span class="live-pill">'+(career.transferHistory||[]).length+' total</span></div>'+((career.transferHistory||[]).slice().reverse().slice(0,12).map(h=>'<div class="finance-transaction"><div><strong>'+safe(h.playerName||"Player transfer")+'</strong><small>Season '+Number(h.season||career.season)+' · '+safe(h.type||"Transfer")+' · '+safe(h.from||"Unknown club")+' → '+safe(h.to||"Unknown club")+'</small></div><strong class="'+(h.type==="Sale"?"positive":"negative")+'">'+money(h.fee||0)+'</strong></div>').join("")||'<p class="empty-state">Completed signings and sales will appear here.</p>')+'</section>';
    }
    if(page==="fixtures"){
        const allRounds=clubs.length*2-2,nextRound=career.fixtures.find(f=>!f.played);
        const selectedRound=fixtureRound==="NEXT"?(nextRound?Number(nextRound.round):allRounds):Math.max(1,Math.min(allRounds,Number(fixtureRound)||1));
        const roundFixtures=career.fixtures.filter(f=>Number(f.round)===selectedRound);
        const filteredFixtures=roundFixtures.filter(f=>fixtureFilter==="CLUB"?(Number(f.homeClubId)===Number(club.id)||Number(f.awayClubId)===Number(club.id)):fixtureFilter==="PLAYED"?!!f.played:fixtureFilter==="UPCOMING"?!f.played:true);
        const playedCount=roundFixtures.filter(f=>f.played).length;
        const roundOptions=Array.from({length:allRounds},(_,i)=>i+1).map(r=>'<option value="'+r+'" '+(r===selectedRound?'selected':'')+'>Matchday '+r+'</option>').join("");
        return '<div class="view-intro"><p class="panel-eyebrow">SEASON '+career.season+'</p><h1>Fixtures & results</h1><p>Follow the full home-and-away league schedule, filter results and jump directly to a matchday.</p></div><div class="metric-grid"><div class="metric-card"><span>SEASON PROGRESS</span><strong>'+career.fixtures.filter(f=>f.played).length+' / '+career.fixtures.length+'</strong><small>Fixtures completed league-wide</small></div><div class="metric-card"><span>YOUR NEXT MATCHDAY</span><strong>'+(nextRound?Number(nextRound.round):"—")+'</strong><small>'+(nextRound?"Matchday "+nextRound.round:"Season complete")+'</small></div><div class="metric-card"><span>SELECTED MATCHDAY</span><strong>'+playedCount+' / '+roundFixtures.length+'</strong><small>Fixtures completed on this matchday</small></div><div class="metric-card"><span>YOUR MATCH</span><strong>'+(roundFixtures.some(f=>(Number(f.homeClubId)===Number(club.id)||Number(f.awayClubId)===Number(club.id))&&f.played)?"Played":roundFixtures.some(f=>Number(f.homeClubId)===Number(club.id)||Number(f.awayClubId)===Number(club.id))?"Scheduled":"Not in this round")+'</strong><small>Selected club match status</small></div></div><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">MATCH CENTRE</p><h2>Matchday '+selectedRound+'</h2><p class="subtle">Showing '+filteredFixtures.length+' of '+roundFixtures.length+' fixtures. '+(nextRound?"Next unplayed matchday: "+nextRound.round+".":"All league fixtures are complete.")+'</p></div><button class="game-btn" id="playRoundButton">'+(nextRound?'Simulate next matchday '+nextRound.round:'Start next season')+' →</button></div><div class="fixture-controls"><label>Matchday<select data-fixture-round>'+roundOptions+'</select></label><label>Show<select data-fixture-filter>'+options(["ALL","CLUB","PLAYED","UPCOMING"],fixtureFilter).replace('>ALL</option>','>All fixtures</option>').replace('>CLUB</option>','>My club</option>').replace('>PLAYED</option>','>Played results</option>').replace('>UPCOMING</option>','>Upcoming only</option>')+'</select></label><button class="small-btn" data-action="fixtures-next">Jump to next matchday</button></div><div class="fixture-list">'+(filteredFixtures.length?filteredFixtures.map(f=>fixtureMarkup(f,club.id)).join(""):'<p class="empty-state">No fixtures match this filter on the selected matchday.</p>')+'</div><div class="fixture-footer"><span class="subtle">Matchday '+selectedRound+' of '+allRounds+'</span><div><button class="small-btn" data-action="fixtures-prev" '+(selectedRound<=1?'disabled':'')+'>← Previous</button> <button class="small-btn" data-action="fixtures-next-round" '+(selectedRound>=allRounds?'disabled':'')+'>Next matchday →</button></div></div></section>';
    }
    if(page==="league"){
        const completed=career.fixtures.filter(f=>f.played).length,total=career.fixtures.length;
        const leader=table[0],myRank=table.findIndex(t=>Number(t.clubId)===Number(club.id))+1;
        const pointsGap=Math.max(0,Number(leader&&leader.points||0)-Number(standing.points||0));
        const clubForm=career.fixtures.filter(f=>f.played&&f.result&&(Number(f.homeClubId)===Number(club.id)||Number(f.awayClubId)===Number(club.id))).sort((a,b)=>a.round-b.round).slice(-5).reverse().map(f=>{const gf=Number(f.homeClubId)===Number(club.id)?f.result.homeGoals:f.result.awayGoals,ga=Number(f.homeClubId)===Number(club.id)?f.result.awayGoals:f.result.homeGoals;return gf>ga?"W":gf===ga?"D":"L"});
        return '<div class="view-intro"><p class="panel-eyebrow">GINGA INTERNATIONAL LEAGUE</p><h1>League table</h1><p>Points, goal difference and goals scored determine the standings. All '+clubs.length+' clubs compete in a home-and-away season.</p></div><div class="metric-grid"><div class="metric-card"><span>YOUR POSITION</span><strong>#'+myRank+'</strong><small>'+standing.points+' points</small></div><div class="metric-card"><span>POINTS TO LEADER</span><strong>'+pointsGap+'</strong><small>'+(myRank===1?"You are top of the league":safe(leader.club)+" lead the table")+'</small></div><div class="metric-card"><span>GOAL DIFFERENCE</span><strong>'+(standing.goalsFor-standing.goalsAgainst>0?"+":"")+(standing.goalsFor-standing.goalsAgainst)+'</strong><small>'+standing.goalsFor+' scored · '+standing.goalsAgainst+' conceded</small></div><div class="metric-card"><span>LEAGUE PROGRESS</span><strong>'+Math.round(completed/Math.max(1,total)*100)+'%</strong><small>'+completed+' of '+total+' matches played</small></div></div><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">CURRENT STANDINGS</p><h2>Season '+career.season+'</h2><p class="subtle">Your club is highlighted. Tiebreakers: points, goal difference, goals scored.</p></div><button class="text-btn" data-page="fixtures">View fixtures ↗</button></div>'+tableMarkup(table,club.id,false)+'</section><section class="game-panel"><div class="panel-heading"><div><h2>Your recent form</h2><p class="subtle">Last five completed league matches.</p></div></div><div class="dashboard-form-line"><strong>'+safe(club.name)+'</strong><div class="dashboard-form-chips">'+(clubForm.length?clubForm.map(x=>'<span class="form-chip form-'+x.toLowerCase()+'">'+x+'</span>').join(""):'<span class="subtle">No matches played</span>')+'</div></div></section>';
    }
    if(page==="finances"){
        const wages=currentPlayers.reduce((sum,pl)=>sum+Number((career.contracts[pl.id]||{}).wage||estimateWage(pl)),0);
        const wageBudget=Math.max(1,Number(club.finances.wageBudget||0)),headroom=wageBudget-wages;
        const transferSpent=(career.transferHistory||[]).filter(h=>Number(h.season)===Number(career.season)&&h.type==="Signing").reduce((s,h)=>s+Number(h.fee||0),0);
        const transferIncome=(career.transferHistory||[]).filter(h=>Number(h.season)===Number(career.season)&&h.type==="Sale").reduce((s,h)=>s+Number(h.fee||0),0);
        const transactions=(career.financialTransactions||[]).filter(t=>Number(t.season)===Number(career.season)).slice(0,20);
        const transactionMarkup=transactions.length?transactions.map(t=>'<div class="finance-transaction"><div><strong>'+safe(t.description)+'</strong><small>Season '+Number(t.season)+' · Matchday '+Number(t.round)+'</small></div><strong class="'+(t.type==="income"?"positive":"negative")+'">'+(t.type==="income"?"+":"−")+money(t.amount)+'</strong></div>').join(""):'<p class="empty-state">Financial transactions will appear here as you play matches and complete transfers.</p>';
        return '<div class="view-intro"><p class="panel-eyebrow">CLUB ACCOUNTING</p><h1>Finances</h1><p>Monitor cash, recruitment allocation, wage commitments and recorded matchday transactions.</p></div><div class="metric-grid"><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Current available funds</small></div><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Recruitment allocation remaining</small></div><div class="metric-card"><span>WEEKLY WAGES</span><strong>'+money(wages)+'</strong><small>'+Math.round(wages/wageBudget*100)+'% of weekly allowance</small></div><div class="metric-card"><span>MANAGER SALARY</span><strong>'+money(career.managerSalary||0)+'</strong><small>Manager salary estimate</small></div></div><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">WAGE CONTROL</p><h2>Weekly payroll</h2></div><span class="live-pill '+(headroom<0?'negative':'')+'">'+(headroom<0?'Over budget':'Within budget')+'</span></div><div class="finance-line"><span>Registered squad wages</span><strong>'+money(wages)+'</strong></div><div class="finance-line"><span>Manager salary</span><strong>'+money(career.managerSalary||0)+'</strong></div><div class="finance-line"><span>Weekly wage allowance</span><strong>'+money(wageBudget)+'</strong></div><div class="finance-line total"><span>Wage headroom</span><strong class="'+(headroom<0?'negative':'positive')+'">'+money(headroom)+'</strong></div><div class="dashboard-progress"><div><span>Wage allowance used</span><strong>'+Math.round(wages/wageBudget*100)+'%</strong></div><div class="dashboard-progress-track"><i class="'+(wages>wageBudget?'bar-danger':'')+'" style="width:'+Math.min(100,wages/wageBudget*100)+'%"></i></div></div><p class="subtle">New signings are blocked when their estimated wage would exceed the squad wage allowance.</p></section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">SEASON LEDGER</p><h2>Income and expenditure</h2><p class="subtle">Matchday accounting for the current season.</p></div></div><div class="finance-line"><span>Starting club balance</span><strong>'+money(club.finances.balance)+'</strong></div><div class="finance-line"><span>Matchday income / bonuses</span><strong class="positive">+'+money(career.totalIncome||0)+'</strong></div><div class="finance-line"><span>Matchday operating costs</span><strong class="negative">−'+money(career.totalCosts||0)+'</strong></div><div class="finance-line"><span>Transfer spending this season</span><strong class="negative">−'+money(transferSpent)+'</strong></div><div class="finance-line"><span>Transfer sales this season</span><strong class="positive">+'+money(transferIncome)+'</strong></div><div class="finance-line total"><span>Recorded matchday net</span><strong class="'+(Number(career.totalIncome||0)-Number(career.totalCosts||0)<0?'negative':'positive')+'">'+money(Number(career.totalIncome||0)-Number(career.totalCosts||0))+'</strong></div><p class="subtle">Transfer fees affect club balance and recruitment funds. Matchday totals are shown separately to avoid double-counting transfers.</p></section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">AUDIT TRAIL</p><h2>Recent transactions</h2></div><span class="live-pill">'+transactions.length+' listed</span></div>'+transactionMarkup+'</section><div class="hero-actions"><button class="game-btn secondary" data-page="transfers">Open transfer market</button><button class="game-btn secondary" data-page="squad">Review squad wages</button></div>';
    }
    if(page==="board"){
        const confidence=Math.max(0,Math.min(100,Math.round(Number(career.boardConfidence||70))));
        const wages=currentPlayers.reduce((sum,pl)=>sum+Number((career.contracts[pl.id]||{}).wage||estimateWage(pl)),0);
        const wageBudget=Math.max(1,Number(club.finances.wageBudget||0));
        const topHalf=Math.ceil(clubs.length/2),leagueProgress=standing.played?Math.min(100,Math.round(standing.points/Math.max(1,standing.played*3)*100)):0;
        const objectives=[
          {title:"League performance",description:"Finish in the top half of the league.",status:standing.played===0?"Awaiting first result":position<=topHalf?"On track":"Below target",detail:"Position #"+position+" · target top "+topHalf,ok:standing.played===0||position<=topHalf},
          {title:"Financial discipline",description:"Keep club funds above zero and control weekly wages.",status:Number(career.balance)>0&&wages<=wageBudget?"On track":"Action required",detail:"Balance "+money(career.balance)+" · wages "+Math.round(wages/wageBudget*100)+"% of allowance",ok:Number(career.balance)>0&&wages<=wageBudget},
          {title:"Squad registration",description:"Maintain a registered squad of 25–33 players.",status:currentPlayers.length>=25&&currentPlayers.length<=33?"On track":"Action required",detail:currentPlayers.length+" registered players",ok:currentPlayers.length>=25&&currentPlayers.length<=33},
          {title:"Starting XI",description:"Select exactly 11 players for the next match.",status:(career.startingXI||[]).length===11?"Lineup selected":"Select 11 players",detail:(career.startingXI||[]).length+" of 11 selected",ok:(career.startingXI||[]).length===11}
        ];
        const history=(career.boardHistory||[]).slice(-10).reverse();
        const historyMarkup=history.length?history.map(h=>'<div class="finance-transaction"><div><strong>Matchday '+Number(h.round)+'</strong><small>Season '+Number(h.season)+'</small></div><strong>'+Math.round(Number(h.confidence))+'%</strong></div>').join(""):'<p class="empty-state">Board confidence history will appear after your first match.</p>';
        return '<div class="view-intro"><p class="panel-eyebrow">CLUB LEADERSHIP</p><h1>Board expectations</h1><p>Review your objectives, financial discipline, reputation and career opportunities.</p></div><div class="metric-grid"><div class="metric-card"><span>BOARD CONFIDENCE</span><strong>'+confidence+'%</strong><small>'+(confidence>=75?'The board is pleased with progress.':confidence>=45?'The board expects improvement.':'Pressure is increasing after recent results.')+'</small></div><div class="metric-card"><span>MANAGER REPUTATION</span><strong>'+Math.round(career.managerReputation||50)+'/100</strong><small>Strong finishes improve future job prospects</small></div><div class="metric-card"><span>LEAGUE POSITION</span><strong>#'+position+'</strong><small>'+standing.points+' points · '+standing.played+' played</small></div><div class="metric-card"><span>JOB OFFERS</span><strong>'+(career.jobOffers||[]).length+'</strong><small>Alternative clubs available</small></div></div><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">SEASON OBJECTIVES</p><h2>Board assessment</h2></div><span class="live-pill">'+objectives.filter(o=>o.ok).length+' / '+objectives.length+' on track</span></div>'+objectives.map(o=>'<article class="objective-card"><span class="objective-icon">'+(o.ok?'✓':'!')+'</span><div><strong>'+safe(o.title)+'</strong><p>'+safe(o.description)+'</p><small class="'+(o.ok?'positive':'negative')+'">'+safe(o.status)+' · '+safe(o.detail)+'</small></div></article>').join("")+'<div class="dashboard-progress"><div><span>Points earned against maximum available</span><strong>'+leagueProgress+'%</strong></div><div class="dashboard-progress-track"><i style="width:'+leagueProgress+'%"></i></div></div></section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">CONFIDENCE HISTORY</p><h2>Board sentiment</h2></div></div>'+historyMarkup+'</section>'+(career.jobOffers&&career.jobOffers.length?'<section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">CAREER PROGRESSION</p><h2>Job offers</h2></div></div>'+career.jobOffers.map(o=>'<div class="finance-line"><span><strong>'+safe(o.clubName)+'</strong><small class="cell-sub">League finish: '+Number(o.position)+' · Weekly salary: '+money(o.weeklySalary)+' · Transfer allocation: '+money(o.transferBudget)+'</small></span><button class="small-btn" data-action="accept-job-offer" data-club="'+o.clubId+'">Accept job</button></div>').join("")+'</section>':'<section class="game-panel"><h2>Career progression</h2><p class="subtle">Complete the season to generate job opportunities based on manager reputation and league performance.</p></section>');
    }
    if(page==="staff"){
        const wage=Number(career.managerSalary||0),confidence=Math.round(Number(career.boardConfidence||70)),reputation=Math.round(Number(career.managerReputation||50));
        const completed=career.fixtures.filter(f=>f.played).length;
        const attributes=[["Tactical knowledge",manager.tactical_knowledge],["Man management",manager.man_management],["Youth development",manager.youth_development],["Motivational ability",manager.motivational_ability],["Discipline",manager.discipline],["Recruitment & scouting",manager.recruitment_scouting]];
        return '<div class="view-intro"><p class="panel-eyebrow">TECHNICAL AREA</p><h1>Manager profile</h1><p>Your coaching identity, career performance and managerial attributes.</p></div><section class="game-panel"><div class="profile-top"><div class="profile-avatar">'+safe((manager.manager_name||"M").split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase())+'</div><div><h2>'+safe(manager.manager_name||"Manager")+'</h2><p class="subtle">'+safe(manager.nationality||"Nationality not set")+' · '+safe(manager.coaching_licence||"Licence not set")+'</p><span class="live-pill">'+safe(manager.management_style||"Balanced")+' manager</span></div><button class="game-btn secondary" data-action="edit-profile">Edit profile</button></div><div class="metric-grid"><div class="metric-card"><span>MANAGER REPUTATION</span><strong>'+reputation+'/100</strong><small>Career standing</small></div><div class="metric-card"><span>BOARD CONFIDENCE</span><strong>'+confidence+'%</strong><small>Current club confidence</small></div><div class="metric-card"><span>WEEKLY SALARY</span><strong>'+money(wage)+'</strong><small>Manager salary estimate</small></div><div class="metric-card"><span>SEASON RECORD</span><strong>'+standing.wins+'–'+standing.draws+'–'+standing.losses+'</strong><small>'+completed+' league fixtures played</small></div></div><div class="panel-divider"></div><h2>Coaching attributes</h2><div class="skill-grid">'+attributes.map(a=>'<div class="skill"><div><span>'+safe(a[0])+'</span><strong>'+Number(a[1]||50)+'</strong></div><div class="skill-track"><i style="width:'+Math.max(1,Math.min(100,Number(a[1]||50)))+'%"></i></div></div>').join("")+'</div><div class="panel-divider"></div><h2>Current appointment</h2><div class="finance-line"><span>Club</span><strong>'+safe(club.name)+'</strong></div><div class="finance-line"><span>Season</span><strong>'+Number(career.season||1)+'</strong></div><div class="finance-line"><span>League position</span><strong>#'+position+' of '+clubs.length+'</strong></div><div class="finance-line"><span>League points</span><strong>'+standing.points+'</strong></div><div class="finance-line"><span>Manager style</span><strong>'+safe(manager.management_style||"Balanced")+'</strong></div><div class="hero-actions"><button class="game-btn" data-action="edit-profile">Edit manager profile</button><button class="game-btn secondary" data-page="board">View career opportunities</button></div></section>';
    }
    if(page==="news"){
        const all=(career.news||[]).slice().reverse();
        const filtered=all.filter(n=>(newsCategory==="ALL"||newsCategoryFor(n)===newsCategory)&&(!newsSearch||[n.date,n.title,n.body].join(" ").toLowerCase().includes(newsSearch.toLowerCase())));
        const pageSize=20,pages=Math.max(1,Math.ceil(filtered.length/pageSize));
        newsPage=Math.max(0,Math.min(newsPage,pages-1));
        const shown=filtered.slice(newsPage*pageSize,(newsPage+1)*pageSize);
        return '<div class="view-intro"><p class="panel-eyebrow">AROUND THE CLUB</p><h1>Club news</h1><p>Search and filter match reports, transfers, training updates and career events. The latest '+all.length+' updates are retained.</p></div><div class="metric-grid compact"><div class="metric-card"><span>UPDATES RETAINED</span><strong>'+all.length+'</strong><small>Latest club history</small></div><div class="metric-card"><span>FILTERED RESULTS</span><strong>'+filtered.length+'</strong><small>Matching updates</small></div></div><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">CLUB BULLETIN</p><h2>News archive</h2></div><span class="live-pill">Page '+(newsPage+1)+' / '+pages+'</span></div><div class="news-controls"><input type="search" data-news-search value="'+safe(newsSearch)+'" placeholder="Search news, match, player or date" aria-label="Search club news"><select data-news-category>'+options(["ALL","MATCHES","TRANSFERS","TRAINING","SQUAD","CONTRACTS","BOARD","SEASON","OTHER"],newsCategory).replace('>ALL</option>','>All categories</option>').replace('>MATCHES</option>','>Matches</option>').replace('>TRANSFERS</option>','>Transfers</option>').replace('>TRAINING</option>','>Training</option>').replace('>SQUAD</option>','>Squad & fitness</option>').replace('>CONTRACTS</option>','>Contracts</option>').replace('>BOARD</option>','>Board & career</option>').replace('>SEASON</option>','>Season updates</option>').replace('>OTHER</option>','>Other</option>')+'</select></div>'+(shown.length?shown.map(n=>'<article class="news-item"><span class="news-dot"></span><div><small>'+safe(n.date||"SEASON "+career.season)+' · '+safe(newsCategoryFor(n))+'</small><h3>'+safe(n.title)+'</h3><p>'+safe(n.body)+'</p></div></article>').join(""):'<p class="empty-state">No news matches your search or selected category.</p>')+'<div class="fixture-footer"><span class="subtle">Showing '+(filtered.length?newsPage*pageSize+1:0)+'–'+Math.min(filtered.length,(newsPage+1)*pageSize)+' of '+filtered.length+' updates</span><div><button class="small-btn" data-action="news-prev" '+(newsPage===0?'disabled':'')+'>← Previous</button> <button class="small-btn" data-action="news-next" '+(newsPage>=pages-1?'disabled':'')+'>Next →</button></div></div></section>';
    }
    return '<section class="game-panel"><h2>Ginga FM</h2><p>Choose a section from the menu to continue.</p></section>';
}

function renderDashboard(context) {
    const {club,manager,table,standing,position,currentPlayers}=context;
    const clubFixtures=career.fixtures.filter(f=>Number(f.homeClubId)===Number(club.id)||Number(f.awayClubId)===Number(club.id));
    const played=clubFixtures.filter(f=>f.played&&f.result).sort((a,b)=>a.round-b.round);
    const nextFixtures=clubFixtures.filter(f=>!f.played).sort((a,b)=>a.round-b.round).slice(0,5);
    const recentClub=played.slice(-5).reverse();
    const goalsFor=played.reduce((sum,f)=>sum+(Number(f.homeClubId)===Number(club.id)?Number(f.result.homeGoals||0):Number(f.result.awayGoals||0)),0);
    const goalsAgainst=played.reduce((sum,f)=>sum+(Number(f.homeClubId)===Number(club.id)?Number(f.result.awayGoals||0):Number(f.result.homeGoals||0)),0);
    const goalDifference=goalsFor-goalsAgainst;
    const form=recentClub.map(f=>{const gf=Number(f.homeClubId)===Number(club.id)?f.result.homeGoals:f.result.awayGoals;const ga=Number(f.homeClubId)===Number(club.id)?f.result.awayGoals:f.result.homeGoals;return gf>ga?"W":gf===ga?"D":"L"});
    const formMarkup=form.length?form.map(x=>'<span class="form-chip form-'+x.toLowerCase()+'" title="'+(x==="W"?"Win":x==="D"?"Draw":"Loss")+'">'+x+'</span>').join(""):'<span class="subtle">No matches played</span>';
    const lastPosition=Number(career.previousSeasonPosition||0);
    const movement=lastPosition?(lastPosition-position):0;
    const movementLabel=!lastPosition?"First season":movement>0?"↑ "+movement+" place(s) vs last season":movement<0?"↓ "+Math.abs(movement)+" place(s) vs last season":"Same place as last season";
    const available=currentPlayers.filter(p=>Number(p.injuryWeeks||0)<=0);
    const matchFit=available.filter(p=>Number(p.fitness==null?100:p.fitness)>=50);
    const injured=currentPlayers.filter(p=>Number(p.injuryWeeks||0)>0);
    const lowFitness=available.filter(p=>Number(p.fitness==null?100:p.fitness)<50);
    const selectedCount=(career.startingXI||[]).filter(id=>currentPlayers.some(p=>Number(p.id)===Number(id)&&Number(p.injuryWeeks||0)<=0)).length;
    const squadWages=currentPlayers.reduce((sum,p)=>sum+Number((career.contracts[p.id]||{}).wage||estimateWage(p)),0);
    const wageBudget=Math.max(1,Number(club.finances.wageBudget||0));
    const wagePercent=Math.round(squadWages/wageBudget*100);
    const wageHeadroom=wageBudget-squadWages;
    const income=Number(career.totalIncome||0),costs=Number(career.totalCosts||0);
    const titleGap=Math.max(0,Number((table[0]||{}).points||0)-Number(standing.points||0));
    const nextOpponentFixture=nextFixtures[0];
    const nextOpponentId=nextOpponentFixture?(Number(nextOpponentFixture.homeClubId)===Number(club.id)?nextOpponentFixture.awayClubId:nextOpponentFixture.homeClubId):null;
    const nextOpponent=getClub(nextOpponentId);
    const opponentStanding=nextOpponentId?table.find(t=>Number(t.clubId)===Number(nextOpponentId)):null;
    const unread=Math.max(0,(career.news||[]).length-Number(career.newsSeenCount||0));
    const latestNews=(career.news||[]).slice(-4).reverse();
    const alerts=[];
    if(matchFit.length<11)alerts.push({level:"danger",title:"Not enough match-fit players",body:matchFit.length+" player(s) currently meet the fitness threshold. Review availability and the starting XI.",page:"squad",action:"Review squad"});
    if(injured.length)alerts.push({level:"warning",title:injured.length+" player(s) injured",body:injured.slice(0,3).map(p=>p.name+" ("+p.injuryWeeks+" MD)").join(" · ")+(injured.length>3?" and "+(injured.length-3)+" more":""),page:"squad",action:"Check injuries"});
    if(lowFitness.length)alerts.push({level:"warning",title:lowFitness.length+" player(s) have low fitness",body:"Players below 50 fitness are flagged as unfit. Consider a fitness recovery session.",page:"squad",action:"Run recovery"});
    if(currentPlayers.length<25||currentPlayers.length>33)alerts.push({level:"danger",title:"Squad registration outside target",body:"Your squad has "+currentPlayers.length+" registered players; the target range is 25–33.",page:"squad",action:"Manage squad"});
    if(wageHeadroom<0)alerts.push({level:"danger",title:"Wage budget exceeded",body:"Weekly wages are "+money(Math.abs(wageHeadroom))+" above the club allowance.",page:"finances",action:"Review finances"});
    else if(wageHeadroom<wageBudget*0.1)alerts.push({level:"warning",title:"Limited wage headroom",body:"Only "+money(wageHeadroom)+" remains within the weekly wage allowance.",page:"finances",action:"Review wages"});
    if(Number(career.balance||0)<=0)alerts.push({level:"danger",title:"Club balance is at or below zero",body:"Review operating costs and recruitment before committing more funds.",page:"finances",action:"Open finances"});
    if(Number(career.boardConfidence||70)<45)alerts.push({level:"warning",title:"Board confidence is under pressure",body:"Recent results or financial performance may put your position at risk.",page:"board",action:"Review board"});
    if(!alerts.length)alerts.push({level:"good",title:"No urgent club alerts",body:"Squad availability, wage headroom and club balance show no immediate dashboard warning.",page:"squad",action:"Review squad"});
    const objectiveMet=position<=Math.ceil(clubs.length/2);
    const confidence=Math.round(Number(career.boardConfidence==null?70:career.boardConfidence));
    const confidenceText=confidence>=75?"Strong":confidence>=45?"Stable":"At risk";
    const crest=safe(club.name.split(/\s+/).map(w=>w[0]).join("").slice(0,3));
    const matchReport=career.lastResult?'<section class="game-panel match-report"><div class="panel-heading"><div><p class="panel-eyebrow">LATEST MATCH</p><h2>'+safe(career.lastResult.homeTeam)+' '+Number(career.lastResult.homeGoals||0)+'–'+Number(career.lastResult.awayGoals||0)+' '+safe(career.lastResult.awayTeam)+'</h2></div><span class="live-pill">MATCHDAY '+Number(career.lastResult.round||0)+'</span></div><div class="metric-grid compact"><div class="metric-card"><span>SHOTS</span><strong>'+Number(career.lastResult.homeShots||0)+'–'+Number(career.lastResult.awayShots||0)+'</strong><small>Home · Away</small></div><div class="metric-card"><span>POSSESSION</span><strong>'+Number(career.lastResult.homePossession||50)+'%–'+Number(career.lastResult.awayPossession||50)+'%</strong><small>Home · Away</small></div></div><p class="subtle">'+safe((career.lastResult.scorers||[]).join(" · ")||"No goals recorded")+'</p></section>':'';
    const upcomingMarkup=nextFixtures.length?nextFixtures.map((f,i)=>{
        const isHome=Number(f.homeClubId)===Number(club.id),opponent=getClub(isHome?f.awayClubId:f.homeClubId),oppTable=table.find(t=>Number(t.clubId)===Number(opponent.id));
        return '<div class="dashboard-fixture"><div><span class="round-tag">MD '+Number(f.round)+'</span><strong>'+(isHome?"HOME":"AWAY")+'</strong></div><div class="dashboard-opponent"><span class="mini-crest">'+safe(opponent.name.split(/\s+/).map(w=>w[0]).join("").slice(0,2))+'</span><span><b>'+safe(opponent.name)+'</b><small>'+(oppTable?"League position #"+(table.indexOf(oppTable)+1):"League position pending")+'</small></span></div><span class="fixture-state scheduled">'+(i===0?"NEXT":"UPCOMING")+'</span></div>';
    }).join(""):'<p class="empty-state">All league fixtures are complete. Start the next season when ready.</p>';
    const alertMarkup=alerts.slice(0,6).map(a=>'<article class="dashboard-alert alert-'+a.level+'"><span class="alert-symbol">'+(a.level==="danger"?"!":a.level==="warning"?"⚠":"✓")+'</span><div><strong>'+safe(a.title)+'</strong><p>'+safe(a.body)+'</p><button class="text-btn" data-page="'+a.page+'">'+safe(a.action)+' ↗</button></div></article>').join("");
    const newsMarkup=latestNews.length?latestNews.map(n=>'<article class="news-item"><span class="news-dot"></span><div><small>'+safe(n.date||"SEASON "+career.season)+'</small><h3>'+safe(n.title)+'</h3><p>'+safe(n.body)+'</p></div></article>').join(""):'<p class="empty-state">Club updates will appear here as you play matches, train and make transfers.</p>';
    const formStats=recentClub.reduce((acc,f)=>{const gf=Number(f.homeClubId)===Number(club.id)?f.result.homeGoals:f.result.awayGoals;const ga=Number(f.homeClubId)===Number(club.id)?f.result.awayGoals:f.result.homeGoals;acc[gf>ga?"w":gf===ga?"d":"l"]++;return acc},{w:0,d:0,l:0});
    return '<div class="hero-panel"><div class="hero-copy"><p class="hero-kicker">THE TOUCHLINE IS YOURS</p><h1>Welcome back, '+safe(manager.manager_name||"Gaffer")+'.</h1><p>'+safe(club.name)+' · Season '+career.season+'. Your next decisions start here.</p><div class="hero-actions"><button class="game-btn" id="playRoundButton">'+(nextOpponentFixture?'Simulate Matchday '+nextOpponentFixture.round:'Start next season')+' <span>→</span></button><button class="game-btn secondary" data-page="squad">View squad</button><button class="game-btn secondary" data-page="tactics">Tactics</button></div></div><div class="hero-emblem"><div class="big-crest">'+crest+'</div><span>'+safe(String(club.city||"").toUpperCase())+' · '+safe(String(club.country||"Ghana").toUpperCase())+'</span></div></div>'+
    '<div class="metric-grid dashboard-key-metrics"><div class="metric-card"><span>LEAGUE POSITION</span><strong>#'+position+'</strong><small>'+Number(standing.points||0)+' points · '+Number(standing.played||0)+' played</small><em class="metric-trend">'+safe(movementLabel)+'</em></div><div class="metric-card"><span>CLUB BALANCE</span><strong>'+money(career.balance)+'</strong><small>Current available funds</small><em class="metric-trend '+(Number(career.balance||0)<=0?"negative":"positive")+'">'+(Number(career.balance||0)<=0?"Financial risk":"Available cash")+'</em></div><div class="metric-card"><span>TRANSFER BUDGET</span><strong>'+money(career.transferBudget)+'</strong><small>Recruitment funds remaining</small><em class="metric-trend">'+(Number(career.transferBudget||0)>0?"Available to spend":"No transfer allocation")+'</em></div><div class="metric-card"><span>SQUAD AVAILABILITY</span><strong>'+matchFit.length+' / '+currentPlayers.length+'</strong><small>'+injured.length+' injured · '+lowFitness.length+' low fitness</small><em class="metric-trend '+(matchFit.length<11?"negative":"positive")+'">'+(matchFit.length<11?"Fewer than 11 match-fit":"11+ match-fit players")+'</em></div></div>'+
    '<section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">SEASON PERFORMANCE</p><h2>Club form and league progress</h2></div><button class="text-btn" data-page="league">Full table ↗</button></div><div class="dashboard-performance-grid"><div class="dashboard-performance-stat"><span>RECORD</span><strong>'+standing.wins+'–'+standing.draws+'–'+standing.losses+'</strong><small>Wins · Draws · Losses</small></div><div class="dashboard-performance-stat"><span>GOALS</span><strong>'+goalsFor+' : '+goalsAgainst+'</strong><small>Scored : Conceded</small></div><div class="dashboard-performance-stat"><span>GOAL DIFFERENCE</span><strong class="'+(goalDifference>0?"positive":goalDifference<0?"negative":"")+'">'+(goalDifference>0?"+":"")+goalDifference+'</strong><small>Across '+played.length+' played</small></div><div class="dashboard-performance-stat"><span>GAP TO TOP</span><strong>'+titleGap+'</strong><small>Points behind 1st place</small></div></div><div class="dashboard-form-line"><strong>LAST FIVE</strong><div class="dashboard-form-chips">'+formMarkup+'</div><small>'+formStats.w+'W · '+formStats.d+'D · '+formStats.l+'L</small></div><div class="dashboard-progress"><div><span>League fixtures completed</span><strong>'+played.length+' / '+clubFixtures.length+'</strong></div><div class="dashboard-progress-track"><i style="width:'+Math.round(played.length/Math.max(1,clubFixtures.length)*100)+'%"></i></div></div></section>'+
    (matchReport||"")+
    '<div class="dashboard-columns"><div><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">MATCH CENTRE</p><h2>Next fixtures</h2><p class="subtle">Your next five scheduled league matches.</p></div><button class="text-btn" data-page="fixtures">All fixtures ↗</button></div>'+upcomingMarkup+'</section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">CLUB HEALTH</p><h2>Alerts and actions</h2></div><span class="live-pill">'+alerts.filter(a=>a.level==="danger"||a.level==="warning").length+' priority</span></div>'+alertMarkup+'</section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">LATEST UPDATES</p><h2>Club news</h2></div><button class="text-btn" data-page="news">All news ↗ '+(unread?'<span class="news-count">'+unread+'</span>':'')+'</button></div>'+newsMarkup+'</section></div><div><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">THE RACE</p><h2>League table</h2></div><button class="text-btn" data-page="league">Full table ↗</button></div>'+tableMarkup(table,club.id,true)+'</section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">FINANCIAL CONTROL</p><h2>Wages and cash flow</h2></div><button class="text-btn" data-page="finances">Finances ↗</button></div><div class="finance-line"><span>Weekly squad wages</span><strong>'+money(squadWages)+'</strong></div><div class="finance-line"><span>Weekly wage allowance</span><strong>'+money(wageBudget)+'</strong></div><div class="finance-line"><span>Wage headroom</span><strong class="'+(wageHeadroom<0?"negative":"positive")+'">'+money(wageHeadroom)+'</strong></div><div class="dashboard-progress"><div><span>Wage budget used</span><strong>'+wagePercent+'%</strong></div><div class="dashboard-progress-track"><i class="'+(wagePercent>100?"bar-danger":"")+'" style="width:'+Math.min(100,wagePercent)+'%"></i></div></div><div class="finance-line"><span>Season income</span><strong class="positive">'+money(income)+'</strong></div><div class="finance-line"><span>Season operating costs</span><strong class="negative">−'+money(costs)+'</strong></div><div class="finance-line total"><span>Net recorded cash flow</span><strong class="'+(income-costs<0?"negative":"positive")+'">'+money(income-costs)+'</strong></div><p class="subtle">Income and costs update when matchdays are simulated.</p></section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">BOARD EXPECTATIONS</p><h2>Season objectives</h2></div><button class="text-btn" data-page="board">Board room ↗</button></div><div class="dashboard-board-score"><strong>'+confidence+'%</strong><span>'+confidenceText+' confidence</span><div class="dashboard-progress-track"><i style="width:'+Math.max(0,Math.min(100,confidence))+'%"></i></div></div><div class="finance-line"><span>Top-half objective</span><strong class="'+(objectiveMet?"positive":"")+'">'+(objectiveMet?"On track":"Needs improvement")+'</strong></div><div class="finance-line"><span>Current league position</span><strong>#'+position+' / '+clubs.length+'</strong></div><div class="finance-line"><span>Manager reputation</span><strong>'+Math.round(Number(career.managerReputation||50))+'/100</strong></div>'+(career.jobOffers&&career.jobOffers.length?'<div class="notice-line">'+career.jobOffers.length+' job offer(s) available to review.</div>':'')+'<button class="game-btn secondary dashboard-full-button" data-page="board">Review board objectives</button></section><section class="game-panel"><div class="panel-heading"><div><p class="panel-eyebrow">QUICK MANAGEMENT</p><h2>Shortcuts</h2></div></div><div class="dashboard-shortcuts"><button data-page="squad">⚽ Squad & fitness</button><button data-page="tactics">♟ Tactics</button><button data-page="transfers">⇄ Transfer market</button><button data-page="finances">₵ Finances</button><button data-page="board">♧ Board expectations</button><button data-page="news">▣ Club news'+(unread?' · '+unread:'')+'</button></div></section></div></div>';
}

function options(values,current){return values.map(v=>'<option value="'+safe(v)+'" '+(v===current?'selected':'')+'>'+safe(v)+'</option>').join("")}
function fixtureMarkup(f,selectedId){
    const home=getClub(f.homeClubId),away=getClub(f.awayClubId),r=f.result;
    const selected=Number(f.homeClubId)===Number(selectedId)||Number(f.awayClubId)===Number(selectedId);
    return '<div class="fixture-row '+(selected?'your-fixture':'')+'"><span class="round-tag">MD '+f.round+'</span><div class="fixture-team home"><span class="mini-crest">'+safe(home.name.split(/\s+/).map(w=>w[0]).join("").slice(0,2))+'</span><strong>'+safe(home.name)+'</strong></div><div class="fixture-score">'+(f.played&&r?r.homeGoals+' <i>–</i> '+r.awayGoals:'<span>vs</span>')+'</div><div class="fixture-team away"><strong>'+safe(away.name)+'</strong><span class="mini-crest">'+safe(away.name.split(/\s+/).map(w=>w[0]).join("").slice(0,2))+'</span></div><span class="fixture-state '+(f.played?'played':'scheduled')+'">'+(f.played?'FT':'Scheduled')+'</span></div>';
}
function tableMarkup(table,selectedId,compact){
    const formFor=clubId=>career.fixtures.filter(f=>f.played&&f.result&&(Number(f.homeClubId)===Number(clubId)||Number(f.awayClubId)===Number(clubId))).sort((a,b)=>a.round-b.round).slice(-5).map(f=>{const gf=Number(f.homeClubId)===Number(clubId)?f.result.homeGoals:f.result.awayGoals,ga=Number(f.homeClubId)===Number(clubId)?f.result.awayGoals:f.result.homeGoals;return gf>ga?"W":gf===ga?"D":"L"});
    return '<div class="table-scroll"><table class="data-table league-table"><thead><tr><th>#</th><th>CLUB</th><th>P</th><th>W</th><th>D</th><th>L</th>'+(compact?'':'<th>GF</th><th>GA</th>')+'<th>GD</th><th>PTS</th>'+(compact?'':'<th>FORM</th>')+'</tr></thead><tbody>'+table.map((t,i)=>'<tr class="'+(Number(t.clubId)===Number(selectedId)?'your-row':'')+'"><td>'+(i+1)+'</td><td><span class="table-club"><span class="mini-crest">'+safe(t.club.split(/\s+/).map(w=>w[0]).join("").slice(0,2))+'</span><strong>'+safe(t.club)+'</strong></span></td><td>'+t.played+'</td><td>'+t.wins+'</td><td>'+t.draws+'</td><td>'+t.losses+'</td>'+(compact?'':'<td>'+t.goalsFor+'</td><td>'+t.goalsAgainst+'</td>')+'<td>'+(t.goalsFor-t.goalsAgainst>0?"+":"")+(t.goalsFor-t.goalsAgainst)+'</td><td><strong>'+t.points+'</strong></td>'+(compact?'':'<td><div class="table-form">'+(formFor(t.clubId).map(v=>'<span class="form-chip form-'+v.toLowerCase()+'">'+v+'</span>').join("")||'—')+'</div></td>')+'</tr>').join("")+'</tbody></table></div>';
}

function transferFee(player){const a=player.attributes||{},keys=["pace","shooting","passing","dribbling","defending","physical","stamina","composure","goalkeeping"].filter(k=>Number.isFinite(Number(a[k]))),overall=Math.round(keys.reduce((sum,k)=>sum+Number(a[k]),0)/Math.max(1,keys.length));return Math.round((overall*1100+Number(player.age||22)*250)/500)*500}
async function handleTacticChange(event){
    const key=event.target.dataset.tactic;if(!key)return;
    career.tactics[key]=event.target.value;Object.assign(getClub(career.clubId).tactics,career.tactics);
    try{await saveCareer("Tactics saved.");shell()}catch(e){showToast("Could not save tactics: "+e.message,true)}
}
async function handleAction(event){
    const action=event.currentTarget.dataset.action;
    if(action==="fixtures-next"){const next=career.fixtures.find(f=>!f.played);fixtureRound=next?String(next.round):String(clubs.length*2-2);shell();return}
    if(action==="fixtures-prev"||action==="fixtures-next-round"){const total=clubs.length*2-2,current=fixtureRound==="NEXT"?(career.fixtures.find(f=>!f.played)?.round||total):Number(fixtureRound)||1;fixtureRound=String(Math.max(1,Math.min(total,current+(action==="fixtures-next-round"?1:-1))));shell();return}
    if(action==="news-prev"||action==="news-next"){newsPage=Math.max(0,newsPage+(action==="news-next"?1:-1));shell();return}
    if(action==="view-player"){selectedPlayerId=Number(event.currentTarget.dataset.player);playerProfileReturnPage=activePage==="player-profile"?playerProfileReturnPage:activePage;activePage="player-profile";shell();return}
    if(action==="back-to-squad"){activePage=playerProfileReturnPage||"squad";shell();return}
    if(action==="edit-profile"){location.href="./manager.html";return}
    if(action==="train-squad"){
        const club=getClub(career.clubId),squad=players.filter(p=>!p.retired&&clubForPlayer(p)===club.name);let improved=0;
        const keys={technical:["passing","dribbling","shooting","crossing","vision"],physical:["pace","physical","stamina","acceleration","balance"],defending:["defending","tackling","interceptions","heading"],attacking:["shooting","dribbling","longShots","crossing"],balanced:["passing","stamina","composure"]};
        squad.forEach(p=>{if(Number(p.injuryWeeks||0)>0)return;if(trainingFocus==="fitness"){p.fitness=Math.min(100,Number(p.fitness||0)+8);return}if(trainingFocus==="morale"){p.morale=Math.min(100,Number(p.morale||50)+4);return}p.fitness=Math.max(20,Number(p.fitness||0)-3);const list=keys[trainingFocus]||keys.balanced,key=list[Math.floor(Math.random()*list.length)];if(Number(p.attributes[key]||0)<Number(p.potential||99)&&Math.random()<0.72){p.attributes[key]=Math.min(Number(p.potential||99),Number(p.attributes[key]||40)+1);improved++}ensurePlayerAttributes(p)});
        career.trainingLog=career.trainingLog||[];career.trainingLog.push({season:career.season,round:career.currentRound,focus:trainingFocus,summary:"Training completed: "+trainingFocus+". "+improved+" attribute improvement(s) recorded."});career.news.push({date:"TRAINING",title:"Squad training completed",body:career.trainingLog[career.trainingLog.length-1].summary});persistPlayerStates(club);
        try{await saveCareer("Training session completed.");shell()}catch(e){showToast("Training ran but could not be saved: "+e.message,true)}return
    }
    if(action==="accept-job-offer"){
        const nextClub=getClub(Number(event.currentTarget.dataset.club));
        if(!nextClub){showToast("That club is no longer available.",true);return}
        if(!confirm("Accept the job at "+nextClub.name+"? Your former club's players will remain with that club."))return;
        const previous=getClub(career.clubId);
        career.news.push({date:"SEASON "+career.season,title:"Managerial appointment",body:"After leaving "+previous.name+", you have accepted the manager role at "+nextClub.name+"."});
        career.clubId=nextClub.id;career.balance=nextClub.finances.balance;career.transferBudget=nextClub.finances.transferBudget;career.managerSalary=Number(career.jobOffers.find(o=>Number(o.clubId)===Number(nextClub.id))?.weeklySalary||Math.round(nextClub.finances.wageBudget*0.025));career.tactics={...nextClub.tactics};Object.assign(nextClub.tactics,career.tactics);
        career.startingXI=bestStartingXI(nextClub).map(p=>p.id);career.boardConfidence=70;career.jobOffers=[];
        try{await saveCareer("You are now managing "+nextClub.name+".");activePage="dashboard";shell()}catch(e){showToast("The appointment could not be saved: "+e.message,true)}return
    }
    if(action==="auto-lineup"){career.startingXI=bestStartingXI(getClub(career.clubId)).map(p=>p.id);try{await saveCareer("Best available starting XI selected.");shell()}catch(e){showToast("Could not save lineup: "+e.message,true)}return}
    if(action==="market-next"||action==="market-prev"){const count=players.filter(p=>!p.retired&&clubForPlayer(p)!==getClub(career.clubId).name&&(!marketSearch||[p.name,p.club,p.nationality||""].join(" ").toLowerCase().includes(marketSearch.toLowerCase()))&&(marketPosition==="ALL"||p.position===marketPosition)).length;const pages=Math.max(1,Math.ceil(count/40));marketPage=Math.max(0,Math.min(pages-1,marketPage+(action==="market-next"?1:-1)));shell();return}
    if(action==="sell-player"){
        const id=Number(event.currentTarget.dataset.player),player=players.find(p=>Number(p.id)===id),club=getClub(career.clubId),squad=players.filter(p=>clubForPlayer(p)===club.name);
        if(!player||squad.length<=25){showToast("Keep at least 25 registered players in your squad.",true);return}
        const fee=Math.round(transferFee(player)*0.7);
        if(!confirm("Sell "+player.name+" for "+money(fee)+"? This removes the player from your squad."))return;
        const other=clubs.filter(c=>c.id!==club.id&&players.filter(p=>!p.retired&&clubForPlayer(p)===c.name).length<33).sort((a,b)=>players.filter(p=>!p.retired&&clubForPlayer(p)===a.name).length-players.filter(p=>!p.retired&&clubForPlayer(p)===b.name).length)[0];
        if(!other){showToast("No destination club is available.",true);return}
        career.playerClubOverrides[id]=other.name;player.club=other.name;career.balance+=fee;career.transferBudget+=Math.round(fee*0.25);recordFinancialTransaction("income","Player sale: "+player.name,fee);career.contracts[id]={wage:0,years:0,expirySeason:career.season};career.startingXI=(career.startingXI||[]).filter(pid=>Number(pid)!==id);career.transferHistory=career.transferHistory||[];career.transferHistory.push({playerId:id,playerName:player.name,season:career.season,from:club.name,to:other.name,fee,type:"Sale"});
        career.news.push({date:"MATCHDAY "+career.currentRound,title:"Player sold",body:player.name+" has been sold to "+other.name+" for "+money(fee)+"."});
        try{persistPlayerStates(club);await saveCareer(player.name+" sold.");shell()}catch(e){showToast("Sale could not be saved: "+e.message,true)}return
    }
    if(action==="buy-player"){
        const id=Number(event.currentTarget.dataset.player),player=players.find(p=>p.id===id);if(!player||player.retired)return;
        const sellerClubName=clubForPlayer(player);
        const sellerSquad=players.filter(p=>!p.retired&&clubForPlayer(p)===sellerClubName);
        if(sellerSquad.length<=25){showToast("That club must retain at least 25 registered players. Choose another player.",true);return}
        const fee=transferFee(player),club=getClub(career.clubId),wage=estimateWage(player),squad=players.filter(p=>!p.retired&&clubForPlayer(p)===club.name);
        const weeklyWages=squad.reduce((sum,p)=>sum+Number((career.contracts[p.id]||{}).wage||estimateWage(p)),0);
        if(fee>career.transferBudget||fee>career.balance){showToast("This transfer exceeds your available funds.",true);return}
        if(weeklyWages+wage>club.finances.wageBudget){showToast("The player's estimated wage would exceed your weekly wage budget.",true);return}
        if(squad.length>=33){showToast("Your squad has reached the 33-player limit. Sell a player first.",true);return}
        if(!confirm("Sign "+player.name+" for "+money(fee)+" and an estimated weekly wage of "+money(wage)+"?"))return;
        career.playerClubOverrides[id]=club.name;player.club=club.name;career.contracts[id]={wage,years:3,expirySeason:career.season+2};career.balance-=fee;career.transferBudget-=fee;recordFinancialTransaction("expense","Player signing: "+player.name,fee);career.transferHistory=career.transferHistory||[];career.transferHistory.push({playerId:id,playerName:player.name,season:career.season,from:sellerClubName,to:club.name,fee,type:"Signing"});
        career.news.push({date:"MATCHDAY "+career.currentRound,title:"New signing confirmed",body:player.name+" has joined "+getClub(career.clubId).name+" for "+money(fee)+"."});
        try{await saveCareer(player.name+" signed successfully.");shell()}catch(e){showToast("Signing could not be saved: "+e.message,true)}
    }
}
async function playRound(){
    if(busy)return;
    const round=career.fixtures.find(f=>!f.played)?.round;
    if(!round){showToast("The season is complete.");return}
    if(!Array.isArray(career.startingXI)||career.startingXI.length!==11){showToast("Select exactly 11 available players in Squad Room before playing.",true);activePage="squad";shell();return}
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
    const matchCost=Math.round(Math.max(club.finances.wageBudget*0.12,squadWages*0.7)+Number(career.managerSalary||0)*0.7);
    let bonus=0;
    if(match){const score=match.fixture.result;if((match.home.id===club.id&&score.homeGoals>score.awayGoals)||(match.away.id===club.id&&score.awayGoals>score.homeGoals))bonus=5000;else if(score.homeGoals===score.awayGoals)bonus=2000}
    career.totalIncome=Number(career.totalIncome||0)+matchIncome+bonus;career.totalCosts=Number(career.totalCosts||0)+matchCost;
    career.balance=Number(career.balance||0)+matchIncome+bonus-matchCost;
    recordFinancialTransaction("income","Matchday income and bonuses",matchIncome+bonus);
    recordFinancialTransaction("expense","Matchday operating costs",matchCost);
    career.transferBudget=Math.max(0,Number(career.transferBudget||0)+Math.round((matchIncome+bonus-matchCost)*0.15));
    career.currentRound=round+1;
    if(match){
        const res=match.fixture.result,engineResult=match.result;
        updatePlayerCondition(match);
        const scorers=(engineResult.events||[]).filter(e=>e.type==="goal").map(e=>e.minute+"' "+e.player).slice(0,6);
        career.lastResult={homeTeam:match.home.name,awayTeam:match.away.name,homeGoals:res.homeGoals,awayGoals:res.awayGoals,round:round,homeShots:res.homeShots,awayShots:res.awayShots,homePossession:res.homePossession,awayPossession:res.awayPossession,events:(engineResult.events||[]).slice(0,30),scorers};
        const won=(match.home.id===club.id?res.homeGoals>res.awayGoals:res.awayGoals>res.homeGoals);
        career.boardConfidence=Math.max(0,Math.min(100,Number(career.boardConfidence||70)+(res.homeGoals===res.awayGoals?0:won?3:-4)));career.boardHistory=career.boardHistory||[];career.boardHistory.push({season:career.season,round,confidence:career.boardConfidence});if(career.boardHistory.length>60)career.boardHistory=career.boardHistory.slice(-60);
        career.news.push({date:"MATCHDAY "+round,title:match.home.name+" "+res.homeGoals+"–"+res.awayGoals+" "+match.away.name,body:"Shots "+(res.homeShots||0)+"–"+(res.awayShots||0)+" · Possession "+(res.homePossession||50)+"%–"+(res.awayPossession||50)+"%. "+(scorers.length?"Goals: "+scorers.join(", ")+".":"No goals were scored.")});
    }
    if(!career.fixtures.some(f=>!f.played))career.news.push({date:"SEASON "+career.season,title:"Season complete",body:"All "+(clubs.length*(clubs.length-1))+" league fixtures have been played. The final table is ready."});
    busy=false;
    try{await saveCareer("Matchday "+round+" complete. Results and finances saved.");activePage="dashboard";shell()}catch(e){showToast("Results were played, but saving failed. Keep this page open and retry: "+e.message,true);shell()}
}
async function startNextSeason(){
    if(busy||career.fixtures.some(f=>!f.played))return;
    if(!confirm("Start a new season? Your current season summary will remain in club news."))return;
    const finalTable=buildTable(),finalStanding=finalTable.find(t=>t.clubId===career.clubId),finalPosition=finalTable.indexOf(finalStanding)+1,club=getClub(career.clubId);career.previousSeasonPosition=finalPosition;
    career.news.push({date:"SEASON "+career.season+" FINAL",title:"Season "+career.season+" completed",body:club.name+" finished "+finalPosition+" in the league with "+finalStanding.points+" points."});
    career.seasonFinancialArchive=career.seasonFinancialArchive||[];career.seasonFinancialArchive.push({season:Number(career.season),income:Number(career.totalIncome||0),costs:Number(career.totalCosts||0)});if(career.seasonFinancialArchive.length>20)career.seasonFinancialArchive=career.seasonFinancialArchive.slice(-20);career.totalIncome=0;career.totalCosts=0;career.financialTotalsSeason=Number(career.season)+1;
    const repGain=finalPosition<=3?12:finalPosition<=10?7:finalPosition<=30?2:-5;
    career.managerReputation=Math.max(0,Math.min(100,Number(career.managerReputation||50)+repGain));
    const offerCount=career.managerReputation>=80?4:career.managerReputation>=55?3:1;
    const candidates=finalTable.slice(-25).filter(t=>t.clubId!==career.clubId).sort(()=>Math.random()-0.5).slice(0,offerCount);
    career.jobOffers=candidates.map(t=>{const target=getClub(t.clubId);return {clubId:target.id,clubName:target.name,position:finalTable.findIndex(x=>x.clubId===target.id)+1,weeklySalary:Math.round(target.finances.wageBudget*0.035/100)*100,transferBudget:target.finances.transferBudget}});
    if(career.jobOffers.length)career.news.push({date:"MANAGER MARKET",title:"New managerial opportunities",body:"Your season performance has attracted "+career.jobOffers.length+" potential job offer(s). Review them in Board Expectations."});
    let retirementCount=0;
    players.filter(p=>clubForPlayer(p)===club.name).forEach(p=>{const oldOverall=playerOverall(p);p.developmentHistory=p.developmentHistory||[];p.developmentHistory.push({season:career.season,overall:oldOverall});if(p.developmentHistory.length>12)p.developmentHistory=p.developmentHistory.slice(-12);const contract=career.contracts[p.id];if(contract&&Number(contract.years||0)>0){contract.years=Math.max(0,Number(contract.years)-1);if(contract.years===0){contract.wage=estimateWage(p);contract.years=1;contract.expirySeason=career.season+1;career.news.push({date:"CONTRACTS",title:"Contract renewed: "+p.name,body:p.name+" has entered a one-season rolling renewal at "+money(contract.wage)+" per week."})}}
        p.age=Number(p.age||20)+1;
        if(p.age<=23){const key=["pace","shooting","passing","dribbling","defending","physical","stamina","composure"][Math.floor(Math.random()*8)];p.attributes[key]=Math.min(99,Number(p.attributes[key]||45)+1+Math.floor(Math.random()*2))}
        else if(p.age>=32)["pace","stamina","physical"].forEach(k=>p.attributes[k]=Math.max(20,Number(p.attributes[k]||50)-1));
        p.fitness=Math.min(100,Number(p.fitness||80)+15);p.morale=Math.max(25,Math.min(100,Number(p.morale||50)+2));p.injuryWeeks=0;
        if(p.age>=35&&players.filter(x=>!x.retired&&clubForPlayer(x)===club.name).length-retirementCount>25&&Math.random()<0.22){p.retired=true;p.club="Retired Players";career.playerClubOverrides[p.id]="Retired Players";retirementCount++;career.news.push({date:"SEASON "+career.season+" FINAL",title:"Retirement announced",body:p.name+" has retired from professional football at age "+p.age+"."})}
    });
    persistPlayerStates(club);
    const aiMoves=runAITransferWindow();
    const positions=["GK","CB","LB","RB","CM","DM","AM","LW","RW","ST"],first=["Kofi","Kwame","Daniel","Samuel","Michael","Abdul","Emmanuel","Isaac","Nana","Joseph","Bright","Kojo"],last=["Mensah","Boateng","Asare","Owusu","Addo","Tetteh","Osei","Antwi","Adu","Frimpong","Yeboah","Sarpong"];
    let nextId=Math.max(0,...players.map(p=>Number(p.id)||0))+1;
    const youthSlots=Math.max(0,33-players.filter(p=>!p.retired&&clubForPlayer(p)===club.name).length);
    for(let i=0;i<Math.min(3,youthSlots);i++){
        const position=positions[Math.floor(Math.random()*positions.length)],attributes={};
        ["pace","shooting","passing","dribbling","defending","physical","stamina","composure"].forEach(k=>attributes[k]=40+Math.floor(Math.random()*26));
        if(position==="GK")attributes.goalkeeping=45+Math.floor(Math.random()*26);
        const youth={id:nextId++,name:first[Math.floor(Math.random()*first.length)]+" "+last[Math.floor(Math.random()*last.length)]+" "+(career.season+1),club:club.name,position,age:16+Math.floor(Math.random()*3),nationality:"Ghanaian",attributes,fitness:100,morale:70,form:60,injuryWeeks:0,appearances:0,goals:0};
        career.youthPlayers.push(youth);players.push({...youth});
    }
    career.season=Number(career.season||1)+1;career.fixtures=createFixtures();career.currentRound=1;career.lastResult=null;career.startingXI=bestStartingXI(club).map(p=>p.id);
    career.news.push({date:"SEASON "+career.season,title:"A new season begins",body:"The league table has reset. Three academy prospects have joined the club, "+aiMoves+" AI transfer(s) were completed across the league, and the squad has completed its seasonal development."});
    try{await saveCareer("Season "+career.season+" is ready.");activePage="dashboard";shell()}catch(e){showToast("Could not save the new season: "+e.message,true)}
}
async function signOut(){await supabaseClient.auth.signOut();location.replace("./login.html")}
async function init(){
    try{
        const {data,error}=await supabaseClient.auth.getUser();
        if(!error&&data.user)authUser=data.user;
        else{
            const {data:sessionData,error:sessionError}=await supabaseClient.auth.getSession();
            if(sessionError)throw sessionError;
            authUser=sessionData.session&&sessionData.session.user?sessionData.session.user:null;
        }
        if(!authUser){location.replace("./login.html");return}
        if(!getManager().manager_name){location.replace("./manager.html");return}
        if(!getManager().club_id){location.replace("./club-selection.html");return}
        if(!initCareer())return;
        const status=$("worldStatus");if(status)status.textContent="Syncing career save…";
        document.body.classList.add("game-ready");
        shell();
        try{await saveCareer();if(status)status.textContent="Career save connected"}catch(e){console.warn("Initial career sync skipped:",e);if(status)status.textContent="Save needs attention";showToast("Your career loaded, but its first save failed: "+e.message,true)}
    }catch(e){
        console.error("Ginga FM career initialization failed:",e);
        document.body.classList.add("game-ready");
        const view=$("view");
        if(view)view.innerHTML='<section class="game-panel"><h2>Career could not be loaded</h2><p class="subtle">Your account could not be verified or its career could not be initialized. The page has stopped automatic redirects. Your saved data has not been intentionally changed.</p><div class="hero-actions"><button class="game-btn" type="button" onclick="location.reload()">Try again</button><a class="game-btn secondary" href="./login.html">Go to login</a></div></section>';
        showToast("Career initialization failed. See the message on this page.",true);
    }
}
init();
})();