// ==========================================
// GHANA FOOTBALL MANAGER
// MATCH ENGINE
// ==========================================

function simulateMatch(homeTeam, awayTeam) {

    // Home advantage
    const homeAdvantage = 3;

    // Team strength
    const homeStrength = homeTeam.strength + homeAdvantage;
    const awayStrength = awayTeam.strength;

    // Difference between teams
    const strengthDifference =
        homeStrength - awayStrength;

    // Starting score
    let homeGoals = 0;
    let awayGoals = 0;


    // Create scoring opportunities
    for (let i = 0; i < 10; i++) {

        const homeChance =
            Math.random() * 100 + strengthDifference;

        const awayChance =
            Math.random() * 100 - strengthDifference;


        if (homeChance > 92) {
            homeGoals++;
        }


        if (awayChance > 94) {
            awayGoals++;
        }

    }


    // Prevent unrealistic scores
    homeGoals = Math.min(homeGoals, 6);
    awayGoals = Math.min(awayGoals, 6);


    // Return result
    return {

        homeTeam: homeTeam.name,

        awayTeam: awayTeam.name,

        homeGoals: homeGoals,

        awayGoals: awayGoals

    };

}
