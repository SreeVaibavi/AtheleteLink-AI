package com.athletelink.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.*;

@Service
public class AdminService {

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public AdminService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void initAdminSchemaAndSeeds() {
        // Safe column additions
        addColumnIfMissing("users", "role", "VARCHAR(30) NOT NULL DEFAULT 'ATHLETE'");
        addColumnIfMissing("users", "status", "VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'");
        addColumnIfMissing("achievements", "verification_status", "VARCHAR(30) NOT NULL DEFAULT 'PENDING'");
        addColumnIfMissing("achievements", "admin_notes", "VARCHAR(255) NULL");

        // Opportunities table for dynamic management
        jdbc.execute("CREATE TABLE IF NOT EXISTS opportunities (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "slug VARCHAR(80) NOT NULL UNIQUE, " +
                "name VARCHAR(180) NOT NULL, " +
                "type VARCHAR(80) NOT NULL, " +
                "description TEXT NULL, " +
                "deadline DATE NULL, " +
                "is_active BOOLEAN NOT NULL DEFAULT TRUE, " +
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // Scholarships table
        jdbc.execute("CREATE TABLE IF NOT EXISTS scholarships (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "title VARCHAR(180) NOT NULL, " +
                "organization VARCHAR(180) NOT NULL, " +
                "category VARCHAR(80) NOT NULL DEFAULT 'General', " +
                "eligibility TEXT NULL, " +
                "amount_details VARCHAR(180) NULL, " +
                "deadline DATE NULL, " +
                "is_active BOOLEAN NOT NULL DEFAULT TRUE, " +
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // Announcements table
        jdbc.execute("CREATE TABLE IF NOT EXISTS announcements (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "title VARCHAR(180) NOT NULL, " +
                "content TEXT NOT NULL, " +
                "category VARCHAR(60) NOT NULL DEFAULT 'Important Announcement', " +
                "priority VARCHAR(30) NOT NULL DEFAULT 'NORMAL', " +
                "is_active BOOLEAN NOT NULL DEFAULT TRUE, " +
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        seedAdminUser();
        seedOpportunities();
        seedScholarships();
        seedAnnouncements();
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        try {
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
        } catch (Exception ignored) {
            // column already exists
        }
    }

    private void seedAdminUser() {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email='admin@athletelink.ai'", Integer.class);
            if (count == null || count == 0) {
                String passHash = passwordEncoder.encode("Admin@123");
                jdbc.update("INSERT INTO users (full_name, email, password_hash, sport, location, role, status, created_at) " +
                        "VALUES ('Platform Administrator', 'admin@athletelink.ai', ?, 'Administration', 'New Delhi, India', 'ADMIN', 'ACTIVE', NOW())", passHash);
            } else {
                // Ensure role is ADMIN and status is ACTIVE
                jdbc.update("UPDATE users SET role='ADMIN', status='ACTIVE' WHERE email='admin@athletelink.ai'");
            }
        } catch (Exception e) {
            // ignore
        }
    }

    private void seedOpportunities() {
        seedOpIfNotExists("boxing-academy", "National Boxing Excellence Academy", "Academy & Training",
                "Full scholarship residential training camp hosted at Army Sports Institute, Pune for selected youth boxers.", "2026-09-15");
        seedOpIfNotExists("jsw-stipend", "JSW Sports Grassroots Stipend", "Scholarship Grant",
                "Monthly financial aid of ₹20,000 + elite dietary support for talented athletes across rural districts.", "2026-09-01");
        seedOpIfNotExists("khelo-trials", "Khelo India National Talent Hunt", "Open Trials",
                "Zonal open trials for athletics, weightlifting, and hockey across 50 regional sports complexes.", "2026-09-30");
        seedOpIfNotExists("tata-archery", "Tata Archery Foundation Elite Program", "Academy & Training",
                "World-class archery coaching, Olympic equipment sponsorship, and sports science support in Jamshedpur.", "2026-10-15");
        seedOpIfNotExists("reliance-rf-grant", "Reliance Foundation Youth Sports Grant", "Scholarship Grant",
                "Direct financial scholarship and athletic kit support for emerging track and field athletes under 21.", "2026-10-30");
    }

    private void seedOpIfNotExists(String slug, String name, String type, String desc, String deadline) {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM opportunities WHERE slug=?", Integer.class, slug);
            if (count == null || count == 0) {
                jdbc.update("INSERT INTO opportunities(slug, name, type, description, deadline, is_active) VALUES(?,?,?,?,?,TRUE)",
                        slug, name, type, desc, parseDate(deadline));
            }
        } catch (Exception ignored) {}
    }

    private void seedScholarships() {
        seedScholarshipIfNotExists("National Sports Talent Contest (NSTC) Scholarship", "Sports Authority of India (SAI)",
                "General", "Athletes aged 8-14 who have won district/state level competitions in designated olympic disciplines.",
                "₹10,000/month + Full Kit & School Fee Waiver", "2026-10-15");

        seedScholarshipIfNotExists("Usha Rani Women in Athletics Endowment", "National Women's Sports Federation",
                "Women", "Female athletes competing at district or state level track & field, archery, or boxing.",
                "₹25,000/month + Sports Nutrition & Travel Allowance", "2026-09-28");

        seedScholarshipIfNotExists("Veer Jawan Martyrs Children Sports Grant", "Armed Forces Sports Control Board",
                "Children of armed-forces personnel", "Children of Indian armed forces personnel and martyrs showing high potential in combat or endurance sports.",
                "Full Boarding at Army Sports Institute + ₹15,000 Stipend", "2026-11-10");

        seedScholarshipIfNotExists("Ekalavya Single-Parent Talent Fellowship", "Champions Trust India",
                "Single-parent families", "Youth athletes from single-parent households with verified sports merit and income under ₹4 LPA.",
                "₹18,000/month + Academic & Equipment Coverage", "2026-10-05");

        seedScholarshipIfNotExists("Para-Athlete Excellence Fellowship", "Paralympic Committee of India",
                "Other", "Differently-abled athletes preparing for national and international qualifying events.",
                "₹30,000/month + Specialized Prosthetics & Coaching", "2026-11-20");
    }

    private void seedScholarshipIfNotExists(String title, String org, String category, String eligibility, String amount, String deadline) {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM scholarships WHERE title=?", Integer.class, title);
            if (count == null || count == 0) {
                jdbc.update("INSERT INTO scholarships(title, organization, category, eligibility, amount_details, deadline, is_active) VALUES(?,?,?,?,?,?,TRUE)",
                        title, org, category, eligibility, amount, parseDate(deadline));
            }
        } catch (Exception ignored) {}
    }

    private void seedAnnouncements() {
        seedAnnouncementIfNotExists("Registration Open for U19 National Trials 2026",
                "Registrations are officially open for Hockey India and Athletics regional trials in New Delhi and Bhubaneswar. Ensure your athlete profile is updated with valid certificates before applying.",
                "New Trial", "URGENT");

        seedAnnouncementIfNotExists("SAI & Reliance Grassroots Scholarship Applications Open",
                "Over 200 athletic scholarships across 5 distinct categories including Women Athletes and Armed-Forces wards are now accepting applications. Check the Scholarships section for eligibility.",
                "New Scholarship", "HIGH");

        seedAnnouncementIfNotExists("New Verified Coaches & Scouts Onboarded from South & North Zones",
                "Certified high-performance coaches and talent scouts from SAI, NIS, and state academies have joined the AthleteLink network. Use the Scout & Coach locator to connect directly.",
                "Important Announcement", "NORMAL");
    }

    private void seedAnnouncementIfNotExists(String title, String content, String category, String priority) {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM announcements WHERE title=?", Integer.class, title);
            if (count == null || count == 0) {
                jdbc.update("INSERT INTO announcements(title, content, category, priority, is_active) VALUES(?,?,?,?,TRUE)",
                        title, content, category, priority);
            }
        } catch (Exception ignored) {}
    }

    // =========================================================================
    // OVERVIEW & ANALYTICS
    // =========================================================================
    public Map<String, Object> getOverviewStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        int totalUsers = queryCount("SELECT COUNT(*) FROM users");
        int totalAthletes = queryCount("SELECT COUNT(*) FROM users WHERE role='ATHLETE' OR role IS NULL OR role=''");
        int totalCoaches = queryCount("SELECT COUNT(*) FROM coaches");
        int totalScouts = queryCount("SELECT COUNT(*) FROM scouts");
        int totalOpportunities = queryCount("SELECT COUNT(*) FROM opportunities");
        int totalTrials = queryCount("SELECT COUNT(*) FROM trials");
        int totalScholarships = queryCount("SELECT COUNT(*) FROM scholarships");
        int trialApplicationsCount = queryCount("SELECT COUNT(*) FROM trial_applications");
        int oppApplicationsCount = queryCount("SELECT COUNT(*) FROM applications");
        int totalApplications = trialApplicationsCount + oppApplicationsCount;
        int totalAchievements = queryCount("SELECT COUNT(*) FROM achievements");
        int pendingAchievements = queryCount("SELECT COUNT(*) FROM achievements WHERE verification_status='PENDING' OR verification_status IS NULL");
        int totalBookings = queryCount("SELECT COUNT(*) FROM bookings");

        stats.put("totalUsers", totalUsers);
        stats.put("totalAthletes", totalAthletes);
        stats.put("totalCoaches", totalCoaches);
        stats.put("totalScouts", totalScouts);
        stats.put("totalOpportunities", totalOpportunities);
        stats.put("totalTrials", totalTrials);
        stats.put("totalScholarships", totalScholarships);
        stats.put("totalApplications", totalApplications);
        stats.put("trialApplicationsCount", trialApplicationsCount);
        stats.put("opportunityApplicationsCount", oppApplicationsCount);
        stats.put("totalAchievements", totalAchievements);
        stats.put("pendingAchievements", pendingAchievements);
        stats.put("totalBookings", totalBookings);

        // Sports breakdown for charts
        List<Map<String, Object>> sportsDistribution = jdbc.queryForList(
                "SELECT COALESCE(NULLIF(sport, ''), 'General') as sport_name, COUNT(*) as athlete_count " +
                        "FROM users WHERE role='ATHLETE' OR role IS NULL OR role='' " +
                        "GROUP BY COALESCE(NULLIF(sport, ''), 'General') ORDER BY athlete_count DESC LIMIT 6");
        stats.put("sportsDistribution", sportsDistribution);

        // Application Status breakdown
        List<Map<String, Object>> applicationStatus = jdbc.queryForList(
                "SELECT status, COUNT(*) as count FROM (" +
                        "  SELECT status FROM trial_applications " +
                        "  UNION ALL " +
                        "  SELECT status FROM applications" +
                        ") combined GROUP BY status");
        stats.put("applicationStatus", applicationStatus);

        // Recent activity feed
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        try {
            List<Map<String, Object>> recentUsers = jdbc.queryForList(
                    "SELECT id, full_name, email, sport, role, created_at, 'USER_REGISTERED' as activity_type " +
                            "FROM users ORDER BY created_at DESC LIMIT 5");
            recentActivity.addAll(recentUsers);

            List<Map<String, Object>> recentApps = jdbc.queryForList(
                    "SELECT a.id, a.athlete_name, a.sport, a.status, a.created_at, t.name as target_name, 'TRIAL_APPLICATION' as activity_type " +
                            "FROM trial_applications a JOIN trials t ON t.id=a.trial_id ORDER BY a.created_at DESC LIMIT 5");
            recentActivity.addAll(recentApps);
        } catch (Exception ignored) {}

        recentActivity.sort((a, b) -> {
            Object d1 = a.get("created_at");
            Object d2 = b.get("created_at");
            if (d1 == null || d2 == null) return 0;
            return d2.toString().compareTo(d1.toString());
        });

        if (recentActivity.size() > 10) {
            recentActivity = recentActivity.subList(0, 10);
        }
        stats.put("recentActivity", recentActivity);

        return stats;
    }

    private int queryCount(String sql) {
        try {
            Integer c = jdbc.queryForObject(sql, Integer.class);
            return c != null ? c : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    // =========================================================================
    // USER MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getUsers() {
        return jdbc.queryForList(
                "SELECT id, full_name, email, sport, location, role, status, created_at, " +
                        "(SELECT COUNT(*) FROM achievements a WHERE a.user_id = u.id) as achievements_count, " +
                        "(SELECT COUNT(*) FROM trial_applications ta WHERE ta.user_id = u.id) as trial_apps_count " +
                        "FROM users u ORDER BY id DESC");
    }

    public Map<String, Object> getUser(Long id) {
        return jdbc.queryForMap(
                "SELECT id, full_name, email, sport, location, latitude, longitude, role, status, created_at FROM users WHERE id=?", id);
    }

    public Map<String, Object> createUser(Map<String, Object> req) {
        String fullName = Objects.toString(req.get("fullName"), "").trim();
        String email = Objects.toString(req.get("email"), "").trim().toLowerCase();
        String password = Objects.toString(req.get("password"), "Password@123");
        String sport = Objects.toString(req.get("sport"), "");
        String location = Objects.toString(req.get("location"), "");
        String role = Objects.toString(req.get("role"), "ATHLETE").toUpperCase();
        String status = Objects.toString(req.get("status"), "ACTIVE").toUpperCase();

        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email=?", Integer.class, email);
        if (count != null && count > 0) {
            throw new IllegalArgumentException("User with this email already exists");
        }

        String hash = passwordEncoder.encode(password);
        jdbc.update("INSERT INTO users(full_name, email, password_hash, sport, location, role, status, created_at) " +
                "VALUES(?,?,?,?,?,?,?,NOW())", fullName, email, hash, sport, location, role, status);

        return jdbc.queryForMap("SELECT id, full_name, email, sport, location, role, status, created_at FROM users WHERE email=?", email);
    }

    public Map<String, Object> updateUser(Long id, Map<String, Object> req) {
        String fullName = Objects.toString(req.get("fullName"), "").trim();
        String email = Objects.toString(req.get("email"), "").trim().toLowerCase();
        String sport = Objects.toString(req.get("sport"), "");
        String location = Objects.toString(req.get("location"), "");
        String role = Objects.toString(req.get("role"), "ATHLETE").toUpperCase();
        String status = Objects.toString(req.get("status"), "ACTIVE").toUpperCase();

        jdbc.update("UPDATE users SET full_name=?, email=?, sport=?, location=?, role=?, status=? WHERE id=?",
                fullName, email, sport, location, role, status, id);

        String newPassword = (String) req.get("password");
        if (newPassword != null && !newPassword.isBlank()) {
            jdbc.update("UPDATE users SET password_hash=? WHERE id=?", passwordEncoder.encode(newPassword), id);
        }

        return getUser(id);
    }

    public void toggleUserStatus(Long id, String status) {
        String safeStatus = (status == null || status.isBlank() || "ACTIVE".equalsIgnoreCase(status)) ? "ACTIVE" : "INACTIVE";
        jdbc.update("UPDATE users SET status=? WHERE id=?", safeStatus, id);
    }

    public void setUserRole(Long id, String role) {
        String safeRole = (role == null || role.isBlank()) ? "ATHLETE" : role.toUpperCase();
        jdbc.update("UPDATE users SET role=? WHERE id=?", safeRole, id);
    }

    public void deleteUser(Long id) {
        jdbc.update("DELETE FROM users WHERE id=?", id);
    }

    // =========================================================================
    // ATHLETE MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getAthletes() {
        return jdbc.queryForList(
                "SELECT u.id, u.full_name, u.email, u.sport, u.location, u.status, u.created_at, " +
                        "(SELECT COUNT(*) FROM achievements a WHERE a.user_id = u.id) as achievements_count, " +
                        "(SELECT COUNT(*) FROM achievements a WHERE a.user_id = u.id AND a.verification_status='VERIFIED') as verified_achievements_count, " +
                        "(SELECT COUNT(*) FROM trial_applications ta WHERE ta.user_id = u.id) as applications_count, " +
                        "(SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) as bookings_count " +
                        "FROM users u WHERE u.role='ATHLETE' OR u.role IS NULL OR u.role='' ORDER BY u.id DESC");
    }

    public Map<String, Object> getAthleteDetails(Long id) {
        Map<String, Object> profile = getUser(id);
        List<Map<String, Object>> achievements = jdbc.queryForList(
                "SELECT * FROM achievements WHERE user_id=? ORDER BY achievement_year DESC, id DESC", id);
        List<Map<String, Object>> trialApplications = jdbc.queryForList(
                "SELECT a.*, t.name as trial_name, t.venue, t.trial_date FROM trial_applications a " +
                        "JOIN trials t ON t.id=a.trial_id WHERE a.user_id=? ORDER BY a.created_at DESC", id);
        List<Map<String, Object>> oppApplications = jdbc.queryForList(
                "SELECT * FROM applications WHERE user_id=? ORDER BY created_at DESC", id);
        List<Map<String, Object>> bookings = jdbc.queryForList(
                "SELECT b.*, t.name as trial_name, t.venue, s.slot_date, s.slot_time FROM bookings b " +
                        "JOIN trials t ON t.id=b.trial_id JOIN trial_slots s ON s.id=b.slot_id WHERE b.user_id=? ORDER BY b.created_at DESC", id);
        List<Map<String, Object>> coachConnections = jdbc.queryForList(
                "SELECT c.*, ch.name as coach_name, ch.organization, ch.sports FROM coach_connections c " +
                        "JOIN coaches ch ON ch.id=c.coach_id WHERE c.user_id=? ORDER BY c.created_at DESC", id);
        List<Map<String, Object>> scoutConnections = jdbc.queryForList(
                "SELECT c.*, s.name as scout_name, s.organization, s.sports FROM scout_connections c " +
                        "JOIN scouts s ON s.id=c.scout_id WHERE c.user_id=? ORDER BY c.created_at DESC", id);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("profile", profile);
        details.put("achievements", achievements);
        details.put("trialApplications", trialApplications);
        details.put("opportunityApplications", oppApplications);
        details.put("bookings", bookings);
        details.put("coachConnections", coachConnections);
        details.put("scoutConnections", scoutConnections);
        return details;
    }

    // =========================================================================
    // COACH MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getCoaches() {
        return jdbc.queryForList(
                "SELECT c.*, (SELECT COUNT(*) FROM coach_connections cc WHERE cc.coach_id = c.id) as connections_count " +
                        "FROM coaches c ORDER BY c.id ASC");
    }

    public Map<String, Object> createCoach(Map<String, Object> req) {
        String name = Objects.toString(req.get("name"), "").trim();
        String org = Objects.toString(req.get("organization"), "").trim();
        String sports = Objects.toString(req.get("sports"), "").trim();
        String spec = Objects.toString(req.get("specialization"), "").trim();
        String exp = Objects.toString(req.get("experience"), "").trim();
        String loc = Objects.toString(req.get("location"), "").trim();
        double lat = req.get("latitude") != null ? Double.parseDouble(req.get("latitude").toString()) : 20.5937;
        double lon = req.get("longitude") != null ? Double.parseDouble(req.get("longitude").toString()) : 78.9629;

        jdbc.update("INSERT INTO coaches(name, organization, sports, specialization, experience, location, latitude, longitude) " +
                "VALUES(?,?,?,?,?,?,?,?)", name, org, sports, spec, exp, loc, lat, lon);

        return jdbc.queryForMap("SELECT * FROM coaches WHERE name=? AND organization=? ORDER BY id DESC LIMIT 1", name, org);
    }

    public Map<String, Object> updateCoach(Long id, Map<String, Object> req) {
        String name = Objects.toString(req.get("name"), "").trim();
        String org = Objects.toString(req.get("organization"), "").trim();
        String sports = Objects.toString(req.get("sports"), "").trim();
        String spec = Objects.toString(req.get("specialization"), "").trim();
        String exp = Objects.toString(req.get("experience"), "").trim();
        String loc = Objects.toString(req.get("location"), "").trim();
        double lat = req.get("latitude") != null ? Double.parseDouble(req.get("latitude").toString()) : 20.5937;
        double lon = req.get("longitude") != null ? Double.parseDouble(req.get("longitude").toString()) : 78.9629;

        jdbc.update("UPDATE coaches SET name=?, organization=?, sports=?, specialization=?, experience=?, location=?, latitude=?, longitude=? WHERE id=?",
                name, org, sports, spec, exp, loc, lat, lon, id);

        return jdbc.queryForMap("SELECT * FROM coaches WHERE id=?", id);
    }

    public void deleteCoach(Long id) {
        jdbc.update("DELETE FROM coaches WHERE id=?", id);
    }

    public List<Map<String, Object>> getCoachConnections() {
        return jdbc.queryForList(
                "SELECT c.id, c.status, c.message, c.created_at, c.updated_at, " +
                        "u.id as user_id, u.full_name as athlete_name, u.email as athlete_email, u.sport as athlete_sport, " +
                        "ch.id as coach_id, ch.name as coach_name, ch.organization as coach_org, ch.sports as coach_sports " +
                        "FROM coach_connections c " +
                        "JOIN users u ON u.id = c.user_id " +
                        "JOIN coaches ch ON ch.id = c.coach_id " +
                        "ORDER BY c.created_at DESC");
    }

    public void updateCoachConnectionStatus(Long id, String status) {
        jdbc.update("UPDATE coach_connections SET status=? WHERE id=?", status, id);
    }

    // =========================================================================
    // SCOUT MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getScouts() {
        return jdbc.queryForList(
                "SELECT s.*, (SELECT COUNT(*) FROM scout_connections sc WHERE sc.scout_id = s.id) as connections_count " +
                        "FROM scouts s ORDER BY s.id ASC");
    }

    public Map<String, Object> createScout(Map<String, Object> req) {
        String name = Objects.toString(req.get("name"), "").trim();
        String org = Objects.toString(req.get("organization"), "").trim();
        String sports = Objects.toString(req.get("sports"), "").trim();
        String spec = Objects.toString(req.get("specialization"), "").trim();
        String exp = Objects.toString(req.get("experience"), "").trim();
        String loc = Objects.toString(req.get("location"), "").trim();

        jdbc.update("INSERT INTO scouts(name, organization, sports, specialization, experience, location) " +
                "VALUES(?,?,?,?,?,?)", name, org, sports, spec, exp, loc);

        return jdbc.queryForMap("SELECT * FROM scouts WHERE name=? AND organization=? ORDER BY id DESC LIMIT 1", name, org);
    }

    public Map<String, Object> updateScout(Long id, Map<String, Object> req) {
        String name = Objects.toString(req.get("name"), "").trim();
        String org = Objects.toString(req.get("organization"), "").trim();
        String sports = Objects.toString(req.get("sports"), "").trim();
        String spec = Objects.toString(req.get("specialization"), "").trim();
        String exp = Objects.toString(req.get("experience"), "").trim();
        String loc = Objects.toString(req.get("location"), "").trim();

        jdbc.update("UPDATE scouts SET name=?, organization=?, sports=?, specialization=?, experience=?, location=? WHERE id=?",
                name, org, sports, spec, exp, loc, id);

        return jdbc.queryForMap("SELECT * FROM scouts WHERE id=?", id);
    }

    public void deleteScout(Long id) {
        jdbc.update("DELETE FROM scouts WHERE id=?", id);
    }

    public List<Map<String, Object>> getScoutConnections() {
        return jdbc.queryForList(
                "SELECT c.id, c.status, c.message, c.created_at, c.updated_at, " +
                        "u.id as user_id, u.full_name as athlete_name, u.email as athlete_email, u.sport as athlete_sport, " +
                        "s.id as scout_id, s.name as scout_name, s.organization as scout_org, s.sports as scout_sports " +
                        "FROM scout_connections c " +
                        "JOIN users u ON u.id = c.user_id " +
                        "JOIN scouts s ON s.id = c.scout_id " +
                        "ORDER BY c.created_at DESC");
    }

    public void updateScoutConnectionStatus(Long id, String status) {
        jdbc.update("UPDATE scout_connections SET status=? WHERE id=?", status, id);
    }

    // =========================================================================
    // OPPORTUNITY MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getOpportunities() {
        return jdbc.queryForList(
                "SELECT o.*, (SELECT COUNT(*) FROM applications a WHERE a.opportunity_id = o.slug) as applications_count " +
                        "FROM opportunities o ORDER BY o.id ASC");
    }

    public Map<String, Object> createOpportunity(Map<String, Object> req) {
        String name = Objects.toString(req.get("name"), "").trim();
        String slug = Objects.toString(req.get("slug"), "").trim();
        if (slug.isBlank()) {
            slug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        }
        String type = Objects.toString(req.get("type"), "Academy & Training").trim();
        String desc = Objects.toString(req.get("description"), "").trim();
        String deadline = Objects.toString(req.get("deadline"), null);
        boolean isActive = req.get("isActive") == null || Boolean.parseBoolean(req.get("isActive").toString());

        jdbc.update("INSERT INTO opportunities(slug, name, type, description, deadline, is_active) VALUES(?,?,?,?,?,?)",
                slug, name, type, desc, parseDate(deadline), isActive);

        return jdbc.queryForMap("SELECT * FROM opportunities WHERE slug=?", slug);
    }

    public Map<String, Object> updateOpportunity(Long id, Map<String, Object> req) {
        String name = Objects.toString(req.get("name"), "").trim();
        String slug = Objects.toString(req.get("slug"), "").trim();
        String type = Objects.toString(req.get("type"), "Academy & Training").trim();
        String desc = Objects.toString(req.get("description"), "").trim();
        String deadline = Objects.toString(req.get("deadline"), null);
        boolean isActive = req.get("isActive") == null || Boolean.parseBoolean(req.get("isActive").toString());

        jdbc.update("UPDATE opportunities SET slug=?, name=?, type=?, description=?, deadline=?, is_active=? WHERE id=?",
                slug, name, type, desc, parseDate(deadline), isActive, id);

        return jdbc.queryForMap("SELECT * FROM opportunities WHERE id=?", id);
    }

    public void deleteOpportunity(Long id) {
        jdbc.update("DELETE FROM opportunities WHERE id=?", id);
    }

    public void toggleOpportunityStatus(Long id, boolean isActive) {
        jdbc.update("UPDATE opportunities SET is_active=? WHERE id=?", isActive, id);
    }

    // =========================================================================
    // TRIAL MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getTrials() {
        return jdbc.queryForList(
                "SELECT t.*, " +
                        "COALESCE(SUM(s.capacity), 0) as total_capacity, " +
                        "COALESCE(SUM(s.booked_count), 0) as booked_count, " +
                        "COALESCE(SUM(s.capacity - s.booked_count), 0) as remaining_slots, " +
                        "(SELECT COUNT(*) FROM trial_applications ta WHERE ta.trial_id = t.id) as applications_count " +
                        "FROM trials t " +
                        "LEFT JOIN trial_slots s ON s.trial_id = t.id " +
                        "GROUP BY t.id " +
                        "ORDER BY t.trial_date DESC, t.id DESC");
    }

    public Map<String, Object> createTrial(Map<String, Object> req) {
        String name = Objects.toString(req.get("name"), "").trim();
        String sport = Objects.toString(req.get("sport"), "").trim();
        String org = Objects.toString(req.get("organization"), "").trim();
        String venue = Objects.toString(req.get("venue"), "").trim();
        LocalDate trialDate = parseDate(Objects.toString(req.get("trialDate"), null));
        String category = Objects.toString(req.get("category"), "Open");
        String ageCategory = Objects.toString(req.get("ageCategory"), "Youth");
        String regStatus = Objects.toString(req.get("registrationStatus"), "REG OPEN");
        boolean featured = req.get("featured") != null && Boolean.parseBoolean(req.get("featured").toString());

        jdbc.update("INSERT INTO trials(name, sport, organization, venue, trial_date, category, age_category, registration_status, featured) " +
                "VALUES(?,?,?,?,?,?,?,?,?)", name, sport, org, venue, trialDate, category, ageCategory, regStatus, featured);

        Long trialId = jdbc.queryForObject("SELECT id FROM trials WHERE name=?", Long.class, name);

        // Auto-generate default slots if trialDate is present
        int initialCapacity = req.get("capacity") != null ? Integer.parseInt(req.get("capacity").toString()) : 30;
        if (trialId != null && trialDate != null) {
            int slotCap = Math.max(5, initialCapacity / 3);
            jdbc.update("INSERT IGNORE INTO trial_slots(trial_id, slot_date, slot_time, capacity, booked_count) VALUES(?,?,?,?,0)",
                    trialId, trialDate, java.sql.Time.valueOf("09:00:00"), slotCap);
            jdbc.update("INSERT IGNORE INTO trial_slots(trial_id, slot_date, slot_time, capacity, booked_count) VALUES(?,?,?,?,0)",
                    trialId, trialDate, java.sql.Time.valueOf("11:00:00"), slotCap);
            jdbc.update("INSERT IGNORE INTO trial_slots(trial_id, slot_date, slot_time, capacity, booked_count) VALUES(?,?,?,?,0)",
                    trialId, trialDate, java.sql.Time.valueOf("14:00:00"), slotCap);
        }

        return jdbc.queryForMap("SELECT * FROM trials WHERE id=?", trialId);
    }

    public Map<String, Object> updateTrial(Long id, Map<String, Object> req) {
        String name = Objects.toString(req.get("name"), "").trim();
        String sport = Objects.toString(req.get("sport"), "").trim();
        String org = Objects.toString(req.get("organization"), "").trim();
        String venue = Objects.toString(req.get("venue"), "").trim();
        LocalDate trialDate = parseDate(Objects.toString(req.get("trialDate"), null));
        String category = Objects.toString(req.get("category"), "Open");
        String ageCategory = Objects.toString(req.get("ageCategory"), "Youth");
        String regStatus = Objects.toString(req.get("registrationStatus"), "REG OPEN");
        boolean featured = req.get("featured") != null && Boolean.parseBoolean(req.get("featured").toString());

        jdbc.update("UPDATE trials SET name=?, sport=?, organization=?, venue=?, trial_date=?, category=?, age_category=?, registration_status=?, featured=? WHERE id=?",
                name, sport, org, venue, trialDate, category, ageCategory, regStatus, featured, id);

        return jdbc.queryForMap("SELECT * FROM trials WHERE id=?", id);
    }

    public void deleteTrial(Long id) {
        jdbc.update("DELETE FROM trials WHERE id=?", id);
    }

    public List<Map<String, Object>> getTrialSlots(Long trialId) {
        return jdbc.queryForList("SELECT id, trial_id, slot_date, slot_time, capacity, booked_count, (capacity - booked_count) as remaining_slots " +
                "FROM trial_slots WHERE trial_id=? ORDER BY slot_date, slot_time", trialId);
    }

    public Map<String, Object> addTrialSlot(Long trialId, Map<String, Object> req) {
        LocalDate slotDate = parseDate(Objects.toString(req.get("slotDate"), null));
        String slotTimeStr = Objects.toString(req.get("slotTime"), "09:00:00");
        if (!slotTimeStr.contains(":") || slotTimeStr.length() == 5) slotTimeStr += ":00";
        java.sql.Time slotTime = java.sql.Time.valueOf(slotTimeStr);
        int capacity = req.get("capacity") != null ? Integer.parseInt(req.get("capacity").toString()) : 10;

        jdbc.update("INSERT INTO trial_slots(trial_id, slot_date, slot_time, capacity, booked_count) VALUES(?,?,?,?,0)",
                trialId, slotDate, slotTime, capacity);

        return jdbc.queryForMap("SELECT * FROM trial_slots WHERE trial_id=? AND slot_date=? AND slot_time=?", trialId, slotDate, slotTime);
    }

    public void deleteTrialSlot(Long slotId) {
        jdbc.update("DELETE FROM trial_slots WHERE id=?", slotId);
    }

    // =========================================================================
    // SCHOLARSHIP MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getScholarships() {
        return jdbc.queryForList("SELECT * FROM scholarships ORDER BY id ASC");
    }

    public Map<String, Object> createScholarship(Map<String, Object> req) {
        String title = Objects.toString(req.get("title"), "").trim();
        String org = Objects.toString(req.get("organization"), "").trim();
        String category = Objects.toString(req.get("category"), "General").trim();
        String elig = Objects.toString(req.get("eligibility"), "").trim();
        String amount = Objects.toString(req.get("amountDetails"), "").trim();
        LocalDate deadline = parseDate(Objects.toString(req.get("deadline"), null));
        boolean isActive = req.get("isActive") == null || Boolean.parseBoolean(req.get("isActive").toString());

        jdbc.update("INSERT INTO scholarships(title, organization, category, eligibility, amount_details, deadline, is_active) " +
                "VALUES(?,?,?,?,?,?,?)", title, org, category, elig, amount, deadline, isActive);

        return jdbc.queryForMap("SELECT * FROM scholarships WHERE title=? ORDER BY id DESC LIMIT 1", title);
    }

    public Map<String, Object> updateScholarship(Long id, Map<String, Object> req) {
        String title = Objects.toString(req.get("title"), "").trim();
        String org = Objects.toString(req.get("organization"), "").trim();
        String category = Objects.toString(req.get("category"), "General").trim();
        String elig = Objects.toString(req.get("eligibility"), "").trim();
        String amount = Objects.toString(req.get("amountDetails"), "").trim();
        LocalDate deadline = parseDate(Objects.toString(req.get("deadline"), null));
        boolean isActive = req.get("isActive") == null || Boolean.parseBoolean(req.get("isActive").toString());

        jdbc.update("UPDATE scholarships SET title=?, organization=?, category=?, eligibility=?, amount_details=?, deadline=?, is_active=? WHERE id=?",
                title, org, category, elig, amount, deadline, isActive, id);

        return jdbc.queryForMap("SELECT * FROM scholarships WHERE id=?", id);
    }

    public void deleteScholarship(Long id) {
        jdbc.update("DELETE FROM scholarships WHERE id=?", id);
    }

    public void toggleScholarshipStatus(Long id, boolean isActive) {
        jdbc.update("UPDATE scholarships SET is_active=? WHERE id=?", isActive, id);
    }

    // =========================================================================
    // APPLICATIONS MANAGEMENT
    // =========================================================================
    public Map<String, Object> getAllApplications() {
        List<Map<String, Object>> trialApplications = jdbc.queryForList(
                "SELECT a.id, a.user_id, a.trial_id, a.athlete_name, a.email, a.phone, a.location, a.sport, a.position_role, " +
                        "a.age, a.institution, a.experience, a.achievements, a.introduction, a.skills, a.additional_info, a.status, " +
                        "a.created_at, a.updated_at, t.name as trial_name, t.organization as trial_org, t.venue, t.trial_date, " +
                        "'TRIAL' as application_type " +
                        "FROM trial_applications a " +
                        "JOIN trials t ON t.id = a.trial_id " +
                        "ORDER BY a.created_at DESC");

        List<Map<String, Object>> oppApplications = jdbc.queryForList(
                "SELECT a.id, a.user_id, a.opportunity_id, a.opportunity_name, a.status, a.created_at, " +
                        "u.full_name as athlete_name, u.email, u.sport, u.location, " +
                        "'OPPORTUNITY' as application_type " +
                        "FROM applications a " +
                        "JOIN users u ON u.id = a.user_id " +
                        "ORDER BY a.created_at DESC");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("trialApplications", trialApplications);
        result.put("opportunityApplications", oppApplications);
        result.put("totalCount", trialApplications.size() + oppApplications.size());
        return result;
    }

    public void updateTrialApplicationStatus(Long id, String status) {
        jdbc.update("UPDATE trial_applications SET status=? WHERE id=?", status, id);
        try {
            Long userId = jdbc.queryForObject("SELECT user_id FROM trial_applications WHERE id=?", Long.class, id);
            if (userId != null) {
                jdbc.update("INSERT INTO notifications(user_id, title, message) VALUES(?, ?, ?)",
                        userId, "Trial Application Status Updated", "Your trial application status is now: " + status);
            }
        } catch (Exception ignored) {}
    }

    public void updateOpportunityApplicationStatus(Long id, String status) {
        jdbc.update("UPDATE applications SET status=? WHERE id=?", status, id);
        try {
            Long userId = jdbc.queryForObject("SELECT user_id FROM applications WHERE id=?", Long.class, id);
            if (userId != null) {
                jdbc.update("INSERT INTO notifications(user_id, title, message) VALUES(?, ?, ?)",
                        userId, "Opportunity Application Status Updated", "Your opportunity application status is now: " + status);
            }
        } catch (Exception ignored) {}
    }

    // =========================================================================
    // ACHIEVEMENTS VERIFICATION
    // =========================================================================
    public List<Map<String, Object>> getAchievements() {
        return jdbc.queryForList(
                "SELECT a.*, u.full_name as athlete_name, u.email as athlete_email, u.sport as athlete_sport, u.location as athlete_location " +
                        "FROM achievements a " +
                        "JOIN users u ON u.id = a.user_id " +
                        "ORDER BY a.created_at DESC, a.id DESC");
    }

    public void updateAchievementVerification(Long id, String status, String adminNotes) {
        String safeStatus = (status == null || status.isBlank()) ? "PENDING" : status.toUpperCase();
        jdbc.update("UPDATE achievements SET verification_status=?, admin_notes=? WHERE id=?", safeStatus, adminNotes, id);

        try {
            Long userId = jdbc.queryForObject("SELECT user_id FROM achievements WHERE id=?", Long.class, id);
            String title = jdbc.queryForObject("SELECT title FROM achievements WHERE id=?", String.class, id);
            if (userId != null) {
                jdbc.update("INSERT INTO notifications(user_id, title, message) VALUES(?, ?, ?)",
                        userId, "Achievement Review: " + safeStatus, "Your achievement '" + title + "' has been marked as " + safeStatus + (adminNotes != null && !adminNotes.isBlank() ? " (Note: " + adminNotes + ")" : ""));
            }
        } catch (Exception ignored) {}
    }

    // =========================================================================
    // ANNOUNCEMENTS MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getAnnouncements() {
        return jdbc.queryForList("SELECT * FROM announcements ORDER BY created_at DESC, id DESC");
    }

    public Map<String, Object> createAnnouncement(Map<String, Object> req) {
        String title = Objects.toString(req.get("title"), "").trim();
        String content = Objects.toString(req.get("content"), "").trim();
        String category = Objects.toString(req.get("category"), "Important Announcement").trim();
        String priority = Objects.toString(req.get("priority"), "NORMAL").toUpperCase().trim();
        boolean isActive = req.get("isActive") == null || Boolean.parseBoolean(req.get("isActive").toString());

        jdbc.update("INSERT INTO announcements(title, content, category, priority, is_active) VALUES(?,?,?,?,?)",
                title, content, category, priority, isActive);

        return jdbc.queryForMap("SELECT * FROM announcements WHERE title=? ORDER BY id DESC LIMIT 1", title);
    }

    public Map<String, Object> updateAnnouncement(Long id, Map<String, Object> req) {
        String title = Objects.toString(req.get("title"), "").trim();
        String content = Objects.toString(req.get("content"), "").trim();
        String category = Objects.toString(req.get("category"), "Important Announcement").trim();
        String priority = Objects.toString(req.get("priority"), "NORMAL").toUpperCase().trim();
        boolean isActive = req.get("isActive") == null || Boolean.parseBoolean(req.get("isActive").toString());

        jdbc.update("UPDATE announcements SET title=?, content=?, category=?, priority=?, is_active=? WHERE id=?",
                title, content, category, priority, isActive, id);

        return jdbc.queryForMap("SELECT * FROM announcements WHERE id=?", id);
    }

    public void deleteAnnouncement(Long id) {
        jdbc.update("DELETE FROM announcements WHERE id=?", id);
    }

    // =========================================================================
    // SYSTEM STATUS & DIAGNOSTICS
    // =========================================================================
    public Map<String, Object> getSystemStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("appName", "AthleteLink AI");
        status.put("version", "1.0.0 (Hackathon Edition)");
        status.put("serverStatus", "OPERATIONAL");
        status.put("serverPort", 8880);
        status.put("databaseType", "MySQL Server");
        status.put("databaseStatus", "CONNECTED");
        status.put("dbPort", 3306);
        status.put("jvmVersion", System.getProperty("java.version"));
        status.put("totalMemoryMB", Runtime.getRuntime().totalMemory() / (1024 * 1024));
        status.put("freeMemoryMB", Runtime.getRuntime().freeMemory() / (1024 * 1024));
        status.put("maxMemoryMB", Runtime.getRuntime().maxMemory() / (1024 * 1024));
        status.put("activeThreads", Thread.activeCount());

        try {
            List<Map<String, Object>> tables = jdbc.queryForList(
                    "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'athletelink_db'");
            status.put("tables", tables);
        } catch (Exception e) {
            status.put("tables", List.of());
        }

        return status;
    }

    private LocalDate parseDate(String v) {
        return (v == null || v.isBlank()) ? null : LocalDate.parse(v);
    }
}
