#!/bin/bash

# Színek a jobb olvashatóságért
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Heinemann ngrok indítása...${NC}"

# Ellenőrizzük, hogy az ngrok telepítve van-e
if ! command -v ngrok &> /dev/null; then
    echo "Ngrok nem található. Kérlek telepítsd az ngrok-ot."
    exit 1
fi

# Ngrok indítása a megadott domain névvel
echo -e "${BLUE}Ngrok indítása a heinemann-adatbazis.ngrok.dev domain névvel...${NC}"
ngrok http --domain=heinemann-adatbazis.ngrok.dev 5001

echo -e "${GREEN}Ngrok leállítva.${NC}"
