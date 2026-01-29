# Guía de Deployment Manual - Takis

## Información del Servidor
- **Dominio**: dev.takisaficionintensa.com.mx
- **Directorio**: /dev.takisaficionintensa.com.mx/public_html
- **Base de datos**: dbx7kmb408ygd7
- **Usuario DB**: ubayhneffxygo

## Estructura de Directorios

```
/dev.takisaficionintensa.com.mx/public_html/
├── api/                    # Backend (CodeIgniter)
│   ├── app/
│   ├── public/
│   ├── uploads/
│   ├── generated_pdfs/
│   ├── writable/
│   ├── .env
│   └── .htaccess
└── (archivos frontend)     # Frontend (Angular) en la raíz
```

## Pasos de Deployment

### 1. Preparar archivos localmente

```bash
cd /Users/friaz85/Documents/Proyectos/DesaLyL/Takis

# Build del frontend
cd frontend
npm run build
cd ..
```

### 2. Crear paquetes

```bash
# Backend
cd backend
zip -r ../backend_deploy.zip \
    app/ \
    public/ \
    database/ \
    composer.json \
    -x "*.git*" "writable/*" "vendor/*"
cd ..

# Frontend
cd frontend/dist/browser
zip -r ../../../frontend_deploy.zip *
cd ../../..
```

### 3. Subir vía SSH/SFTP

```bash
# Usando SCP (reemplaza USUARIO con tu usuario SSH)
scp backend_deploy.zip USUARIO@dev.takisaficionintensa.com.mx:~/
scp frontend_deploy.zip USUARIO@dev.takisaficionintensa.com.mx:~/
scp deploy/api.htaccess USUARIO@dev.takisaficionintensa.com.mx:~/
scp deploy/frontend.htaccess USUARIO@dev.takisaficionintensa.com.mx:~/
```

### 4. Conectar por SSH y desplegar

```bash
ssh USUARIO@dev.takisaficionintensa.com.mx

# Descomprimir backend
cd /dev.takisaficionintensa.com.mx/public_html/api
unzip ~/backend_deploy.zip
composer install --no-dev --optimize-autoloader

# Descomprimir frontend
cd /dev.takisaficionintensa.com.mx/public_html
unzip ~/frontend_deploy.zip

# Configurar .htaccess
cp ~/api.htaccess /dev.takisaficionintensa.com.mx/public_html/api/.htaccess
cp ~/frontend.htaccess /dev.takisaficionintensa.com.mx/public_html/.htaccess

# Crear directorios necesarios
mkdir -p /dev.takisaficionintensa.com.mx/public_html/api/uploads/logo
mkdir -p /dev.takisaficionintensa.com.mx/public_html/api/uploads/rewards
mkdir -p /dev.takisaficionintensa.com.mx/public_html/api/uploads/templates
mkdir -p /dev.takisaficionintensa.com.mx/public_html/api/generated_pdfs
mkdir -p /dev.takisaficionintensa.com.mx/public_html/api/writable/logs
mkdir -p /dev.takisaficionintensa.com.mx/public_html/api/writable/cache

# Configurar permisos
chmod -R 755 /dev.takisaficionintensa.com.mx/public_html/api/writable
chmod -R 755 /dev.takisaficionintensa.com.mx/public_html/api/uploads
chmod -R 755 /dev.takisaficionintensa.com.mx/public_html/api/generated_pdfs

# Limpiar
rm ~/backend_deploy.zip ~/frontend_deploy.zip ~/api.htaccess ~/frontend.htaccess
```

### 5. Configurar .env en el servidor

```bash
nano /dev.takisaficionintensa.com.mx/public_html/api/.env
```

Copiar el contenido de `deploy/production.env` y actualizar:
- JWT_SECRET (generar uno nuevo)
- Configuración de email

### 6. Importar/Actualizar Base de Datos

```bash
# Opción 1: Via SSH
mysql -u ubayhneffxygo -p dbx7kmb408ygd7 < /dev.takisaficionintensa.com.mx/public_html/api/database/schema.sql

# Opción 2: Via phpMyAdmin
# Ir a phpMyAdmin y ejecutar el schema.sql
```

### 7. Verificar

- Frontend: https://dev.takisaficionintensa.com.mx
- API: https://dev.takisaficionintensa.com.mx/api/
- Test endpoint: https://dev.takisaficionintensa.com.mx/api/rewards/public

## Deployment Rápido (Script Automatizado)

Si tienes acceso SSH configurado:

```bash
./deploy.sh USUARIO@dev.takisaficionintensa.com.mx /dev.takisaficionintensa.com.mx/public_html
```

## Troubleshooting

### Error 500
- Verificar permisos de writable/
- Revisar logs: `/dev.takisaficionintensa.com.mx/public_html/api/writable/logs/`

### Base de datos no conecta
- Verificar credenciales en .env
- Verificar que la base de datos existe

### CORS errors
- Verificar que .htaccess esté en su lugar
- Verificar configuración de CORS en backend

## Comandos Útiles

```bash
# Ver logs en tiempo real
tail -f /dev.takisaficionintensa.com.mx/public_html/api/writable/logs/log-*.log

# Limpiar cache
rm -rf /dev.takisaficionintensa.com.mx/public_html/api/writable/cache/*

# Ver espacio en disco
du -sh /dev.takisaficionintensa.com.mx/public_html/*
```
