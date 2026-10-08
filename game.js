// ==========================================
// GHANA FOOTBALL MANAGER
// GAME DATA
// ==========================================

const game = {

    season: 1,

    league: "Ghana Premier Division",

    clubs: clubs,

    players: players,

    matches: [],

    leagueTable: []
};


// ==========================================
// CREATE INITIAL LEAGUE TABLE
// ==========================================

function createLeagueTable() {

    game.leagueTable = game.clubs.map(club => {

        return {
            clubId: club.id,
            club: club.name,

            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,

            goalsFor: 0,
            goalsAgainst: 0,

            points: 0
        };

    });

}


// ==========================================
// UPDATE LEAGUE TABLE AFTER A MATCH
// ==========================================

function updateLeagueTable(result) {

    const home = game.leagueTable.find(
        team => team.club === result.homeTeam
    );

    const away = game.leagueTable.find(
        team => team.club === result.awayTeam
    );

    if (!home || !away) {
        console.log("Team not found.");
        return;
    }


    // Matches played
    home.played++;
    away.played++;


    // Goals
    home.goalsFor += result.homeGoals;
    home.goalsAgainst += result.awayGoals;

    away.goalsFor += result.awayGoals;
    away.goalsAgainst += result.homeGoals;


    // Home win
    if (result.homeGoals > result.awayGoals) {

        home.wins++;
        home.points += 3;

        away.losses++;

    }

    // Away win
    else if (result.awayGoals > result.homeGoals) {

        away.wins++;
        away.points += 3;

        home.losses++;

    }

    // Draw
    else {

        home.draws++;
        away.draws++;

        home.points++;
        away.points++;
    }

}


// ==========================================
// SORT LEAGUE TABLE
// ==========================================

function sortLeagueTable() {

    game.leagueTable.sort((a, b) => {

        // Points first
        if (b.points !== a.points) {
            return b.points - a.points;
        }

        // Goal difference second
        const goalDifferenceA =
            a.goalsFor - a.goalsAgainst;

        const goalDifferenceB =
            b.goalsFor - b.goalsAgainst;

        return goalDifferenceB - goalDifferenceA;

    });

}


// ==========================================
// RUN A MATCH
// ==========================================

function playMatch(homeClubId, awayClubId) {

    const homeTeam = game.clubs.find(
        club => club.id === homeClubId
    );

    const awayTeam = game.clubs.find(
        club => club.id === awayClubId
    );


    if (!homeTeam || !awayTeam) {

        console.log("Invalid clubs.");
        return;

    }


    const result = simulateMatch(
        homeTeam,
        awayTeam
    );


    game.matches.push(result);

    updateLeagueTable(result);

    sortLeagueTable();


    console.log(
        result.homeTeam +
        " " +
        result.homeGoals +
        " - " +
        result.awayGoals +
        " " +
        result.awayTeam
    );

}


// ==========================================
// START THE GAME
// ==========================================

createLeagueTable();


// ==========================================
// TEST MATCH
// ==========================================

playMatch(1, 2);


// ==========================================
// SHOW LEAGUE TABLE
// ==========================================

console.log(" ");
console.log("LEAGUE TABLE");
console.log("-------------------------");

console.table(game.leagueTable);
