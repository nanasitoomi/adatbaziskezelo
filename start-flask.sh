#!/bin/bash

# Színek a jobb olvashatóságért
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Heinemann Flask szerver indítása...${NC}"

# Ellenőrizzük, hogy a Python telepítve van-e
if ! command -v python3 &> /dev/null; then
    echo "Python3 nem található. Kérlek telepítsd a Python 3-at."
    exit 1
fi

# Flask szerver indítása debug módban
echo -e "${BLUE}Flask szerver indítása debug módban...${NC}"
FLASK_ENV=development FLASK_DEBUG=1 python3 app.py

echo -e "${GREEN}Flask szerver leállítva.${NC}"
