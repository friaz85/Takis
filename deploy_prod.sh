#!/bin/bash

# Takis FINAL LAUNCH Script
# Este script se ejecuta el 16 de Febrero a las 00:00 para activar la App.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -f "deploy/prod/.env.deploy" ]; then
    export $(cat deploy/prod/.env.deploy | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: deploy/prod/.env.deploy no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 ACTIVANDO TAKIS AFICIÓN INTENSA (LANZAMIENTO)${NC}"
echo "======================================================"

ssh -p $SERVER_PORT -i $SSH_KEY $SERVER_USER@$SERVER_HOST << EOF
    cd $SERVER_PATH
    
    if [ -f "index.app.html" ]; then
        echo "Guardando respaldo del index antiguo..."
        mv index.html index.holding.html
        
        echo "Activando aplicación Angular..."
        mv index.app.html index.html
        
        echo "✅ LANZAMIENTO EXITOSO!"
    else
        echo "❌ Error: index.app.html no encontrado. ¿Ya se ejecutó el pre-despliegue?"
        exit 1
    fi
EOF
