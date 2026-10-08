// ==========================================
// GHANA FOOTBALL MANAGER - MATCH ENGINE
// ==========================================

// Simulate a football match
function simulateMatch(homeTeam, awayTeam) {

    // ------------------------------
    // 1. HOME ADVANTAGE
    // ------------------------------
    const homeAdvantage = 3;

    // ------------------------------
    // 2. TEAM STRENGTH
    // ------------------------------
    const homeStrength = homeTeam.strength + homeAdvantage;
    const awayStrength = awayTeam.strength;

    // ------------------------------
    // 3. STRENGTH DIFFERENCE
    // ------------------------------
    const strengthDifference = homeStrength - awayStrength;

    // ------------------------------
    // 4. INITIAL SCORE
    // ------------------------------
    let homeGoals = 0;
    let awayGoals = 0;

    // ------------------------------
    // 5. CREATE SCORING CHANCES
    // ------------------------------
    for (let i = 0; i < 10; i++) {

        const homeChance =
            Math.random() * 100 + strengthDifference;

        const awayChance =
            Math.random() * 100 - strengthDifference;

        // Home team scores
        if (homeChance > 92) {
            homeGoals++;
        }

        // Away team scores
        if (awayChance > 94) {
            awayGoals++;
        }
    }

    // ------------------------------
    // 6. RETURN MATCH RESULT
    // ------------------------------
    return {
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        homeGoals: homeGoals,
        awayGoals: awayGoals
    };
}


// ==========================================
// TEST MATCH
// ==========================================

const homeTeam = {
    name: "Accra Lions FC",
    strength: 78
};

const awayTeam = {
    name: "Kumasi Warriors",
    strength: 76
};


// ==========================================
// RUN THE MATCH
// ==========================================

const result = simulateMatch(homeTeam, awayTeam);


// ==========================================
// DISPLAY RESULT
// ==========================================

console.log("MATCH RESULT");
console.log("-------------------------");
console.log(
    result.homeTeam +
    " " +
    result.homeGoals +
    " - " +
    result.awayGoals +
    " " +
    result.awayTeam
);
