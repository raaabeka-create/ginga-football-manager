// ==========================================
// GHANA FOOTBALL MANAGER
// CLUB DATABASE
// ==========================================

const clubs = [

    {
        id: 1,
        name: "Accra Lions FC",
        city: "Accra",

        finances: {
            balance: 500000,
            transferBudget: 150000,
            wageBudget: 30000
        },

        tactics: {
            formation: "4-3-3",
            mentality: "Balanced",
            tempo: "Normal",
            pressing: "Medium",
            defensiveLine: "Normal"
        }
    },


    {
        id: 2,
        name: "Kumasi Warriors",
        city: "Kumasi",

        finances: {
            balance: 450000,
            transferBudget: 120000,
            wageBudget: 28000
        },

        tactics: {
            formation: "4-4-2",
            mentality: "Balanced",
            tempo: "Fast",
            pressing: "Medium",
            defensiveLine: "Normal"
        }
    },


    {
        id: 3,
        name: "Takoradi United",
        city: "Takoradi",

        finances: {
            balance: 400000,
            transferBudget: 100000,
            wageBudget: 25000
        },

        tactics: {
            formation: "4-2-3-1",
            mentality: "Attacking",
            tempo: "Fast",
            pressing: "High",
            defensiveLine: "High"
        }
    },


    {
        id: 4,
        name: "Cape Coast Stars",
        city: "Cape Coast",

        finances: {
            balance: 380000,
            transferBudget: 90000,
            wageBudget: 24000
        },

        tactics: {
            formation: "4-3-3",
            mentality: "Balanced",
            tempo: "Normal",
            pressing: "Medium",
            defensiveLine: "Normal"
        }
    },


    {
        id: 5,
        name: "Tamale City",
        city: "Tamale",

        finances: {
            balance: 350000,
            transferBudget: 80000,
            wageBudget: 22000
        },

        tactics: {
            formation: "4-4-2",
            mentality: "Defensive",
            tempo: "Normal",
            pressing: "Low",
            defensiveLine: "Deep"
        }
    },


    {
        id: 6,
        name: "Sunyani FC",
        city: "Sunyani",

        finances: {
            balance: 330000,
            transferBudget: 70000,
            wageBudget: 21000
        },

        tactics: {
            formation: "4-2-3-1",
            mentality: "Balanced",
            tempo: "Slow",
            pressing: "Medium",
            defensiveLine: "Normal"
        }
    },


    {
        id: 7,
        name: "Tema Athletic",
        city: "Tema",

        finances: {
            balance: 420000,
            transferBudget: 110000,
            wageBudget: 26000
        },

        tactics: {
            formation: "4-3-3",
            mentality: "Attacking",
            tempo: "Fast",
            pressing: "High",
            defensiveLine: "High"
        }
    },


    {
        id: 8,
        name: "Ho United",
        city: "Ho",

        finances: {
            balance: 280000,
            transferBudget: 60000,
            wageBudget: 18000
        },

        tactics: {
            formation: "5-3-2",
            mentality: "Defensive",
            tempo: "Slow",
            pressing: "Low",
            defensiveLine: "Deep"
        }
    },


    {
        id: 9,
        name: "Koforidua Rangers",
        city: "Koforidua",

        finances: {
            balance: 310000,
            transferBudget: 65000,
            wageBudget: 19000
        },

        tactics: {
            formation: "4-4-2",
            mentality: "Balanced",
            tempo: "Normal",
            pressing: "Medium",
            defensiveLine: "Normal"
        }
    },


    {
        id: 10,
        name: "Wa Eagles",
        city: "Wa",

        finances: {
            balance: 250000,
            transferBudget: 50000,
            wageBudget: 16000
        },

        tactics: {
            formation: "5-4-1",
            mentality: "Defensive",
            tempo: "Slow",
            pressing: "Low",
            defensiveLine: "Deep"
        }
    },

    {
        id: 11,
        name: "Accra Hearts Academy",
        city: "Accra",
        finances: { balance: 390000, transferBudget: 95000, wageBudget: 23000 },
        tactics: { formation: "4-2-3-1", mentality: "Attacking", tempo: "Fast", pressing: "High", defensiveLine: "High" }
    },

    {
        id: 12,
        name: "Ashanti Goldfields FC",
        city: "Obuasi",
        finances: { balance: 370000, transferBudget: 85000, wageBudget: 22000 },
        tactics: { formation: "4-4-2", mentality: "Balanced", tempo: "Normal", pressing: "Medium", defensiveLine: "Normal" }
    },

    {
        id: 13,
        name: "Berekum Town FC",
        city: "Berekum",
        finances: { balance: 290000, transferBudget: 62000, wageBudget: 18000 },
        tactics: { formation: "4-3-3", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "Normal" }
    },

    {
        id: 14,
        name: "Bolgatanga United",
        city: "Bolgatanga",
        finances: { balance: 240000, transferBudget: 48000, wageBudget: 15500 },
        tactics: { formation: "5-3-2", mentality: "Defensive", tempo: "Slow", pressing: "Low", defensiveLine: "Deep" }
    },

    {
        id: 15,
        name: "Keta Coastal FC",
        city: "Keta",
        finances: { balance: 260000, transferBudget: 52000, wageBudget: 16500 },
        tactics: { formation: "4-4-2", mentality: "Balanced", tempo: "Normal", pressing: "Medium", defensiveLine: "Normal" }
    },

    {
        id: 16,
        name: "Nkawkaw Athletic",
        city: "Nkawkaw",
        finances: { balance: 275000, transferBudget: 57000, wageBudget: 17000 },
        tactics: { formation: "4-2-3-1", mentality: "Attacking", tempo: "Fast", pressing: "High", defensiveLine: "Normal" }
    },

    {
        id: 17,
        name: "Obuasi Miners FC",
        city: "Obuasi",
        finances: { balance: 320000, transferBudget: 70000, wageBudget: 19500 },
        tactics: { formation: "4-3-3", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "High" }
    },

    {
        id: 18,
        name: "Axim Harbour FC",
        city: "Axim",
        finances: { balance: 230000, transferBudget: 45000, wageBudget: 15000 },
        tactics: { formation: "5-4-1", mentality: "Defensive", tempo: "Slow", pressing: "Low", defensiveLine: "Deep" }
    },

    {
        id: 19,
        name: "Ejisu City FC",
        city: "Ejisu",
        finances: { balance: 305000, transferBudget: 68000, wageBudget: 19000 },
        tactics: { formation: "4-3-3", mentality: "Attacking", tempo: "Normal", pressing: "High", defensiveLine: "Normal" }
    },

    {
        id: 20,
        name: "Nalerigu Stars",
        city: "Nalerigu",
        finances: { balance: 220000, transferBudget: 42000, wageBudget: 14500 },
        tactics: { formation: "4-4-2", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "Deep" }
    },

    {
        id: 21,
        name: "Thunderhawks",
        city: "Accra",
        finances: { balance: 210000, transferBudget: 38000, wageBudget: 13000 },
        tactics: { formation: "4-3-3", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "Deep" }
    },
    {
        id: 22,
        name: "Iron Titans",
        city: "Kumasi",
        finances: { balance: 227000, transferBudget: 47000, wageBudget: 14200 },
        tactics: { formation: "4-2-3-1", mentality: "Attacking", tempo: "Slow", pressing: "High", defensiveLine: "Normal" }
    },
    {
        id: 23,
        name: "Stormbreakers",
        city: "Takoradi",
        finances: { balance: 244000, transferBudget: 56000, wageBudget: 15400 },
        tactics: { formation: "4-4-2", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "High" }
    },
    {
        id: 24,
        name: "Shadow Wolves",
        city: "Tamale",
        finances: { balance: 261000, transferBudget: 65000, wageBudget: 16600 },
        tactics: { formation: "3-5-2", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "Deep" }
    },
    {
        id: 25,
        name: "Blaze United",
        city: "Cape Coast",
        finances: { balance: 278000, transferBudget: 74000, wageBudget: 17800 },
        tactics: { formation: "5-3-2", mentality: "Attacking", tempo: "Slow", pressing: "High", defensiveLine: "Normal" }
    },
    {
        id: 26,
        name: "Frost Giants",
        city: "Tema",
        finances: { balance: 295000, transferBudget: 83000, wageBudget: 19000 },
        tactics: { formation: "4-3-3", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "High" }
    },
    {
        id: 27,
        name: "Vortex FC",
        city: "Sunyani",
        finances: { balance: 312000, transferBudget: 92000, wageBudget: 20200 },
        tactics: { formation: "4-2-3-1", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "Deep" }
    },
    {
        id: 28,
        name: "Raging Bulls",
        city: "Ho",
        finances: { balance: 329000, transferBudget: 101000, wageBudget: 21400 },
        tactics: { formation: "4-4-2", mentality: "Attacking", tempo: "Slow", pressing: "High", defensiveLine: "Normal" }
    },
    {
        id: 29,
        name: "Eclipse Riders",
        city: "Koforidua",
        finances: { balance: 346000, transferBudget: 110000, wageBudget: 22600 },
        tactics: { formation: "3-5-2", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "High" }
    },
    {
        id: 30,
        name: "Phoenix Flames",
        city: "Wa",
        finances: { balance: 363000, transferBudget: 119000, wageBudget: 23800 },
        tactics: { formation: "5-3-2", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "Deep" }
    },
    {
        id: 31,
        name: "Apex Predators",
        city: "Obuasi",
        finances: { balance: 380000, transferBudget: 43000, wageBudget: 25000 },
        tactics: { formation: "4-3-3", mentality: "Attacking", tempo: "Slow", pressing: "High", defensiveLine: "Normal" }
    },
    {
        id: 32,
        name: "Midnight Express",
        city: "Techiman",
        finances: { balance: 397000, transferBudget: 52000, wageBudget: 26200 },
        tactics: { formation: "4-2-3-1", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "High" }
    },
    {
        id: 33,
        name: "Cascade Crushers",
        city: "Bolgatanga",
        finances: { balance: 414000, transferBudget: 61000, wageBudget: 27400 },
        tactics: { formation: "4-4-2", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "Deep" }
    },
    {
        id: 34,
        name: "Ember Knights",
        city: "Keta",
        finances: { balance: 211000, transferBudget: 70000, wageBudget: 28600 },
        tactics: { formation: "3-5-2", mentality: "Attacking", tempo: "Slow", pressing: "High", defensiveLine: "Normal" }
    },
    {
        id: 35,
        name: "Horizon Strikers",
        city: "Axim",
        finances: { balance: 228000, transferBudget: 79000, wageBudget: 13800 },
        tactics: { formation: "5-3-2", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "High" }
    },
    {
        id: 36,
        name: "Titan Forge",
        city: "Ejisu",
        finances: { balance: 245000, transferBudget: 88000, wageBudget: 15000 },
        tactics: { formation: "4-3-3", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "Deep" }
    },
    {
        id: 37,
        name: "Nebula Nomads",
        city: "Berekum",
        finances: { balance: 262000, transferBudget: 97000, wageBudget: 16200 },
        tactics: { formation: "4-2-3-1", mentality: "Attacking", tempo: "Slow", pressing: "High", defensiveLine: "Normal" }
    },
    {
        id: 38,
        name: "Crimson Avalanche",
        city: "Nkawkaw",
        finances: { balance: 279000, transferBudget: 106000, wageBudget: 17400 },
        tactics: { formation: "4-4-2", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "High" }
    },
    {
        id: 39,
        name: "Quantum Quakes",
        city: "Nalerigu",
        finances: { balance: 296000, transferBudget: 115000, wageBudget: 18600 },
        tactics: { formation: "3-5-2", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "Deep" }
    },
    {
        id: 40,
        name: "Zenith Zephyrs",
        city: "Winneba",
        finances: { balance: 313000, transferBudget: 39000, wageBudget: 19800 },
        tactics: { formation: "5-3-2", mentality: "Attacking", tempo: "Slow", pressing: "High", defensiveLine: "Normal" }
    },

    {
        id: 41,
        name: "Lagos Crown FC",
        city: "Lagos",
        country: "Nigeria",
        finances: { balance: 220000, transferBudget: 45000, wageBudget: 15000 },
        tactics: { formation: "4-3-3", mentality: "Attacking", tempo: "Fast", pressing: "High", defensiveLine: "High" }
    },

    {
        id: 42,
        name: "Abuja Capital FC",
        city: "Abuja",
        country: "Nigeria",
        finances: { balance: 232500, transferBudget: 54000, wageBudget: 16800 },
        tactics: { formation: "4-2-3-1", mentality: "Balanced", tempo: "Normal", pressing: "Medium", defensiveLine: "Normal" }
    },

    {
        id: 43,
        name: "Kano Falcons",
        city: "Kano",
        country: "Nigeria",
        finances: { balance: 245000, transferBudget: 63000, wageBudget: 18600 },
        tactics: { formation: "4-4-2", mentality: "Defensive", tempo: "Fast", pressing: "Low", defensiveLine: "High" }
    },

    {
        id: 44,
        name: "Port Harcourt United",
        city: "Port Harcourt",
        country: "Nigeria",
        finances: { balance: 257500, transferBudget: 72000, wageBudget: 20400 },
        tactics: { formation: "3-5-2", mentality: "Attacking", tempo: "Normal", pressing: "High", defensiveLine: "Normal" }
    },

    {
        id: 45,
        name: "London Borough FC",
        city: "London",
        country: "England",
        finances: { balance: 270000, transferBudget: 81000, wageBudget: 22200 },
        tactics: { formation: "5-3-2", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "High" }
    },

    {
        id: 46,
        name: "Manchester Forge",
        city: "Manchester",
        country: "England",
        finances: { balance: 282500, transferBudget: 90000, wageBudget: 24000 },
        tactics: { formation: "4-3-3", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "Normal" }
    },

    {
        id: 47,
        name: "Madrid Atletico City",
        city: "Madrid",
        country: "Spain",
        finances: { balance: 295000, transferBudget: 99000, wageBudget: 25800 },
        tactics: { formation: "4-2-3-1", mentality: "Attacking", tempo: "Fast", pressing: "High", defensiveLine: "High" }
    },

    {
        id: 48,
        name: "Barcelona Coast FC",
        city: "Barcelona",
        country: "Spain",
        finances: { balance: 307500, transferBudget: 108000, wageBudget: 15000 },
        tactics: { formation: "4-4-2", mentality: "Balanced", tempo: "Normal", pressing: "Medium", defensiveLine: "Normal" }
    },

    {
        id: 49,
        name: "Paris Saint Union",
        city: "Paris",
        country: "France",
        finances: { balance: 320000, transferBudget: 45000, wageBudget: 16800 },
        tactics: { formation: "3-5-2", mentality: "Defensive", tempo: "Fast", pressing: "Low", defensiveLine: "High" }
    },

    {
        id: 50,
        name: "Lyon Royals",
        city: "Lyon",
        country: "France",
        finances: { balance: 332500, transferBudget: 54000, wageBudget: 18600 },
        tactics: { formation: "5-3-2", mentality: "Attacking", tempo: "Normal", pressing: "High", defensiveLine: "Normal" }
    },

    {
        id: 51,
        name: "Berlin Dynamo",
        city: "Berlin",
        country: "Germany",
        finances: { balance: 345000, transferBudget: 63000, wageBudget: 20400 },
        tactics: { formation: "4-3-3", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "High" }
    },

    {
        id: 52,
        name: "Munich Blau FC",
        city: "Munich",
        country: "Germany",
        finances: { balance: 357500, transferBudget: 72000, wageBudget: 22200 },
        tactics: { formation: "4-2-3-1", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "Normal" }
    },

    {
        id: 53,
        name: "Milan Rossoneri",
        city: "Milan",
        country: "Italy",
        finances: { balance: 370000, transferBudget: 81000, wageBudget: 24000 },
        tactics: { formation: "4-4-2", mentality: "Attacking", tempo: "Fast", pressing: "High", defensiveLine: "High" }
    },

    {
        id: 54,
        name: "Rome Gladiators",
        city: "Rome",
        country: "Italy",
        finances: { balance: 382500, transferBudget: 90000, wageBudget: 25800 },
        tactics: { formation: "3-5-2", mentality: "Balanced", tempo: "Normal", pressing: "Medium", defensiveLine: "Normal" }
    },

    {
        id: 55,
        name: "Amsterdam Canals FC",
        city: "Amsterdam",
        country: "Netherlands",
        finances: { balance: 395000, transferBudget: 99000, wageBudget: 15000 },
        tactics: { formation: "5-3-2", mentality: "Defensive", tempo: "Fast", pressing: "Low", defensiveLine: "High" }
    },

    {
        id: 56,
        name: "Lisbon Mariners",
        city: "Lisbon",
        country: "Portugal",
        finances: { balance: 407500, transferBudget: 108000, wageBudget: 16800 },
        tactics: { formation: "4-3-3", mentality: "Attacking", tempo: "Normal", pressing: "High", defensiveLine: "Normal" }
    },

    {
        id: 57,
        name: "New York Empire FC",
        city: "New York",
        country: "United States",
        finances: { balance: 420000, transferBudget: 45000, wageBudget: 18600 },
        tactics: { formation: "4-2-3-1", mentality: "Balanced", tempo: "Fast", pressing: "Medium", defensiveLine: "High" }
    },

    {
        id: 58,
        name: "Los Angeles Comets",
        city: "Los Angeles",
        country: "United States",
        finances: { balance: 432500, transferBudget: 54000, wageBudget: 20400 },
        tactics: { formation: "4-4-2", mentality: "Defensive", tempo: "Normal", pressing: "Low", defensiveLine: "Normal" }
    },

    {
        id: 59,
        name: "Toronto Northstars",
        city: "Toronto",
        country: "Canada",
        finances: { balance: 445000, transferBudget: 63000, wageBudget: 22200 },
        tactics: { formation: "3-5-2", mentality: "Attacking", tempo: "Fast", pressing: "High", defensiveLine: "High" }
    },

    {
        id: 60,
        name: "Glasgow Thistle FC",
        city: "Glasgow",
        country: "Scotland",
        finances: { balance: 457500, transferBudget: 72000, wageBudget: 24000 },
        tactics: { formation: "5-3-2", mentality: "Balanced", tempo: "Normal", pressing: "Medium", defensiveLine: "Normal" }
    }
];