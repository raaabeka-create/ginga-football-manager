// Supplemental fictional pilot players.
// Existing player records in players.js remain unchanged.
const pilotAdditionalPlayers = [
 {id:11,name:"Kojo Antwi",club:"Cape Coast Stars",position:"CM",age:22,attributes:{pace:69,shooting:58,passing:78,dribbling:70,defending:65,physical:68,stamina:84,composure:73},fitness:94,morale:76,form:72},
 {id:12,name:"Abdul Karim",club:"Tamale City",position:"RW",age:21,attributes:{pace:86,shooting:71,passing:65,dribbling:81,defending:33,physical:67,stamina:82,composure:70},fitness:96,morale:79,form:75},
 {id:13,name:"Nana Yeboah",club:"Sunyani FC",position:"CB",age:24,attributes:{pace:63,shooting:32,passing:66,dribbling:42,defending:81,physical:83,stamina:77,composure:78},fitness:93,morale:78,form:73},
 {id:14,name:"Bright Sarpong",club:"Tema Athletic",position:"ST",age:22,attributes:{pace:83,shooting:80,passing:62,dribbling:77,defending:31,physical:75,stamina:80,composure:76},fitness:97,morale:82,form:78},
 {id:15,name:"Felix Nartey",club:"Tema Athletic",position:"GK",age:26,attributes:{pace:44,shooting:18,passing:57,dribbling:23,defending:30,physical:74,stamina:69,composure:84,goalkeeping:82},fitness:96,morale:80,form:77},
 {id:16,name:"Selorm Agbeko",club:"Ho United",position:"ST",age:23,attributes:{pace:77,shooting:75,passing:60,dribbling:72,defending:34,physical:79,stamina:78,composure:74},fitness:92,morale:75,form:71},
 {id:17,name:"Kwaku Mensimah",club:"Ho United",position:"CB",age:27,attributes:{pace:58,shooting:29,passing:63,dribbling:39,defending:84,physical:87,stamina:72,composure:81},fitness:95,morale:77,form:74},
 {id:18,name:"Prince Osei",club:"Koforidua Rangers",position:"AM",age:20,attributes:{pace:76,shooting:68,passing:80,dribbling:82,defending:44,physical:60,stamina:86,composure:75},fitness:98,morale:84,form:80},
 {id:19,name:"Mawuli Tettey",club:"Koforidua Rangers",position:"GK",age:25,attributes:{pace:43,shooting:19,passing:59,dribbling:24,defending:31,physical:71,stamina:68,composure:83,goalkeeping:80},fitness:94,morale:78,form:76},
 {id:20,name:"Issah Seidu",club:"Wa Eagles",position:"ST",age:24,attributes:{pace:79,shooting:76,passing:58,dribbling:73,defending:32,physical:82,stamina:76,composure:72},fitness:95,morale:77,form:74},
 {id:21,name:"Abdul Fatawu",club:"Wa Eagles",position:"CB",age:23,attributes:{pace:65,shooting:31,passing:64,dribbling:41,defending:79,physical:80,stamina:81,composure:76},fitness:97,morale:81,form:77}
];

/*
 * Expands the fictional player database to 500 total records.
 * Original players.js records and the 11 existing supplemental records are retained.
 * Generated player names are unique full-name combinations.
 */
(function () {
    const firstNames = [
        "John","Michael","Jones","Bentil","Daniel","Samuel","Joseph","Richard","Emmanuel","Isaac",
        "Kwame","Kofi","Kojo","Yaw","Nana","Kwesi","Kwaku","Bright","Felix","Prince",
        "Abdul","Karim","Issah","Mawuli","Selorm","Ebo","Ekow","Fiifi","Ato","Nii",
        "Benjamin","David","Andrew","Peter","Paul","Thomas","Francis","Patrick","Stephen","Anthony",
        "George","Matthew","Jonathan","Christian","Caleb","Nathan","Elijah","Gabriel","Aaron","Joel",
        "Solomon","Bernard","Kingsley","Lawrence","Dennis","Maxwell","Theophilus","Vincent","Collins","Augustine"
    ];
    const surnames = [
        "Mensah","Boateng","Owusu","Asare","Tetteh","Addo","Ofori","Adu","Amoah","Frimpong",
        "Antwi","Yeboah","Sarpong","Nartey","Agbeko","Osei","Tettey","Seidu","Karikari","Badu",
        "Bentil","Jones","Appiah","Acheampong","Agyeman","Amankwah","Annan","Awuah","Baah","Baffour",
        "Bonsu","Darko","Danso","Donkor","Essien","Fosu","Gyan","Koomson","Koranteng","Kusi",
        "Lamptey","Lartey","Manu","Minta","Nkrumah","Nyarko","Okyere","Opoku","Quaye","Sackey",
        "Salia","Sasu","Sowah","Tawiah","Tufuor","Twum","Wiredu","Yankson","Zico","Ababio",
        "Achebe","Adjei","Agyei","Aidoo","Aikins","Aidoo","Amoako","Armah","Asante","Atta",
        "Biney","Boakye","Dadzie","Eshun","Gaisie","Gyasi","Kwakye","Mantey","Otoo","Poku"
    ];
    const positions = ["GK","RB","CB","LB","DM","CM","AM","RW","LW","ST"];
    const existingNames = new Set(players.map(player => player.name.toLowerCase()));
    const generated = [];
    let clubCursor = 0;
    for (let f = 0; f < firstNames.length && generated.length < 479; f++) {
        for (let s = 0; s < surnames.length && generated.length < 479; s++) {
            const name = firstNames[f] + " " + surnames[s];
            if (existingNames.has(name.toLowerCase())) continue;
            existingNames.add(name.toLowerCase());
            const id = 22 + generated.length;
            const position = positions[(id * 7 + f + s) % positions.length];
            const age = 17 + ((id * 13 + f * 3 + s) % 18);
            const base = 48 + ((id * 11 + f * 5 + s * 3) % 37);
            const attributes = {
                pace: Math.max(30, Math.min(94, base + ((id + 2) % 11) - 5)),
                shooting: Math.max(25, Math.min(93, base + ((id + 5) % 13) - 6)),
                passing: Math.max(30, Math.min(94, base + ((id + 7) % 9) - 4)),
                dribbling: Math.max(25, Math.min(95, base + ((id + 3) % 15) - 7)),
                defending: Math.max(25, Math.min(95, base + ((id + 9) % 17) - 8)),
                physical: Math.max(30, Math.min(95, base + ((id + 4) % 12) - 5)),
                stamina: Math.max(35, Math.min(96, base + ((id + 6) % 14) - 6)),
                composure: Math.max(30, Math.min(95, base + ((id + 8) % 10) - 4))
            };
            if (position === "GK") attributes.goalkeeping = Math.max(45, Math.min(94, base + ((id + 1) % 12)));
            generated.push({
                id,
                name,
                club: clubs[clubCursor % clubs.length].name,
                position,
                age,
                attributes,
                fitness: 78 + ((id * 3) % 23),
                morale: 58 + ((id * 5) % 39),
                form: 55 + ((id * 7) % 43)
            });
            clubCursor++;
        }
    }
    if (generated.length !== 479) {
        throw new Error("Player database expansion expected 479 new records, got " + generated.length);
    }
    players.push(...generated);
})();
