#!/bin/bash

# Takis SILENT PRODUCTION Deployment (Pre-launch)
# Despliega todo el backend y bundles de frontend, pero mantiene el index actual.

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

echo -e "${GREEN}🛡️  Takis SILENT PRODUCTION Deployment${NC}"
echo "=========================================="

DEPLOY_DIR="deploy_silent_prod"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 1. Preparar API
echo -e "${YELLOW}📁 Preparando API...${NC}"
mkdir -p $DEPLOY_DIR/api
cp -r backend/app $DEPLOY_DIR/api/
cp -a backend/public/. $DEPLOY_DIR/api/
cp backend/composer.json $DEPLOY_DIR/api/
cp backend/composer.lock $DEPLOY_DIR/api/
cp backend/database/schema.sql $DEPLOY_DIR/api/
cp deploy/prod/Database.php $DEPLOY_DIR/api/app/Config/Database.php
cp deploy/prod/.env $DEPLOY_DIR/api/.env
cp deploy/api.htaccess $DEPLOY_DIR/api/.htaccess
mkdir -p $DEPLOY_DIR/api/uploads/{logo,rewards,templates}
mkdir -p $DEPLOY_DIR/api/generated_pdfs
mkdir -p $DEPLOY_DIR/api/writable/{logs,cache,session,debugbar}

# 2. Preparar Frontend (Angular)
echo -e "${YELLOW}🎨 Building Angular (App)...${NC}"
cd frontend
npm run build -- --configuration=production
cd ..

# Copiar archivos compilados a la raíz del paquete
cp -r frontend/dist/frontend-tmp/browser/* $DEPLOY_DIR/
# EL TRUCO: Renombramos el index de Angular para que no pise el actual todavía
mv $DEPLOY_DIR/index.html $DEPLOY_DIR/index.app.html
# Mantenemos el htaccess de frontend preparado
cp deploy/frontend.htaccess $DEPLOY_DIR/.htaccess

# 3. Empaquetar y Subir
echo -e "${YELLOW}📦 Subiendo archivos latentes...${NC}"
cd $DEPLOY_DIR
tar -czf ../takis_silent_deploy.tar.gz .
cd ..

scp -P $SERVER_PORT -i $SSH_KEY takis_silent_deploy.tar.gz $SERVER_USER@$SERVER_HOST:~/

# 4. Desplegar en el servidor (Sin borrar el index.html actual)
ssh -p $SERVER_PORT -i $SSH_KEY $SERVER_USER@$SERVER_HOST << EOF
    set -e
    echo "Extrayendo archivos latentes..."
    mkdir -p $SERVER_PATH
    # Usamos k para que no sobrescriba archivos si existen (aunque queremos que sobrescriba casi todo menos el index si fuera necesario, 
    # pero aquí tar extraerá index.app.html así que no hay riesgo con index.html)
    tar -xzf ~/takis_silent_deploy.tar.gz -C $SERVER_PATH
    
    echo "Instalando dependencias de backend..."
    cd $SERVER_PATH/api
    if command -v composer &> /dev/null; then
        composer install --no-dev --optimize-autoloader
    fi
    
    echo "Configurando permisos..."
    chmod -R 755 writable/ uploads/ generated_pdfs/
    
    echo "Limpiando servidor..."
    rm ~/takis_silent_deploy.tar.gz
    
    echo "✅ Pre-despliegue completado. La App está lista (latente como index.app.html)."
EOF

rm -rf $DEPLOY_DIR
rm takis_silent_deploy.tar.gz
echo -e "${GREEN}🎉 Todo listo. El sitio sigue mostrando 'Próximamente' pero la App ya está instalada.${NC}"
