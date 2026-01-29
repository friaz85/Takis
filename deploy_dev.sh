#!/bin/bash

# Takis DEV Deployment Script
# Usage: ./deploy_dev.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment configuration
if [ -f "deploy/dev/.env" ]; then
    export $(cat deploy/dev/.env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: deploy/dev/.env no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}🌶️  Takis DEV Deployment Script${NC}"
echo "================================"
echo "Host: $SERVER_HOST"
echo "Usuario: $SERVER_USER"
echo "Ruta: $SERVER_PATH"

echo -e "${YELLOW}📦 Preparando archivos...${NC}"

# Create temporary deployment directory
DEPLOY_DIR="deploy_temp_dev"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Backend
echo -e "${YELLOW}📁 Empaquetando backend...${NC}"
mkdir -p $DEPLOY_DIR/api
cp -r backend/app $DEPLOY_DIR/api/
cp -a backend/public/. $DEPLOY_DIR/api/
cp backend/composer.json $DEPLOY_DIR/api/
cp backend/database/schema.sql $DEPLOY_DIR/api/
# Use dev database config
cp deploy/dev/Database.php $DEPLOY_DIR/api/app/Config/Database.php
# Copy .env configuration
cp deploy/dev/.env $DEPLOY_DIR/api/.env
# Use standard htaccess for api
cp deploy/api.htaccess $DEPLOY_DIR/api/.htaccess

# Create necessary directories
mkdir -p $DEPLOY_DIR/api/uploads/logo
mkdir -p $DEPLOY_DIR/api/uploads/rewards
mkdir -p $DEPLOY_DIR/api/uploads/templates
mkdir -p $DEPLOY_DIR/api/generated_pdfs
mkdir -p $DEPLOY_DIR/api/writable/logs
mkdir -p $DEPLOY_DIR/api/writable/cache
mkdir -p $DEPLOY_DIR/api/writable/session
mkdir -p $DEPLOY_DIR/api/writable/debugbar

# Copy logo if exists
if [ -f "backend/uploads/logo/takis_logo.png" ]; then
    cp backend/uploads/logo/takis_logo.png $DEPLOY_DIR/api/uploads/logo/
fi

# Frontend
echo -e "${YELLOW}🎨 Building frontend (Setup: dev)...${NC}"
cd frontend
# Use the new 'dev' configuration we added to angular.json
npm run build -- --configuration=dev
cd ..

mkdir -p $DEPLOY_DIR
# Move frontend files to root since we want to serve them directly or in public_html
cp -r frontend/dist/frontend-tmp/browser/* $DEPLOY_DIR/
cp deploy/frontend.htaccess $DEPLOY_DIR/.htaccess

# Create deployment package
echo -e "${YELLOW}📦 Creando paquete de deployment...${NC}"
cd $DEPLOY_DIR
tar -czf ../takis_dev_deploy.tar.gz .
cd ..

# Upload to server
echo -e "${YELLOW}⬆️  Subiendo archivos al servidor...${NC}"
# Using specific port and identity file
scp -P $SERVER_PORT -i $SSH_KEY takis_dev_deploy.tar.gz $SERVER_USER@$SERVER_HOST:~/

# Deploy on server
echo -e "${YELLOW}🚀 Desplegando en servidor...${NC}"
ssh -p $SERVER_PORT -i $SSH_KEY $SERVER_USER@$SERVER_HOST << EOF
    set -e
    
    echo "Extrayendo archivos..."
    # Ensure directory exists
    mkdir -p $SERVER_PATH
    
    # Extract to target path
    tar -xzf ~/takis_dev_deploy.tar.gz -C $SERVER_PATH
    
    echo "Instalando dependencias de backend..."
    cd $SERVER_PATH/api
    # Check if composer is available, if not we might need to rely on vendor dir being uploaded (which we didn't do to save space/time)
    # Assuming composer is installed on server
    if command -v composer &> /dev/null; then
        composer install --no-dev --optimize-autoloader
    else
        echo "⚠️ Composer no encontrado. Asegúrate de subir la carpeta vendor si no puedes ejecutar composer."
    fi
    
    echo "Configurando permisos..."
    chmod -R 755 writable/
    chmod -R 755 uploads/
    chmod -R 755 generated_pdfs/
    
    echo "Limpiando archivos temporales del servidor..."
    rm ~/takis_dev_deploy.tar.gz
    
    echo "✅ Deployment completado!"
EOF

# Cleanup
echo -e "${YELLOW}🧹 Limpiando archivos temporales locales...${NC}"
rm -rf $DEPLOY_DIR
rm takis_dev_deploy.tar.gz

echo -e "${GREEN}✅ Deployment a DEV exitoso!${NC}"
