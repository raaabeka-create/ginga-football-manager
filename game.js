// ==========================================
// GHANA FOOTBALL MANAGER
// GAME SYSTEM
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
// CREATE LEAGUE TABLE
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
// UPDATE LEAGUE TABLE
// ==========================================

function updateLeagueTable(result) {

    const home =
        game.leagueTable.find(
            team => team.club === result.homeTeam
        );


    const away =
        game.leagueTable.find(
            team => team.club === result.awayTeam
        );


    if (!home || !away) {

        console.log("Team not found.");

        return;

    }


    home.played++;
    away.played++;


    home.goalsFor += result.homeGoals;

    home.goalsAgainst += result.awayGoals;


    away.goalsFor += result.awayGoals;

    away.goalsAgainst += result.homeGoals;



    // HOME WIN

    if (result.homeGoals > result.awayGoals) {

        home.wins++;

        home.points += 3;

        away.losses++;

    }


    // AWAY WIN

    else if (result.awayGoals > result.homeGoals) {

        away.wins++;

        away.points += 3;

        home.losses++;

    }


    // DRAW

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


        // Points

        if (b.points !== a.points) {

            return b.points - a.points;

        }


        // Goal difference

        const goalDifferenceA =
            a.goalsFor - a.goalsAgainst;


        const goalDifferenceB =
            b.goalsFor - b.goalsAgainst;


        return goalDifferenceB - goalDifferenceA;

    });

}



// ==========================================
// PLAY MATCH
// ==========================================

function playMatch(homeClubId, awayClubId) {


    const homeTeam =
        game.clubs.find(
            club => club.id === homeClubId
        );


    const awayTeam =
        game.clubs.find(
            club => club.id === awayClubId
        );


    if (!homeTeam || !awayTeam) {

        console.log("Invalid clubs.");

        return;

    }


    // Run match engine

    const result =
        simulateMatch(
            homeTeam,
            awayTeam
        );


    // Save match

    game.matches.push(result);


    // Update league

    updateLeagueTable(result);


    // Sort table

    sortLeagueTable();


    // Display result

    displayMatchResult(result);


    // Update dashboard

    updateDashboard();

}



// ==========================================
// DISPLAY MATCH RESULT
// ==========================================

function displayMatchResult(result) {


    const resultElement =
        document.getElementById("matchResult");


    if (!resultElement) {

        return;

    }


    resultElement.innerHTML = `

        <strong>
            ${result.homeTeam}
            ${result.homeGoals}
            -
            ${result.awayGoals}
            ${result.awayTeam}
        </strong>

    `;

}



// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateDashboard() {


    const team =
        game.leagueTable.find(
            team =>
                team.club === "Accra Lions FC"
        );


    if (!team) {

        return;

    }


    const position =
        game.leagueTable.indexOf(team) + 1;


    document.getElementById("position")
        .textContent =
        position + getOrdinal(position);


    document.getElementById("points")
        .textContent =
        team.points;

}



// ==========================================
// ORDINAL NUMBERS
// ==========================================

function getOrdinal(number) {


    if (number % 100 >= 11 &&
        number % 100 <= 13) {

        return "th";

    }


    switch (number % 10) {

        case 1:
            return "st";

        case 2:
            return "nd";

        case 3:
            return "rd";

        default:
            return "th";

    }

}



// ==========================================
// START GAME
// ==========================================

createLeagueTable();



// ==========================================
// PLAY BUTTON
// ==========================================

function startNextMatch() {

    playMatch(1, 2);

}
