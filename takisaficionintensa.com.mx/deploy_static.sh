#!/bin/bash

# Script de Deployment para Takis Afición Intensa - Sitio Estático
# Uso: ./deploy_static.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌶️  Takis Afición Intensa - Deployment${NC}"
echo "=========================================="
echo ""

# Configuración del servidor
SSH_USER="u10-vaeulgu8bfqa"
SSH_HOST="ssh.takisaficionintensa.com.mx"
SSH_PORT="18765"
REMOTE_PATH="/home/u10-vaeulgu8bfqa/www/takisaficionintensa.com.mx/public_html"
LOCAL_PATH="/Users/friaz85/Documents/Proyectos/DesaLyL/Takis/takisaficionintensa.com.mx/public_html"

echo -e "${YELLOW}📋 Configuración del servidor:${NC}"
echo -e "Host: ${BLUE}$SSH_HOST${NC}"
echo -e "Usuario: ${BLUE}$SSH_USER${NC}"
echo -e "Puerto: ${BLUE}$SSH_PORT${NC}"
echo ""

echo -e "${YELLOW}📦 Verificando archivos locales...${NC}"

# Verificar que existan los archivos necesarios
REQUIRED_FILES=(
    "$LOCAL_PATH/index.html"
    "$LOCAL_PATH/styles.css"
    "$LOCAL_PATH/script.js"
    "$LOCAL_PATH/logo-takis.png"
    "$LOCAL_PATH/takis-texture.jpg"
    "$LOCAL_PATH/bg-hero.jpg"
    "$LOCAL_PATH/PROXIMAMENTE.png"
    "$LOCAL_PATH/fonts/Veneer.otf"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Error: No se encuentra el archivo $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Todos los archivos necesarios están presentes${NC}"
echo ""

# Mostrar archivos a subir
echo -e "${YELLOW}📁 Archivos que se subirán:${NC}"
echo "  • index.html"
echo "  • styles.css"
echo "  • script.js"
echo "  • logo-takis.png"
echo "  • takis-texture.jpg"
echo "  • bg-hero.jpg"
echo "  • background-people.jpg"
echo "  • fonts/Veneer.otf"
echo ""

# Confirmar
read -p "¿Continuar con el deployment? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Deployment cancelado${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⬆️  Subiendo archivos al servidor...${NC}"

# Usar rsync para subir archivos (más eficiente que scp)
rsync -avz --progress \
    -e "ssh -p $SSH_PORT -i ~/.ssh/takis_dev" \
    --include='*.html' \
    --include='*.css' \
    --include='*.js' \
    --include='*.png' \
    --include='*.jpg' \
    --include='*.jpeg' \
    --include='*.otf' \
    --include='fonts/' \
    --include='fonts/*' \
    --exclude='.*' \
    --exclude='README.md' \
    "$LOCAL_PATH/" \
    "$SSH_USER@$SSH_HOST:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Archivos subidos exitosamente!${NC}"
    echo ""
    
    # Configurar permisos en el servidor
    echo -e "${YELLOW}🔐 Configurando permisos...${NC}"
    ssh -p "$SSH_PORT" -i ~/.ssh/takis_dev "$SSH_USER@$SSH_HOST" << EOF
        cd $REMOTE_PATH
        find . -type f -exec chmod 644 {} \;
        find . -type d -exec chmod 755 {} \;
        echo "✅ Permisos configurados"
EOF
    
    echo ""
    echo -e "${GREEN}🎉 ¡Deployment completado exitosamente!${NC}"
    echo ""
    echo -e "${YELLOW}🌐 Verificar el sitio en:${NC}"
    echo -e "   ${BLUE}https://takisaficionintensa.com.mx${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tip: Si no ves los cambios, intenta:${NC}"
    echo "   • Ctrl+Shift+R (forzar recarga sin caché)"
    echo "   • Modo incógnito del navegador"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error durante el deployment${NC}"
    echo ""
    echo -e "${YELLOW}💡 Soluciones alternativas:${NC}"
    echo "1. Usar FTP/SFTP con FileZilla o Cyberduck"
    echo "2. Usar cPanel File Manager"
    echo "3. Verificar credenciales SSH"
    exit 1
fi
