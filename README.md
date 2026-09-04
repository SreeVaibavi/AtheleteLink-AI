# ATHLETELINK AI – India’s Smart Sports Talent Network

AthleteLink AI is a full-stack sports technology platform connecting emerging Indian athletic talent with certified coaches, talent discovery scouts, state/national trials, and corporate/government sponsorships.

Built with **Java Spring Boot 3**, **MySQL**, **Tailwind CSS**, and **JWT Authentication**, the application serves both the interactive Athlete Portal and a complete **Professional Sports-Tech Admin Dashboard**.

---

## 🌟 Key Features

### 🏅 Athlete Platform (`http://localhost:8880`)
- **Secure Authentication**: JWT-based registration, login, and profile protection with BCrypt password encryption.
- **Athlete Dashboard**: Real-time stats on registered achievements, active trial applications, confirmed slot bookings, and verified connections.
- **Sporting Achievements Registry**: Record verified medals, tournament ranks, certificates, and institutional credentials.
- **Trial Application & Slot Booking Engine**: Select regional/national open trials, pick specific trial dates and time slots with capacity management.
- **Scout & Coach Discovery**: Search geotagged coaches and talent scouts across disciplines with direct connection requests.
- **Opportunities & Sponsorships**: Apply for residential training academies, Khelo India programs, and sports stipends.
- **Integrated Chatbot & AI Matching**: AI-driven opportunity recommendations based on the athlete's primary sport and location.

### 🛡️ Professional Admin Dashboard (`http://localhost:8880/admin.html`)
- **Dark Sports-Tech UI**: High-contrast glassmorphism interface styled with cyan (`#0ea5e9` / `#22d3ee`) and emerald green (`#10b981`) accents.
- **12 Dedicated Management Modules**:
  1. **Dashboard Analytics**: Real-time KPI counters (Users, Athletes, Coaches, Scouts, Opportunities, Trials, Scholarships, Applications), Chart.js sport distribution doughnut and application pipeline charts, and live activity stream.
  2. **User Management**: Search, filter by role/status, view details, activate/deactivate accounts, and edit roles.
  3. **Athlete Directory**: Talent network roster, sporting resume drill-downs, and achievement certificate verification.
  4. **Coach Management**: Add, edit, delete coaches with GPS coordinates (`lat`/`lon`), and review athlete connection requests.
  5. **Scout Management**: Add, edit, delete scouts and manage scout-athlete connections.
  6. **Opportunities Management**: Dynamic CRUD for training academies, corporate grants, and open trials with active/inactive toggles.
  7. **Trials Management**: Configure trial venues, dates, categories, age categories, registration statuses, and slot capacities.
  8. **Scholarship Programs**: CRUD supporting 5 categories: `General`, `Women`, `Children of armed-forces personnel`, `Single-parent families`, and `Other`.
  9. **Applications Reviewer**: Multi-stage pipeline for trial and opportunity applications (`Approve`, `Shortlist`, `Reject`).
  10. **Achievements Review**: Verify submitted athlete medals and certificates with custom feedback and notifications.
  11. **Platform Announcements**: Broadcast announcements with priority tags (`NORMAL`, `HIGH`, `URGENT`).
  12. **Settings & Diagnostics**: Real-time health metrics, JVM memory statistics, and MySQL table inventory with row counts.

---

## 🚀 Quick Start (Windows / Linux / macOS)

### Prerequisites
- **Java 17+**
- **Apache Maven 3.8+**
- **MySQL Server 8.0+** running on `127.0.0.1:3306`

### 1. Database Configuration
Ensure MySQL is running. The application automatically creates the database schema (`athletelink_db`) and executes startup migrations and seeders on boot.

Default configuration in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/athletelink_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=1234567
```
*(Override via environment variables `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` if needed).*

### 2. Run the Application
From the `backend` directory:
```bash
mvn spring-boot:run
```
Or double-click `START-ATHLETELINK.bat` in the project root on Windows.

### 3. Access Portals
- **Athlete & Public Portal**: [http://localhost:8880](http://localhost:8880)
- **Admin Dashboard**: [http://localhost:8880/admin.html](http://localhost:8880/admin.html)

---

## 🔑 Default Credentials

| Portal | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin Dashboard** | Super Admin | `admin@athletelink.ai` | `Admin@123` |
| **Athlete Portal** | Athlete | *Register a new account or use existing credentials* | *User password* |

> **Hackathon Tip**: The Admin login modal features a **"1-Click Demo Admin Login"** button for quick presentation during evaluation.

---

## 📁 Project Architecture

```
AtheleteLink-AI/
├── backend/
│   ├── src/main/java/com/athletelink/
│   │   ├── config/              # SecurityConfig, JwtAuthFilter, CorsConfig
│   │   ├── controller/          # AdminController, AuthController, PlatformController, UserController
│   │   ├── dto/                 # AuthResponse, AchievementRequest, BookingRequest, etc.
│   │   ├── model/               # User, Achievement, Trial, etc.
│   │   ├── repository/          # UserRepository (JDBC Template with safe row mappers)
│   │   ├── service/             # AdminService, AuthService, PlatformService, EmailService
│   │   └── util/                # JwtUtil (Token generation, claims, and role extraction)
│   └── src/main/resources/
│       ├── application.properties
│       └── static/              # index.html, admin.html, styles, and js modules
├── database/
│   └── schema.sql               # Base database schema definitions
├── frontend/                    # Synchronized static frontend mirror
├── START-ATHLETELINK.bat        # 1-click startup script for Windows
├── DEMO-SETUP.txt               # Demo flow walkthrough & testing guide
└── README.md
```
