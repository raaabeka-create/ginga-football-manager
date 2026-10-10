// GINGA FM — match engine
// Deterministic team selection + tactical and player-condition effects.
// The main career passes the manager's selected XI; other clubs use best-fit AI XIs.

function playerOverall(player) {
    const a = player && player.attributes || {};
    const pos = String(player && player.position || "").toUpperCase();
    const values = pos === "GK"
        ? [["goalkeeping", 0.45], ["composure", 0.12], ["passing", 0.10], ["physical", 0.10], ["defending", 0.10], ["stamina", 0.08], ["pace", 0.05]]
        : pos === "CB" || pos === "LB" || pos === "RB"
        ? [["defending", 0.25], ["physical", 0.18], ["pace", 0.14], ["stamina", 0.12], ["passing", 0.12], ["composure", 0.10], ["dribbling", 0.05], ["shooting", 0.04]]
        : pos === "CM" || pos === "DM" || pos === "AM"
        ? [["passing", 0.20], ["stamina", 0.16], ["dribbling", 0.15], ["composure", 0.14], ["defending", 0.12], ["pace", 0.10], ["shooting", 0.08], ["physical", 0.05]]
        : [["shooting", 0.22], ["pace", 0.18], ["dribbling", 0.16], ["composure", 0.14], ["passing", 0.12], ["physical", 0.08], ["stamina", 0.06], ["defending", 0.04]];
    return Math.round(values.reduce((sum, entry) => sum + Number(a[entry[0]] || 0) * entry[1], 0));
}

function calculatePlayerEffectiveness(player) {
    const fitness = Math.max(0, Math.min(100, Number(player.fitness == null ? 100 : player.fitness)));
    const form = Math.max(0, Math.min(100, Number(player.form == null ? 50 : player.form)));
    const morale = Math.max(0, Math.min(100, Number(player.morale == null ? 50 : player.morale)));
    const injuryPenalty = Number(player.injuryWeeks || 0) > 0 ? 0.62 : 1;
    return playerOverall(player) * (0.72 + fitness / 357) * (0.88 + form / 625) * (0.92 + morale / 1250) * injuryPenalty;
}

function positionGroup(position) {
    const p = String(position || "").toUpperCase();
    if (p === "GK") return "GK";
    if (["CB", "LB", "RB"].includes(p)) return "DEF";
    if (["CM", "DM", "AM", "LM", "RM"].includes(p)) return "MID";
    return "ATT";
}

function selectBestLineup(club, requestedLineup) {
    const squad = (typeof players !== "undefined" ? players : []).filter(p => p.club === club.name);
    const eligible = squad.filter(p => Number(p.injuryWeeks || 0) <= 0);
    if (Array.isArray(requestedLineup) && requestedLineup.length === 11) {
        const selected = requestedLineup.map(id => eligible.find(p => Number(p.id) === Number(id))).filter(Boolean);
        if (selected.length === 11) return selected;
    }
    const sorted = eligible.slice().sort((a, b) => playerOverall(b) - playerOverall(a));
    const selected = [];
    const take = group => {
        const candidate = sorted.find(p => !selected.some(s => s.id === p.id) && positionGroup(p.position) === group);
        if (candidate) selected.push(candidate);
    };
    take("GK");
    for (let i = 0; i < 4; i++) take("DEF");
    for (let i = 0; i < 3; i++) take("MID");
    for (let i = 0; i < 3; i++) take("ATT");
    for (const p of sorted) if (selected.length < 11 && !selected.some(s => s.id === p.id)) selected.push(p);
    return selected.slice(0, 11);
}

function tacticalProfile(club) {
    const t = club && club.tactics || {};
    const formation = String(t.formation || "4-3-3");
    const mentality = String(t.mentality || "Balanced");
    const tempo = String(t.tempo || "Normal");
    const pressing = String(t.pressing || "Medium");
    const defensiveLine = String(t.defensiveLine || "Normal");
    return {
        attack: (mentality === "Attacking" ? 0.18 : mentality === "Defensive" ? -0.13 : 0) +
            (tempo === "Fast" ? 0.08 : tempo === "Slow" ? -0.04 : 0) +
            (formation === "4-3-3" || formation === "4-2-3-1" ? 0.05 : 0),
        defence: (mentality === "Defensive" ? 0.17 : mentality === "Attacking" ? -0.08 : 0) +
            (defensiveLine === "Deep" ? 0.06 : defensiveLine === "High" ? -0.04 : 0) +
            (formation === "5-3-2" || formation === "5-4-1" ? 0.08 : 0),
        pressure: pressing === "High" ? 0.10 : pressing === "Low" ? -0.04 : 0,
        fatigue: pressing === "High" ? 1.35 : pressing === "Low" ? 0.82 : 1
    };
}

function calculateTeamStrength(club, requestedLineup) {
    const lineup = selectBestLineup(club, requestedLineup);
    if (!lineup.length) return 45;
    const total = lineup.reduce((sum, p) => sum + calculatePlayerEffectiveness(p), 0);
    return total / lineup.length;
}

function calculateGoalChance(teamStrength, opponentStrength) {
    return Math.max(0.035, Math.min(0.16, 0.078 + (teamStrength - opponentStrength) * 0.0013));
}

function chooseScorer(lineup) {
    if (!lineup.length) return null;
    const weights = lineup.map(p => {
        const pos = String(p.position || "").toUpperCase();
        const a = p.attributes || {};
        return Math.max(1, Number(a.shooting || 35) * (["ST", "CF", "LW", "RW"].includes(pos) ? 1.8 : ["AM", "CM"].includes(pos) ? 1 : 0.45));
    });
    let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lineup.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return lineup[i];
    }
    return lineup[lineup.length - 1];
}

function simulateMatch(homeTeam, awayTeam, options) {
    options = options || {};
    const homeLineup = selectBestLineup(homeTeam, options.homeLineup);
    const awayLineup = selectBestLineup(awayTeam, options.awayLineup);
    const homeRaw = calculateTeamStrength(homeTeam, homeLineup.map(p => p.id));
    const awayRaw = calculateTeamStrength(awayTeam, awayLineup.map(p => p.id));
    const homeTactics = tacticalProfile(homeTeam);
    const awayTactics = tacticalProfile(awayTeam);
    const homeStrength = homeRaw + homeTactics.attack * 8 + homeTactics.pressure * 5 + 3.5;
    const awayStrength = awayRaw + awayTactics.attack * 8 + awayTactics.pressure * 5;
    const homeChance = calculateGoalChance(homeStrength, awayRaw + awayTactics.defence * 8);
    const awayChance = calculateGoalChance(awayStrength, homeRaw + homeTactics.defence * 8);
    const homeGoals = { value: 0 };
    const awayGoals = { value: 0 };
    const events = [];
    let homeShots = 0, awayShots = 0, homePossession = 50;
    for (let minute = 4; minute <= 90; minute += 4) {
        const homeAttack = Math.random() < Math.min(0.82, Math.max(0.25, 0.52 + (homeStrength - awayStrength) * 0.006));
        const attackingTeam = homeAttack ? homeTeam : awayTeam;
        const attackingLineup = homeAttack ? homeLineup : awayLineup;
        const defendingLineup = homeAttack ? awayLineup : homeLineup;
        const attackChance = homeAttack ? homeChance : awayChance;
        const attackTactics = homeAttack ? homeTactics : awayTactics;
        if (homeAttack) homeShots++; else awayShots++;
        const pressBoost = homeAttack ? awayTactics.pressure : homeTactics.pressure;
        const scoreProbability = Math.max(0.012, Math.min(0.23, attackChance + attackTactics.attack * 0.035 - pressBoost * 0.025));
        if (Math.random() < scoreProbability) {
            const scorer = chooseScorer(attackingLineup);
            if (homeAttack) homeGoals.value++; else awayGoals.value++;
            events.push({ minute, type: "goal", team: attackingTeam.name, playerId: scorer ? scorer.id : null, player: scorer ? scorer.name : "Unknown scorer" });
        } else if (Math.random() < 0.12) {
            events.push({ minute, type: "chance", team: attackingTeam.name, player: chooseScorer(attackingLineup)?.name || "Attacking player" });
        }
        if (Math.random() < 0.025) {
            const booked = defendingLineup[Math.floor(Math.random() * Math.max(1, defendingLineup.length))];
            if (booked) events.push({ minute, type: "yellow", team: homeAttack ? awayTeam.name : homeTeam.name, playerId: booked.id, player: booked.name });
        }
    }
    const totalPossession = 50 + (homeStrength - awayStrength) * 0.45 + (Math.random() * 8 - 4);
    homePossession = Math.max(30, Math.min(70, Math.round(totalPossession)));
    const homeScore = Math.min(6, homeGoals.value), awayScore = Math.min(6, awayGoals.value);
    events.sort((a, b) => a.minute - b.minute);
    return {
        homeTeam: homeTeam.name, awayTeam: awayTeam.name,
        homeGoals: homeScore, awayGoals: awayScore,
        homeStrength: Math.round(homeStrength), awayStrength: Math.round(awayStrength),
        homeShots, awayShots, homePossession, awayPossession: 100 - homePossession,
        homeLineup: homeLineup.map(p => p.id), awayLineup: awayLineup.map(p => p.id),
        events: events.filter(e => e.type !== "goal" || (e.minute >= 1)),
        manOfTheMatch: null
    };
}
