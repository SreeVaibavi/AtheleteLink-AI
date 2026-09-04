@echo off
cd /d "%~dp0backend"
echo Starting AthleteLink AI on http://localhost:8880
mvn spring-boot:run
pause
