#!/bin/bash

# Script para enlazar la carpeta uploads de PROD a la carpeta uploads de DEV
# Esto asegura que ambos entornos compartan las mismas imágenes (ya que comparten BD)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -f "deploy/prod/.env.deploy" ]; then
    export $(cat deploy/prod/.env.deploy | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: deploy/prod/.env.deploy no encontrado${NC}"
    exit 1
fi

echo -e "${YELLOW}🔗 Configurando enlace simbólico para uploads en PRODUCCIÓN...${NC}"

ssh -p $SERVER_PORT -i $SSH_KEY $SERVER_USER@$SERVER_HOST << EOF
    # Rutas en el servidor
    PROD_PATH="$SERVER_PATH/api/uploads"
    DEV_PATH="/home/u10-vaeulgu8bfqa/www/dev.takisaficionintensa.com.mx/public_html/api/uploads"

    echo "Verificando rutas..."
    
    if [ ! -d "\$DEV_PATH" ]; then
        echo "❌ Error: La carpeta de uploads de DEV no existe en: \$DEV_PATH"
        exit 1
    fi

    # Si existe la carpeta uploads en PROD (y no es symlink), la renombramos como backup
    if [ -d "\$PROD_PATH" ] && [ ! -L "\$PROD_PATH" ]; then
        echo "⚠️  Carpeta uploads existente en PROD detectada. Creando backup..."
        mv "\$PROD_PATH" "\${PROD_PATH}_backup_\$(date +%Y%m%d_%H%M%S)"
    fi

    # Crear el enlace simbólico si no existe
    if [ ! -L "\$PROD_PATH" ]; then
        echo "🔗 Creando enlace simbólico PROD -> DEV..."
        ln -s "\$DEV_PATH" "\$PROD_PATH"
        echo "✅ Enlace creado exitosamente."
    else
        echo "ℹ️  El enlace simbólico ya existe."
    fi

    # Verificar
    echo "Verificando enlace:"
    ls -ld "\$PROD_PATH"
EOF

echo -e "${GREEN}✅ Configuración de uploads compartidos completada.${NC}"
