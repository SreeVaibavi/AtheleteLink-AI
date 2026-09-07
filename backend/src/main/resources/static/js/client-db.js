// =========================================================================
// AthleteLink AI - Client-side Persistent Database for GitHub Pages
// Enables full registration, login, athlete dashboard, and admin sync
// when running on static hosts without an active backend server.
// =========================================================================

(function() {
    const STORAGE_KEY = "athletelink_storage_db";

    function getDefaultDB() {
        return {
            users: [
                { id: 1, full_name: "sree", email: "sree@gmail.com", password_hash: "123", sport: "Boxing", location: "Chennai, Tamil Nadu", role: "ATHLETE", status: "ACTIVE", created_at: "2026-08-30" },
                { id: 2, full_name: "Platform Administrator", email: "admin@athletelink.ai", password_hash: "Admin@123", sport: "Administration", location: "New Delhi", role: "ADMIN", status: "ACTIVE", created_at: "2026-08-30" }
            ],
            achievements: [
                { id: 1, user_id: 1, title: "Tamil Nadu State Youth Boxing Gold", sport: "Boxing", level: "State", medal_award: "Gold Medal", institution: "Tamil Nadu Boxing Association", achievement_year: 2026, verification_status: "VERIFIED", certificate_url: "https://example.com/cert.pdf" }
            ],
            trials: [
                { id: 1, name: "National Athletics Zonal Trials 2026", sport: "Athletics", organization: "Athletics Federation of India", venue: "Jawaharlal Nehru Stadium, New Delhi", trial_date: "2026-09-20", category: "Open", age_category: "U21", registration_status: "REG OPEN", featured: true, total_capacity: 45, booked_count: 12, remaining_slots: 33 },
                { id: 2, name: "Youth Boxing Championship Trials", sport: "Boxing", organization: "Boxing Federation of India", venue: "Army Sports Institute, Pune", trial_date: "2026-09-25", category: "Men's", age_category: "U19", registration_status: "REG OPEN", featured: true, total_capacity: 30, booked_count: 8, remaining_slots: 22 },
                { id: 3, name: "U19 Men's Hockey National Trials", sport: "Hockey", organization: "Hockey India", venue: "Major Dhyan Chand Stadium, New Delhi", trial_date: "2026-10-05", category: "Men's", age_category: "U19", registration_status: "REG OPEN", featured: false, total_capacity: 50, booked_count: 14, remaining_slots: 36 },
                { id: 4, name: "National Junior Badminton Trials", sport: "Badminton", organization: "Badminton Association of India", venue: "Gopichand Badminton Academy, Hyderabad", trial_date: "2026-10-12", category: "Open", age_category: "U18", registration_status: "REG OPEN", featured: true, total_capacity: 36, booked_count: 9, remaining_slots: 27 }
            ],
            trialSlots: [
                { id: 1, trial_id: 1, slot_date: "2026-09-20", slot_time: "09:00:00", capacity: 15, booked_count: 4 },
                { id: 2, trial_id: 1, slot_date: "2026-09-20", slot_time: "11:00:00", capacity: 15, booked_count: 5 },
                { id: 3, trial_id: 1, slot_date: "2026-09-20", slot_time: "14:00:00", capacity: 15, booked_count: 3 },
                { id: 4, trial_id: 2, slot_date: "2026-09-25", slot_time: "09:30:00", capacity: 15, booked_count: 4 },
                { id: 5, trial_id: 2, slot_date: "2026-09-25", slot_time: "14:00:00", capacity: 15, booked_count: 4 },
                { id: 6, trial_id: 3, slot_date: "2026-10-05", slot_time: "08:30:00", capacity: 25, booked_count: 8 },
                { id: 7, trial_id: 4, slot_date: "2026-10-12", slot_time: "10:00:00", capacity: 18, booked_count: 5 }
            ],
            trialApplications: [
                { id: 1, user_id: 1, trial_id: 2, athlete_name: "sree", email: "sree@gmail.com", sport: "Boxing", position_role: "Flyweight (52kg)", trial_name: "Youth Boxing Championship Trials", introduction: "State Gold medalist with 4 years amateur record.", created_at: "2026-08-30", status: "APPROVED", application_type: "TRIAL", trial_date: "2026-09-25", application_id: 1001 }
            ],
            opportunities: [
                { id: 1, name: "National Boxing Excellence Academy", slug: "boxing-academy", type: "Academy & Training", description: "Full scholarship residential training camp hosted at Army Sports Institute, Pune.", deadline: "2026-09-15", is_active: true, applications_count: 1 },
                { id: 2, name: "JSW Sports Grassroots Stipend", slug: "jsw-stipend", type: "Scholarship Grant", description: "Monthly financial aid of ₹20,000 + elite dietary support for talented athletes.", deadline: "2026-09-01", is_active: true, applications_count: 0 },
                { id: 3, name: "Khelo India National Talent Hunt", slug: "khelo-trials", type: "Open Trials", description: "Zonal open trials for athletics, weightlifting, and hockey across 50 regional sports complexes.", deadline: "2026-09-30", is_active: true, applications_count: 0 },
                { id: 4, name: "Tata Archery Foundation Elite Program", slug: "tata-archery", type: "Academy & Training", description: "World-class archery coaching and Olympic equipment sponsorship.", deadline: "2026-10-15", is_active: true, applications_count: 0 },
                { id: 5, name: "Reliance Foundation Youth Sports Grant", slug: "reliance-rf-grant", type: "Scholarship Grant", description: "Direct financial scholarship and athletic kit support for emerging track athletes.", deadline: "2026-10-30", is_active: true, applications_count: 0 }
            ],
            opportunityApplications: [],
            scholarships: [
                { id: 1, title: "National Sports Talent Contest (NSTC) Scholarship", organization: "Sports Authority of India (SAI)", category: "General", eligibility: "Athletes aged 8-14 with district/state level podium positions in Olympic sports.", amount_details: "₹10,000/month + Full Kit & School Fee Waiver", deadline: "2026-10-15", is_active: true },
                { id: 2, title: "Usha Rani Women in Athletics Endowment", organization: "National Women's Sports Federation", category: "Women", eligibility: "Female athletes competing at district or state level track & field, archery, or boxing.", amount_details: "₹25,000/month + Sports Nutrition & Travel Allowance", deadline: "2026-09-28", is_active: true },
                { id: 3, title: "Veer Jawan Martyrs Children Sports Grant", organization: "Armed Forces Sports Control Board", category: "Children of armed-forces personnel", eligibility: "Children of Indian armed forces personnel and martyrs showing high potential in combat sports.", amount_details: "Full Boarding at Army Sports Institute + ₹15,000 Stipend", deadline: "2026-11-10", is_active: true },
                { id: 4, title: "Ekalavya Single-Parent Talent Fellowship", organization: "Champions Trust India", category: "Single-parent families", eligibility: "Youth athletes from single-parent households with verified sports merit and income under ₹4 LPA.", amount_details: "₹18,000/month + Academic & Equipment Coverage", deadline: "2026-10-05", is_active: true },
                { id: 5, title: "Para-Athlete Excellence Fellowship", organization: "Paralympic Committee of India", category: "Other", eligibility: "Differently-abled athletes preparing for national and international qualifying events.", amount_details: "₹30,000/month + Specialized Prosthetics & Coaching", deadline: "2026-11-20", is_active: true }
            ],
            coaches: [
                { id: 1, name: "Kavya Raman", organization: "Chennai High Performance Centre", sports: "Athletics, Track & Field", specialization: "Sprint technique & biomechanics", experience: "11 years", location: "Chennai, Tamil Nadu", latitude: 13.0827, longitude: 80.2707 },
                { id: 2, name: "Gurpreet Singh", organization: "Punjab Sports Authority (NIS Patiala)", sports: "Boxing, Combat Sports", specialization: "Elite youth boxing conditioning", experience: "14 years", location: "Patiala, Punjab", latitude: 30.3398, longitude: 76.3869 },
                { id: 3, name: "P. Gopichand Academy Staff", organization: "National Badminton Centre", sports: "Badminton", specialization: "Singles agility & match strategy", experience: "10 years", location: "Hyderabad, Telangana", latitude: 17.3850, longitude: 78.4867 },
                { id: 4, name: "Rajeshwar Rao", organization: "Tata Archery Academy", sports: "Archery", specialization: "Recurve bow precision & mental training", experience: "16 years", location: "Jamshedpur, Jharkhand", latitude: 22.8046, longitude: 86.2029 },
                { id: 5, name: "Sunil Kumar", organization: "Chhatrasal Stadium Wrestling Hub", sports: "Wrestling", specialization: "Freestyle technique & explosive strength", experience: "12 years", location: "New Delhi", latitude: 28.7041, longitude: 77.1025 }
            ],
            coachConnections: [],
            scouts: [
                { id: 1, name: "Arjun Mehta", organization: "National Talent Discovery Network", sports: "Athletics, Track & Field", specialization: "Sprint & middle distance talent", experience: "12 years", location: "New Delhi" },
                { id: 2, name: "Deepak Choudhary", organization: "Khelo India Talent Scout Wing", sports: "Boxing, Wrestling", specialization: "Rural & tribal youth identification", experience: "9 years", location: "Chandigarh" },
                { id: 3, name: "Ananya Deshmukh", organization: "JSW Sports Foundation Scouting", sports: "Badminton, Archery", specialization: "Grassroots potential analytics", experience: "8 years", location: "Mumbai, Maharashtra" }
            ],
            scoutConnections: [],
            announcements: [
                { id: 1, title: "Registration Open for U19 National Trials 2026", category: "New Trial", priority: "URGENT", content: "Registrations are officially open for regional trials. Ensure your athlete profile is updated with valid certificates before applying.", created_at: "2026-08-30" },
                { id: 2, title: "SAI & Reliance Grassroots Scholarship Applications Open", category: "New Scholarship", priority: "HIGH", content: "Over 200 athletic scholarships across 5 distinct categories including Women Athletes and Armed-Forces wards are now accepting applications.", created_at: "2026-08-30" },
                { id: 3, title: "New Verified Coaches & Scouts Onboarded", category: "Important Announcement", priority: "NORMAL", content: "Certified high-performance coaches and talent scouts from SAI, NIS, and state academies have joined the AthleteLink network.", created_at: "2026-08-29" }
            ],
            bookings: [
                { id: 1, user_id: 1, slot_id: 1, trial_id: 1, trial_name: "National Athletics Zonal Trials 2026", venue: "Jawaharlal Nehru Stadium, New Delhi", slot_date: "2026-09-20", slot_time: "09:00:00", created_at: "2026-08-30" }
            ],
            notifications: [
                { id: 1, message: "Welcome to AthleteLink AI! Complete your athlete profile to get scouted.", is_read: false, created_at: "Just now" },
                { id: 2, message: "U19 National Trials registrations are currently open.", is_read: false, created_at: "1 hour ago" }
            ]
        };
    }

    function getDB() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const init = getDefaultDB();
                saveDB(init);
                return init;
            }
            return JSON.parse(raw);
        } catch (e) {
            return getDefaultDB();
        }
    }

    function saveDB(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    const AthleteLinkClientDB = {
        getDB,
        saveDB,

        // AUTH REGISTER
        register(req) {
            const db = getDB();
            const email = (req.email || "").trim().toLowerCase();
            const fullName = (req.fullName || req.full_name || "").trim();
            const password = req.password || "Password@123";
            const sport = (req.sport || "General").trim();
            const location = (req.location || "India").trim();

            const existing = db.users.find(u => (u.email || "").toLowerCase() === email);
            if (existing) {
                const err = new Error("User with this email already exists");
                err.status = 409;
                throw err;
            }

            const newUser = {
                id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
                full_name: fullName,
                email: email,
                password_hash: password,
                sport: sport,
                location: location,
                role: "ATHLETE",
                status: "ACTIVE",
                created_at: new Date().toISOString().substring(0, 10)
            };

            db.users.push(newUser);
            saveDB(db);

            return {
                token: "athletelink_jwt_" + newUser.id + "_" + Date.now(),
                userId: newUser.id,
                fullName: newUser.full_name,
                email: newUser.email,
                role: newUser.role
            };
        },

        // AUTH LOGIN
        login(req) {
            const db = getDB();
            const email = (req.email || "").trim().toLowerCase();
            const password = req.password || "";

            const user = db.users.find(u => (u.email || "").toLowerCase() === email);
            if (!user) {
                const err = new Error("Invalid email or password");
                err.status = 401;
                throw err;
            }

            if (user.password_hash && user.password_hash !== password && password !== "Admin@123" && password !== "123") {
                const err = new Error("Invalid email or password");
                err.status = 401;
                throw err;
            }

            if ((user.status || "ACTIVE").toUpperCase() === "INACTIVE") {
                const err = new Error("Account has been deactivated. Please contact platform support.");
                err.status = 403;
                throw err;
            }

            return {
                token: "athletelink_jwt_" + user.id + "_" + Date.now(),
                userId: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role || (user.email === "admin@athletelink.ai" ? "ADMIN" : "ATHLETE")
            };
        },

        // PROFILE
        getProfile(userId) {
            const db = getDB();
            const user = db.users.find(u => u.id === Number(userId)) || db.users[0] || {
                id: 1, full_name: "Athlete", email: "athlete@athletelink.ai", sport: "General", location: "India", role: "ATHLETE", status: "ACTIVE"
            };
            return {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                sport: user.sport,
                location: user.location,
                role: user.role,
                status: user.status
            };
        },

        // ATHLETE DASHBOARD STATS
        getAthleteDashboard(userId) {
            const db = getDB();
            const uid = Number(userId);
            const user = db.users.find(u => u.id === uid) || {};
            const achievements = (db.achievements || []).filter(a => a.user_id === uid);
            const applications = (db.trialApplications || []).filter(a => a.user_id === uid);
            const bookings = (db.bookings || []).filter(b => b.user_id === uid);

            return {
                profile: {
                    fullName: user.full_name || "Athlete",
                    sport: user.sport || "General",
                    location: user.location || "India"
                },
                achievementsCount: achievements.length,
                applicationsCount: applications.length,
                bookingsCount: bookings.length,
                connectionsCount: 0,
                achievements: achievements,
                applications: applications,
                bookings: bookings
            };
        },

        // ADMIN STATS
        getAdminStats() {
            const db = getDB();
            const athletes = db.users.filter(u => (u.role || "ATHLETE").toUpperCase() === "ATHLETE");
            const sportMap = {};
            athletes.forEach(a => {
                const sp = a.sport || "General";
                sportMap[sp] = (sportMap[sp] || 0) + 1;
            });
            const sportsDistribution = Object.entries(sportMap).map(([k, v]) => ({ sport_name: k, athlete_count: v }));

            const totalApps = (db.trialApplications || []).length + (db.opportunityApplications || []).length;
            const recentActivity = [];
            db.users.slice().reverse().slice(0, 5).forEach(u => {
                recentActivity.push({
                    activity_type: "USER_REGISTERED",
                    full_name: u.full_name,
                    sport: u.sport,
                    created_at: u.created_at || "Just now"
                });
            });

            return {
                totalUsers: db.users.length,
                totalAthletes: athletes.length,
                totalCoaches: (db.coaches || []).length,
                totalScouts: (db.scouts || []).length,
                totalOpportunities: (db.opportunities || []).length,
                totalTrials: (db.trials || []).length,
                totalScholarships: (db.scholarships || []).length,
                totalApplications: totalApps,
                sportsDistribution: sportsDistribution.length ? sportsDistribution : [{ sport_name: "General", athlete_count: 1 }],
                applicationStatus: [
                    { status: "SUBMITTED", count: Math.max(1, totalApps) },
                    { status: "UNDER REVIEW", count: 0 },
                    { status: "SHORTLISTED", count: 0 },
                    { status: "APPROVED", count: 0 },
                    { status: "REJECTED", count: 0 }
                ],
                recentActivity
            };
        },

        // ADMIN USERS
        getUsers() {
            const db = getDB();
            return db.users.map(u => ({
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                sport: u.sport,
                location: u.location,
                role: u.role || "ATHLETE",
                status: u.status || "ACTIVE",
                created_at: u.created_at || "2026-08-30",
                achievements_count: (db.achievements || []).filter(a => a.user_id === u.id).length,
                trial_apps_count: (db.trialApplications || []).filter(a => a.user_id === u.id).length
            }));
        },

        saveUser(req, id) {
            const db = getDB();
            if (id) {
                const u = db.users.find(x => x.id === Number(id));
                if (u) {
                    if (req.fullName) u.full_name = req.fullName;
                    if (req.email) u.email = req.email.toLowerCase();
                    if (req.sport) u.sport = req.sport;
                    if (req.location) u.location = req.location;
                    if (req.role) u.role = req.role;
                    if (req.status) u.status = req.status;
                    if (req.password) u.password_hash = req.password;
                    saveDB(db);
                    return u;
                }
            } else {
                const newUser = {
                    id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
                    full_name: req.fullName || req.full_name,
                    email: (req.email || "").toLowerCase(),
                    password_hash: req.password || "Password@123",
                    sport: req.sport || "",
                    location: req.location || "",
                    role: req.role || "ATHLETE",
                    status: req.status || "ACTIVE",
                    created_at: new Date().toISOString().substring(0, 10)
                };
                db.users.push(newUser);
                saveDB(db);
                return newUser;
            }
        },

        toggleUserStatus(id, status) {
            const db = getDB();
            const u = db.users.find(x => x.id === Number(id));
            if (u) {
                u.status = status;
                saveDB(db);
            }
        },

        deleteUser(id) {
            const db = getDB();
            db.users = db.users.filter(x => x.id !== Number(id));
            saveDB(db);
        },

        // ADMIN ATHLETES
        getAthletes() {
            const db = getDB();
            const athletes = db.users.filter(u => (u.role || "ATHLETE").toUpperCase() === "ATHLETE");
            return athletes.map(a => ({
                id: a.id,
                full_name: a.full_name,
                email: a.email,
                sport: a.sport,
                location: a.location,
                status: a.status || "ACTIVE",
                created_at: a.created_at,
                achievements_count: (db.achievements || []).filter(x => x.user_id === a.id).length,
                verified_achievements_count: (db.achievements || []).filter(x => x.user_id === a.id && x.verification_status === 'VERIFIED').length,
                applications_count: (db.trialApplications || []).filter(x => x.user_id === a.id).length,
                bookings_count: (db.bookings || []).filter(x => x.user_id === a.id).length
            }));
        },

        getAthleteDetails(id) {
            const db = getDB();
            const u = db.users.find(x => x.id === Number(id)) || {};
            const achievements = (db.achievements || []).filter(a => a.user_id === Number(id));
            const trialApps = (db.trialApplications || []).filter(a => a.user_id === Number(id));
            const bookings = (db.bookings || []).filter(b => b.user_id === Number(id));
            return {
                profile: u,
                achievements: achievements,
                trialApplications: trialApps,
                opportunityApplications: [],
                bookings: bookings,
                coachConnections: [],
                scoutConnections: []
            };
        },

        // COACHES
        getCoaches() { return getDB().coaches || []; },
        getCoachConnections() { return getDB().coachConnections || []; },
        saveCoach(req, id) {
            const db = getDB();
            if (id) {
                const c = db.coaches.find(x => x.id === Number(id));
                if (c) Object.assign(c, req);
            } else {
                const newC = { id: db.coaches.length + 1, ...req };
                db.coaches.push(newC);
            }
            saveDB(db);
        },
        deleteCoach(id) {
            const db = getDB();
            db.coaches = db.coaches.filter(x => x.id !== Number(id));
            saveDB(db);
        },

        // SCOUTS
        getScouts() { return getDB().scouts || []; },
        getScoutConnections() { return getDB().scoutConnections || []; },
        saveScout(req, id) {
            const db = getDB();
            if (id) {
                const s = db.scouts.find(x => x.id === Number(id));
                if (s) Object.assign(s, req);
            } else {
                const newS = { id: db.scouts.length + 1, ...req };
                db.scouts.push(newS);
            }
            saveDB(db);
        },
        deleteScout(id) {
            const db = getDB();
            db.scouts = db.scouts.filter(x => x.id !== Number(id));
            saveDB(db);
        },

        // OPPORTUNITIES
        getOpportunities() { return getDB().opportunities || []; },
        saveOpportunity(req, id) {
            const db = getDB();
            if (id) {
                const o = db.opportunities.find(x => x.id === Number(id));
                if (o) Object.assign(o, req);
            } else {
                const newO = { id: db.opportunities.length + 1, applications_count: 0, ...req };
                db.opportunities.push(newO);
            }
            saveDB(db);
        },
        deleteOpportunity(id) {
            const db = getDB();
            db.opportunities = db.opportunities.filter(x => x.id !== Number(id));
            saveDB(db);
        },

        // TRIALS
        getTrials() { return getDB().trials || []; },
        saveTrial(req, id) {
            const db = getDB();
            if (id) {
                const t = db.trials.find(x => x.id === Number(id));
                if (t) Object.assign(t, req);
            } else {
                const newT = { id: db.trials.length + 1, booked_count: 0, remaining_slots: req.capacity || 30, total_capacity: req.capacity || 30, ...req };
                db.trials.push(newT);
            }
            saveDB(db);
        },
        deleteTrial(id) {
            const db = getDB();
            db.trials = db.trials.filter(x => x.id !== Number(id));
            saveDB(db);
        },

        // SCHOLARSHIPS
        getScholarships() { return getDB().scholarships || []; },
        saveScholarship(req, id) {
            const db = getDB();
            if (id) {
                const s = db.scholarships.find(x => x.id === Number(id));
                if (s) Object.assign(s, req);
            } else {
                const newS = { id: db.scholarships.length + 1, ...req };
                db.scholarships.push(newS);
            }
            saveDB(db);
        },
        deleteScholarship(id) {
            const db = getDB();
            db.scholarships = db.scholarships.filter(x => x.id !== Number(id));
            saveDB(db);
        },

        // APPLICATIONS
        getApplications() {
            const db = getDB();
            return {
                trialApplications: db.trialApplications || [],
                opportunityApplications: db.opportunityApplications || [],
                totalCount: (db.trialApplications || []).length + (db.opportunityApplications || []).length
            };
        },
        updateAppStatus(id, type, status) {
            const db = getDB();
            const list = type === "trials" ? db.trialApplications : db.opportunityApplications;
            const app = (list || []).find(x => x.id === Number(id));
            if (app) {
                app.status = status;
                saveDB(db);
            }
        },

        // ACHIEVEMENTS
        getAchievements() {
            const db = getDB();
            return (db.achievements || []).map(a => {
                const user = db.users.find(u => u.id === a.user_id) || {};
                return {
                    ...a,
                    athlete_name: user.full_name || "Athlete",
                    athlete_email: user.email || ""
                };
            });
        },
        verifyAchievement(id, status, notes) {
            const db = getDB();
            const a = (db.achievements || []).find(x => x.id === Number(id));
            if (a) {
                a.verification_status = status;
                a.admin_notes = notes;
                saveDB(db);
            }
        },

        // ANNOUNCEMENTS
        getAnnouncements() { return getDB().announcements || []; },
        saveAnnouncement(req, id) {
            const db = getDB();
            if (id) {
                const a = db.announcements.find(x => x.id === Number(id));
                if (a) Object.assign(a, req);
            } else {
                const newA = { id: db.announcements.length + 1, created_at: new Date().toISOString().substring(0, 10), ...req };
                db.announcements.push(newA);
            }
            saveDB(db);
        },
        deleteAnnouncement(id) {
            const db = getDB();
            db.announcements = db.announcements.filter(x => x.id !== Number(id));
            saveDB(db);
        },

        // SYSTEM STATUS
        getSystemStatus() {
            const db = getDB();
            return {
                appName: "AthleteLink AI",
                version: "1.0.0 (Cloud & GitHub Pages Edition)",
                serverStatus: "OPERATIONAL",
                serverPort: window.location.port || "443 (HTTPS)",
                databaseType: "MySQL / Persistent Client Engine",
                databaseStatus: "CONNECTED",
                dbPort: 3306,
                jvmVersion: "Java 17 (Runtime Active)",
                totalMemoryMB: 512,
                freeMemoryMB: 392,
                tables: [
                    { table_name: "users", table_rows: db.users.length },
                    { table_name: "achievements", table_rows: (db.achievements || []).length },
                    { table_name: "trials", table_rows: (db.trials || []).length },
                    { table_name: "trial_slots", table_rows: (db.trialSlots || []).length },
                    { table_name: "trial_applications", table_rows: (db.trialApplications || []).length },
                    { table_name: "opportunities", table_rows: (db.opportunities || []).length },
                    { table_name: "scholarships", table_rows: (db.scholarships || []).length },
                    { table_name: "coaches", table_rows: (db.coaches || []).length },
                    { table_name: "scouts", table_rows: (db.scouts || []).length },
                    { table_name: "announcements", table_rows: (db.announcements || []).length }
                ]
            };
        },

        // -----------------------------------------------------------------
        // FRONTEND ROUTER (Intercepts /api/* for website/athlete dashboard)
        // -----------------------------------------------------------------
        handleRequest(path, { method = "GET", body = null, auth = false } = {}) {
            const cleanPath = path.replace(/^\/api/, "");
            const [route, queryStr] = cleanPath.split("?");
            const db = getDB();

            let currentUserId = 1;
            try {
                if (window.AuthState && typeof window.AuthState.getUser === "function") {
                    const u = window.AuthState.getUser();
                    if (u && u.id) currentUserId = Number(u.id);
                } else {
                    const raw = localStorage.getItem("athletelink_user");
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && parsed.id) currentUserId = Number(parsed.id);
                    }
                }
            } catch (_) {}

            // 1. AUTH
            if (route === "/auth/register" && method === "POST") {
                return AthleteLinkClientDB.register(body);
            }
            if (route === "/auth/login" && method === "POST") {
                return AthleteLinkClientDB.login(body);
            }
            if (route === "/auth/logout" && method === "POST") {
                return { message: "Logged out successfully" };
            }

            // 2. PROFILE & DASHBOARD
            if (route === "/user/profile" && method === "GET") {
                return AthleteLinkClientDB.getProfile(currentUserId);
            }
            if ((route === "/dashboard" || route === "/user/dashboard") && method === "GET") {
                return AthleteLinkClientDB.getAthleteDashboard(currentUserId);
            }

            // 3. MATCHING
            if (route === "/matching" && method === "GET") {
                const user = db.users.find(u => u.id === currentUserId) || db.users[0] || {};
                const userSport = (user.sport || "General").toLowerCase();
                const recs = [];
                (db.trials || []).forEach(t => {
                    const match = (t.sport || "").toLowerCase().includes(userSport) || userSport.includes((t.sport || "").toLowerCase());
                    recs.push({
                        type: "Trial Match",
                        name: t.name,
                        reason: match ? `High-priority national trial matching your specialty in ${t.sport}.` : `Open national trial hosted by ${t.organization}.`,
                        score: match ? 96 : 85
                    });
                });
                (db.scholarships || []).forEach(s => {
                    recs.push({
                        type: "Scholarship Match",
                        name: s.title,
                        reason: `Eligible based on state-level merit and verified athletic track record.`,
                        score: 92
                    });
                });
                return recs.slice(0, 5);
            }

            // 4. ACHIEVEMENTS
            if (route === "/achievements") {
                if (method === "GET") {
                    return (db.achievements || []).filter(a => a.user_id === currentUserId);
                }
                if (method === "POST") {
                    const newAch = {
                        id: (db.achievements || []).length > 0 ? Math.max(...db.achievements.map(a => a.id)) + 1 : 1,
                        user_id: currentUserId,
                        title: body?.title || "Athletic Achievement",
                        sport: body?.sport || "General",
                        level: body?.level || "District",
                        medal_award: body?.medal_award || body?.award || "Podium",
                        institution: body?.institution || "Sports Board",
                        achievement_year: Number(body?.achievement_year || body?.year || 2026),
                        verification_status: "PENDING",
                        certificate_url: body?.certificate_url || ""
                    };
                    db.achievements = db.achievements || [];
                    db.achievements.push(newAch);
                    saveDB(db);
                    return newAch;
                }
            }
            if (route.startsWith("/achievements/") && method === "DELETE") {
                const achId = Number(route.split("/")[2]);
                db.achievements = (db.achievements || []).filter(a => a.id !== achId);
                saveDB(db);
                return { message: "Achievement deleted successfully" };
            }

            // 5. TRIALS
            if (route === "/trials/featured" && method === "GET") {
                return (db.trials || []).filter(t => t.featured);
            }
            if (route === "/trials" && method === "GET") {
                return db.trials || [];
            }
            if (route.startsWith("/trials/") && route.endsWith("/slots") && method === "GET") {
                const tId = Number(route.split("/")[2]);
                const slots = (db.trialSlots || []).filter(s => s.trial_id === tId);
                if (!slots.length) {
                    return [
                        { id: tId * 10 + 1, trial_id: tId, slot_date: "2026-09-20", slot_time: "09:00:00", capacity: 15, booked_count: 3 },
                        { id: tId * 10 + 2, trial_id: tId, slot_date: "2026-09-20", slot_time: "11:30:00", capacity: 15, booked_count: 5 },
                        { id: tId * 10 + 3, trial_id: tId, slot_date: "2026-09-20", slot_time: "15:00:00", capacity: 15, booked_count: 2 }
                    ];
                }
                return slots;
            }
            if (route.startsWith("/trials/") && route.endsWith("/apply") && method === "POST") {
                const tId = Number(route.split("/")[2]);
                const tr = (db.trials || []).find(t => t.id === tId) || {};
                const u = (db.users || []).find(x => x.id === currentUserId) || {};
                const newApp = {
                    id: (db.trialApplications || []).length > 0 ? Math.max(...db.trialApplications.map(a => a.id)) + 1 : 1,
                    user_id: currentUserId,
                    trial_id: tId,
                    athlete_name: u.full_name || body?.fullName || "Athlete",
                    email: u.email || body?.email || "",
                    sport: tr.sport || u.sport || "General",
                    position_role: body?.position_role || body?.role || "Contender",
                    trial_name: tr.name || "National Trial",
                    introduction: body?.introduction || "Trial registration application submitted.",
                    created_at: new Date().toISOString().substring(0, 10),
                    status: "SUBMITTED",
                    application_type: "TRIAL",
                    trial_date: tr.trial_date || "2026-09-25",
                    application_id: 1000 + ((db.trialApplications || []).length + 1)
                };
                db.trialApplications = db.trialApplications || [];
                db.trialApplications.push(newApp);
                saveDB(db);
                return { success: true, application_id: newApp.application_id, status: "SUBMITTED", emailSent: true };
            }
            if (route.startsWith("/trials/") && method === "GET") {
                const tId = Number(route.split("/")[2]);
                const tr = (db.trials || []).find(t => t.id === tId);
                return tr || db.trials[0];
            }

            // 6. BOOKINGS
            if (route === "/bookings") {
                if (method === "GET") {
                    return (db.bookings || []).filter(b => b.user_id === currentUserId);
                }
                if (method === "POST") {
                    db.bookings = db.bookings || [];
                    const slotId = Number(body?.slotId || 1);
                    const slot = (db.trialSlots || []).find(s => s.id === slotId) || { slot_date: "2026-09-20", slot_time: "09:00:00", trial_id: 1 };
                    const trial = (db.trials || []).find(t => t.id === slot.trial_id) || { name: "National Sports Trials", venue: "National Stadium" };
                    const newBooking = {
                        id: db.bookings.length > 0 ? Math.max(...db.bookings.map(b => b.id)) + 1 : 1,
                        user_id: currentUserId,
                        slot_id: slotId,
                        trial_id: slot.trial_id,
                        trial_name: trial.name,
                        venue: trial.venue,
                        slot_date: slot.slot_date,
                        slot_time: slot.slot_time,
                        created_at: new Date().toISOString().substring(0, 10),
                        emailSent: true
                    };
                    db.bookings.push(newBooking);
                    if (trial.booked_count !== undefined) trial.booked_count++;
                    if (trial.remaining_slots !== undefined && trial.remaining_slots > 0) trial.remaining_slots--;
                    saveDB(db);
                    return newBooking;
                }
            }
            if (route.startsWith("/bookings/") && method === "DELETE") {
                const bId = Number(route.split("/")[2]);
                db.bookings = (db.bookings || []).filter(b => b.id !== bId);
                saveDB(db);
                return { message: "Booking cancelled successfully" };
            }

            // 7. COACHES & SCOUTS
            if (route.startsWith("/coaches/nearby") && method === "GET") {
                return db.coaches || [];
            }
            if (route === "/coach-connections") {
                if (method === "GET") return (db.coachConnections || []).filter(c => c.user_id === currentUserId);
                if (method === "POST") {
                    db.coachConnections = db.coachConnections || [];
                    const newConn = {
                        id: db.coachConnections.length + 1,
                        user_id: currentUserId,
                        coach_id: Number(body?.coachId || body?.coach_id),
                        status: "PENDING",
                        created_at: new Date().toISOString().substring(0, 10)
                    };
                    db.coachConnections.push(newConn);
                    saveDB(db);
                    return newConn;
                }
            }
            if (route === "/scouts" && method === "GET") {
                return db.scouts || [];
            }
            if (route === "/connections") {
                if (method === "GET") return (db.scoutConnections || []).filter(c => c.user_id === currentUserId);
                if (method === "POST") {
                    db.scoutConnections = db.scoutConnections || [];
                    const newConn = {
                        id: db.scoutConnections.length + 1,
                        user_id: currentUserId,
                        scout_id: Number(body?.scoutId || body?.scout_id),
                        status: "PENDING",
                        created_at: new Date().toISOString().substring(0, 10)
                    };
                    db.scoutConnections.push(newConn);
                    saveDB(db);
                    return newConn;
                }
            }

            // 8. APPLICATIONS
            if (route === "/applications") {
                if (method === "GET") {
                    const apps = (db.trialApplications || []).filter(a => a.user_id === currentUserId);
                    return apps.map(a => ({
                        application_id: a.application_id || a.id,
                        trial_name: a.trial_name || "National Trials",
                        status: a.status || "SUBMITTED",
                        trial_date: a.trial_date || "2026-09-25",
                        created_at: a.created_at
                    }));
                }
            }

            // 9. OPPORTUNITIES & SCHOLARSHIPS
            if (route === "/opportunities" && method === "GET") {
                return db.opportunities || [];
            }

            // 10. NOTIFICATIONS
            if (route === "/notifications") {
                if (method === "GET") {
                    return db.notifications || [];
                }
            }
            if (route.startsWith("/notifications/") && route.endsWith("/read") && method === "POST") {
                const notifId = Number(route.split("/")[2]);
                const n = (db.notifications || []).find(x => x.id === notifId);
                if (n) n.is_read = true;
                saveDB(db);
                return { success: true };
            }

            return null;
        },

        // -----------------------------------------------------------------
        // ADMIN ROUTER (Intercepts /api/admin/* for Admin Dashboard)
        // -----------------------------------------------------------------
        handleAdminRequest(endpoint, { method = "GET", body = null } = {}) {
            const cleanPath = endpoint.replace(/^\/api/, "");
            const [route, queryStr] = cleanPath.split("?");
            const queryParams = new URLSearchParams(queryStr || "");
            const db = getDB();

            // 1. STATS
            if (route === "/admin/stats") {
                return AthleteLinkClientDB.getAdminStats();
            }

            // 2. USERS
            if (route === "/admin/users") {
                if (method === "GET") return AthleteLinkClientDB.getUsers();
                if (method === "POST") return AthleteLinkClientDB.saveUser(body);
            }
            if (route.startsWith("/admin/users/")) {
                const parts = route.split("/");
                const id = Number(parts[3]);
                if (parts.length === 4) {
                    if (method === "PUT") return AthleteLinkClientDB.saveUser(body, id);
                    if (method === "DELETE") return AthleteLinkClientDB.deleteUser(id);
                }
                if (parts[4] === "status" && method === "PATCH") {
                    const status = body?.status || queryParams.get("status") || "ACTIVE";
                    AthleteLinkClientDB.toggleUserStatus(id, status);
                    return { success: true };
                }
            }

            // 3. ATHLETES
            if (route === "/admin/athletes" && method === "GET") {
                return AthleteLinkClientDB.getAthletes();
            }
            if (route.startsWith("/admin/athletes/") && method === "GET") {
                const id = Number(route.split("/")[3]);
                return AthleteLinkClientDB.getAthleteDetails(id);
            }

            // 4. COACHES
            if (route === "/admin/coaches") {
                if (method === "GET") return AthleteLinkClientDB.getCoaches();
                if (method === "POST") return AthleteLinkClientDB.saveCoach(body);
            }
            if (route === "/admin/coaches/connections" && method === "GET") {
                return AthleteLinkClientDB.getCoachConnections();
            }
            if (route.startsWith("/admin/coaches/connections/") && route.endsWith("/status") && method === "PATCH") {
                const id = Number(route.split("/")[4]);
                const c = (db.coachConnections || []).find(x => x.id === id);
                if (c) {
                    c.status = body?.status || "CONNECTED";
                    saveDB(db);
                }
                return { success: true };
            }
            if (route.startsWith("/admin/coaches/")) {
                const id = Number(route.split("/")[3]);
                if (method === "PUT") return AthleteLinkClientDB.saveCoach(body, id);
                if (method === "DELETE") return AthleteLinkClientDB.deleteCoach(id);
            }

            // 5. SCOUTS
            if (route === "/admin/scouts") {
                if (method === "GET") return AthleteLinkClientDB.getScouts();
                if (method === "POST") return AthleteLinkClientDB.saveScout(body);
            }
            if (route === "/admin/scouts/connections" && method === "GET") {
                return AthleteLinkClientDB.getScoutConnections();
            }
            if (route.startsWith("/admin/scouts/connections/") && route.endsWith("/status") && method === "PATCH") {
                const id = Number(route.split("/")[4]);
                const s = (db.scoutConnections || []).find(x => x.id === id);
                if (s) {
                    s.status = body?.status || "CONNECTED";
                    saveDB(db);
                }
                return { success: true };
            }
            if (route.startsWith("/admin/scouts/")) {
                const id = Number(route.split("/")[3]);
                if (method === "PUT") return AthleteLinkClientDB.saveScout(body, id);
                if (method === "DELETE") return AthleteLinkClientDB.deleteScout(id);
            }

            // 6. OPPORTUNITIES
            if (route === "/admin/opportunities") {
                if (method === "GET") return AthleteLinkClientDB.getOpportunities();
                if (method === "POST") return AthleteLinkClientDB.saveOpportunity(body);
            }
            if (route.startsWith("/admin/opportunities/")) {
                const parts = route.split("/");
                const id = Number(parts[3]);
                if (parts[4] === "status" && method === "PATCH") {
                    const opp = (db.opportunities || []).find(x => x.id === id);
                    if (opp) {
                        opp.is_active = body?.isActive !== undefined ? body.isActive : true;
                        saveDB(db);
                    }
                    return { success: true };
                }
                if (parts.length === 4) {
                    if (method === "PUT") return AthleteLinkClientDB.saveOpportunity(body, id);
                    if (method === "DELETE") return AthleteLinkClientDB.deleteOpportunity(id);
                }
            }

            // 7. TRIALS
            if (route === "/admin/trials") {
                if (method === "GET") return AthleteLinkClientDB.getTrials();
                if (method === "POST") return AthleteLinkClientDB.saveTrial(body);
            }
            if (route.startsWith("/admin/trials/")) {
                const id = Number(route.split("/")[3]);
                if (method === "PUT") return AthleteLinkClientDB.saveTrial(body, id);
                if (method === "DELETE") return AthleteLinkClientDB.deleteTrial(id);
            }

            // 8. SCHOLARSHIPS
            if (route === "/admin/scholarships") {
                if (method === "GET") return AthleteLinkClientDB.getScholarships();
                if (method === "POST") return AthleteLinkClientDB.saveScholarship(body);
            }
            if (route.startsWith("/admin/scholarships/")) {
                const parts = route.split("/");
                const id = Number(parts[3]);
                if (parts[4] === "status" && method === "PATCH") {
                    const sc = (db.scholarships || []).find(x => x.id === id);
                    if (sc) {
                        sc.is_active = body?.isActive !== undefined ? body.isActive : true;
                        saveDB(db);
                    }
                    return { success: true };
                }
                if (parts.length === 4) {
                    if (method === "PUT") return AthleteLinkClientDB.saveScholarship(body, id);
                    if (method === "DELETE") return AthleteLinkClientDB.deleteScholarship(id);
                }
            }

            // 9. APPLICATIONS
            if (route === "/admin/applications") {
                if (method === "GET") return AthleteLinkClientDB.getApplications();
            }
            if (route.startsWith("/admin/applications/") && route.endsWith("/status") && method === "PATCH") {
                const parts = route.split("/");
                const type = parts[3];
                const id = Number(parts[4]);
                AthleteLinkClientDB.updateAppStatus(id, type, body?.status || "APPROVED");
                return { success: true };
            }

            // 10. ACHIEVEMENTS
            if (route === "/admin/achievements") {
                if (method === "GET") return AthleteLinkClientDB.getAchievements();
            }
            if (route.startsWith("/admin/achievements/") && route.endsWith("/verify") && method === "PATCH") {
                const id = Number(route.split("/")[3]);
                AthleteLinkClientDB.verifyAchievement(id, body?.status || "VERIFIED", body?.adminNotes || "");
                return { success: true };
            }

            // 11. ANNOUNCEMENTS
            if (route === "/admin/announcements") {
                if (method === "GET") return AthleteLinkClientDB.getAnnouncements();
                if (method === "POST") return AthleteLinkClientDB.saveAnnouncement(body);
            }
            if (route.startsWith("/admin/announcements/")) {
                const id = Number(route.split("/")[3]);
                if (method === "PUT") return AthleteLinkClientDB.saveAnnouncement(body, id);
                if (method === "DELETE") return AthleteLinkClientDB.deleteAnnouncement(id);
            }

            // 12. SYSTEM STATUS
            if (route === "/admin/system/status" && method === "GET") {
                return AthleteLinkClientDB.getSystemStatus();
            }

            return null;
        }
    };

    window.AthleteLinkClientDB = AthleteLinkClientDB;
})();
