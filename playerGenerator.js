// ==========================================
// GHANA FOOTBALL MANAGER
// PLAYER GENERATOR
// ==========================================


// ==========================================
// FIRST NAMES
// ==========================================

const firstNames = [
    "Kwame",
    "Kofi",
    "Yaw",
    "Kojo",
    "Kwaku",
    "Kwesi",
    "Yaw",
    "Samuel",
    "Daniel",
    "Michael",
    "Emmanuel",
    "Joseph",
    "Isaac",
    "Richard",
    "David",
    "Stephen",
    "Felix",
    "Caleb",
    "Thomas",
    "Benjamin"
];


// ==========================================
// LAST NAMES
// ==========================================

const lastNames = [
    "Mensah",
    "Asare",
    "Boateng",
    "Ofori",
    "Owusu",
    "Addo",
    "Tetteh",
    "Frimpong",
    "Adu",
    "Amoah",
    "Appiah",
    "Arthur",
    "Boadu",
    "Darko",
    "Danso",
    "Gyamfi",
    "Antwi",
    "Amponsah",
    "Acheampong",
    "Adjei"
];


// ==========================================
// POSITIONS
// ==========================================

const positions = [
    "GK",
    "RB",
    "LB",
    "CB",
    "CB",
    "DM",
    "CM",
    "CM",
    "AM",
    "RW",
    "LW",
    "ST",
    "ST"
];


// ==========================================
// RANDOM NUMBER
// ==========================================

function randomNumber(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;

}


// ==========================================
// RANDOM ITEM
// ==========================================

function randomItem(array) {

    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];

}


// ==========================================
// GENERATE PLAYER
// ==========================================

function generatePlayer(id, clubName) {


    const position =
        randomItem(positions);


    const age =
        randomNumber(17, 34);


    // Base ability

    const baseAbility =
        randomNumber(55, 78);


    // Attribute variation

    const attributes = {

        pace:
            randomNumber(
                baseAbility - 12,
                baseAbility + 12
            ),

        shooting:
            randomNumber(
                baseAbility - 12,
                baseAbility + 12
            ),

        passing:
            randomNumber(
                baseAbility - 12,
                baseAbility + 12
            ),

        dribbling:
            randomNumber(
                baseAbility - 12,
                baseAbility + 12
            ),

        defending:
            randomNumber(
                baseAbility - 12,
                baseAbility + 12
            ),

        physical:
            randomNumber(
                baseAbility - 12,
                baseAbility + 12
            ),

        stamina:
            randomNumber(
                baseAbility - 10,
                baseAbility + 10
            ),

        composure:
            randomNumber(
                baseAbility - 10,
                baseAbility + 10
            )

    };


    // Goalkeeper ability

    if (position === "GK") {

        attributes.goalkeeping =
            randomNumber(60, 85);

    }


    // Player name

    const name =
        randomItem(firstNames)
        +
        " "
        +
        randomItem(lastNames);


    // Fitness

    const fitness =
        randomNumber(80, 100);


    // Morale

    const morale =
        randomNumber(60, 90);


    // Form

    const form =
        randomNumber(60, 85);


    // Potential

    const potential =
        Math.min(
            95,
            baseAbility +
            randomNumber(5, 20)
        );


    return {

        id: id,

        name: name,

        club: clubName,

        position: position,

        age: age,

        attributes: attributes,

        fitness: fitness,

        morale: morale,

        form: form,

        potential: potential

    };

}



// ==========================================
// GENERATE CLUB SQUAD
// ==========================================

function generateSquad(
    clubName,
    startingId
) {


    const squad = [];


    for (let i = 0; i < 25; i++) {

        const player =
            generatePlayer(
                startingId + i,
                clubName
            );


        squad.push(player);

    }


    return squad;

}



// ==========================================
// GENERATE ALL SQUADS
// ==========================================

function generateAllSquads(clubList) {


    const generatedPlayers = [];


    let nextPlayerId = 100;


    clubList.forEach(club => {


        const squad =
            generateSquad(
                club.name,
                nextPlayerId
            );


        generatedPlayers.push(
            ...squad
        );


        nextPlayerId += 25;

    });


    return generatedPlayers;

}
