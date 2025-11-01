#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🗄️  Configuration PostgreSQL pour le projet${NC}"

# Créer utilisateur et base de données (en tant que superuser)
echo -e "${BLUE}📝 Création de l'utilisateur 'test'...${NC}"
# psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';" 2>/dev/null || echo "Utilisateur existe déjà"

echo -e "${BLUE}📝 Création de la base de données 'agentova'...${NC}"
# psql -U postgres -c "CREATE DATABASE agentova OWNER test;" 2>/dev/null || echo "Base de données existe déjà"

# Exécuter les migrations
echo -e "${BLUE}📝 Exécution des migrations SQL...${NC}"
psql -U test -d agentova -f migrations/001_initial_schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de données configurée avec succès !${NC}"
else
    echo -e "${RED}❌ Erreur lors de la configuration${NC}"
    exit 1
fi
