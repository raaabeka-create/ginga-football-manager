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
    }
];
