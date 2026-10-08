// ==========================================
// GHANA FOOTBALL MANAGER
// MATCH ENGINE v2
// ==========================================


// ==========================================
// CALCULATE PLAYER EFFECTIVENESS
// ==========================================

function calculatePlayerEffectiveness(player) {

    const attributes = player.attributes;

    const averageAttributes =
        Object.values(attributes)
            .reduce((total, value) => total + value, 0)
        /
        Object.values(attributes).length;


    // Fitness affects performance
    const fitnessMultiplier =
        player.fitness / 100;


    // Form affects performance
    const formMultiplier =
        0.8 + (player.form / 100) * 0.2;


    // Morale affects performance
    const moraleMultiplier =
        0.9 + (player.morale / 100) * 0.1;


    return (
        averageAttributes *
        fitnessMultiplier *
        formMultiplier *
        moraleMultiplier
    );
}



// ==========================================
// CALCULATE TEAM STRENGTH
// ==========================================

function calculateTeamStrength(club) {

    const clubPlayers =
        players.filter(
            player => player.club === club.name
        );


    // If the club has no players
    if (clubPlayers.length === 0) {

        return 50;

    }


    const playerStrengths =
        clubPlayers.map(
            player =>
                calculatePlayerEffectiveness(player)
        );


    const averagePlayerStrength =
        playerStrengths.reduce(
            (total, value) => total + value,
            0
        ) /
        playerStrengths.length;


    // Tactical modifiers

    let tacticalModifier = 0;


    if (club.tactics.mentality === "Attacking") {
        tacticalModifier += 3;
    }


    if (club.tactics.mentality === "Defensive") {
        tacticalModifier += 1;
    }


    if (club.tactics.pressing === "High") {
        tacticalModifier += 2;
    }


    if (club.tactics.pressing === "Low") {
        tacticalModifier -= 1;
    }


    if (club.tactics.tempo === "Fast") {
        tacticalModifier += 1;
    }


    if (club.tactics.tempo === "Slow") {
        tacticalModifier -= 1;
    }


    return averagePlayerStrength + tacticalModifier;

}



// ==========================================
// CALCULATE GOAL CHANCE
// ==========================================

function calculateGoalChance(teamStrength, opponentStrength) {

    const difference =
        teamStrength - opponentStrength;


    let chance =
        25 + difference * 0.8;


    // Keep probability within reasonable limits

    chance =
        Math.max(5, Math.min(45, chance));


    return chance;

}



// ==========================================
// SIMULATE MATCH
// ==========================================

function simulateMatch(homeTeam, awayTeam) {


    // Calculate team strengths

    const homeStrength =
        calculateTeamStrength(homeTeam);


    const awayStrength =
        calculateTeamStrength(awayTeam);


    // Home advantage

    const homeAdvantage = 4;


    const adjustedHomeStrength =
        homeStrength + homeAdvantage;


    // Goal probabilities

    const homeGoalChance =
        calculateGoalChance(
            adjustedHomeStrength,
            awayStrength
        );


    const awayGoalChance =
        calculateGoalChance(
            awayStrength,
            adjustedHomeStrength
        );


    // Starting scores

    let homeGoals = 0;

    let awayGoals = 0;


    // Simulate 10 scoring opportunities

    for (let minute = 0; minute < 10; minute++) {


        const homeRoll =
            Math.random() * 100;


        const awayRoll =
            Math.random() * 100;


        if (homeRoll < homeGoalChance) {
            homeGoals++;
        }


        if (awayRoll < awayGoalChance) {
            awayGoals++;
        }

    }


    // Prevent unrealistic scores

    homeGoals =
        Math.min(homeGoals, 6);


    awayGoals =
        Math.min(awayGoals, 6);


    // Return complete result

    return {

        homeTeam: homeTeam.name,

        awayTeam: awayTeam.name,

        homeGoals: homeGoals,

        awayGoals: awayGoals,

        homeStrength:
            Math.round(homeStrength),

        awayStrength:
            Math.round(awayStrength)

    };

}
