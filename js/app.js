// AthleteLink AI - Site interaction + real platform features

const PROTECTED_TABS = ["dashboard", "trials", "scouts"];

const ALL_TABS = [
    "home",
    "challenge",
    "solution",
    "dashboard",
    "matching",
    "directory",
    "scouts",
    "trials",
    "opportunities"
];

/* =========================================================
   NAVIGATION
========================================================= */

function switchTab(tabId) {
    if (
        PROTECTED_TABS.includes(tabId) &&
        !window.AuthState?.isLoggedIn()
    ) {
        openAuth("login");
        return;
    }

    ALL_TABS.forEach(tab => {
        const page = document.getElementById("page-" + tab);
        if (page) {
            page.classList.toggle("hidden", tab !== tabId);
        }
    });

    if (tabId === "dashboard") loadDashboard();
    if (tabId === "scouts") loadScouts();
    if (tabId === "trials") loadTrials();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenuBtn2 = document.getElementById("mobile-menu-btn-2");
    const mobileMenu = document.getElementById("mobile-menu");

    const toggleMobile = () => {
        mobileMenu?.classList.toggle("hidden");
    };

    mobileMenuBtn?.addEventListener("click", toggleMobile);
    mobileMenuBtn2?.addEventListener("click", toggleMobile);

    loadOpportunityCards();

    [
        "achievement-modal",
        "trial-modal",
        "result-modal",
        "scout-connection-modal",
        "coach-connection-modal"
    ].forEach(id => {
        const modal = document.getElementById(id);

        modal?.addEventListener("click", event => {
            if (event.target.id === id) {
                closeModal(id);
            }
        });
    });
});

/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMobileMenu() {
    document.getElementById("mobile-menu")?.classList.add("hidden");
}

/* =========================================================
   ATHLETE DIRECTORY FILTER
========================================================= */

function filterAthletes() {
    const search =
        document.getElementById("athlete-search")?.value
            ?.toLowerCase()
            .trim() || "";

    const sport =
        document.getElementById("filter-sport")?.value || "all";

    document.querySelectorAll(".athlete-card").forEach(card => {
        const name =
            card.dataset.name?.toLowerCase() || "";

        const cardSport =
            card.dataset.sport || "";

        const matchesName = name.includes(search);
        const matchesSport =
            sport === "all" || cardSport === sport;

        card.style.display =
            matchesName && matchesSport ? "block" : "none";
    });
}

/* =========================================================
   TOAST
========================================================= */

function showFeatureToast(message, type = "info") {
    let toast = document.getElementById("feature-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "feature-toast";
        document.body.appendChild(toast);
    }

    toast.className =
        "fixed bottom-6 right-6 z-[200] max-w-md px-5 py-3 rounded-xl border shadow-2xl text-sm font-bold " +
        (
            type === "error"
                ? "bg-red-950 border-red-500 text-red-200"
                : "bg-gray-950 border-accentBlue text-white"
        );

    toast.textContent = message;

    clearTimeout(window.__toastTimer);

    window.__toastTimer = setTimeout(() => {
        toast.remove();
    }, 4000);
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function esc(value) {
    return String(value ?? "").replace(
        /[&<>'"]/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[char])
    );
}

/* =========================================================
   AI MATCHING
========================================================= */

async function runAIMatching() {
    const box = document.getElementById("matching-results");

    if (box) {
        box.style.opacity = ".4";
    }

    try {
        if (!window.AuthState?.isLoggedIn()) {
            openAuth("login");
            return;
        }

        const results = await apiRequest("/matching", {
            auth: true
        });

        if (!box) return;

        if (!Array.isArray(results) || !results.length) {
            box.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    No matching recommendations found yet.
                </div>
            `;
            return;
        }

        box.innerHTML = results.map(result => `
            <div class="p-4 rounded-2xl bg-darkbg/60 border border-gray-800">
                <div class="flex justify-between gap-3">
                    <div>
                        <div class="text-xs font-bold text-accentBlue">
                            ${esc(result.type)}
                        </div>

                        <h4 class="font-bold mt-1">
                            ${esc(result.name)}
                        </h4>

                        <p class="text-xs text-gray-400 mt-1">
                            ${esc(result.reason)}
                        </p>
                    </div>

                    <span class="text-sm font-black text-accentGreen">
                        ${esc(result.score)}%
                    </span>
                </div>
            </div>
        `).join("");

        showFeatureToast(
            "AI matching completed — recommendations updated.",
            "success"
        );

    } catch (error) {
        showFeatureToast(
            error?.message || "Unable to run AI matching.",
            "error"
        );
    } finally {
        if (box) {
            box.style.opacity = "1";
        }
    }
}

/* =========================================================
   ATHLETE DASHBOARD
========================================================= */

async function loadAthleteFeatures() {
    if (!window.AuthState?.isLoggedIn()) return;

    try {
        await Promise.all([
            loadAchievements(),
            loadApplications(),
            loadBookings(),
            loadConnections(),
            loadNotifications(),
            loadProfileIntoDashboard(),
            loadDashboardTrials()
        ]);
    } catch (error) {
        console.warn("Dashboard loading error:", error);
    }
}

/* =========================================================
   ACHIEVEMENTS
========================================================= */

async function loadAchievements() {
    const list = document.getElementById("achievements-list");

    if (!list) return;

    try {
        const rows = await apiRequest("/achievements", {
            auth: true
        });

        if (!Array.isArray(rows) || !rows.length) {
            list.innerHTML = `
                <p class="text-xs text-gray-500">
                    No achievements added yet.
                </p>
            `;
            return;
        }

        list.innerHTML = rows.map(achievement => `
            <div class="p-3.5 rounded-xl bg-darkbg/60 border border-gray-800">

                <div class="flex items-start justify-between gap-3">

                    <div>
                        <div class="font-bold text-sm">
                            ${esc(achievement.title)}
                        </div>

                        <div class="text-xs text-gray-400 mt-1">
                            ${esc(achievement.sport || "Sport not set")}
                            •
                            ${esc(achievement.level || "Level not set")}
                        </div>

                        <div class="text-[11px] text-gray-500 mt-1">
                            ${esc(achievement.institution || "Institution not set")}
                            •
                            ${esc(
                                achievement.achievement_year ||
                                achievement.achieved_on ||
                                achievement.year ||
                                "Year not set"
                            )}
                        </div>
                    </div>

                    <button
                        onclick="deleteAchievement(${Number(achievement.id)})"
                        class="text-gray-500 hover:text-red-300"
                        title="Delete"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

                <div class="mt-2 text-xs text-yellow-400 font-bold">
                    ${esc(
                        achievement.medal_award ||
                        achievement.position ||
                        achievement.result_label ||
                        "Achievement"
                    )}
                </div>

            </div>
        `).join("");

    } catch (error) {
        list.innerHTML = `
            <p class="text-xs text-red-300">
                ${esc(error?.message || "Unable to load achievements.")}
            </p>
        `;
    }
}

async function addAchievement() {
    openAchievementModal();
}

async function deleteAchievement(id) {
    if (!confirm("Delete this achievement?")) return;

    try {
        await apiRequest(`/achievements/${id}`, {
            method: "DELETE",
            auth: true
        });

        await loadAchievements();

        showFeatureToast(
            "Achievement deleted.",
            "success"
        );

    } catch (error) {
        showFeatureToast(
            error?.message || "Unable to delete achievement.",
            "error"
        );
    }
}

async function submitAchievement(event) {
    event.preventDefault();

    const form = event.target;

    const body = Object.fromEntries(
        new FormData(form).entries()
    );

    if (body.year) {
        body.year = Number(body.year);
    }

    try {
        await apiRequest("/achievements", {
            method: "POST",
            auth: true,
            body
        });

        closeModal("achievement-modal");

        form.reset();

        await loadAchievements();

        showFeatureToast(
            "Achievement saved successfully.",
            "success"
        );

    } catch (error) {
        showFeatureToast(
            error?.message || "Unable to save achievement.",
            "error"
        );
    }
}

/* =========================================================
   TRIALS
========================================================= */

async function loadTrials() {
    const box = document.getElementById("trials-grid");

    if (!box) return;

    box.innerHTML = `
        <div class="md:col-span-3 text-center text-gray-500 py-10">
            Loading trials…
        </div>
    `;

    try {
        const rows = await apiRequest("/trials");

        box.innerHTML = renderTrialCards(rows, false);

    } catch (error) {
        box.innerHTML = `
            <div class="md:col-span-3 text-red-300">
                ${esc(error?.message || "Unable to load trials.")}
            </div>
        `;
    }
}

function renderTrialCards(rows, dashboard = false) {

    if (!Array.isArray(rows) || !rows.length) {
        return `
            <div class="md:col-span-3 text-xs text-gray-500 py-8 text-center">
                No live trial opportunities are available right now.
            </div>
        `;
    }

    return rows.map(trial => {

        const remaining =
            Number(trial.remaining_slots ?? 0);

        const status =
            trial.registration_status || "REG OPEN";

        const category =
            trial.category || "Open Category";

        const age =
            trial.age_category || "Youth";

        return `
            <div
                class="group glass-card p-5 rounded-3xl border border-gray-800 hover:border-accentBlue/60 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >

                <div class="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-accentBlue/10 blur-2xl group-hover:bg-accentGreen/10 transition"></div>

                <div class="relative space-y-4">

                    <div class="flex items-start justify-between gap-3">

                        <div>

                            <span class="inline-flex px-2.5 py-1 rounded-full bg-accentBlue/10 border border-accentBlue/20 text-accentBlue text-[10px] font-black uppercase tracking-wider">
                                ${esc(trial.sport)}
                            </span>

                            <h4 class="text-lg font-black mt-3 leading-tight">
                                ${esc(trial.name)}
                            </h4>

                        </div>

                        <span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accentGreen/10 border border-accentGreen/20 text-accentGreen text-[9px] font-black">
                            ● ${esc(status)}
                        </span>

                    </div>

                    <div class="grid grid-cols-2 gap-2 text-[11px]">

                        <div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3">
                            <span class="text-gray-500 block mb-1">
                                Category
                            </span>
                            <span class="font-bold text-gray-200">
                                ${esc(category)}
                            </span>
                        </div>

                        <div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3">
                            <span class="text-gray-500 block mb-1">
                                Age
                            </span>
                            <span class="font-bold text-gray-200">
                                ${esc(age)}
                            </span>
                        </div>

                        <div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3">
                            <span class="text-gray-500 block mb-1">
                                Venue
                            </span>
                            <span
                                class="font-bold text-gray-200 truncate"
                                title="${esc(trial.venue)}"
                            >
                                ${esc(trial.venue)}
                            </span>
                        </div>

                        <div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3">
                            <span class="text-gray-500 block mb-1">
                                Trial Date
                            </span>
                            <span class="font-bold text-gray-200">
                                ${esc(trial.trial_date)}
                            </span>
                        </div>

                    </div>

                    <div class="flex items-center justify-between pt-1">

                        <div>
                            <span class="text-[10px] text-gray-500 uppercase tracking-wider block">
                                Available Slots
                            </span>

                            <span class="text-sm font-black ${
                                remaining > 0
                                    ? "text-accentNeon"
                                    : "text-red-300"
                            }">
                                ${remaining} places
                            </span>
                        </div>

                        <button
                            ${remaining < 1 ? "disabled" : ""}
                            onclick="openTrialApplication(${Number(trial.id)})"
                            class="px-4 py-2.5 rounded-xl ${
                                remaining < 1
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-400 to-emerald-400 text-darkbg hover:shadow-lg hover:shadow-cyan-400/10"
                            } text-[11px] font-black uppercase tracking-wider transition"
                        >
                            ${remaining < 1 ? "Full" : "Apply Now"}
                        </button>

                    </div>

                </div>
            </div>
        `;

    }).join("");
}

async function loadDashboardTrials() {
    const box =
        document.getElementById("dashboard-trials-grid");

    if (!box) return;

    try {
        const rows =
            await apiRequest("/trials/featured");

        box.innerHTML =
            renderTrialCards(rows, true);

    } catch (error) {
        box.innerHTML = `
            <div class="md:col-span-2 text-red-300 text-xs">
                ${esc(error?.message || "Unable to load featured trials.")}
            </div>
        `;
    }
}

/* =========================================================
   TRIAL APPLICATION
========================================================= */

async function openTrialApplication(trialId) {

    if (!window.AuthState?.isLoggedIn()) {
        openAuth("login");
        return;
    }

    try {

        const [
            trial,
            profile,
            applications
        ] = await Promise.all([
            apiRequest(`/trials/${trialId}`),
            apiRequest("/user/profile", { auth: true }),
            apiRequest("/applications", { auth: true })
        ]);

        const existing =
            Array.isArray(applications)
                ? applications.find(
                    application =>
                        Number(application.trial_id) === Number(trialId)
                )
                : null;

        if (existing) {
            showApplicationResult(existing);
            return;
        }

        const title =
            document.getElementById("trial-modal-title");

        if (title) {
            title.textContent =
                `Apply — ${trial.name}`;
        }

        const meta =
            document.getElementById("trial-modal-meta");

        if (meta) {
            meta.textContent =
                `${trial.organization || "Verified trial organizer"} • Complete your athlete details below. Profile information has been pre-filled where available.`;
        }

        const trialIdInput =
            document.getElementById("trial-id");

        if (trialIdInput) {
            trialIdInput.value = trialId;
        }

        const summary =
            document.getElementById("trial-form-summary");

        if (summary) {
            summary.innerHTML = `
                <div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3">
                    <span class="text-[9px] text-gray-500 uppercase block">
                        Category
                    </span>
                    <b class="text-xs">
                        ${esc(trial.category || "Open")}
                    </b>
                </div>

                <div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3">
                    <span class="text-[9px] text-gray-500 uppercase block">
                        Age
                    </span>
                    <b class="text-xs">
                        ${esc(trial.age_category || "Youth")}
                    </b>
                </div>

                <div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3">
                    <span class="text-[9px] text-gray-500 uppercase block">
                        Venue
                    </span>
                    <b
                        class="text-xs truncate block"
                        title="${esc(trial.venue)}"
                    >
                        ${esc(trial.venue)}
                    </b>
                </div>

                <div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3">
                    <span class="text-[9px] text-gray-500 uppercase block">
                        Date
                    </span>
                    <b class="text-xs">
                        ${esc(trial.trial_date)}
                    </b>
                </div>
            `;
        }

        const fields = {
            athleteName: profile?.fullName,
            email: profile?.email,
            sport: profile?.sport || trial?.sport || "",
            location: profile?.location || ""
        };

        Object.entries(fields).forEach(([name, value]) => {

            const element =
                document.querySelector(
                    `#trial-form [name="${name}"]`
                );

            if (element) {
                element.value = value || "";
            }

        });

        const submit =
            document.getElementById("trial-submit-btn");

        if (submit) {
            submit.disabled = false;
            submit.textContent = "Submit Application";
        }

        openModal("trial-modal");

    } catch (error) {

        showFeatureToast(
            error?.message || "Unable to open trial application.",
            "error"
        );

    }
}

async function submitTrialApplication(event) {

    event.preventDefault();

    const form = event.target;

    const trialId =
        document.getElementById("trial-id")?.value;

    if (!trialId) {
        showFeatureToast(
            "Trial information is missing.",
            "error"
        );
        return;
    }

    const body =
        Object.fromEntries(
            new FormData(form).entries()
        );

    delete body.trialId;

    if (body.age) {
        body.age = Number(body.age);
    }

    const submit =
        document.getElementById("trial-submit-btn");

    if (submit) {
        submit.disabled = true;
        submit.textContent = "Submitting…";
    }

    try {

        const result =
            await apiRequest(
                `/trials/${trialId}/apply`,
                {
                    method: "POST",
                    auth: true,
                    body
                }
            );

        closeModal("trial-modal");

        showApplicationResult(result);

        await loadDashboard();

        showFeatureToast(
            result?.emailSent
                ? "Trial application saved and confirmation email sent."
                : "Trial application saved successfully.",
            "success"
        );

    } catch (error) {

        showFeatureToast(
            error?.message || "Unable to submit application.",
            "error"
        );

        if (submit) {
            submit.disabled = false;
            submit.textContent = "Submit Application";
        }
    }
}

/* =========================================================
   APPLICATION RESULT
========================================================= */

function showApplicationResult(result) {

    const content =
        document.getElementById("result-modal-content");

    if (!content) return;

    const trialId =
        result?.trialId ?? result?.trial_id;

    const applicationId =
        result?.applicationId ?? result?.application_id;

    const emailSent =
        result?.emailSent ?? result?.email_sent;

    content.innerHTML = `
        <div class="text-center space-y-4">

            <div class="w-16 h-16 mx-auto rounded-2xl bg-accentGreen/10 border border-accentGreen/30 flex items-center justify-center text-accentGreen text-3xl">
                <i class="fa-solid fa-check"></i>
            </div>

            <h3 class="text-xl font-black">
                ${applicationId ? "Application Submitted" : "Application Status"}
            </h3>

            <p class="text-sm text-gray-400">
                ${esc(
                    result?.trial ||
                    result?.trial_name ||
                    "Trial application"
                )}
            </p>

            <div class="inline-flex px-4 py-2 rounded-full bg-accentBlue/10 text-accentNeon font-bold">
                Status:
                ${esc(result?.status || "SUBMITTED")}
            </div>

            ${
                applicationId
                    ? `
                        <p class="text-xs text-gray-500">
                            Application ID: #${esc(applicationId)}
                        </p>
                    `
                    : ""
            }

            ${
                emailSent
                    ? `
                        <div class="p-3 rounded-xl border border-accentGreen/30 bg-accentGreen/5 text-xs text-accentGreen">
                            Confirmation email sent to
                            ${esc(result?.email || "your email")}.
                        </div>
                    `
                    : `
                        <div class="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-xs text-yellow-200">
                            SMTP is not configured.
                            Your application remains saved in MySQL.
                        </div>
                    `
            }

            ${
                result?.confirmationUrl
                    ? `
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="${esc(result.confirmationUrl)}"
                            class="block text-center py-3 rounded-xl bg-gray-800 text-white font-bold text-sm"
                        >
                            Open Application Confirmation
                        </a>
                    `
                    : ""
            }

            ${
                trialId
                    ? `
                        <button
                            onclick="showTrialSlots(${Number(trialId)})"
                            class="w-full py-3 rounded-xl bg-accentBlue text-darkbg font-black text-sm"
                        >
                            View Available Slots
                        </button>
                    `
                    : ""
            }

        </div>
    `;

    openModal("result-modal");
}

/* =========================================================
   TRIAL SLOTS
========================================================= */

async function showTrialSlots(trialId) {

    try {

        const [trial, slots] =
            await Promise.all([
                apiRequest(`/trials/${trialId}`),
                apiRequest(`/trials/${trialId}/slots`)
            ]);

        const content =
            document.getElementById("result-modal-content");

        if (!content) return;

        const safeSlots =
            Array.isArray(slots) ? slots : [];

        content.innerHTML = `
            <div>

                <div class="flex justify-between items-center mb-4">

                    <div>
                        <h3 class="text-xl font-black">
                            Available Slots
                        </h3>

                        <p class="text-xs text-gray-500">
                            ${esc(trial.name)}
                            •
                            ${esc(trial.venue)}
                        </p>
                    </div>

                </div>

                <div class="space-y-3">

                    ${
                        safeSlots.length
                            ? safeSlots.map(slot => {

                                const remaining =
                                    Number(slot.remaining_slots ?? 0);

                                return `
                                    <div class="p-4 rounded-xl border border-gray-800 bg-darkbg/60 flex items-center justify-between gap-4">

                                        <div>

                                            <div class="font-bold text-sm">
                                                ${esc(slot.slot_date)}
                                                •
                                                ${esc(slot.slot_time)}
                                            </div>

                                            <div class="text-xs text-gray-500 mt-1">
                                                ${remaining}
                                                of
                                                ${esc(slot.capacity)}
                                                places available
                                            </div>

                                        </div>

                                        <button
                                            ${
                                                remaining < 1
                                                    ? "disabled"
                                                    : ""
                                            }
                                            onclick="bookSlot(${Number(slot.id)})"
                                            class="px-4 py-2 rounded-lg ${
                                                remaining < 1
                                                    ? "bg-gray-800 text-gray-500"
                                                    : "bg-accentGreen text-darkbg hover:bg-emerald-300"
                                            } text-xs font-black"
                                        >
                                            ${
                                                remaining < 1
                                                    ? "Full"
                                                    : "Confirm Booking"
                                            }
                                        </button>

                                    </div>
                                `;

                            }).join("")
                            : `
                                <p class="text-sm text-gray-500 text-center py-6">
                                    No slots available.
                                </p>
                            `
                    }

                </div>

            </div>
        `;

    } catch (error) {

        showFeatureToast(
            error?.message || "Unable to load trial slots.",
            "error"
        );
    }
}

/* =========================================================
   BOOKINGS
========================================================= */

async function bookSlot(slotId) {

    if (!window.AuthState?.isLoggedIn()) {
        openAuth("login");
        return;
    }

    try {

        const booking =
            await apiRequest("/bookings", {
                method: "POST",
                auth: true,
                body: {
                    slotId
                }
            });

        showBookingCard(booking);

        await loadBookings();

        showFeatureToast(
            booking?.emailSent
                ? "Booking confirmed and email sent."
                : "Booking confirmed successfully.",
            "success"
        );

    } catch (error) {

        showFeatureToast(
            error?.message || "Unable to confirm booking.",
            "error"
        );
    }
}

/* =========================================================
   COACH / SCOUT NETWORK
========================================================= */

async function loadScouts() {

    const box =
        document.getElementById("scouts-grid");

    if (!box) return;

    if (!window.AuthState?.isLoggedIn()) {
        openAuth("login");
        return;
    }

    box.innerHTML = `
        <div class="md:col-span-3 text-center text-gray-500 py-10">
            Finding coaches near you…
        </div>
    `;

    try {

        const renderCoaches =
            async (latitude = null, longitude = null, radius = 100) => {

                const query =
                    latitude != null && longitude != null
                        ? `?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&radiusKm=${radius}`
                        : "";

                const [
                    coaches,
                    connections
                ] = await Promise.all([
                    apiRequest(`/coaches/nearby${query}`, {
                        auth: true
                    }),
                    apiRequest("/coach-connections", {
                        auth: true
                    })
                ]);

                if (!Array.isArray(coaches) || !coaches.length) {

                    box.innerHTML = `
                        <div class="md:col-span-3 text-center py-10">

                            <div class="text-lg font-black">
                                No coaches found nearby
                            </div>

                            <p class="text-sm text-gray-500 mt-2">
                                Allow location access or search a wider radius.
                            </p>

                            <button
                                onclick="findNearbyCoaches(true)"
                                class="mt-4 px-5 py-2 rounded-xl bg-accentBlue text-darkbg font-bold text-xs"
                            >
                                Search within 500 km
                            </button>

                        </div>
                    `;

                    return;
                }

                box.innerHTML =
                    coaches.map(coach => {

                        const connection =
                            Array.isArray(connections)
                                ? connections.find(
                                    item =>
                                        Number(item.coach_id) ===
                                        Number(coach.id)
                                )
                                : null;

                        const label =
                            connection
                                ? connection.status === "CONNECTED"
                                    ? "Connected"
                                    : "Pending"
                                : "Connect";

                        return `
                            <div class="glass-card p-6 rounded-3xl border border-gray-800 space-y-4 hover:border-accentBlue/50 transition">

                                <div class="flex items-center gap-4">

                                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-2xl">
                                        <i class="fa-solid fa-person-chalkboard"></i>
                                    </div>

                                    <div>
                                        <h3 class="font-bold text-lg">
                                            ${esc(coach.name)}
                                        </h3>

                                        <p class="text-xs text-accentBlue font-bold">
                                            ${esc(coach.organization)}
                                        </p>
                                    </div>

                                </div>

                                <p class="text-xs text-gray-400">
                                    <b class="text-gray-300">
                                        Sports:
                                    </b>
                                    ${esc(coach.sports)}
                                </p>

                                <p class="text-xs text-gray-400">
                                    <b class="text-gray-300">
                                        Specialization:
                                    </b>
                                    ${esc(coach.specialization)}
                                </p>

                                <div class="flex flex-wrap justify-between gap-2 text-xs text-gray-500">

                                    <span>
                                        <i class="fa-solid fa-location-dot text-red-400 mr-1"></i>
                                        ${esc(coach.location)}
                                    </span>

                                    <span class="text-accentGreen font-bold">
                                        ${esc(coach.distance_km)}
                                        km away
                                    </span>

                                </div>

                                <div class="text-[11px] text-gray-500">
                                    ${esc(coach.experience)}
                                    •
                                    Profile match
                                    ${esc(coach.match_score)}%
                                </div>

                                <button
                                    ${connection ? "disabled" : ""}
                                    onclick="openCoachConnection(${Number(coach.id)}, '${esc(coach.name)}')"
                                    class="w-full py-2.5 rounded-xl ${
                                        connection
                                            ? "bg-gray-800 text-accentGreen"
                                            : "bg-accentBlue hover:bg-accentNeon text-darkbg"
                                    } text-xs font-bold transition"
                                >
                                    ${label}
                                </button>

                            </div>
                        `;

                    }).join("");
            };

        if (navigator.geolocation) {

            navigator.geolocation.getCurrentPosition(
                position => {
                    renderCoaches(
                        position.coords.latitude,
                        position.coords.longitude,
                        100
                    );
                },
                () => {
                    renderCoaches();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 7000,
                    maximumAge: 300000
                }
            );

        } else {
            await renderCoaches();
        }

        await loadScoutNetwork();

    } catch (error) {

        box.innerHTML = `
            <div class="md:col-span-3 text-red-300">
                ${esc(error?.message || "Unable to load coaches.")}
            </div>
        `;
    }
}

/* =========================================================
   FIND NEARBY COACHES
========================================================= */

async function findNearbyCoaches(wide = false) {

    if (!window.AuthState?.isLoggedIn()) {
        openAuth("login");
        return;
    }

    if (!navigator.geolocation) {
        showFeatureToast(
            "Your browser does not support location services.",
            "error"
        );
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async position => {

            try {

                const radius =
                    wide ? 500 : 100;

                const [
                    coaches,
                    connections
                ] = await Promise.all([
                    apiRequest(
                        `/coaches/nearby?lat=${position.coords.latitude}&lon=${position.coords.longitude}&radiusKm=${radius}`,
                        { auth: true }
                    ),
                    apiRequest(
                        "/coach-connections",
                        { auth: true }
                    )
                ]);

                const box =
                    document.getElementById("scouts-grid");

                if (!box) return;

                if (!Array.isArray(coaches) || !coaches.length) {

                    box.innerHTML = `
                        <div class="md:col-span-3 text-center text-gray-500 py-10">
                            No coaches found in this radius.
                        </div>
                    `;

                    return;
                }

                box.innerHTML =
                    coaches.map(coach => {

                        const connection =
                            Array.isArray(connections)
                                ? connections.find(
                                    item =>
                                        Number(item.coach_id) ===
                                        Number(coach.id)
                                )
                                : null;

                        return `
                            <div class="glass-card p-6 rounded-3xl border border-gray-800 space-y-4">

                                <div class="flex items-center gap-4">

                                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-2xl">
                                        <i class="fa-solid fa-person-chalkboard"></i>
                                    </div>

                                    <div>
                                        <h3 class="font-bold text-lg">
                                            ${esc(coach.name)}
                                        </h3>

                                        <p class="text-xs text-accentBlue font-bold">
                                            ${esc(coach.organization)}
                                        </p>
                                    </div>

                                </div>

                                <p class="text-xs text-gray-400">
                                    <b class="text-gray-300">
                                        Sports:
                                    </b>
                                    ${esc(coach.sports)}
                                </p>

                                <p class="text-xs text-gray-400">
                                    <b class="text-gray-300">
                                        Specialization:
                                    </b>
                                    ${esc(coach.specialization)}
                                </p>

                                <div class="flex justify-between text-xs text-gray-500">

                                    <span>
                                        ${esc(coach.location)}
                                    </span>

                                    <span class="text-accentGreen font-bold">
                                        ${esc(coach.distance_km)}
                                        km away
                                    </span>

                                </div>

                                <button
                                    ${connection ? "disabled" : ""}
                                    onclick="openCoachConnection(${Number(coach.id)}, '${esc(coach.name)}')"
                                    class="w-full py-2.5 rounded-xl ${
                                        connection
                                            ? "bg-gray-800 text-accentGreen"
                                            : "bg-accentBlue hover:bg-accentNeon text-darkbg"
                                    } text-xs font-bold"
                                >
                                    ${
                                        connection
                                            ? connection.status === "CONNECTED"
                                                ? "Connected"
                                                : "Pending"
                                            : "Connect"
                                    }
                                </button>

                            </div>
                        `;

                    }).join("");

            } catch (error) {

                showFeatureToast(
                    error?.message || "Unable to find nearby coaches.",
                    "error"
                );
            }
        },
        () => {
            showFeatureToast(
                "Location permission is needed to find nearby coaches.",
                "error"
            );
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

/* =========================================================
   COACH CONNECTION
========================================================= */

function openCoachConnection(id, name) {

    const idInput =
        document.getElementById("coach-connection-id");

    const nameElement =
        document.getElementById("coach-connection-name");

    const message =
        document.getElementById("coach-connection-message");

    if (idInput) idInput.value = id;
    if (nameElement) nameElement.textContent = name;
    if (message) message.value = "";

    openModal("coach-connection-modal");
}

async function submitCoachConnection(event) {

    event.preventDefault();

    const id =
        document.getElementById("coach-connection-id")?.value;

    const message =
        document.getElementById("coach-connection-message")
            ?.value
            ?.trim() || "";

    if (!id) {
        showFeatureToast(
            "Coach information is missing.",
            "error"
        );
        return;
    }

    try {

        await apiRequest(
            `/coaches/${id}/connect`,
            {
                method: "POST",
                auth: true,
                body: {
                    message
                }
            }
        );

        closeModal("coach-connection-modal");

        showFeatureToast(
            "Coach connection request sent — status is now Pending.",
            "success"
        );

        await loadScouts();
        await loadConnections();

    } catch (error) {

        showFeatureToast(
            error?.message || "Unable to send coach request.",
            "error"
        );
    }
}

/* =========================================================
   SCOUT CONNECTION
========================================================= */

function openScoutConnection(id, name) {

    const idInput =
        document.getElementById("scout-connection-id");

    const nameElement =
        document.getElementById("scout-connection-name");

    const message =
        document.getElementById("scout-connection-message");

    if (idInput) idInput.value = id;
    if (nameElement) nameElement.textContent = name;
    if (message) message.value = "";

    openModal("scout-connection-modal");
}

async function submitScoutConnection(event) {

    event.preventDefault();

    const id =
        document.getElementById("scout-connection-id")?.value;

    const message =
        document.getElementById("scout-connection-message")
            ?.value
            ?.trim() || "";

    if (!id) {
        showFeatureToast(
            "Scout information is missing.",
            "error"
        );
        return;
    }

    try {

        await apiRequest(
            `/scouts/${id}/connect`,
            {
                method: "POST",
                auth: true,
                body: {
                    message
                }
            }
        );

        closeModal("scout-connection-modal");

        showFeatureToast(
            "Scout connection request sent — status is now Pending.",
            "success"
        );

        await loadScoutNetwork();
        await loadConnections();

    } catch (error) {

        showFeatureToast(
            error?.message || "Unable to send scout request.",
            "error"
        );
    }
}

/* =========================================================
   SCOUT NETWORK
========================================================= */

async function loadScoutNetwork() {

    const box =
        document.getElementById("scouts-network-grid");

    if (!box) return;

    try {

        const [
            scouts,
            connections
        ] = await Promise.all([
            apiRequest("/scouts"),
            apiRequest("/connections", {
                auth: true
            })
        ]);

        if (!Array.isArray(scouts) || !scouts.length) {

            box.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    No scouts available right now.
                </div>
            `;

            return;
        }

        box.innerHTML =
            scouts.map(scout => {

                const connection =
                    Array.isArray(connections)
                        ? connections.find(
                            item =>
                                Number(item.scout_id) ===
                                Number(scout.id)
                        )
                        : null;

                return `
                    <div class="glass-card p-6 rounded-3xl border border-gray-800 space-y-3">

                        <div class="flex items-center gap-3">

                            <div class="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-300">
                                <i class="fa-solid fa-binoculars"></i>
                            </div>

                            <div>

                                <h4 class="font-bold">
                                    ${esc(scout.name)}
                                </h4>

                                <p class="text-xs text-accentBlue">
                                    ${esc(scout.organization)}
                                </p>

                            </div>

                        </div>

                        <p class="text-xs text-gray-400">
                            ${esc(scout.sports)}
                            •
                            ${esc(scout.specialization)}
                        </p>

                        <p class="text-xs text-gray-500">
                            ${esc(scout.location)}
                            •
                            ${esc(scout.experience)}
                        </p>

                        <button
                            ${connection ? "disabled" : ""}
                            onclick="openScoutConnection(${Number(scout.id)}, '${esc(scout.name)}')"
                            class="w-full py-2.5 rounded-xl ${
                                connection
                                    ? "bg-gray-800 text-accentGreen"
                                    : "bg-accentBlue text-darkbg hover:bg-accentNeon"
                            } text-xs font-bold"
                        >
                            ${
                                connection
                                    ? connection.status === "CONNECTED"
                                        ? "Connected"
                                        : "Pending"
                                    : "Connect"
                            }
                        </button>

                    </div>
                `;

            }).join("");

    } catch (error) {

        box.innerHTML = `
            <div class="text-red-300">
                ${esc(error?.message || "Unable to load scout network.")}
            </div>
        `;
    }
}

/* =========================================================
   CONNECTIONS
========================================================= */

async function loadConnections() {

    const box =
        document.getElementById("connections-list");

    if (!box) return;

    try {

        const rows =
            await apiRequest("/connections", {
                auth: true
            });

        if (!Array.isArray(rows) || !rows.length) {

            box.innerHTML = `
                <p class="text-xs text-gray-500">
                    No scout connections yet.
                </p>
            `;

            return;
        }

        box.innerHTML =
            rows.map(connection => `
                <div class="flex items-center justify-between p-3 rounded-xl bg-darkbg/60 border border-gray-800">

                    <div>

                        <div class="font-bold text-sm">
                            ${esc(connection.name)}
                        </div>

                        <div class="text-xs text-gray-500">
                            ${esc(connection.organization)}
                        </div>

                    </div>

                    <span class="text-[10px] font-bold px-2 py-1 rounded-full ${
                        connection.status === "CONNECTED"
                            ? "bg-accentGreen/10 text-accentGreen"
                            : "bg-yellow-400/10 text-yellow-300"
                    }">
                        ${esc(connection.status)}
                    </span>

                </div>
            `).join("");

    } catch (error) {

        box.innerHTML = `
            <p class="text-xs text-red-300">
                ${esc(error?.message || "Unable to load connections.")}
            </p>
        `;
    }
}

/* =========================================================
   APPLICATIONS
========================================================= */

async function loadApplications() {

    const box =
        document.getElementById("applications-list");

    if (!box) return;

    try {

        const rows =
            await apiRequest("/applications", {
                auth: true
            });

        if (!Array.isArray(rows) || !rows.length) {

            box.innerHTML = `
                <p class="text-xs text-gray-500">
                    No trial applications yet.
                </p>
            `;

            return;
        }

        box.innerHTML =
            rows.map(application => `
                <div class="p-3 rounded-xl bg-darkbg/60 border border-gray-800">

                    <div class="flex justify-between gap-2">

                        <b class="text-sm">
                            ${esc(application.trial_name)}
                        </b>

                        <span class="text-[10px] font-bold text-accentNeon">
                            ${esc(application.status)}
                        </span>

                    </div>

                    <div class="text-[11px] text-gray-500 mt-1">
                        Application #
                        ${esc(application.application_id)}
                        •
                        ${esc(application.trial_date)}
                    </div>

                </div>
            `).join("");

    } catch (error) {

        box.innerHTML = `
            <p class="text-xs text-red-300">
                ${esc(error?.message || "Unable to load applications.")}
            </p>
        `;
    }
}

/* =========================================================
   BOOKINGS LIST
========================================================= */

async function loadBookings() {

    const box =
        document.getElementById("bookings-list");

    if (!box) return;

    try {

        const rows =
            await apiRequest("/bookings", {
                auth: true
            });

        if (!Array.isArray(rows) || !rows.length) {

            box.innerHTML = `
                <p class="text-xs text-gray-500">
                    No booked trials yet.
                </p>
            `;

            return;
        }

        box.innerHTML =
            rows.map(booking => `
                <div class="p-4 rounded-xl bg-darkbg/60 border border-gray-800">

                    <div class="flex justify-between gap-2">

                        <b class="text-sm">
                            ${esc(booking.trial_name)}
                        </b>

                        <span class="text-[10px] font-bold text-accentGreen">
                            ${esc(booking.status)}
                        </span>

                    </div>

                    <div class="text-xs text-gray-400 mt-1">
                        ${esc(booking.venue)}
                    </div>

                    <div class="text-xs text-gray-500 mt-1">
                        ${esc(booking.slot_date)}
                        •
                        ${esc(booking.slot_time)}
                        •
                        Booking #
                        ${esc(booking.booking_id)}
                    </div>

                    <button
                        onclick="showBooking(${Number(booking.booking_id)})"
                        class="mt-3 text-xs text-accentBlue hover:text-white font-bold"
                    >
                        View confirmation →
                    </button>

                </div>
            `).join("");

    } catch (error) {

        box.innerHTML = `
            <p class="text-xs text-red-300">
                ${esc(error?.message || "Unable to load bookings.")}
            </p>
        `;
    }
}

async function showBooking(id) {

    try {

        const booking =
            await apiRequest(`/bookings/${id}`, {
                auth: true
            });

        showBookingCard(booking);

    } catch (error) {

        showFeatureToast(
            error?.message || "Unable to load booking.",
            "error"
        );
    }
}

function showBookingCard(booking) {

    const content =
        document.getElementById("result-modal-content");

    if (!content) return;

    content.innerHTML = `
        <div class="space-y-5">

            <div class="flex items-center gap-3">

                <div class="w-12 h-12 rounded-xl bg-accentGreen/10 text-accentGreen flex items-center justify-center">
                    <i class="fa-solid fa-ticket"></i>
                </div>

                <div>

                    <h3 class="text-xl font-black">
                        Booking Confirmed
                    </h3>

                    <p class="text-xs text-gray-500">
                        Booking #
                        ${esc(booking.booking_id)}
                    </p>

                </div>

            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">

                <div class="p-3 rounded-xl bg-darkbg/60">
                    <span class="text-gray-500 block text-xs">
                        Trial
                    </span>
                    ${esc(booking.trial_name)}
                </div>

                <div class="p-3 rounded-xl bg-darkbg/60">
                    <span class="text-gray-500 block text-xs">
                        Sport
                    </span>
                    ${esc(booking.sport)}
                </div>

                <div class="p-3 rounded-xl bg-darkbg/60">
                    <span class="text-gray-500 block text-xs">
                        Venue
                    </span>
                    ${esc(booking.venue)}
                </div>

                <div class="p-3 rounded-xl bg-darkbg/60">
                    <span class="text-gray-500 block text-xs">
                        Date & Time
                    </span>
                    ${esc(booking.slot_date)}
                    •
                    ${esc(booking.slot_time)}
                </div>

            </div>

            <div class="p-4 rounded-xl border border-accentBlue/30 bg-accentBlue/5 text-xs text-gray-300">
                ${
                    booking.email_sent
                        ? "Confirmation email sent."
                        : "SMTP is not configured. Your booking confirmation is available locally."
                }
            </div>

            ${
                booking.confirmation_token
                    ? `
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="/api/confirm-booking?token=${encodeURIComponent(booking.confirmation_token)}"
                            class="block text-center py-3 rounded-xl bg-accentBlue text-darkbg font-bold text-sm"
                        >
                            Open Confirmation
                        </a>
                    `
                    : ""
            }

        </div>
    `;

    openModal("result-modal");
}

/* =========================================================
   OPPORTUNITIES
========================================================= */

async function loadOpportunityCards() {
    // Static opportunity cards retain the existing design.
    // Their real API actions can be attached here if needed.
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    if (!window.AuthState?.isLoggedIn()) return;

    try {

        const rows =
            await apiRequest("/notifications", {
                auth: true
            });

        let bell =
            document.getElementById("notification-bell");

        if (!bell) {

            bell = document.createElement("button");

            bell.id = "notification-bell";

            bell.className =
                "fixed top-24 right-5 z-40 w-11 h-11 rounded-full bg-gray-950/90 border border-gray-700 text-white shadow-xl hover:border-accentBlue transition";

            document.body.appendChild(bell);
        }

        const safeRows =
            Array.isArray(rows) ? rows : [];

        const unread =
            safeRows.filter(
                notification => !notification.is_read
            ).length;

        bell.innerHTML =
            '<i class="fa-solid fa-bell"></i>' +
            (
                unread
                    ? `
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center">
                            ${unread}
                        </span>
                    `
                    : ""
            );

        bell.onclick = () =>
            showNotifications(safeRows);

    } catch (error) {

        console.warn(
            "Notification loading error:",
            error
        );
    }
}

function showNotifications(rows) {

    const content =
        document.getElementById("result-modal-content");

    if (!content) return;

    const safeRows =
        Array.isArray(rows) ? rows : [];

    content.innerHTML = `
        <div>

            <h3 class="text-xl font-black mb-4">
                Notifications
            </h3>

            <div class="space-y-2">

                ${
                    safeRows.length
                        ? safeRows.slice(0, 12).map(notification => `
                            <div class="p-3 rounded-xl border border-gray-800 bg-darkbg/60">

                                <div class="font-bold text-sm">
                                    ${esc(notification.title)}
                                </div>

                                <div class="text-xs text-gray-400 mt-1">
                                    ${esc(notification.message)}
                                </div>

                            </div>
                        `).join("")
                        : `
                            <p class="text-sm text-gray-500">
                                No notifications yet.
                            </p>
                        `
                }

            </div>

        </div>
    `;

    openModal("result-modal");

    safeRows
        .filter(notification => !notification.is_read)
        .forEach(notification => {

            apiRequest(
                `/notifications/${notification.id}/read`,
                {
                    method: "POST",
                    auth: true
                }
            ).catch(() => {});

        });

    setTimeout(
        loadNotifications,
        400
    );
}

/* =========================================================
   PROFILE
========================================================= */

async function loadProfileIntoDashboard() {

    try {

        const profile =
            await apiRequest(
                "/user/profile",
                {
                    auth: true
                }
            );

        const name =
            document.getElementById("dash-user-name");

        if (name) {
            name.replaceChildren(
                document.createTextNode(
                    profile?.fullName || "Athlete"
                )
            );
        }

        const sport =
            document.getElementById("dash-user-sport");

        if (sport) {
            sport.textContent =
                profile?.sport || "Athlete";
        }

        const email =
            document.getElementById("dash-user-email");

        if (email) {
            email.textContent =
                profile?.email || "";
        }

        const location =
            document.querySelector(
                "#dash-user-location span"
            );

        if (location) {
            location.textContent =
                profile?.location || "Location not set";
        }

        const avatar =
            document.getElementById("profile-avatar");

        if (avatar) {

            const initials =
                (profile?.fullName || "A")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(part => part[0])
                    .join("")
                    .toUpperCase();

            avatar.textContent =
                initials || "A";
        }

    } catch (error) {

        if (
            error?.status === 401 ||
            error?.status === 403
        ) {

            window.AuthState?.clearSession?.();

            if (typeof refreshAuthUI === "function") {
                refreshAuthUI();
            }
        }
    }
}

/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    if (!window.AuthState?.isLoggedIn()) {
        return;
    }

    await loadAthleteFeatures();
}

/* =========================================================
   MODALS
========================================================= */

function openModal(id) {
    document
        .getElementById(id)
        ?.classList.remove("hidden");
}

function closeModal(id) {
    document
        .getElementById(id)
        ?.classList.add("hidden");
}

function openAchievementModal() {
    openModal("achievement-modal");
}

/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.switchTab = switchTab;
window.toggleMobileMenu = toggleMobileMenu;
window.filterAthletes = filterAthletes;
window.showFeatureToast = showFeatureToast;

window.runAIMatching = runAIMatching;

window.loadAthleteFeatures = loadAthleteFeatures;
window.loadDashboard = loadDashboard;
window.loadDashboardTrials = loadDashboardTrials;
window.loadTrials = loadTrials;
window.loadScouts = loadScouts;

window.loadAchievements = loadAchievements;
window.addAchievement = addAchievement;
window.deleteAchievement = deleteAchievement;
window.submitAchievement = submitAchievement;

window.openTrialApplication = openTrialApplication;
window.submitTrialApplication = submitTrialApplication;
window.showApplicationResult = showApplicationResult;

window.showTrialSlots = showTrialSlots;
window.bookSlot = bookSlot;

window.findNearbyCoaches = findNearbyCoaches;

window.openCoachConnection = openCoachConnection;
window.submitCoachConnection = submitCoachConnection;

window.openScoutConnection = openScoutConnection;
window.submitScoutConnection = submitScoutConnection;

window.loadScoutNetwork = loadScoutNetwork;
window.loadConnections = loadConnections;

window.loadApplications = loadApplications;
window.loadBookings = loadBookings;

window.showBooking = showBooking;
window.showBookingCard = showBookingCard;

window.loadNotifications = loadNotifications;
window.showNotifications = showNotifications;

window.loadProfileIntoDashboard = loadProfileIntoDashboard;

window.openAchievementModal = openAchievementModal;

window.openModal = openModal;
window.closeModal = closeModal;
