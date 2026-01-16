# 🌶️ Takis - Plataforma de Recompensas

Sistema de promociones y recompensas para Takis con autenticación sin contraseña (OTP) y gestión completa de canjes.

## 🚀 Características

### Autenticación
- ✅ **Registro sin contraseña** - Solo email, nombre y teléfono
- ✅ **Login con OTP** - Código de 6 dígitos enviado por email
- ✅ **Verificación por email** - Códigos con expiración de 10 minutos
- ✅ **Panel de administración** - Login tradicional con usuario/contraseña

### Sistema de Recompensas
- 🎁 **Catálogo público** - Vista de recompensas sin autenticación
- 🎁 **Recompensas físicas** - Productos con envío a domicilio
- 🎁 **Recompensas digitales** - Generación automática de PDFs personalizados
- 📦 **Gestión de órdenes** - Estados: pending, processing, shipped, delivered, completed

### Gestión de Archivos
- 🖼️ **Logo local** - Almacenado en el servidor
- 🖼️ **Imágenes de recompensas** - Upload y almacenamiento local
- 📄 **Templates PDF** - Upload de plantillas para recompensas digitales
- 📄 **PDFs generados** - Guardados automáticamente en el servidor

### Panel de Administración
- 📊 **Dashboard** - Estadísticas de usuarios, puntos y canjes
- 🎁 **Gestión de recompensas** - CRUD completo con upload de imágenes
- 📦 **Gestión de órdenes** - Actualización de estados y tracking
- 💬 **Soporte** - Sistema de tickets
- 🔑 **Códigos promocionales** - Generación y gestión de códigos Takis

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: CodeIgniter 4
- **Base de datos**: MySQL
- **Autenticación**: JWT + OTP
- **Email**: PHPMailer con templates HTML
- **PDF**: TCPDF para generación de documentos

### Frontend
- **Framework**: Angular 19
- **Styling**: CSS moderno con gradientes y animaciones
- **HTTP**: HttpClient nativo de Angular
- **Routing**: Angular Router con guards

## 📋 Requisitos

- PHP 8.1+
- MySQL 5.7+
- Node.js 18+
- Composer
- npm/pnpm

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/friaz85/Takis.git
cd Takis
```

### 2. Configurar Backend

```bash
cd backend
composer install
```

Crear archivo `.env` basado en `deploy/production.env`:
```bash
cp deploy/production.env backend/.env
```

Configurar variables de entorno:
```env
# Database
database.default.hostname = localhost
database.default.database = takis_db
database.default.username = tu_usuario
database.default.password = tu_password

# JWT
JWT_SECRET = tu_secret_key_seguro

# Email (Gmail SMTP)
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USERNAME = tu_email@gmail.com
EMAIL_PASSWORD = tu_app_password
EMAIL_FROM = tu_email@gmail.com
EMAIL_FROM_NAME = Takis Promo
```

Importar base de datos:
```bash
mysql -u usuario -p takis_db < backend/database/schema.sql
```

Crear directorios necesarios:
```bash
mkdir -p backend/uploads/logo
mkdir -p backend/uploads/rewards
mkdir -p backend/uploads/templates
mkdir -p backend/generated_pdfs
chmod -R 755 backend/uploads
chmod -R 755 backend/generated_pdfs
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

Configurar API endpoint en `frontend/src/app/services/auth.service.ts`:
```typescript
private apiUrl = 'https://tu-dominio.com/api';
```

### 4. Desarrollo Local

**Backend:**
```bash
cd backend
php spark serve
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 🚀 Deployment

### Backend (Servidor con cPanel/SSH)

1. **Subir archivos:**
```bash
cd backend
# Comprimir archivos necesarios
zip -r backend.zip app/ public/ .env composer.json
```

2. **En el servidor:**
```bash
# Descomprimir
unzip backend.zip -d /path/to/api

# Instalar dependencias
cd /path/to/api
composer install --no-dev --optimize-autoloader

# Configurar permisos
chmod -R 755 writable/
chmod -R 755 uploads/
chmod -R 755 generated_pdfs/
```

3. **Configurar .htaccess** (usar `deploy/api.htaccess`)

### Frontend (Servidor estático)

1. **Build de producción:**
```bash
cd frontend
npm run build
```

2. **Subir archivos:**
```bash
# Los archivos compilados están en frontend/dist/browser/
# Subir todo el contenido a la raíz del dominio
```

3. **Configurar .htaccess** (usar `deploy/frontend.htaccess`)

### Deployment con SSH (Automatizado)

```bash
# Desde la raíz del proyecto
./deploy.sh usuario@servidor.com /ruta/destino
```

## 📁 Estructura del Proyecto

```
Takis/
├── backend/
│   ├── app/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php          # OTP auth
│   │   │   ├── AdminAuthController.php     # Admin login
│   │   │   ├── RewardAdminController.php   # CRUD recompensas
│   │   │   ├── OrdersController.php        # Gestión órdenes
│   │   │   ├── RedemptionController.php    # Canjes
│   │   │   └── UploadController.php        # Upload archivos
│   │   ├── Models/
│   │   ├── Libraries/
│   │   │   └── EmailSender.php             # Email templates
│   │   └── Config/
│   ├── database/
│   │   └── schema.sql
│   ├── uploads/                             # Archivos subidos
│   └── generated_pdfs/                      # PDFs generados
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── guards/
│   │   └── styles.css
│   └── public/
│       └── assets/
├── deploy/
│   ├── api.htaccess
│   ├── frontend.htaccess
│   └── production.env
└── README.md
```

## 🔐 Seguridad

- ✅ JWT con expiración de 30 días
- ✅ OTP con expiración de 10 minutos
- ✅ Passwords hasheados con bcrypt
- ✅ CORS configurado
- ✅ Validación de inputs
- ✅ Session versioning para invalidar tokens
- ✅ Logs de seguridad para brute force protection

## 📧 Configuración de Email

Para usar Gmail SMTP:
1. Activar verificación en 2 pasos en tu cuenta Google
2. Generar una contraseña de aplicación
3. Usar esa contraseña en `EMAIL_PASSWORD`

## 🎨 Personalización

### Logo
Reemplazar: `backend/uploads/logo/takis_logo.png`

### Colores del tema
Editar: `frontend/src/styles.css`

### Templates de email
Editar: `backend/app/Libraries/EmailSender.php`

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro con OTP
- `POST /api/auth/request-login-otp` - Solicitar código de login
- `POST /api/auth/verify-otp` - Verificar código OTP
- `POST /api/admin/login` - Login admin

### Recompensas
- `GET /api/rewards/public` - Catálogo público
- `GET /api/rewards` - Catálogo (autenticado)
- `POST /api/admin/rewards` - Crear recompensa
- `PUT /api/admin/rewards/{id}` - Actualizar recompensa
- `DELETE /api/admin/rewards/{id}` - Eliminar recompensa

### Canjes
- `POST /api/redeem` - Canjear recompensa
- `GET /api/redemptions` - Mis canjes
- `GET /api/admin/orders` - Todas las órdenes
- `PUT /api/admin/orders/{id}` - Actualizar estado

## 🐛 Troubleshooting

### Error de conexión a base de datos
- Verificar credenciales en `.env`
- Verificar que MySQL esté corriendo
- Verificar permisos del usuario de BD

### Emails no se envían
- Verificar configuración SMTP en `.env`
- Verificar que el puerto 587 esté abierto
- Revisar logs en `backend/writable/logs/`

### Archivos no se suben
- Verificar permisos de carpetas `uploads/` y `generated_pdfs/`
- Verificar límites de PHP: `upload_max_filesize` y `post_max_size`

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👨‍💻 Autor

**friaz85**
- GitHub: [@friaz85](https://github.com/friaz85)

---

Hecho con 🌶️ por el equipo de Takis
