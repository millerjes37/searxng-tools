#!/bin/bash
# SearXNG Tools - Quick Setup Script
# This script helps you set up SearXNG with Docker and configure the OpenClaw plugin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}SearXNG Tools - Quick Setup${NC}"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"
echo ""

# Start SearXNG
echo "Starting SearXNG server..."
cd "$SCRIPT_DIR"
docker-compose up -d

echo ""
echo -e "${YELLOW}Waiting for SearXNG to be ready...${NC}"
sleep 5

# Check if SearXNG is healthy
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8888/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✓ SearXNG is running!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo ""
    echo -e "${RED}✗ SearXNG failed to start${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "=============================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=============================="
echo ""
echo "SearXNG is running at: http://localhost:8888"
echo ""
echo "Next steps:"
echo "1. Install the OpenClaw plugin:"
echo "   mkdir -p ~/.openclaw/extensions/searxng-tools"
echo "   cp -r * ~/.openclaw/extensions/searxng-tools/"
echo "   cd ~/.openclaw/extensions/searxng-tools && npm install"
echo ""
echo "2. Add to your ~/.openclaw/openclaw.json configuration"
echo ""
echo "3. Restart OpenClaw:"
echo "   openclaw gateway restart"
echo ""
echo "For more details, see:"
echo "  - README.md for full documentation"
echo "  - DOCKER.md for Docker-specific setup"
echo ""
