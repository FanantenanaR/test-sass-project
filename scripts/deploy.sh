#!/bin/bash

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Détecter l'environnement (local par défaut)
ENV=${1:-local}

if [ "$ENV" != "local" ] && [ "$ENV" != "prod" ]; then
    echo -e "${RED}❌ Usage: $0 [local|prod]${NC}"
    echo -e "${YELLOW}   Default: local${NC}"
    exit 1
fi

echo -e "${GREEN}🔧 Mode: ${ENV^^}${NC}"

# Fonction pour déplacer les logs
move_logs() {
    echo -e "${BLUE}📁 Déplacement des logs dans le dossier logs/...${NC}"
    mkdir -p logs
    mv *-debug.log logs/ 2>/dev/null || true
    echo -e "${GREEN}✅ Logs organisés${NC}"
}

# Déplacer les logs existants
move_logs

# S'assurer d'être dans le bon dossier
if [ -d "server" ]; then
    echo -e "${BLUE}📂 Navigation vers le dossier server...${NC}"
    cd server
elif [ -f "package.json" ] && [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✅ Déjà dans le dossier server${NC}"
else
    echo -e "${RED}❌ Ce script doit être exécuté depuis le dossier server ou son parent${NC}"
    exit 1
fi

# Configuration de l'environnement
if [ "$ENV" = "local" ]; then
    export FASTAPI_ENV="local"
    export NODE_ENV=development
    echo -e "${BLUE}🌍 Environnement: DÉVELOPPEMENT LOCAL${NC}"
else
    export NODE_ENV=production
    echo -e "${BLUE}🌍 Environnement: PRODUCTION${NC}"
fi

echo -e "${BLUE}🔨 Installation des dépendances...${NC}"
npm install

echo -e "${BLUE}🔨 Build du projet TypeScript...${NC}"
npm run clean 2>/dev/null || true

if npm run build; then
    echo -e "${GREEN}✅ Build réussi${NC}"
    
    # Vérifier que les fichiers sont générés
    if [ ! -f "lib/server/index.js" ]; then
        echo -e "${RED}❌ Erreur: lib/server/index.js non trouvé après compilation${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Fichiers compilés vérifiés${NC}"
else
    echo -e "${RED}❌ Build échoué${NC}"
    exit 1
fi

# Aller dans le dossier parent pour les commandes Firebase
cd ..

if [ "$ENV" = "local" ]; then
    # Mode LOCAL : Démarrer les émulateurs
    echo -e "${GREEN}🚀 Démarrage des émulateurs Firebase (mode LOCAL)...${NC}"
    # echo -e "${YELLOW}📡 FastAPI configuré en mode local (http://127.0.0.1:8080)${NC}"
    echo -e "${BLUE}📍 Région: us-central1 (émulateurs)${NC}"
    
    firebase emulators:start \
        --import=./emulator-data \
        --export-on-exit=./emulator-data \
        # --only functions
    
    # Déplacer les logs à la fin
    move_logs
else
    # Mode PRODUCTION : Déployer
    echo -e "${GREEN}🚀 Déploiement vers Firebase (mode PRODUCTION)...${NC}"
    echo -e "${YELLOW}⚠️  ATTENTION: Vous allez déployer en PRODUCTION${NC}"
    echo -e "${BLUE}📍 Région: europe-west1${NC}"
    
    read -p "Continuer le déploiement en production? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}❌ Déploiement annulé${NC}"
        exit 0
    fi
    
    firebase deploy --only functions
    
    # Déplacer les logs à la fin
    move_logs
    
    echo -e "${GREEN}✅ Déploiement terminé${NC}"
fi