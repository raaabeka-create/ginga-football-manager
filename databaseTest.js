
async function testGingaFMDatabase() {
    const status = document.getElementById("databaseStatus");

    try {
        status.textContent = "Loading clubs from Supabase...";

        const { data, error } = await supabaseClient
            .from("clubs")
            .select("id, name, city")
            .order("id");

        if (error) {
            throw error;
        }

        status.textContent =
            `Connected successfully! ${data.length} clubs loaded.`;

        console.log("Ginga FM clubs:", data);

    } catch (error) {
        console.error("Database connection failed:", error);

        status.textContent =
            "Could not load clubs: " + error.message;
    }
}

testGingaFMDatabase();
