@echo off
setlocal

:: Project directory
cd /d %~dp0

:: Check if docker-compose.yml already exists
if exist "docker-compose.yml" (
    echo ⚠️ docker-compose.yml already exists. Installation skipped.
    pause
    exit /b
)

:: Download docker-compose.yml (raw GitHub URL)
echo 📥 Downloading docker-compose.yml...
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/jt-lab-com/jt-trader/refs/heads/main/docker/docker-compose.yml' -OutFile 'docker-compose.yml'"

:: Create empty markets.json
echo 🌱 Creating markets.json...
type nul > markets.json

:: Create empty storage.db
echo 🌱 Creating storage.db...
type nul > storage.db

:: Create .env file with configuration
echo ⚙️ Creating .env file...
(
    echo PORT=8080
    echo STANDALONE_APP=1
    echo # both, realtime, tester
    echo ENGINE_MODE="both"
) > .env

if not exist "strategy-source" mkdir "strategy-source"

:: Download jt-lib archive
echo 📥 Downloading jt-lib archive...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/jt-lab-com/jt-lib/archive/refs/heads/main.zip' -OutFile 'jt-lib.zip'"

:: Extract to temporary folder
echo 📦 Extracting jt-lib...
powershell -Command "Expand-Archive -Path 'jt-lib.zip' -DestinationPath '.' -Force"

:: Move content of jt-lib-main/* to current folder
echo 🚚 Moving content from jt-lib-main to current folder...
xcopy ".\jt-lib-main\*.*" "strategy-source\" /E /H /K /Y

:: Cleanup
rd /s /q jt-lib-main
del jt-lib.zip


:: Run docker compose
echo 🐳 Running docker compose...
docker compose up -d

echo ✅ Setup completed!
pause
endlocal