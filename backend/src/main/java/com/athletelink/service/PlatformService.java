package com.athletelink.service;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.athletelink.dto.AchievementRequest;
import com.athletelink.dto.BookingRequest;
import com.athletelink.dto.CoachConnectionRequest;
import com.athletelink.dto.ScholarshipApplicationRequest;
import com.athletelink.dto.TrialApplicationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Service
public class PlatformService {
    private final JdbcTemplate jdbc;
    private final EmailService emailService;
    private final String publicBaseUrl;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");

    public PlatformService(JdbcTemplate jdbc, EmailService emailService, @org.springframework.beans.factory.annotation.Value("${athletelink.public-base-url:http://localhost:8080}") String publicBaseUrl) {
        this.jdbc = jdbc;
        this.emailService = emailService;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/$", "");
    }

    @PostConstruct
    public void initialize() {
        // Core tables
        jdbc.execute("CREATE TABLE IF NOT EXISTS users (id BIGINT AUTO_INCREMENT PRIMARY KEY, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, sport VARCHAR(100) NULL, location VARCHAR(150) NULL, latitude DECIMAL(10,7) NULL, longitude DECIMAL(10,7) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS achievements (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, title VARCHAR(150) NOT NULL, event_location VARCHAR(150) NULL, achieved_on DATE NULL, result_label VARCHAR(100) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        addColumnIfMissing("achievements", "achievement_type", "VARCHAR(40) NULL");
        addColumnIfMissing("achievements", "sport", "VARCHAR(100) NULL");
        addColumnIfMissing("achievements", "level", "VARCHAR(40) NULL");
        addColumnIfMissing("achievements", "achievement_year", "INT NULL");
        addColumnIfMissing("achievements", "academic_year", "VARCHAR(20) NULL");
        addColumnIfMissing("achievements", "institution", "VARCHAR(180) NULL");
        addColumnIfMissing("achievements", "position", "VARCHAR(60) NULL");
        addColumnIfMissing("achievements", "medal_award", "VARCHAR(120) NULL");
        addColumnIfMissing("achievements", "description", "TEXT NULL");
        addColumnIfMissing("achievements", "certificate_details", "VARCHAR(255) NULL");
        addColumnIfMissing("achievements", "certificate_url", "VARCHAR(500) NULL");

        jdbc.execute("CREATE TABLE IF NOT EXISTS trials (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(180) NOT NULL UNIQUE, sport VARCHAR(100) NOT NULL, organization VARCHAR(180) NOT NULL, venue VARCHAR(220) NOT NULL, trial_date DATE NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        addColumnIfMissing("trials", "category", "VARCHAR(40) NOT NULL DEFAULT 'Open'");
        addColumnIfMissing("trials", "age_category", "VARCHAR(20) NOT NULL DEFAULT 'Youth'");
        addColumnIfMissing("trials", "registration_status", "VARCHAR(30) NOT NULL DEFAULT 'REG OPEN'");
        addColumnIfMissing("trials", "featured", "BOOLEAN NOT NULL DEFAULT FALSE");
        jdbc.execute("CREATE TABLE IF NOT EXISTS trial_slots (id BIGINT AUTO_INCREMENT PRIMARY KEY, trial_id BIGINT NOT NULL, slot_date DATE NOT NULL, slot_time TIME NOT NULL, capacity INT NOT NULL, booked_count INT NOT NULL DEFAULT 0, CONSTRAINT fk_trial_slots_trial FOREIGN KEY (trial_id) REFERENCES trials(id) ON DELETE CASCADE, CONSTRAINT uq_trial_slot UNIQUE(trial_id, slot_date, slot_time)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS trial_applications (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, trial_id BIGINT NOT NULL, athlete_name VARCHAR(120) NOT NULL, email VARCHAR(180) NOT NULL, phone VARCHAR(40), sport VARCHAR(100) NOT NULL, position_role VARCHAR(100) NOT NULL, age INT, institution VARCHAR(180), experience TEXT, achievements TEXT, introduction TEXT, skills TEXT, additional_info TEXT, status VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT fk_trial_app_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_trial_app_trial FOREIGN KEY(trial_id) REFERENCES trials(id) ON DELETE CASCADE, CONSTRAINT uq_trial_application UNIQUE(user_id, trial_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        addColumnIfMissing("trial_applications", "location", "VARCHAR(180) NULL");
        addColumnIfMissing("trial_applications", "confirmed_trial_date", "DATE NULL");
        addColumnIfMissing("trial_applications", "confirmed_trial_time", "VARCHAR(30) NULL");
        jdbc.execute("CREATE TABLE IF NOT EXISTS trial_application_confirmations (id BIGINT AUTO_INCREMENT PRIMARY KEY, application_id BIGINT NOT NULL UNIQUE, user_id BIGINT NOT NULL, email VARCHAR(180) NOT NULL, confirmation_token VARCHAR(120) NOT NULL UNIQUE, email_sent BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, confirmed_at DATETIME NULL, CONSTRAINT fk_trial_app_confirmation FOREIGN KEY(application_id) REFERENCES trial_applications(id) ON DELETE CASCADE, CONSTRAINT fk_trial_app_confirmation_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS applications (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, opportunity_id VARCHAR(80) NOT NULL, opportunity_name VARCHAR(180) NOT NULL, status VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT uq_application UNIQUE(user_id, opportunity_id), CONSTRAINT fk_application_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS scouts (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, organization VARCHAR(180) NOT NULL, sports VARCHAR(180) NOT NULL, specialization VARCHAR(180) NOT NULL, experience VARCHAR(100) NOT NULL, location VARCHAR(150) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS scout_connections (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, scout_id BIGINT NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'PENDING', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT fk_connection_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_connection_scout FOREIGN KEY(scout_id) REFERENCES scouts(id) ON DELETE CASCADE, CONSTRAINT uq_scout_connection UNIQUE(user_id, scout_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        addColumnIfMissing("scout_connections", "message", "VARCHAR(500) NULL");
        jdbc.execute("CREATE TABLE IF NOT EXISTS coaches (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, organization VARCHAR(180) NOT NULL, sports VARCHAR(180) NOT NULL, specialization VARCHAR(180) NOT NULL, experience VARCHAR(100) NOT NULL, location VARCHAR(150) NOT NULL, latitude DECIMAL(10,7) NOT NULL, longitude DECIMAL(10,7) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS coach_connections (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, coach_id BIGINT NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'PENDING', message VARCHAR(500) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT fk_coach_connection_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_coach_connection_coach FOREIGN KEY(coach_id) REFERENCES coaches(id) ON DELETE CASCADE, CONSTRAINT uq_coach_connection UNIQUE(user_id, coach_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        addColumnIfMissing("users", "latitude", "DECIMAL(10,7) NULL");
        addColumnIfMissing("users", "longitude", "DECIMAL(10,7) NULL");
        jdbc.execute("CREATE TABLE IF NOT EXISTS bookings (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, trial_id BIGINT NOT NULL, slot_id BIGINT NOT NULL, booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED', confirmation_token VARCHAR(120) NOT NULL UNIQUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_booking_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_booking_trial FOREIGN KEY(trial_id) REFERENCES trials(id) ON DELETE CASCADE, CONSTRAINT fk_booking_slot FOREIGN KEY(slot_id) REFERENCES trial_slots(id) ON DELETE CASCADE, CONSTRAINT uq_booking_user_slot UNIQUE(user_id, slot_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS notifications (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, title VARCHAR(180) NOT NULL, message VARCHAR(500) NOT NULL, is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS email_verifications (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, token VARCHAR(120) NOT NULL UNIQUE, expires_at DATETIME NOT NULL, verified BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        jdbc.execute("CREATE TABLE IF NOT EXISTS booking_confirmations (id BIGINT AUTO_INCREMENT PRIMARY KEY, booking_id BIGINT NOT NULL UNIQUE, user_id BIGINT NOT NULL, email VARCHAR(180) NOT NULL, confirmation_token VARCHAR(120) NOT NULL UNIQUE, email_sent BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, confirmed_at DATETIME NULL, CONSTRAINT fk_confirmation_booking FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE, CONSTRAINT fk_confirmation_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // Scholarship Applications & Quota Enforcement
        jdbc.execute("CREATE TABLE IF NOT EXISTS scholarship_applications (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "user_id BIGINT NOT NULL, " +
                "category VARCHAR(60) NOT NULL, " +
                "category_title VARCHAR(180) NOT NULL, " +
                "full_name VARCHAR(120) NOT NULL, " +
                "email VARCHAR(180) NOT NULL, " +
                "phone VARCHAR(40) NOT NULL, " +
                "age INT NULL, " +
                "dob DATE NULL, " +
                "family_income DECIMAL(12,2) NULL, " +
                "parent_guardian_name VARCHAR(120) NULL, " +
                "defence_relationship VARCHAR(60) NULL, " +
                "supporting_person_name VARCHAR(120) NULL, " +
                "current_grade VARCHAR(80) NULL, " +
                "maintained_grade VARCHAR(80) NULL, " +
                "stationery_required VARCHAR(10) NULL, " +
                "resources_required VARCHAR(10) NULL, " +
                "required_resources_list TEXT NULL, " +
                "loss_year INT NULL, " +
                "documents_json LONGTEXT NULL, " +
                "status VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED', " +
                "admin_notes VARCHAR(500) NULL, " +
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                "CONSTRAINT fk_scholarship_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        jdbc.execute("CREATE TABLE IF NOT EXISTS scholarship_quota_log (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "user_id BIGINT NOT NULL, " +
                "email VARCHAR(180) NOT NULL, " +
                "phone VARCHAR(40) NULL, " +
                "application_id BIGINT NOT NULL, " +
                "category VARCHAR(60) NOT NULL, " +
                "status VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED', " +
                "applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                "UNIQUE KEY uq_quota_user (user_id), " +
                "CONSTRAINT fk_quota_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        seedTrialsAndSlots();
        seedScouts();
        seedCoaches();
    }

    /* ---------- Public Stats (real data from DB) ---------- */
    public Map<String, Object> publicStats() {
        Map<String, Object> stats = new java.util.LinkedHashMap<>();
        long realAthletes = countSafe("SELECT COUNT(*) FROM users WHERE email NOT LIKE '%example.com' AND email NOT LIKE '%admin%'");
        stats.put("athletesRegistered", realAthletes > 0 ? realAthletes : countSafe("SELECT COUNT(*) FROM users"));
        stats.put("trialsAvailable", countSafe("SELECT COUNT(*) FROM trials"));
        long realApps = countSafe("SELECT COUNT(*) FROM trial_applications WHERE email NOT LIKE '%example.com'");
        stats.put("opportunitiesConnected", realApps > 0 ? realApps : countSafe("SELECT COUNT(*) FROM trial_applications"));
        stats.put("scholarshipsApplied", countSafe("SELECT COUNT(*) FROM scholarship_applications"));
        stats.put("scouts", countSafe("SELECT COUNT(*) FROM scouts"));
        stats.put("coaches", countSafe("SELECT COUNT(*) FROM coaches"));
        stats.put("achievements", countSafe("SELECT COUNT(*) FROM achievements"));
        return stats;
    }

    private long countSafe(String sql) {
        try { return jdbc.queryForObject(sql, Long.class); }
        catch (Exception e) { return 0; }
    }

    @SuppressWarnings("UseSpecificCatch")
    private void addColumnIfMissing(String table, String column, String definition) {
        try { jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition); }
        catch (Exception ignored) { /* column already exists */ }
    }

    private void seedTrialsAndSlots() {
        seedFeaturedTrial("U19 Men's Hockey", "Hockey", "Men's", "U19", "Hockey India Youth Selection", "Major Dhyan Chand National Stadium, New Delhi", LocalDate.of(2026,9,6), 36);
        seedFeaturedTrial("U21 Women's Cricket", "Cricket", "Women's", "U21", "Indian Youth Cricket Selection", "M. A. Chidambaram Stadium, Chennai", LocalDate.of(2026,9,12), 30);
        seedFeaturedTrial("U18 Athletics", "Athletics", "Open / Youth", "U18", "National Junior Athletics Network", "Jawaharlal Nehru Stadium, New Delhi", LocalDate.of(2026,9,18), 40);
        seedFeaturedTrial("U19 Women's Hockey", "Hockey", "Women's", "U19", "Hockey India Youth Selection", "Kalinga Stadium, Bhubaneswar", LocalDate.of(2026,9,24), 32);
        seedFeaturedTrial("U21 Men's Cricket", "Cricket", "Men's", "U21", "Indian Youth Cricket Selection", "M. Chinnaswamy Stadium, Bengaluru", LocalDate.of(2026,9,29), 28);
        seedLegacyTrial("National Federation Open Trials", "Athletics & Track", "National Sports Federation", "Jawaharlal Nehru Stadium, New Delhi", LocalDate.of(2026,9,15));
        seedLegacyTrial("Khelo India Regional Trials", "Multi-sport", "Khelo India", "Sree Kanteerava Stadium, Bengaluru", LocalDate.of(2026,9,22));
        seedLegacyTrial("Youth Boxing Selection Camp", "Boxing", "National Boxing Federation", "Army Sports Institute, Pune", LocalDate.of(2026,9,30));
    }

    private void seedFeaturedTrial(String name, String sport, String category, String ageCategory, String organization, String venue, LocalDate date, int capacity) {
        jdbc.update("INSERT IGNORE INTO trials(name,sport,organization,venue,trial_date,category,age_category,registration_status,featured) VALUES(?,?,?,?,?,?,?,?,TRUE)", name, sport, organization, venue, date, category, ageCategory, "REG OPEN");
        jdbc.update("UPDATE trials SET sport=?,organization=?,venue=?,trial_date=?,category=?,age_category=?,registration_status='REG OPEN',featured=TRUE WHERE name=?", sport, organization, venue, date, category, ageCategory, name);
        addFeaturedSlotsForTrial(trialIdByName(name), date, capacity);
    }

    private void seedLegacyTrial(String name, String sport, String organization, String venue, LocalDate date) {
        jdbc.update("INSERT IGNORE INTO trials(name,sport,organization,venue,trial_date,category,age_category,registration_status,featured) VALUES(?,?,?,?,?,?,?,?,FALSE)", name, sport, organization, venue, date, "Open", "Youth", "REG OPEN");
        addSlotsForTrial(trialIdByName(name), date);
    }

    private void addFeaturedSlotsForTrial(long trialId, LocalDate date, int capacity) {
        int a=Math.max(6, capacity/3), b=Math.max(6, capacity/3), c=Math.max(6, capacity-a-b);
        jdbc.update("INSERT IGNORE INTO trial_slots(trial_id,slot_date,slot_time,capacity,booked_count) VALUES(?,?,?,?,0)",trialId,date,java.sql.Time.valueOf("09:00:00"),a);
        jdbc.update("INSERT IGNORE INTO trial_slots(trial_id,slot_date,slot_time,capacity,booked_count) VALUES(?,?,?,?,0)",trialId,date,java.sql.Time.valueOf("11:00:00"),b);
        jdbc.update("INSERT IGNORE INTO trial_slots(trial_id,slot_date,slot_time,capacity,booked_count) VALUES(?,?,?,?,0)",trialId,date,java.sql.Time.valueOf("14:00:00"),c);
    }

    private long trialIdByName(String name) {
        Long id = jdbc.queryForObject("SELECT id FROM trials WHERE name=?", Long.class, name);
        if (id == null) throw new IllegalStateException("Trial seed failed: " + name);
        return id;
    }
    private void addSlotsForTrial(long trialId, LocalDate date) {
        jdbc.update("INSERT IGNORE INTO trial_slots(trial_id,slot_date,slot_time,capacity,booked_count) VALUES(?,?,?,?,0)",trialId,date,java.sql.Time.valueOf("09:00:00"),10);
        jdbc.update("INSERT IGNORE INTO trial_slots(trial_id,slot_date,slot_time,capacity,booked_count) VALUES(?,?,?,?,0)",trialId,date,java.sql.Time.valueOf("11:00:00"),12);
        jdbc.update("INSERT IGNORE INTO trial_slots(trial_id,slot_date,slot_time,capacity,booked_count) VALUES(?,?,?,?,0)",trialId,date,java.sql.Time.valueOf("14:00:00"),8);
    }
    private void seedScouts() {
        jdbc.update("INSERT IGNORE INTO scouts(id,name,organization,sports,specialization,experience,location) VALUES(1,?,?,?,?,?,?)", "Arjun Mehta", "National Talent Discovery Network", "Athletics, Track & Field", "Sprint & performance scouting", "12 years", "New Delhi");
        jdbc.update("INSERT IGNORE INTO scouts(id,name,organization,sports,specialization,experience,location) VALUES(2,?,?,?,?,?,?)", "Priya Nair", "Elite Youth Sports Collective", "Badminton, Athletics", "Grassroots talent identification", "9 years", "Bengaluru");
        jdbc.update("INSERT IGNORE INTO scouts(id,name,organization,sports,specialization,experience,location) VALUES(3,?,?,?,?,?,?)", "Rahul Singh", "National Wrestling Talent Hub", "Wrestling, Boxing", "Youth & combat sports scouting", "15 years", "Rohtak");
    }

    private void seedCoaches() {
        jdbc.update("INSERT IGNORE INTO coaches(id,name,organization,sports,specialization,experience,location,latitude,longitude) VALUES(1,?,?,?,?,?,?,?,?)", "Kavya Raman", "Chennai High Performance Centre", "Athletics, Track & Field", "Sprint technique & strength conditioning", "11 years", "Chennai, Tamil Nadu", 13.0827, 80.2707);
        jdbc.update("INSERT IGNORE INTO coaches(id,name,organization,sports,specialization,experience,location,latitude,longitude) VALUES(2,?,?,?,?,?,?,?,?)", "Arvind Krishnan", "South India Badminton Academy", "Badminton", "Singles coaching & tournament preparation", "14 years", "Chennai, Tamil Nadu", 13.0475, 80.2090);
        jdbc.update("INSERT IGNORE INTO coaches(id,name,organization,sports,specialization,experience,location,latitude,longitude) VALUES(3,?,?,?,?,?,?,?,?)", "Meera Iyer", "Elite Sports Performance Lab", "Athletics, Multi-sport", "Youth development & performance analysis", "8 years", "Bengaluru, Karnataka", 12.9716, 77.5946);
        jdbc.update("INSERT IGNORE INTO coaches(id,name,organization,sports,specialization,experience,location,latitude,longitude) VALUES(4,?,?,?,?,?,?,?,?)", "Rohit Verma", "National Wrestling Development Centre", "Wrestling, Boxing", "Combat sports conditioning", "13 years", "Rohtak, Haryana", 28.8955, 76.6066);
        jdbc.update("INSERT IGNORE INTO coaches(id,name,organization,sports,specialization,experience,location,latitude,longitude) VALUES(5,?,?,?,?,?,?,?,?)", "Neha Kapoor", "Hyderabad Elite Sports Academy", "Badminton, Athletics", "Junior athlete development", "10 years", "Hyderabad, Telangana", 17.3850, 78.4867);
    }

    // =========================================================================
    // SCHOLARSHIP APPLICATIONS (5 CATEGORIES + ONE-PER-PERSON RULE)
    // =========================================================================

    @Transactional
    public Map<String, Object> applyScholarship(long userId, ScholarshipApplicationRequest req) {
        // Normalize Category Key
        String category = normalizeCategory(req.getCategory(), req.getCategoryTitle());
        String categoryTitle = getStandardCategoryTitle(category);

        // 1. STRICT ONE SCHOLARSHIP PER PERSON CHECK
        List<Map<String, Object>> quotaLogs = jdbc.queryForList(
                "SELECT * FROM scholarship_quota_log WHERE user_id=? OR email=?", userId, clean(req.getEmail()));
        if (!quotaLogs.isEmpty()) {
            Map<String, Object> existingLog = quotaLogs.get(0);
            String logStatus = Objects.toString(existingLog.get("status"), "SUBMITTED");
            if ("CANCELLED".equalsIgnoreCase(logStatus)) {
                throw new IllegalStateException("You have already used your scholarship application. Cancelling an application does not allow you to apply for another scholarship.");
            } else {
                throw new IllegalStateException("You have already applied for a scholarship. You can apply for only one scholarship.");
            }
        }

        // Secondary check on scholarship_applications table
        List<Map<String, Object>> existingApps = jdbc.queryForList(
                "SELECT * FROM scholarship_applications WHERE user_id=? OR email=?", userId, clean(req.getEmail()));
        if (!existingApps.isEmpty()) {
            Map<String, Object> latest = existingApps.get(0);
            String status = Objects.toString(latest.get("status"), "SUBMITTED");
            if ("CANCELLED".equalsIgnoreCase(status)) {
                throw new IllegalStateException("You have already used your scholarship application. Cancelling an application does not allow you to apply for another scholarship.");
            } else {
                throw new IllegalStateException("You have already applied for a scholarship. You can apply for only one scholarship.");
            }
        }

        // 2. COMMON FIELD VALIDATION
        String fullName = clean(req.getFullName());
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Full name is required.");
        }

        String email = clean(req.getEmail());
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }

        String phone = clean(req.getPhone());
        if (phone != null) phone = phone.replaceAll("[^0-9]", "");
        if (phone == null || !PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("Please enter a valid 10-digit Indian mobile number.");
        }

        Map<String, String> docs = req.getDocuments() != null ? req.getDocuments() : new LinkedHashMap<>();

        // 3. CATEGORY-SPECIFIC VALIDATION
        LocalDate dob = null;
        Integer age = req.getAge();
        Double familyIncome = req.getFamilyIncome();
        String parentGuardianName = clean(req.getParentGuardianName());
        String defenceRelationship = clean(req.getDefenceRelationship());
        String supportingPersonName = clean(req.getSupportingPersonName());
        String currentGrade = clean(req.getCurrentGrade());
        String maintainedGrade = clean(req.getMaintainedGrade());
        String stationery = clean(req.getStationeryRequired());
        String resources = clean(req.getResourcesRequired());
        String requiredResourcesList = clean(req.getRequiredResourcesList());
        Integer lossYear = req.getLossYear();

        LocalDate today = LocalDate.now();

        switch (category) {
            case "UNDER_18":
                if (age == null || age < 1 || age >= 18) {
                    throw new IllegalArgumentException("Age must be below 18 for this scholarship.");
                }
                dob = parseDate(req.getDob());
                if (dob == null) {
                    throw new IllegalArgumentException("Date of birth is required.");
                }
                if (dob.isAfter(today)) {
                    throw new IllegalArgumentException("Date of birth cannot be a future date.");
                }
                int calculatedAgeU18 = Period.between(dob, today).getYears();
                if (calculatedAgeU18 >= 18) {
                    throw new IllegalArgumentException("Date of birth corresponds to age 18 or above. Age must be below 18.");
                }
                if (familyIncome == null || familyIncome <= 0) {
                    throw new IllegalArgumentException("Family annual income must be a valid positive amount.");
                }
                if (docs.get("ageProof") == null || docs.get("ageProof").isBlank()) {
                    throw new IllegalArgumentException("Age proof document (Birth Certificate / Aadhaar Card) is required.");
                }
                if (parentGuardianName == null || parentGuardianName.isBlank()) {
                    throw new IllegalArgumentException("Parent/Guardian name is required.");
                }
                if (docs.get("parentGuardianId") == null || docs.get("parentGuardianId").isBlank()) {
                    throw new IllegalArgumentException("Parent/Guardian ID proof document is required.");
                }
                break;

            case "ABOVE_18":
                if (age == null || age < 18) {
                    throw new IllegalArgumentException("Age must be 18 or above for this scholarship.");
                }
                dob = parseDate(req.getDob());
                if (dob == null) {
                    throw new IllegalArgumentException("Date of birth is required.");
                }
                if (dob.isAfter(today)) {
                    throw new IllegalArgumentException("Date of birth cannot be a future date.");
                }
                int calculatedAgeA18 = Period.between(dob, today).getYears();
                if (calculatedAgeA18 < 18) {
                    throw new IllegalArgumentException("Date of birth corresponds to age below 18. Age must be 18 or above.");
                }
                if (familyIncome == null || familyIncome <= 0) {
                    throw new IllegalArgumentException("Family annual income must be a valid positive amount.");
                }
                if (docs.get("ageProof") == null || docs.get("ageProof").isBlank()) {
                    throw new IllegalArgumentException("Age proof document is required.");
                }
                if (docs.get("applicantId") == null || docs.get("applicantId").isBlank()) {
                    throw new IllegalArgumentException("Applicant ID proof document is required.");
                }
                break;

            case "WOMEN":
                // Category 3: Simple & focused - only Full Name, Email, Phone, Aadhaar Card
                String aadhaarDoc = docs.get("aadhaarCard") != null ? docs.get("aadhaarCard") : docs.get("applicantId");
                if (aadhaarDoc == null || aadhaarDoc.isBlank()) {
                    throw new IllegalArgumentException("Aadhaar Card document upload is mandatory.");
                }
                docs.put("aadhaarCard", aadhaarDoc);
                break;

            case "DEFENCE":
                if (defenceRelationship == null || (!defenceRelationship.equalsIgnoreCase("Mother") && !defenceRelationship.equalsIgnoreCase("Father") && !defenceRelationship.equalsIgnoreCase("Other blood relative only"))) {
                    throw new IllegalArgumentException("Defence personnel relationship must be selected from Mother, Father, or Other blood relative only.");
                }
                if (supportingPersonName == null || supportingPersonName.isBlank()) {
                    throw new IllegalArgumentException("Supporting person's full name is required.");
                }
                if (currentGrade == null || currentGrade.isBlank()) {
                    throw new IllegalArgumentException("Current grade/year of study is required.");
                }
                if (maintainedGrade == null || maintainedGrade.isBlank()) {
                    throw new IllegalArgumentException("Grade/year being maintained is required.");
                }
                if (stationery == null || (!stationery.equalsIgnoreCase("Yes") && !stationery.equalsIgnoreCase("No"))) {
                    throw new IllegalArgumentException("Please indicate whether you require stationery (Yes/No).");
                }
                if (resources == null || (!resources.equalsIgnoreCase("Yes") && !resources.equalsIgnoreCase("No"))) {
                    throw new IllegalArgumentException("Please indicate whether you require other educational resources/support (Yes/No).");
                }
                if ("Yes".equalsIgnoreCase(resources) && (requiredResourcesList == null || requiredResourcesList.isBlank())) {
                    throw new IllegalArgumentException("Please list the required educational resources and support.");
                }
                if (docs.get("applicantId") == null || docs.get("applicantId").isBlank()) {
                    throw new IllegalArgumentException("Applicant ID proof is required.");
                }
                if (docs.get("defenceId") == null || docs.get("defenceId").isBlank()) {
                    throw new IllegalArgumentException("Defence personnel/supporting person's ID proof is required.");
                }
                break;

            case "SINGLE_PARENT":
                int currentYear = today.getYear();
                if (lossYear == null || lossYear < 1960 || lossYear > currentYear) {
                    throw new IllegalArgumentException("Please enter a valid year when parent was lost (cannot be in the future).");
                }
                if (familyIncome == null || familyIncome <= 0) {
                    throw new IllegalArgumentException("Family annual income must be a valid positive amount.");
                }
                if (docs.get("applicantId") == null || docs.get("applicantId").isBlank()) {
                    throw new IllegalArgumentException("Applicant ID proof is mandatory.");
                }
                break;

            default:
                throw new IllegalArgumentException("Unknown scholarship category: " + category);
        }

        // 4. SERIALIZE DOCUMENTS
        String docsJson = req.getDocumentsJson();
        if (docsJson == null || docsJson.isBlank()) {
            try {
                docsJson = objectMapper.writeValueAsString(docs);
            } catch (Exception e) {
                docsJson = "{}";
            }
        }

        // 5. INSERT SCHOLARSHIP APPLICATION
        jdbc.update("INSERT INTO scholarship_applications(" +
                "user_id, category, category_title, full_name, email, phone, age, dob, family_income, " +
                "parent_guardian_name, defence_relationship, supporting_person_name, current_grade, " +
                "maintained_grade, stationery_required, resources_required, required_resources_list, " +
                "loss_year, documents_json, status" +
                ") VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'SUBMITTED')",
                userId, category, categoryTitle, fullName, email, phone, age, dob, familyIncome,
                parentGuardianName, defenceRelationship, supportingPersonName, currentGrade,
                maintainedGrade, stationery, resources, requiredResourcesList, lossYear, docsJson);

        Long appId = jdbc.queryForObject("SELECT id FROM scholarship_applications WHERE user_id=? ORDER BY id DESC LIMIT 1", Long.class, userId);

        // 6. RECORD QUOTA USAGE (PERMANENT LOG)
        jdbc.update("INSERT INTO scholarship_quota_log(user_id, email, phone, application_id, category, status) VALUES(?,?,?,?,?, 'SUBMITTED')",
                userId, email, phone, appId, category);

        // 7. SEND SUBMISSION CONFIRMATION EMAIL
        boolean sent = emailService.sendScholarshipSubmissionEmail(email, fullName, categoryTitle);

        // 8. ADD NOTIFICATION
        jdbc.update("INSERT INTO notifications(user_id, title, message) VALUES(?,?,?)",
                userId, "Scholarship Application Received",
                "Your application for " + categoryTitle + " has been successfully submitted and is awaiting review.");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("applicationId", appId);
        res.put("category", category);
        res.put("categoryTitle", categoryTitle);
        res.put("status", "SUBMITTED");
        res.put("emailSent", sent);
        res.put("message", "Your scholarship application has been successfully submitted and is awaiting review.");
        return res;
    }

    @Transactional
    public Map<String, Object> cancelScholarship(long userId, long applicationId) {
        List<Map<String, Object>> apps = jdbc.queryForList(
                "SELECT * FROM scholarship_applications WHERE id=? AND user_id=?", applicationId, userId);
        if (apps.isEmpty()) {
            throw new IllegalArgumentException("Scholarship application not found.");
        }
        Map<String, Object> app = apps.get(0);
        String currentStatus = Objects.toString(app.get("status"), "");
        if ("APPROVED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Approved scholarship applications cannot be cancelled.");
        }
        if ("CANCELLED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Application is already cancelled.");
        }

        jdbc.update("UPDATE scholarship_applications SET status='CANCELLED' WHERE id=?", applicationId);
        jdbc.update("UPDATE scholarship_quota_log SET status='CANCELLED' WHERE application_id=?", applicationId);

        jdbc.update("INSERT INTO notifications(user_id, title, message) VALUES(?,?,?)",
                userId, "Scholarship Application Cancelled",
                "Your scholarship application for " + app.get("category_title") + " has been cancelled. Note: Quota remains consumed.");

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("applicationId", applicationId);
        out.put("status", "CANCELLED");
        out.put("message", "Application cancelled successfully.");
        return out;
    }

    public Map<String, Object> getMyScholarshipApplication(long userId) {
        List<Map<String, Object>> list = jdbc.queryForList(
                "SELECT * FROM scholarship_applications WHERE user_id=? ORDER BY id DESC LIMIT 1", userId);
        if (list.isEmpty()) {
            // Check quota log
            List<Map<String, Object>> quota = jdbc.queryForList(
                    "SELECT * FROM scholarship_quota_log WHERE user_id=? ORDER BY id DESC LIMIT 1", userId);
            if (!quota.isEmpty()) {
                Map<String, Object> q = quota.get(0);
                Map<String, Object> stub = new LinkedHashMap<>();
                stub.put("hasUsedQuota", true);
                stub.put("status", q.get("status"));
                stub.put("category", q.get("category"));
                stub.put("categoryTitle", getStandardCategoryTitle(Objects.toString(q.get("category"), "")));
                return stub;
            }
            return Map.of("hasUsedQuota", false);
        }
        Map<String, Object> app = list.get(0);
        app.put("hasUsedQuota", true);
        return app;
    }

    public List<Map<String, Object>> scholarshipApplications(long userId) {
        return jdbc.queryForList("SELECT * FROM scholarship_applications WHERE user_id=? ORDER BY id DESC", userId);
    }

    private String normalizeCategory(String category, String title) {
        String combined = (Objects.toString(category, "") + " " + Objects.toString(title, "")).toUpperCase();
        if (combined.contains("UNDER 18") || combined.contains("UNDER_18") || combined.contains("U18") || combined.contains("YOUTH SCHOLARSHIP")) {
            return "UNDER_18";
        }
        if (combined.contains("ABOVE 18") || combined.contains("ABOVE_18") || combined.contains("ADULT")) {
            return "ABOVE_18";
        }
        if (combined.contains("WOMEN") || combined.contains("FEMALE")) {
            return "WOMEN";
        }
        if (combined.contains("DEFENCE") || combined.contains("DEFENSE") || combined.contains("ARMED")) {
            return "DEFENCE";
        }
        if (combined.contains("SINGLE") || combined.contains("PARENT")) {
            return "SINGLE_PARENT";
        }
        return Objects.toString(category, "UNDER_18").toUpperCase();
    }

    private String getStandardCategoryTitle(String cat) {
        return switch (cat) {
            case "UNDER_18" -> "Scholarship for Under 18";
            case "ABOVE_18" -> "Scholarship for Above 18";
            case "WOMEN" -> "Scholarship for Women";
            case "DEFENCE" -> "Scholarships for Children of Defence Personnel";
            case "SINGLE_PARENT" -> "Scholarship for Single Parents";
            default -> cat;
        };
    }

    // =========================================================================
    // ACHIEVEMENTS & TRIALS & OTHER PLATFORM METHODS
    // =========================================================================

    public List<Map<String,Object>> achievements(long userId) {
        return jdbc.queryForList("SELECT id,title,achievement_type,sport,level,achievement_year,academic_year,institution,position,result_label,medal_award,event_location,achieved_on,description,certificate_details,certificate_url,created_at FROM achievements WHERE user_id=? ORDER BY achievement_year DESC, achieved_on DESC, id DESC", userId);
    }

    public Map<String,Object> addAchievement(long userId, AchievementRequest r) {
        LocalDate date = parseDate(r.getEventDate());
        jdbc.update("INSERT INTO achievements(user_id,title,event_location,achieved_on,result_label,achievement_type,sport,level,achievement_year,academic_year,institution,position,medal_award,description,certificate_details,certificate_url) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                userId, clean(r.getTitle()), clean(r.getLocation()), date, clean(r.getPosition()), clean(r.getType()), clean(r.getSport()), clean(r.getLevel()), r.getYear(), clean(r.getAcademicYear()), clean(r.getInstitution()), clean(r.getPosition()), clean(r.getMedalAward()), clean(r.getDescription()), clean(r.getCertificateDetails()), clean(r.getCertificateUrl()));
        return jdbc.queryForMap("SELECT id,title,achievement_type,sport,level,achievement_year,academic_year,institution,position,result_label,medal_award,event_location,achieved_on,description,certificate_details,certificate_url,created_at FROM achievements WHERE user_id=? ORDER BY id DESC LIMIT 1", userId);
    }
    public void deleteAchievement(long userId,long id) { if(jdbc.update("DELETE FROM achievements WHERE id=? AND user_id=?",id,userId)==0) throw new IllegalArgumentException("Achievement not found"); }
    public Map<String,Object> achievement(long userId,long id) { return jdbc.queryForMap("SELECT id,title,achievement_type,sport,level,achievement_year,academic_year,institution,position,result_label,medal_award,event_location,achieved_on,description,certificate_details,certificate_url,created_at FROM achievements WHERE id=? AND user_id=?", id,userId); }

    public List<Map<String,Object>> trials() { return jdbc.queryForList("SELECT t.id,t.name,t.sport,t.category,t.age_category,t.registration_status,t.featured,t.organization,t.venue,t.trial_date, COALESCE(SUM(s.capacity),0) total_capacity, COALESCE(SUM(s.booked_count),0) booked_count, COALESCE(SUM(s.capacity-s.booked_count),0) remaining_slots FROM trials t LEFT JOIN trial_slots s ON s.trial_id=t.id GROUP BY t.id ORDER BY t.trial_date"); }
    public List<Map<String,Object>> featuredTrials() { return jdbc.queryForList("SELECT t.id,t.name,t.sport,t.category,t.age_category,t.registration_status,t.organization,t.venue,t.trial_date,COALESCE(SUM(s.capacity-s.booked_count),0) remaining_slots FROM trials t LEFT JOIN trial_slots s ON s.trial_id=t.id WHERE t.featured=TRUE AND t.registration_status='REG OPEN' GROUP BY t.id ORDER BY t.trial_date LIMIT 5"); }
    public Map<String,Object> trial(long id) { return jdbc.queryForMap("SELECT t.id,t.name,t.sport,t.category,t.age_category,t.registration_status,t.organization,t.venue,t.trial_date,COALESCE(SUM(s.capacity-s.booked_count),0) remaining_slots FROM trials t LEFT JOIN trial_slots s ON s.trial_id=t.id WHERE t.id=? GROUP BY t.id",id); }
    public List<Map<String,Object>> slots(long trialId) { return jdbc.queryForList("SELECT id,trial_id,slot_date,slot_time,capacity,booked_count,(capacity-booked_count) remaining_slots FROM trial_slots WHERE trial_id=? ORDER BY slot_date,slot_time",trialId); }

    @Transactional
    public Map<String,Object> applyTrial(long userId,long trialId,TrialApplicationRequest r) {
        Map<String,Object> t=trial(trialId);
        Integer existing=jdbc.queryForObject("SELECT COUNT(*) FROM trial_applications WHERE user_id=? AND trial_id=?",Integer.class,userId,trialId);
        if(existing!=null && existing>0) throw new IllegalStateException("You have already applied for this trial.");
        jdbc.update("INSERT INTO trial_applications(user_id,trial_id,athlete_name,email,phone,location,sport,position_role,age,institution,experience,achievements,introduction,skills,additional_info,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'SUBMITTED')",userId,trialId,clean(r.getAthleteName()),clean(r.getEmail()),clean(r.getPhone()),clean(r.getLocation()),clean(r.getSport()),clean(r.getPosition()),r.getAge(),clean(r.getInstitution()),clean(r.getExperience()),clean(r.getAchievements()),clean(r.getIntroduction()),clean(r.getSkills()),clean(r.getAdditionalInfo()));
        long id=jdbc.queryForObject("SELECT id FROM trial_applications WHERE user_id=? AND trial_id=?",Long.class,userId,trialId);
        String token=UUID.randomUUID().toString().replace("-","");
        jdbc.update("INSERT INTO trial_application_confirmations(application_id,user_id,email,confirmation_token) VALUES(?,?,?,?)",id,userId,clean(r.getEmail()),token);
        String link=publicBaseUrl+"/api/trials/applications/confirm?token="+token;
        boolean sent=emailService.sendTrialApplicationConfirmation(clean(r.getEmail()),clean(r.getAthleteName()),t,id,link);
        jdbc.update("UPDATE trial_application_confirmations SET email_sent=? WHERE application_id=?",sent,id);
        jdbc.update("INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)",userId,"Trial application submitted","Your application for " + t.get("name") + " has been submitted.");
        Map<String,Object> out=new LinkedHashMap<>(); out.put("applicationId",id); out.put("status","SUBMITTED"); out.put("trial",t.get("name")); out.put("trialId",trialId); out.put("emailSent",sent); out.put("confirmationUrl",link); return out;
    }
    public List<Map<String,Object>> applications(long userId){ return jdbc.queryForList("SELECT a.id application_id,a.status,a.created_at,a.updated_at,a.athlete_name,a.email,a.phone,a.location,a.sport,a.position_role,a.age,a.institution,a.experience,a.achievements,a.introduction,a.skills,a.additional_info,a.confirmed_trial_date,a.confirmed_trial_time,tc.email_sent,tc.confirmation_token,t.id trial_id,t.name trial_name,t.organization,t.venue,t.trial_date FROM trial_applications a JOIN trials t ON t.id=a.trial_id LEFT JOIN trial_application_confirmations tc ON tc.application_id=a.id WHERE a.user_id=? ORDER BY a.created_at DESC",userId); }
    public Map<String,Object> application(long userId,long id){ return jdbc.queryForMap("SELECT a.id application_id,a.status,a.created_at,a.updated_at,a.athlete_name,a.email,a.phone,a.location,a.sport,a.position_role,a.age,a.institution,a.experience,a.achievements,a.introduction,a.skills,a.additional_info,a.confirmed_trial_date,a.confirmed_trial_time,tc.email_sent,tc.confirmation_token,t.id trial_id,t.name trial_name,t.organization,t.venue,t.trial_date FROM trial_applications a JOIN trials t ON t.id=a.trial_id LEFT JOIN trial_application_confirmations tc ON tc.application_id=a.id WHERE a.user_id=? AND a.id=?",userId,id); }

    public Map<String,Object> confirmTrialApplication(String token){
        try {
            List<Map<String,Object>> list = jdbc.queryForList("SELECT a.id application_id,tc.email_sent,tc.created_at,tc.confirmed_at,a.athlete_name,a.email,a.phone,a.sport,a.age,a.position_role,a.institution,t.id as trial_id,t.name trial_name,t.sport as trial_sport,t.organization,t.venue,t.trial_date FROM trial_application_confirmations tc JOIN trial_applications a ON a.id=tc.application_id JOIN trials t ON t.id=a.trial_id WHERE tc.confirmation_token=?",token);
            if (list.isEmpty()) return null;
            Map<String,Object> c = new LinkedHashMap<>(list.get(0));
            jdbc.update("UPDATE trial_application_confirmations SET confirmed_at=NOW() WHERE confirmation_token=? AND confirmed_at IS NULL",token);
            c.put("confirmed",true);
            c.put("status","CONFIRMED");
            return c;
        } catch (Exception e) {
            return null;
        }
    }

    public List<Map<String,Object>> scouts(){ return jdbc.queryForList("SELECT id,name,organization,sports,specialization,experience,location FROM scouts ORDER BY id"); }
    public Map<String,Object> connect(long userId,long scoutId,CoachConnectionRequest r){
        Map<String,Object> scout=jdbc.queryForMap("SELECT id,name FROM scouts WHERE id=?",scoutId);
        Integer existing=jdbc.queryForObject("SELECT COUNT(*) FROM scout_connections WHERE user_id=? AND scout_id=?",Integer.class,userId,scoutId);
        if(existing!=null && existing>0) throw new IllegalStateException("Connection request already exists.");
        jdbc.update("INSERT INTO scout_connections(user_id,scout_id,status,message) VALUES(?,?, 'PENDING',?)",userId,scoutId,clean(r.getMessage()));
        jdbc.update("INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)",userId,"Scout connection request","Your connection request has been sent to " + scout.get("name") + ".");
        return connection(userId,scoutId);
    }
    public List<Map<String,Object>> connections(long userId){return jdbc.queryForList("SELECT c.id,c.status,c.message,c.created_at,c.updated_at,s.id scout_id,s.name,s.organization,s.sports,s.specialization,s.experience,s.location FROM scout_connections c JOIN scouts s ON s.id=c.scout_id WHERE c.user_id=? ORDER BY c.created_at DESC",userId);}
    private Map<String,Object> connection(long userId,long scoutId){return jdbc.queryForMap("SELECT c.id,c.status,c.message,c.created_at,s.id scout_id,s.name,s.organization FROM scout_connections c JOIN scouts s ON s.id=c.scout_id WHERE c.user_id=? AND c.scout_id=?",userId,scoutId);}

    @Transactional
    public Map<String,Object> book(long userId, BookingRequest req){
        Integer applied=jdbc.queryForObject("SELECT COUNT(*) FROM trial_applications a JOIN trial_slots s ON s.trial_id=a.trial_id WHERE a.user_id=? AND s.id=?",Integer.class,userId,req.getSlotId());
        if(applied==null || applied==0) throw new IllegalStateException("Submit the trial application form before booking a trial slot.");
        Map<String,Object> slot=jdbc.queryForMap("SELECT s.id,s.trial_id,s.slot_date,s.slot_time,s.capacity,s.booked_count,t.name trial_name,t.sport,t.venue FROM trial_slots s JOIN trials t ON t.id=s.trial_id WHERE s.id=? FOR UPDATE",req.getSlotId());
        Integer duplicate=jdbc.queryForObject("SELECT COUNT(*) FROM bookings WHERE user_id=? AND slot_id=?",Integer.class,userId,req.getSlotId());
        if(duplicate!=null && duplicate>0) throw new IllegalStateException("You have already booked this slot.");
        int updated=jdbc.update("UPDATE trial_slots SET booked_count=booked_count+1 WHERE id=? AND booked_count<capacity",req.getSlotId());
        if(updated==0) throw new IllegalStateException("Sorry, this trial slot is full.");
        String token=UUID.randomUUID().toString().replace("-","");
        try { jdbc.update("INSERT INTO bookings(user_id,trial_id,slot_id,booking_status,confirmation_token) VALUES(?,?,?,'CONFIRMED',?)",userId,slot.get("trial_id"),req.getSlotId(),token); }
        catch(DuplicateKeyException e){ throw new IllegalStateException("You have already booked this slot."); }
        long bookingId=jdbc.queryForObject("SELECT id FROM bookings WHERE confirmation_token=?",Long.class,token);
        Map<String,Object> user=jdbc.queryForMap("SELECT full_name,email FROM users WHERE id=?",userId);
        jdbc.update("INSERT INTO booking_confirmations(booking_id,user_id,email,confirmation_token) VALUES(?,?,?,?)",bookingId,userId,user.get("email"),token);
        String link=publicBaseUrl+"/api/confirm-booking?token="+token;
        boolean sent=emailService.sendBookingConfirmation(Objects.toString(user.get("email"),""),Objects.toString(user.get("full_name"),"Athlete"),slot,bookingId,link);
        jdbc.update("UPDATE booking_confirmations SET email_sent=? WHERE booking_id=?",sent,bookingId);
        jdbc.update("INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)",userId,"Trial booking confirmed","Your trial slot for " + slot.get("trial_name") + " on " + slot.get("slot_date") + " at " + slot.get("slot_time") + " is confirmed.");
        Map<String,Object> out=booking(userId,bookingId); out.put("confirmationUrl",link); out.put("emailSent",sent); return out;
    }
    public List<Map<String,Object>> bookings(long userId){return jdbc.queryForList("SELECT b.id booking_id,b.booking_status status,b.confirmation_token,b.created_at,s.id slot_id,s.slot_date,s.slot_time,t.id trial_id,t.name trial_name,t.sport,t.organization,t.venue,bc.email_sent,bc.confirmed_at FROM bookings b JOIN trial_slots s ON s.id=b.slot_id JOIN trials t ON t.id=b.trial_id LEFT JOIN booking_confirmations bc ON bc.booking_id=b.id WHERE b.user_id=? ORDER BY s.slot_date,s.slot_time",userId);}
    public Map<String,Object> booking(long userId,long id){return jdbc.queryForMap("SELECT b.id booking_id,b.booking_status status,b.confirmation_token,b.created_at,s.id slot_id,s.slot_date,s.slot_time,t.id trial_id,t.name trial_name,t.sport,t.organization,t.venue,bc.email_sent,bc.confirmed_at FROM bookings b JOIN trial_slots s ON s.id=b.slot_id JOIN trials t ON t.id=b.trial_id LEFT JOIN booking_confirmations bc ON bc.booking_id=b.id WHERE b.user_id=? AND b.id=?",userId,id);}
    public Map<String,Object> confirm(String token){
        try {
            List<Map<String,Object>> list = jdbc.queryForList("SELECT b.id booking_id,b.booking_status,bc.user_id,bc.email_sent,bc.created_at,bc.confirmed_at,u.full_name as athlete_name,u.email,s.slot_date,s.slot_time,t.id as trial_id,t.name trial_name,t.sport,t.organization,t.venue FROM booking_confirmations bc JOIN bookings b ON b.id=bc.booking_id JOIN trial_slots s ON s.id=b.slot_id JOIN trials t ON t.id=b.trial_id JOIN users u ON u.id=b.user_id WHERE bc.confirmation_token=?",token);
            if (list.isEmpty()) return null;
            Map<String,Object> c = new LinkedHashMap<>(list.get(0));
            jdbc.update("UPDATE booking_confirmations SET confirmed_at=NOW() WHERE confirmation_token=? AND confirmed_at IS NULL",token);
            c.put("confirmed",true);
            c.put("status","CONFIRMED");
            return c;
        } catch (Exception e) {
            return null;
        }
    }

    public List<Map<String,Object>> opportunities(){
        try {
            List<Map<String, Object>> list = jdbc.queryForList("SELECT slug as id, type, name, description, deadline FROM opportunities WHERE is_active=TRUE ORDER BY id ASC");
            if (!list.isEmpty()) return list;
        } catch (Exception ignored) {}
        List<Map<String,Object>> out=new ArrayList<>();
        out.add(op("boxing-academy","Academy & Training","National Boxing Excellence Academy","Full scholarship residential training camp hosted at Army Sports Institute, Pune.","2026-09-15"));
        out.add(op("jsw-stipend","Scholarship Grant","JSW Sports Grassroots Stipend","Monthly financial aid + elite support for talented athletes.","2026-09-01"));
        out.add(op("khelo-trials","Open Trials","Khelo India National Talent Hunt","Zonal open trials for athletics, weightlifting and hockey.","2026-09-30"));
        return out;
    }
    public List<Map<String,Object>> announcements(){
        try {
            return jdbc.queryForList("SELECT id, title, content, category, priority, created_at FROM announcements WHERE is_active=TRUE ORDER BY created_at DESC LIMIT 10");
        } catch (Exception e) {
            return List.of();
        }
    }
    private Map<String,Object> op(String id,String type,String name,String description,String deadline){Map<String,Object> m=new LinkedHashMap<>();m.put("id",id);m.put("type",type);m.put("name",name);m.put("description",description);m.put("deadline",deadline);return m;}
    public Map<String,Object> apply(long userId,String id){
        Map<String,Object> op=opportunities().stream().filter(x->x.get("id").equals(id)).findFirst().orElseThrow(()->new IllegalArgumentException("Opportunity not found"));
        int n=jdbc.update("INSERT IGNORE INTO applications(user_id,opportunity_id,opportunity_name,status) VALUES(?,?,?,'SUBMITTED')",userId,id,op.get("name"));
        if(n==1)jdbc.update("INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)",userId,"Opportunity application submitted","Your application for "+op.get("name")+" has been submitted.");
        return Map.of("message",n==1?"Application submitted successfully":"You have already applied for this opportunity.","opportunity",op.get("name"));
    }

    public List<Map<String,Object>> notifications(long userId){return jdbc.queryForList("SELECT id,title,message,is_read,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 30",userId);}
    public void markNotificationRead(long userId,long id){jdbc.update("UPDATE notifications SET is_read=TRUE WHERE id=? AND user_id=?",id,userId);}
    public List<Map<String,Object>> matching(long userId){Map<String,Object> u=jdbc.queryForMap("SELECT sport,location FROM users WHERE id=?",userId);String sport=Objects.toString(u.get("sport"),"Athletics");List<Map<String,Object>> out=new ArrayList<>();out.add(match("National Athletics Performance Coach","Recommended Coach",96,"Recommendation based on your sport: "+sport));out.add(match("Khelo India Elite Development Grant","Scholarship Grant",93,"Funding opportunity aligned with your athlete profile."));out.add(match("National Federation Open Trials","Upcoming Trial",91,"Open trial recommendation for "+sport+" athletes."));return out;}
    private Map<String,Object> match(String name,String type,int score,String reason){Map<String,Object>m=new LinkedHashMap<>();m.put("name",name);m.put("type",type);m.put("score",score);m.put("reason",reason);return m;}
    public List<Map<String,Object>> coaches(){
        return jdbc.queryForList("SELECT id,name,organization,sports,specialization,experience,location,latitude,longitude FROM coaches ORDER BY id");
    }

    public List<Map<String,Object>> nearbyCoaches(long userId, Double lat, Double lon, double radiusKm){
        if(lat==null || lon==null){
            Map<String,Object> u=jdbc.queryForMap("SELECT latitude,longitude FROM users WHERE id=?",userId);
            if(u.get("latitude")!=null && u.get("longitude")!=null){ lat=((Number)u.get("latitude")).doubleValue(); lon=((Number)u.get("longitude")).doubleValue(); }
        }
        if(lat==null || lon==null) return coachesWithDistance(userId, null, null, radiusKm);
        jdbc.update("UPDATE users SET latitude=?, longitude=? WHERE id=?",lat,lon,userId);
        return coachesWithDistance(userId,lat,lon,radiusKm);
    }

    private List<Map<String,Object>> coachesWithDistance(long userId, Double lat, Double lon, double radiusKm){
        Map<String,Object> u=jdbc.queryForMap("SELECT sport FROM users WHERE id=?",userId);
        String sport=Objects.toString(u.get("sport"),"").toLowerCase();
        int achievementCount=jdbc.queryForObject("SELECT COUNT(*) FROM achievements WHERE user_id=?",Integer.class,userId);
        List<Map<String,Object>> raw=jdbc.queryForList("SELECT id,name,organization,sports,specialization,experience,location,latitude,longitude FROM coaches");
        List<Map<String,Object>> out=new ArrayList<>();
        for(Map<String,Object> c:raw){
            double distance=lat==null?9999:haversine(lat,lon,((Number)c.get("latitude")).doubleValue(),((Number)c.get("longitude")).doubleValue());
            if(lat!=null && distance>radiusKm) continue;
            String cs=Objects.toString(c.get("sports"),"").toLowerCase();
            int score=(sport.isBlank()||cs.contains(sport))?20:0;
            if(achievementCount>0) score+=10;
            c.put("distance_km",Math.round(distance*10.0)/10.0);
            c.put("match_score",Math.min(100,70+score-(int)Math.min(20,distance/10)));
            c.remove("latitude"); c.remove("longitude");
            out.add(c);
        }
        out.sort(Comparator.comparingDouble(m->((Number)m.get("distance_km")).doubleValue()));
        return out;
    }

    private double haversine(double lat1,double lon1,double lat2,double lon2){
        double dLat=Math.toRadians(lat2-lat1), dLon=Math.toRadians(lon2-lon1);
        double a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
        return 6371.0088*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    }

    @Transactional
    public Map<String,Object> connectCoach(long userId,long coachId,CoachConnectionRequest r){
        Map<String,Object> coach=jdbc.queryForMap("SELECT id,name FROM coaches WHERE id=?",coachId);
        Integer existing=jdbc.queryForObject("SELECT COUNT(*) FROM coach_connections WHERE user_id=? AND coach_id=?",Integer.class,userId,coachId);
        if(existing!=null && existing>0) throw new IllegalStateException("Connection request already exists.");
        String message=clean(r.getMessage());
        jdbc.update("INSERT INTO coach_connections(user_id,coach_id,status,message) VALUES(?,?, 'PENDING',?)",userId,coachId,message);
        jdbc.update("INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)",userId,"Coach connection request","Your connection request has been sent to " + coach.get("name") + ".");
        return jdbc.queryForMap("SELECT c.id,c.status,c.message,c.created_at,c.updated_at,ch.id coach_id,ch.name,ch.organization,ch.sports,ch.specialization,ch.experience,ch.location FROM coach_connections c JOIN coaches ch ON ch.id=c.coach_id WHERE c.user_id=? AND c.coach_id=?",userId,coachId);
    }

    public List<Map<String,Object>> coachConnections(long userId){return jdbc.queryForList("SELECT c.id,c.status,c.message,c.created_at,c.updated_at,ch.id coach_id,ch.name,ch.organization,ch.sports,ch.specialization,ch.experience,ch.location FROM coach_connections c JOIN coaches ch ON ch.id=c.coach_id WHERE c.user_id=? ORDER BY c.created_at DESC",userId);}

    public Map<String,Object> dashboard(long userId){
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("achievements",achievements(userId));
        m.put("applications",applications(userId));
        m.put("scholarshipApplications",scholarshipApplications(userId));
        m.put("myScholarship",getMyScholarshipApplication(userId));
        m.put("bookings",bookings(userId));
        m.put("connections",connections(userId));
        m.put("notifications",notifications(userId));
        return m;
    }
    private LocalDate parseDate(String v){return v==null||v.isBlank()?null:LocalDate.parse(v);}
    private String clean(String v){return v==null?null:v.trim();}
}
