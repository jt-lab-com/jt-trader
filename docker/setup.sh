#!/bin/bash

# Ask for sudo upfront
sudo -v || exit 1

# Go to the script directory
cd "$(dirname "$0")"

# Check if docker-compose.yml already exists
if [ -f "docker-compose.yml" ]; then
    echo "⚠️ docker-compose.yml already exists. Installation skipped."
    read -p "Press ENTER to close..."
    exit 0
fi

echo "📥 Downloading docker-compose.yml..."
curl -L -o docker-compose.yml "https://raw.githubusercontent.com/jt-lab-com/jt-trader/develop/docker/docker-compose.yml"

echo "🌱 Creating markets.json..."
touch markets.json

echo "🌱 Creating storage.db..."
touch storage.db

echo "⚙️ Creating .env file..."
cat <<EOF > .env
PORT=8080
STANDALONE_APP=1
# both, realtime, tester
ENGINE_MODE="both"
EOF

mkdir -p strategy-source

echo "📥 Downloading jt-lib archive..."
curl -L -o jt-lib.zip "https://github.com/jt-lab-com/jt-lib/archive/refs/heads/main.zip"

echo "📦 Extracting jt-lib..."
unzip -q jt-lib.zip

echo "🚚 Moving contents from jt-lib-main to strategy-source..."
mv jt-lib-main/* strategy-source/

rm -rf jt-lib-main jt-lib.zip

echo "🐳 Starting docker compose..."
docker compose up -d

echo "✅ Setup completed!"
read -p "Press ENTER to close..."