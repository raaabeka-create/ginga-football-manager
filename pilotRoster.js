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
 * Ginga FM expanded international roster.
 * The 10 original players and 11 existing supplemental Ghanaian players are retained.
 * Adds 1,000 players: exactly 200 Nigerian and 800 from Western/American/European leagues.
 * Final roster: 1,021 players across 60 clubs.
 */
players.push(...pilotAdditionalPlayers);
players.forEach(player => {
    if (!player.nationality) player.nationality = "Ghanaian";
});

(function () {
    const nigeria = {
        nationality: "Nigerian",
        firstNames: ["Chinedu","Emeka","Obinna","Ifeanyi","Chukwudi","Nnamdi","Uche","Kelechi","Tunde","Babatunde","Adebayo","Oluwaseun","Ayodeji","Damilola","Femi","Tobi","Seyi","Chisom","Somto","Ikenna","Oluwatobi","Adekunle","Ibrahim","Musa","Abiola","Oghenekaro","Ebuka","Tochukwu","Nonso","Okiemute"],
        surnames: ["Okafor","Nwankwo","Eze","Adeyemi","Bello","Ibrahim","Okoye","Obi","Balogun","Afolabi","Oladipo","Onyekachi","Chukwu","Udo","Ojo","Ogunleye","Ogunlana","Nwachukwu","Anichebe","Musa","Abubakar","Sule","Olawale","Okechukwu","Akinyemi","Ezeani","Onoh","Iheanacho","Uche","Oladimeji"]
    };
    const internationalPools = [
        { nationality: "English", firstNames: ["Oliver","Harry","George","Jack","Charlie","Thomas","James","William","Alfie","Henry","Arthur","Freddie"], surnames: ["Bennett","Clarke","Walker","Thompson","Hughes","Edwards","Harris","Cooper","Ward","Foster","Mitchell","Parker"] },
        { nationality: "Spanish", firstNames: ["Hugo","Mateo","Leo","Daniel","Pablo","Alejandro","Adrian","Alvaro","Diego","Sergio","Marco","Javier"], surnames: ["Garcia","Rodriguez","Martinez","Lopez","Sanchez","Perez","Romero","Torres","Navarro","Vega","Moreno","Castro"] },
        { nationality: "French", firstNames: ["Lucas","Hugo","Louis","Jules","Nathan","Gabriel","Arthur","Raphael","Theo","Mathis","Enzo","Antoine"], surnames: ["Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau","Laurent","Simon"] },
        { nationality: "German", firstNames: ["Lukas","Leon","Finn","Paul","Jonas","Felix","Noah","Elias","Maximilian","Ben","Niklas","Moritz"], surnames: ["Muller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Koch","Richter"] },
        { nationality: "Italian", firstNames: ["Lorenzo","Matteo","Alessandro","Leonardo","Andrea","Riccardo","Tommaso","Gabriele","Federico","Nicolo","Davide","Marco"], surnames: ["Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco","Bruno","Gallo"] },
        { nationality: "Dutch", firstNames: ["Daan","Sem","Lucas","Milan","Levi","Luuk","Jesse","Finn","Thijs","Lars","Mees","Bram"], surnames: ["De Jong","Jansen","De Vries","Van den Berg","Bakker","Visser","Smit","Meijer","De Boer","Mulder","Bos","Vos"] },
        { nationality: "Portuguese", firstNames: ["Joao","Francisco","Afonso","Martim","Duarte","Santiago","Goncalo","Rafael","Tiago","Diogo","Miguel","Pedro"], surnames: ["Silva","Santos","Ferreira","Pereira","Oliveira","Costa","Rodrigues","Martins","Sousa","Fernandes","Gomes","Lopes"] },
        { nationality: "American", firstNames: ["Liam","Noah","Mason","Logan","Ethan","Carter","Wyatt","Owen","Caleb","Luke","Dylan","Isaac"], surnames: ["Brooks","Reed","Hayes","Bennett","Collins","Perry","Murphy","Bailey","Foster","Powell","Bryant","Griffin"] },
        { nationality: "Canadian", firstNames: ["Evan","Logan","Jacob","Liam","Nathan","Owen","Caleb","Ryan","Connor","Mason","Aiden","Cameron"], surnames: ["Wilson","Campbell","Anderson","MacDonald","Fraser","Morrison","Johnston","Murray","Hamilton","Clark","Thompson","Ross"] },
        { nationality: "Scottish", firstNames: ["Callum","Rory","Ewan","Lewis","Finlay","Alasdair","Angus","Jamie","Blair","Fraser","Kieran","Gregor"], surnames: ["McLeod","Stewart","Graham","Mackenzie","Douglas","Cunningham","Ferguson","Duncan","Wallace","Kerr","Sinclair","Reid"] }
    ];
    const positions = ["GK","RB","CB","LB","DM","CM","AM","RW","LW","ST"];
    const existingNames = new Set(players.map(player => player.name.toLowerCase()));
    const generated = [];

    const middleNames = ["Avery","Blaise","Cedric","Darian","Elian","Fabian","Gideon","Harlan","Isaiah","Jalen","Kellan","Lucian","Marcel","Nolan","Orion","Paolo","Quentin","Rafael","Simeon","Thiago","Uriah","Victor","Warren","Xavier","Yannick","Zaire","Amari","Bastian","Cyril","Denzel","Emmanuel","Farouk","Gabriel","Hamza","Idris","Joaquin","Kwame","Malik","Nathaniel","Obed","Pascal","Raphael","Samuel","Tariq","Umar","Vincent","Wilfred","Yusuf","Zion","Anders","Benoit","Callum","Dario","Elias","Florian","Henrik","Ibrahim","Javier","Kofi","Lennox","Mikael","Noel","Otto","Parker","Romain","Stefan","Tomas","Ulrich","Wesley","Yohan","Zachary"];
    const existingNamePairs = new Set(players.map(player => {
        const parts = String(player.name || "").trim().split(/\\s+/);
        return (parts[0] + " " + (parts[parts.length - 1] || "")).toLowerCase();
    }));
    function uniqueName(firstNames, surnames, index) {
        const combinations = firstNames.length * surnames.length;
        let first = "";
        let last = "";
        let pair = "";
        let attempt = 0;
        while (attempt < combinations) {
            const candidateIndex = index + attempt;
            first = firstNames[Math.floor(candidateIndex / surnames.length) % firstNames.length];
            last = surnames[candidateIndex % surnames.length];
            pair = (first + " " + last).toLowerCase();
            if (!existingNamePairs.has(pair)) break;
            attempt++;
        }
        if (attempt >= combinations) {
            // Only used if a name pool is exhausted: expand the surname to preserve uniqueness.
            first = firstNames[Math.floor(index / surnames.length) % firstNames.length];
            last = surnames[index % surnames.length] + " " + middleNames[index % middleNames.length];
            pair = (first + " " + last).toLowerCase();
            let suffix = 2;
            while (existingNamePairs.has(pair)) {
                last = surnames[index % surnames.length] + " " + middleNames[(index + suffix) % middleNames.length] + " " + suffix;
                pair = (first + " " + last).toLowerCase();
                suffix++;
            }
        }
        const middleIndex = (index * 7 + Math.floor(index / 3) + attempt) % middleNames.length;
        let name = first + " " + middleNames[middleIndex] + " " + last;
        let middleOffset = 0;
        while (existingNames.has(name.toLowerCase())) {
            name = first + " " + middleNames[(middleIndex + ++middleOffset) % middleNames.length] + " " + last;
        }
        existingNamePairs.add(pair);
        existingNames.add(name.toLowerCase());
        return name;
    }

    for (let i = 0; i < 1000; i++) {
        const isNigerian = i < 200;
        const profile = isNigerian ? nigeria : internationalPools[Math.floor((i - 200) / 80)];
        const profileIndex = isNigerian ? i : (i - 200) % 80;
        const name = uniqueName(profile.firstNames, profile.surnames, profileIndex);
        const id = 22 + i;
        const position = positions[(id * 7 + i) % positions.length];
        const age = 17 + ((id * 13 + i * 3) % 18);
        const base = 48 + ((id * 11 + i * 5) % 37);
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
            club: clubs[i % clubs.length].name,
            nationality: profile.nationality,
            position,
            age,
            attributes,
            fitness: 78 + ((id * 3) % 23),
            morale: 58 + ((id * 5) % 39),
            form: 55 + ((id * 7) % 43)
        });
    }

    if (generated.length !== 1000) {
        throw new Error("Expected exactly 1,000 new players, got " + generated.length);
    }
    players.push(...generated);
    let nextPlayerId = players.reduce((highest, player) => Math.max(highest, Number(player.id) || 0), 0) + 1;
    const ghana = {nationality:"Ghanaian",firstNames:["Kwame","Kofi","Yaw","Kojo","Kwesi","Kwaku","Fiifi","Nii","Tetteh","Kweku","Ato","Nana","Ebo","Selorm","Mawuli","Dzifa","Kwadwo","Kobina","Yao","Ekow","Akua","Abena","Adwoa","Ama","Efua","Esi","Araba","Mansa","Afia","Naa"],surnames:["Mensah","Owusu","Asare","Boateng","Osei","Agyeman","Antwi","Appiah","Addo","Tetteh","Quaye","Amankwah","Acheampong","Sarpong","Nartey","Bonsu","Darko","Yeboah","Adjei","Frimpong","Koomson","Amoah","Nyarko","Badu","Gyamfi","Ofori","Kwarteng","Ababio","Tawiah","Adu"]};
    function profileForClub(club) {
        const country=String(club.country||"Ghana");
        if(country==="Nigeria")return nigeria;
        if(country==="England")return internationalPools[0];
        if(country==="Spain")return internationalPools[1];
        if(country==="France")return internationalPools[2];
        if(country==="Germany")return internationalPools[3];
        if(country==="Italy")return internationalPools[4];
        if(country==="Netherlands")return internationalPools[5];
        if(country==="Portugal")return internationalPools[6];
        if(country==="United States")return internationalPools[7];
        if(country==="Canada")return internationalPools[8];
        if(country==="Scotland")return internationalPools[9];
        return ghana;
    }
    clubs.forEach((club,clubIndex)=>{
        const clubPlayers=players.filter(player=>player.club===club.name&&!player.retired);
        let localIndex=0;
        while(clubPlayers.length<30){
            const profile=profileForClub(club);
            const name=uniqueName(profile.firstNames,profile.surnames,nextPlayerId+clubIndex*31+localIndex*17);
            const position=positions[(nextPlayerId*7+clubIndex+localIndex*3)%positions.length];
            const age=18+((nextPlayerId*11+clubIndex*3+localIndex*5)%17);
            const base=48+((nextPlayerId*13+clubIndex*7+localIndex*5)%37);
            const attributes={pace:Math.max(30,Math.min(94,base+((nextPlayerId+2)%11)-5)),shooting:Math.max(25,Math.min(93,base+((nextPlayerId+5)%13)-6)),passing:Math.max(30,Math.min(94,base+((nextPlayerId+7)%9)-4)),dribbling:Math.max(25,Math.min(95,base+((nextPlayerId+3)%15)-7)),defending:Math.max(25,Math.min(95,base+((nextPlayerId+9)%17)-8)),physical:Math.max(30,Math.min(95,base+((nextPlayerId+4)%12)-5)),stamina:Math.max(35,Math.min(96,base+((nextPlayerId+6)%14)-6)),composure:Math.max(30,Math.min(95,base+((nextPlayerId+8)%10)-4))};
            if(position==="GK")attributes.goalkeeping=Math.max(45,Math.min(94,base+((nextPlayerId+1)%12)));
            const player={id:nextPlayerId++,name,club:club.name,nationality:profile.nationality||"Ghanaian",position,age,attributes,fitness:78+((nextPlayerId*3)%23),morale:58+((nextPlayerId*5)%39),form:55+((nextPlayerId*7)%43),appearances:0,goals:0,bio:name+" is a "+age+"-year-old "+(profile.nationality||"Ghanaian")+" footballer who represents "+club.name+". Playing as a "+position+", the player is developing through competitive league football and training."};
            players.push(player);clubPlayers.push(player);localIndex++;
        }
    });
    players.forEach(player=>{
        if(!player.bio){
            const role=player.position==="GK"?"goalkeeper":["CB","LB","RB"].includes(player.position)?"defender":["DM","CM","AM","LM","RM"].includes(player.position)?"midfielder":"attacking player";
            player.bio=player.name+" is a "+Number(player.age||22)+"-year-old "+(player.nationality||"football")+" "+role+" currently registered with "+(player.club||"an unlisted club")+". The player's profile reflects their position, attributes, and development in the Ginga FM league.";
        }
    });
    const seenNames = new Set();
    const seenNamePairs = new Set();
    players.forEach((player, index) => {
        const original = String(player.name || "Player").trim();
        const originalParts = original.split(/\\s+/);
        let candidate = original;
        let parts = candidate.split(/\\s+/);
        let pair = (parts[0] + " " + parts[parts.length - 1]).toLowerCase();
        if (seenNames.has(candidate.toLowerCase()) || seenNamePairs.has(pair)) {
            const last = parts[parts.length - 1] || "Player";
            const rest = parts.slice(1, -1).join(" ");
            let found = false;
            for (let offset = 0; offset < middleNames.length; offset++) {
                const alternativeFirst = middleNames[(index * 11 + offset) % middleNames.length];
                const alternativePair = (alternativeFirst + " " + last).toLowerCase();
                const alternativeName = alternativeFirst + (rest ? " " + rest : "") + " " + last;
                if (!seenNamePairs.has(alternativePair) && !seenNames.has(alternativeName.toLowerCase())) {
                    candidate = alternativeName;
                    pair = alternativePair;
                    found = true;
                    break;
                }
            }
            if (!found) {
                let suffix = 2;
                do {
                    const alternativeLast = last + "-" + suffix;
                    candidate = parts[0] + (rest ? " " + rest : "") + " " + alternativeLast;
                    pair = (parts[0] + " " + alternativeLast).toLowerCase();
                    suffix++;
                } while (seenNamePairs.has(pair) || seenNames.has(candidate.toLowerCase()));
            }
            player.name = candidate;
        }
        parts = String(player.name).trim().split(/\\s+/);
        seenNames.add(String(player.name).toLowerCase());
        seenNamePairs.add((parts[0] + " " + parts[parts.length - 1]).toLowerCase());
    });
})();