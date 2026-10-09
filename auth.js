/* GINGA FM: AUTHENTICATION AND MANAGER PROFILE FLOW */
(function () {
    "use strict";

    const client = window.supabaseClient;
    const authScreen = document.getElementById("authScreen");
    const appShell = document.getElementById("appShell");
    const authPanels = document.getElementById("authPanels");
    const clubSetup = document.getElementById("clubSetup");
    const authMessage = document.getElementById("authMessage");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const clubSetupForm = document.getElementById("clubSetupForm");
    const clubSelect = document.getElementById("clubSelect");
    const clubAvailabilityMessage = document.getElementById("clubAvailabilityMessage");
    const claimClubButton = document.getElementById("claimClubButton");
    const signOutButton = document.getElementById("signOutButton");
    const resetPasswordButton = document.getElementById("resetPasswordButton");
    const authTabs = Array.from(document.querySelectorAll("[data-auth-view]"));

    let currentSession = null;
    let busy = false;

    function setMessage(message, kind) {
        authMessage.textContent = message || "";
        authMessage.dataset.kind = kind || "info";
    }

    function setBusy(isBusy, button) {
        busy = isBusy;
        if (button) {
            button.disabled = isBusy;
            button.dataset.originalText = button.dataset.originalText || button.textContent;
            button.textContent = isBusy ? "Please wait…" : button.dataset.originalText;
        }
    }

    function friendlyError(error) {
        const message = error && error.message ? error.message : String(error || "Unknown error");
        if (/manager_profiles_manager_username_lower_uidx|duplicate key|unique constraint/i.test(message)) {
            return "That manager username is already in use. Please choose another one.";
        }
        if (/club.*(claimed|available|assigned)|unique constraint/i.test(message)) {
            return "That club is no longer available. Please choose another club.";
        }
        if (/invalid login credentials/i.test(message)) {
            return "The email or password is incorrect.";
        }
        if (/email not confirmed/i.test(message)) {
            return "Please confirm your email address before logging in.";
        }
        if (/password should be at least|weak password/i.test(message)) {
            return "Choose a stronger password with at least 8 characters.";
        }
        return message;
    }

    function showAuthPanels(view) {
        authPanels.hidden = false;
        clubSetup.hidden = true;
        loginForm.hidden = view !== "login";
        registerForm.hidden = view !== "register";
        authTabs.forEach(function (tab) {
            const active = tab.dataset.authView === view;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });
        setMessage("", "info");
    }

    function showClubSetup() {
        authScreen.hidden = false;
        appShell.hidden = true;
        authPanels.hidden = true;
        clubSetup.hidden = false;
        setMessage("", "info");
        loadAvailableClubs();
    }

    function showApp(profile) {
        authScreen.hidden = true;
        appShell.hidden = false;
        authPanels.hidden = true;
        clubSetup.hidden = true;

        document.getElementById("managerName").textContent = profile.manager_name || "Manager";
        document.getElementById("managerUsername").textContent = profile.manager_username || "-";
        document.getElementById("managerNationality").textContent = profile.nationality || "-";
        document.getElementById("clubName").textContent = profile.club_name || "No club selected";
        document.getElementById("headerManagerUsername").textContent = "@" + (profile.manager_username || "manager");
        document.getElementById("headerManagerUsername").hidden = false;
        signOutButton.hidden = false;

        const databaseStatus = document.getElementById("databaseStatus");
        if (databaseStatus) {
            databaseStatus.textContent = "Signed in. Manager profile loaded.";
        }
    }

    async function loadManagerProfile() {
        const result = await client.rpc("get_my_manager_profile");
        if (result.error) throw result.error;
        return result.data;
    }

    async function handleSession(session) {
        currentSession = session || null;
        if (!session) {
            authScreen.hidden = false;
            appShell.hidden = true;
            authPanels.hidden = false;
            clubSetup.hidden = true;
            document.getElementById("headerManagerUsername").hidden = true;
            signOutButton.hidden = true;
            showAuthPanels("login");
            return;
        }

        try {
            const profile = await loadManagerProfile();
            if (!profile) {
                setMessage("This account does not have a Ginga FM manager profile. Please register through the Create account form or contact the game administrator.", "error");
                authScreen.hidden = false;
                appShell.hidden = true;
                authPanels.hidden = false;
                clubSetup.hidden = true;
                return;
            }

            if (!profile.club_id) {
                document.getElementById("clubSetupManager").textContent =
                    "Signed in as " + profile.manager_name + " (@" + profile.manager_username + ").";
                showClubSetup();
                return;
            }

            showApp(profile);
        } catch (error) {
            console.error("Could not load manager profile:", error);
            authScreen.hidden = false;
            appShell.hidden = true;
            setMessage("Could not load your manager profile. Confirm that the Supabase SQL setup has been applied. Details: " + friendlyError(error), "error");
        }
    }

    async function loadAvailableClubs() {
        clubSelect.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Loading available clubs…";
        clubSelect.appendChild(placeholder);
        clubSelect.disabled = true;
        claimClubButton.disabled = true;
        clubAvailabilityMessage.textContent = "";

        try {
            const result = await client.rpc("get_available_clubs");
            if (result.error) throw result.error;
            const clubs = Array.isArray(result.data) ? result.data : [];
            clubSelect.replaceChildren();

            if (clubs.length === 0) {
                const option = document.createElement("option");
                option.value = "";
                option.textContent = "No clubs are currently available";
                clubSelect.appendChild(option);
                clubAvailabilityMessage.textContent = "All clubs have already been claimed. Please contact the game administrator.";
                return;
            }

            const firstOption = document.createElement("option");
            firstOption.value = "";
            firstOption.textContent = "Select your club";
            clubSelect.appendChild(firstOption);

            clubs.forEach(function (club) {
                const option = document.createElement("option");
                option.value = String(club.id);
                option.textContent = club.city ? club.name + " — " + club.city : club.name;
                clubSelect.appendChild(option);
            });
            clubSelect.disabled = false;
            claimClubButton.disabled = false;
            clubAvailabilityMessage.textContent = clubs.length + " club(s) available.";
        } catch (error) {
            console.error("Could not load available clubs:", error);
            clubSelect.replaceChildren();
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Could not load clubs";
            clubSelect.appendChild(option);
            clubAvailabilityMessage.textContent = "Check that the Supabase setup script has been run and that the clubs table contains clubs.";
            setMessage(friendlyError(error), "error");
        }
    }

    authTabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            showAuthPanels(tab.dataset.authView);
        });
    });

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (busy) return;

        const submitButton = loginForm.querySelector('button[type="submit"]');
        setBusy(true, submitButton);
        setMessage("Logging in…", "info");

        try {
            const form = new FormData(loginForm);
            const result = await client.auth.signInWithPassword({
                email: String(form.get("email") || "").trim(),
                password: String(form.get("password") || "")
            });
            if (result.error) throw result.error;
            await handleSession(result.data.session);
            setMessage("", "info");
        } catch (error) {
            setMessage(friendlyError(error), "error");
        } finally {
            setBusy(false, submitButton);
        }
    });

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (busy) return;

        const submitButton = registerForm.querySelector('button[type="submit"]');
        const form = new FormData(registerForm);
        const managerName = String(form.get("managerName") || "").trim();
        const managerUsername = String(form.get("managerUsername") || "").trim();
        const nationality = String(form.get("nationality") || "").trim();
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");
        const passwordConfirm = String(form.get("passwordConfirm") || "");

        if (password !== passwordConfirm) {
            setMessage("The passwords do not match.", "error");
            return;
        }
        if (!/^[A-Za-z0-9_]{3,20}$/.test(managerUsername)) {
            setMessage("Your username must be 3–20 characters using only letters, numbers, or underscores.", "error");
            return;
        }

        setBusy(true, submitButton);
        setMessage("Creating your manager account…", "info");

        try {
            const result = await client.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        manager_username: managerUsername,
                        manager_name: managerName,
                        nationality: nationality || "Ghanaian"
                    }
                }
            });
            if (result.error) throw result.error;

            if (result.data.session) {
                await handleSession(result.data.session);
                setMessage("Account created. Choose an available club to start your career.", "success");
            } else {
                setMessage("Account created. Check your email for a confirmation link, then return here and log in. You will choose an available club after signing in.", "success");
                registerForm.reset();
                document.getElementById("registerNationality").value = "Ghanaian";
                showAuthPanels("login");
            }
        } catch (error) {
            console.error("Manager registration failed:", error);
            setMessage(friendlyError(error), "error");
        } finally {
            setBusy(false, submitButton);
        }
    });

    clubSetupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (busy) return;

        const submitButton = clubSetupForm.querySelector('button[type="submit"]');
        setBusy(true, submitButton);
        setMessage("Claiming your club…", "info");

        try {
            const result = await client.rpc("claim_manager_club", {
                p_club_id: String(clubSelect.value)
            });
            if (result.error) throw result.error;
            const profile = await loadManagerProfile();
            if (!profile || !profile.club_id) {
                throw new Error("The club was not assigned. Please try again.");
            }
            showApp(profile);
        } catch (error) {
            console.error("Could not claim club:", error);
            setMessage(friendlyError(error), "error");
            await loadAvailableClubs();
        } finally {
            setBusy(false, submitButton);
        }
    });

    resetPasswordButton.addEventListener("click", async function () {
        const email = String(document.getElementById("loginEmail").value || "").trim();
        if (!email) {
            setMessage("Enter your email address above first, then select Forgot password.", "error");
            document.getElementById("loginEmail").focus();
            return;
        }

        resetPasswordButton.disabled = true;
        try {
            const result = await client.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + window.location.pathname
            });
            if (result.error) throw result.error;
            setMessage("If this email belongs to an account, a password reset link will be sent. Check your inbox.", "success");
        } catch (error) {
            setMessage(friendlyError(error), "error");
        } finally {
            resetPasswordButton.disabled = false;
        }
    });

    signOutButton.addEventListener("click", async function () {
        signOutButton.disabled = true;
        try {
            const result = await client.auth.signOut();
            if (result.error) throw result.error;
            currentSession = null;
            showAuthPanels("login");
            await handleSession(null);
        } catch (error) {
            console.error("Could not log out:", error);
            window.alert("Could not log out right now. Please try again.");
        } finally {
            signOutButton.disabled = false;
        }
    });

    if (!client || !client.auth) {
        authScreen.hidden = false;
        appShell.hidden = true;
        setMessage("Supabase did not load. Check the Supabase script and project settings.", "error");
        return;
    }

    client.auth.onAuthStateChange(function (_event, session) {
        Promise.resolve().then(function () {
            return handleSession(session);
        });
    });

    client.auth.getSession().then(function (result) {
        if (result.error) throw result.error;
        return handleSession(result.data.session);
    }).catch(function (error) {
        console.error("Could not restore login session:", error);
        setMessage("Could not check your login session. Refresh the page and try again.", "error");
    });
})();
