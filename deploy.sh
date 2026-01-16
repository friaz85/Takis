#!/bin/bash

# Takis Deployment Script
# Usage: ./deploy.sh usuario@servidor.com /ruta/destino

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌶️  Takis Deployment Script${NC}"
echo "================================"

# Check arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Error: Se requieren 2 argumentos${NC}"
    echo "Uso: ./deploy.sh usuario@servidor.com /ruta/destino"
    exit 1
fi

SSH_HOST=$1
REMOTE_PATH=$2

echo -e "${YELLOW}📦 Preparando archivos...${NC}"

# Create temporary deployment directory
DEPLOY_DIR="deploy_temp"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Backend
echo -e "${YELLOW}📁 Empaquetando backend...${NC}"
mkdir -p $DEPLOY_DIR/api
cp -r backend/app $DEPLOY_DIR/api/
cp -r backend/public $DEPLOY_DIR/api/
cp backend/composer.json $DEPLOY_DIR/api/
cp backend/database/schema.sql $DEPLOY_DIR/api/
cp deploy/api.htaccess $DEPLOY_DIR/api/.htaccess

# Create necessary directories
mkdir -p $DEPLOY_DIR/api/uploads/logo
mkdir -p $DEPLOY_DIR/api/uploads/rewards
mkdir -p $DEPLOY_DIR/api/uploads/templates
mkdir -p $DEPLOY_DIR/api/generated_pdfs
mkdir -p $DEPLOY_DIR/api/writable/logs
mkdir -p $DEPLOY_DIR/api/writable/cache
mkdir -p $DEPLOY_DIR/api/writable/session

# Copy logo if exists
if [ -f "backend/uploads/logo/takis_logo.png" ]; then
    cp backend/uploads/logo/takis_logo.png $DEPLOY_DIR/api/uploads/logo/
fi

# Frontend
echo -e "${YELLOW}🎨 Building frontend...${NC}"
cd frontend
npm run build
cd ..

mkdir -p $DEPLOY_DIR/public
cp -r frontend/dist/browser/* $DEPLOY_DIR/public/
cp deploy/frontend.htaccess $DEPLOY_DIR/public/.htaccess

# Create deployment package
echo -e "${YELLOW}📦 Creando paquete de deployment...${NC}"
cd $DEPLOY_DIR
tar -czf ../takis_deploy.tar.gz .
cd ..

# Upload to server
echo -e "${YELLOW}⬆️  Subiendo archivos al servidor...${NC}"
scp takis_deploy.tar.gz $SSH_HOST:~/

# Deploy on server
echo -e "${YELLOW}🚀 Desplegando en servidor...${NC}"
ssh $SSH_HOST << EOF
    set -e
    
    echo "Extrayendo archivos..."
    mkdir -p $REMOTE_PATH
    tar -xzf ~/takis_deploy.tar.gz -C $REMOTE_PATH
    
    echo "Instalando dependencias de backend..."
    cd $REMOTE_PATH/api
    composer install --no-dev --optimize-autoloader
    
    echo "Configurando permisos..."
    chmod -R 755 writable/
    chmod -R 755 uploads/
    chmod -R 755 generated_pdfs/
    
    echo "Limpiando archivos temporales..."
    rm ~/takis_deploy.tar.gz
    
    echo "✅ Deployment completado!"
EOF

# Cleanup
echo -e "${YELLOW}🧹 Limpiando archivos temporales locales...${NC}"
rm -rf $DEPLOY_DIR
rm takis_deploy.tar.gz

echo -e "${GREEN}✅ Deployment exitoso!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Recordatorios:${NC}"
echo "1. Configurar archivo .env en el servidor"
echo "2. Importar schema.sql a la base de datos"
echo "3. Verificar que los dominios apunten correctamente"
echo "4. Probar la aplicación en: https://tu-dominio.com"
echo ""
echo -e "${GREEN}🎉 ¡Listo!${NC}"
