#!/bin/bash
# Takis PROD Deployment Script (FULL)
# Usage: ./deploy_prod_full.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load Config
if [ -f "deploy/prod/.env.deploy" ]; then
    export $(cat deploy/prod/.env.deploy | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: deploy/prod/.env.deploy no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}🌶️  Takis PROD Deployment Script${NC}"
echo "================================"
echo "Host: $SERVER_HOST"
echo "Path: $SERVER_PATH"

echo -e "${YELLOW}📦 Generando BACKUP AUTOMÁTICO de Producción...${NC}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_auto_deploy_${TIMESTAMP}.tar.gz"

ssh -p $SERVER_PORT -i $SSH_KEY $SERVER_USER@$SERVER_HOST << EOF
    cd $SERVER_PATH/..
    echo "Comprimiendo public_html a $BACKUP_NAME..."
    # Exclude backup files to avoid recursion if they are inside the path (usually they are outside, but just in case)
    tar -czf $BACKUP_NAME --exclude='backup_*.tar.gz' public_html
    echo "✅ Backup creado: $BACKUP_NAME"
EOF

echo -e "${YELLOW}🎨 Building frontend (Production)...${NC}"
cd frontend
npm run build -- --configuration=production
cd ..

# Prepare Local Package
DEPLOY_DIR="deploy_temp_prod"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Frontend Files
# Check angular.json outputPath logic
cp -r frontend/dist/frontend-tmp/browser/* $DEPLOY_DIR/
cp deploy/frontend.htaccess $DEPLOY_DIR/.htaccess

# Backend Files
echo -e "${YELLOW}📁 Empaquetando backend...${NC}"
mkdir -p $DEPLOY_DIR/api
cp -r backend/app $DEPLOY_DIR/api/
cp -a backend/public/. $DEPLOY_DIR/api/
cp backend/composer.json $DEPLOY_DIR/api/
cp backend/composer.lock $DEPLOY_DIR/api/
cp backend/spark $DEPLOY_DIR/api/
cp backend/database/schema.sql $DEPLOY_DIR/api/
cp deploy/api.htaccess $DEPLOY_DIR/api/.htaccess

# Create empty dirs
mkdir -p $DEPLOY_DIR/api/uploads/logo
mkdir -p $DEPLOY_DIR/api/uploads/rewards
mkdir -p $DEPLOY_DIR/api/uploads/templates
mkdir -p $DEPLOY_DIR/api/generated_pdfs
mkdir -p $DEPLOY_DIR/api/writable/logs
mkdir -p $DEPLOY_DIR/api/writable/cache
mkdir -p $DEPLOY_DIR/api/writable/session
mkdir -p $DEPLOY_DIR/api/writable/debugbar

# Copy Logo if exists
if [ -f "backend/uploads/logo/takis_logo.png" ]; then
    cp backend/uploads/logo/takis_logo.png $DEPLOY_DIR/api/uploads/logo/
fi

# NOT Copying .env nor Database.php to preserve server config

# Create Tar
echo -e "${YELLOW}📦 Creando paquete tar.gz...${NC}"
cd $DEPLOY_DIR
tar -czf ../takis_prod_deploy.tar.gz .
cd ..

# Upload
echo -e "${YELLOW}⬆️  Subiendo a Producción...${NC}"
scp -P $SERVER_PORT -i $SSH_KEY takis_prod_deploy.tar.gz $SERVER_USER@$SERVER_HOST:~/

# Deploy Remote
echo -e "${YELLOW}🚀 Desplegando en Servidor...${NC}"
ssh -p $SERVER_PORT -i $SSH_KEY $SERVER_USER@$SERVER_HOST << EOF
    set -e
    mkdir -p $SERVER_PATH
    
    echo "Extrayendo archivos..."
    tar -xzf ~/takis_prod_deploy.tar.gz -C $SERVER_PATH
    
    echo "Instalando dependencias (Composer)..."
    cd $SERVER_PATH/api
    if command -v composer &> /dev/null; then
        composer install --no-dev --optimize-autoloader
    else
        echo "⚠️ Composer no encontrado. Asegúrate de tener los vendors."
    fi
    
    echo "Configurando permisos..."
    chmod -R 755 writable/
    chmod -R 755 uploads/
    
    echo "Limpiando..."
    rm ~/takis_prod_deploy.tar.gz
    
    echo "✅ Despliegue a PROD completado!"
EOF

# Cleanup Local
rm -rf $DEPLOY_DIR takis_prod_deploy.tar.gz

echo ""
echo -e "${GREEN}🎉 ¡Listo! Sitio actualizado en PROD.${NC}"
