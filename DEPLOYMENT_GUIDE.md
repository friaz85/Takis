# 🚀 Guía de Deployment - Takis a Producción

## ✅ Archivos Preparados

Los siguientes archivos están listos en tu directorio local:
- `backend_deploy.zip` - Backend completo (CodeIgniter)
- `frontend_deploy.zip` - Frontend compilado (Angular)

## 📋 Información del Servidor

```
Host: ssh.qrewards.com.mx
Usuario: u6-pu9mvhpmgwh1
Puerto SSH: 18765
Dominio: takis.qrewards.com.mx
Directorio: /takis.qrewards.com.mx/public_html
```

## 🔧 Opción 1: Deployment via SFTP (Recomendado)

### 1. Conectar via SFTP

Usa un cliente SFTP como FileZilla, Cyberduck o Transmit:

**Configuración FileZilla:**
- Host: `sftp://ssh.qrewards.com.mx`
- Usuario: `u6-pu9mvhpmgwh1`
- Puerto: `18765`
- Tipo de inicio de sesión: Clave SSH
- Archivo de clave: Tu archivo de clave privada SSH

### 2. Subir Archivos

1. Navega a `/takis.qrewards.com.mx/public_html`
2. Sube `backend_deploy.zip` al directorio `api/`
3. Sube `frontend_deploy.zip` a la raíz de `public_html/`

### 3. Descomprimir via cPanel File Manager

1. Accede a cPanel
2. Ve a File Manager
3. Navega a `/takis.qrewards.com.mx/public_html/api/`
4. Click derecho en `backend_deploy.zip` → Extract
5. Navega a `/takis.qrewards.com.mx/public_html/`
6. Click derecho en `frontend_deploy.zip` → Extract
7. Mueve el contenido de `browser/` a la raíz de `public_html/`

### 4. Configurar Backend

En `/takis.qrewards.com.mx/public_html/api/`:

1. **Copiar .htaccess**
   - Usa el archivo `deploy/api.htaccess` del proyecto
   - Renómbralo a `.htaccess`

2. **Crear archivo .env**
   - Copia el contenido de `deploy/production.env`
   - Actualiza `JWT_SECRET` con un valor aleatorio seguro
   - Configura las credenciales de email

3. **Instalar dependencias de Composer**
   - Via SSH o Terminal en cPanel:
   ```bash
   cd /takis.qrewards.com.mx/public_html/api
   composer install --no-dev --optimize-autoloader
   ```

4. **Crear directorios necesarios**
   ```bash
   mkdir -p uploads/logo
   mkdir -p uploads/rewards
   mkdir -p uploads/templates
   mkdir -p generated_pdfs
   mkdir -p writable/logs
   mkdir -p writable/cache
   mkdir -p writable/session
   ```

5. **Configurar permisos**
   ```bash
   chmod -R 755 writable/
   chmod -R 755 uploads/
   chmod -R 755 generated_pdfs/
   ```

### 5. Configurar Frontend

En `/takis.qrewards.com.mx/public_html/`:

1. **Copiar .htaccess**
   - Usa el archivo `deploy/frontend.htaccess`
   - Renómbralo a `.htaccess`

2. **Verificar estructura**
   ```
   /takis.qrewards.com.mx/public_html/
   ├── .htaccess
   ├── index.html
   ├── main-*.js
   ├── polyfills-*.js
   ├── styles-*.css
   ├── assets/
   │   ├── takis-logo.png
   │   └── takis-piece.png
   └── api/
       └── (backend files)
   ```

### 6. Configurar Base de Datos

**Via phpMyAdmin:**
1. Accede a phpMyAdmin en cPanel
2. Selecciona la base de datos: `dbx7kmb408ygd7`
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido de `backend/database/schema.sql`
5. Click en "Go" para ejecutar

**O via SSH:**
```bash
mysql -u ubayhneffxygo -p'1*@J$`r4:e`B' dbx7kmb408ygd7 < /takis.qrewards.com.mx/public_html/api/database/schema.sql
```

### 7. Verificar Deployment

- **Frontend**: https://takis.qrewards.com.mx
- **API Health**: https://takis.qrewards.com.mx/api/
- **Catálogo Público**: https://takis.qrewards.com.mx/api/rewards/public

## 🔧 Opción 2: Deployment via SSH (Si tienes clave configurada)

Si ya tienes tu clave SSH configurada en `~/.ssh/`:

```bash
# Subir archivos
scp -P 18765 backend_deploy.zip u6-pu9mvhpmgwh1@ssh.qrewards.com.mx:~/
scp -P 18765 frontend_deploy.zip u6-pu9mvhpmgwh1@ssh.qrewards.com.mx:~/

# Conectar
ssh -p 18765 u6-pu9mvhpmgwh1@ssh.qrewards.com.mx

# Desplegar backend
cd /takis.qrewards.com.mx/public_html/api
unzip ~/backend_deploy.zip
composer install --no-dev --optimize-autoloader

# Desplegar frontend
cd /takis.qrewards.com.mx/public_html
unzip ~/frontend_deploy.zip
mv browser/* .
rmdir browser

# Crear directorios
mkdir -p api/uploads/{logo,rewards,templates}
mkdir -p api/generated_pdfs
mkdir -p api/writable/{logs,cache,session}

# Permisos
chmod -R 755 api/writable api/uploads api/generated_pdfs

# Limpiar
rm ~/backend_deploy.zip ~/frontend_deploy.zip
```

## 📝 Archivo .env para el Servidor

Crea `/takis.qrewards.com.mx/public_html/api/.env`:

```env
CI_ENVIRONMENT = production

app.baseURL = 'https://takis.qrewards.com.mx/api/'
app.indexPage = ''
app.forceGlobalSecureRequests = true

database.default.hostname = localhost
database.default.database = dbx7kmb408ygd7
database.default.username = ubayhneffxygo
database.default.password = '1*@J$`r4:e`B'
database.default.DBDriver = MySQLi
database.default.port = 3306

# IMPORTANTE: Genera un secreto aleatorio único
JWT_SECRET = GENERA_UN_SECRETO_ALEATORIO_AQUI_MUY_LARGO

# Configurar con tu email SMTP
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USERNAME = tu_email@gmail.com
EMAIL_PASSWORD = tu_app_password
EMAIL_FROM = tu_email@gmail.com
EMAIL_FROM_NAME = Takis Promo
```

## 🔐 Generar JWT_SECRET

Ejecuta en tu terminal local:
```bash
openssl rand -base64 64
```

Copia el resultado y úsalo como `JWT_SECRET`.

## ✅ Checklist Post-Deployment

- [ ] Backend desplegado en `/api/`
- [ ] Frontend desplegado en raíz
- [ ] Archivo `.env` configurado
- [ ] Composer dependencies instaladas
- [ ] Directorios creados con permisos correctos
- [ ] Base de datos importada
- [ ] .htaccess en su lugar (backend y frontend)
- [ ] Frontend carga correctamente
- [ ] API responde en `/api/rewards/public`
- [ ] Login de admin funciona
- [ ] Registro de usuarios funciona
- [ ] OTP se envía correctamente

## 🐛 Troubleshooting

### Error 500 en API
```bash
# Ver logs
tail -f /takis.qrewards.com.mx/public_html/api/writable/logs/log-*.log
```

### Frontend muestra página en blanco
- Verificar que los archivos estén en la raíz de `public_html/`
- Verificar `.htaccess` en la raíz

### CORS errors
- Verificar `.htaccess` en `/api/`
- Verificar que `app.baseURL` en `.env` sea correcto

### Emails no se envían
- Verificar configuración SMTP en `.env`
- Revisar logs de email en `writable/logs/`

## 📞 Comandos Útiles

```bash
# Ver logs en tiempo real
tail -f /takis.qrewards.com.mx/public_html/api/writable/logs/log-*.log

# Limpiar cache
rm -rf /takis.qrewards.com.mx/public_html/api/writable/cache/*

# Ver espacio usado
du -sh /takis.qrewards.com.mx/public_html/*

# Verificar permisos
ls -la /takis.qrewards.com.mx/public_html/api/writable
```

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación estará disponible en:
**https://takis.qrewards.com.mx**

---

**Nota**: Guarda este archivo para futuros deployments.
