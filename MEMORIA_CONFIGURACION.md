# 🧠 Memoria de Configuración y Deployment - Takis Afición Intensa

Este documento resume el estado actual del proyecto, las configuraciones de los servidores y el plan de lanzamiento automatizado.

## 🏁 Estado Actual (13 de Feb, 20:34 hrs)
- **Frontend**: 
  - Dashboard optimizado con 4 KPIs en una sola fila (Visitas, Usuarios Registrados, Códigos Registrados, Canjes Realizados)
  - Títulos actualizados: "CANJES REALIZADOS" y "CÓDIGOS REGISTRADOS"
  - Google Tag Manager integrado (GTM-N2HNKPWC) para monitoreo de visitas
  - Fuente responsive en KPIs para números grandes
  - Promo codes optimizado (solo muestra códigos usados por defecto)
- **Backend**: 
  - Query de dashboard optimizada para evitar escanear 73M registros de promo_codes
  - Solo cuenta códigos USADOS (rápido con índice)
  - API configurada con JWT, base de datos MySQL y sistema de correos/WhatsApp activo
- **Admin**: Dashboard simplificado y optimizado para carga rápida

## 🌍 Configuración de Entornos

### 🛠️ Desarrollo (DEV)
- **URL**: `https://dev.takisaficionintensa.com.mx`
- **Path**: `/home/u10-vaeulgu8bfqa/www/dev.takisaficionintensa.com.mx/public_html`
- **Script**: `./deploy_dev.sh`
- **Base de Datos**: MySQL
  - Host: `localhost`
  - Usuario: `uja2i2v274lkm`
  - Base de datos: `dbemgylpsiadtp`
  - Puerto: `3306`
- **Estado**: Actualizado con todos los fixes y optimizaciones del 13 de febrero

### 🚀 Producción (PROD) - LATENTE
- **Dominio**: `https://takisaficionintensa.com.mx`
- **Path**: `/home/u10-vaeulgu8bfqa/www/takisaficionintensa.com.mx/public_html`
- **Estado Actual**: Se muestra la página "Próximamente" (`index.html`)
- **Estado Latente**: La WebApp completa ya está subida como **`index.app.html`** (desplegada el 13/Feb/2026)
- **Base de Datos**: **MISMA QUE DEV** (MySQL - `dbemgylpsiadtp`)
  - ⚠️ IMPORTANTE: Dev y Prod comparten la misma BD por el momento
- **Uploads (Imágenes)**: **COMPARTIDOS CON DEV** (Enlace simbólico creado el 13/Feb)
  - `PROD/api/uploads` -> `DEV/api/uploads`
  - Esto garantiza que las imágenes de recompensas existentes estén disponibles en Prod sin resubirlas.
- **Script de Pre-despliegue**: `./deploy_silent.sh` (actualiza la versión latente sin afectar el sitio público)
- **Último despliegue silencioso**: 13 de Febrero 2026, 20:42 hrs (v1.0.0-pre-launch)

## 📅 Plan de Lanzamiento Automático (16 de Febrero)
He configurado un **Cron Job** en el sistema local para activar el sitio sin intervención manual:

- **Fecha/Hora**: 2026-02-16 00:00:00 CDMX
- **Script a ejecutar**: `./deploy_prod.sh`
- **Lógica del Script**: 
    1. Renombra `index.html` (Próximamente) → `index.holding.html`
    2. Renombra `index.app.html` (Latente) → `index.html` (Público)
- **Log de seguimiento**: `/Users/friaz85/Documents/Proyectos/DesaLyL/Takis/deployment_prod.log`

## 📊 Google Tag Manager
- **Container ID**: `GTM-N2HNKPWC`
- **Ubicación**: Implementado en `frontend/src/index.html`
- **Funcionalidad**: Monitoreo automático de visitas en todas las páginas
- **Estado**: Activo en DEV y desplegado en PROD (latente)

## 🎯 Optimizaciones Recientes (13 de Febrero)

### Dashboard Admin
- **KPIs simplificados**: 4 tarjetas en una sola fila
- **Query optimizada**: Solo cuenta códigos USADOS (evita escanear 73M registros)
- **Rendimiento**: Carga rápida con datos reales
- **Layout**: Fuente responsive con `word-break` para números grandes

### Páginas Admin
- **Entry Codes** (`/admin/entry-codes`): Título "CANJES REALIZADOS"
- **Promo Codes** (`/admin/promo-codes`): 
  - Título "CÓDIGOS REGISTRADOS"
  - Sin KPI cards
  - Por defecto muestra solo códigos USADOS
  - Límite de 50 registros por página

## 📂 Archivos Clave
- `deploy_silent.sh`: Para subir cambios a PROD sin publicarlos
- `deploy_prod.sh`: Script "gatillo" para el intercambio de archivos el día 16
- `deploy_dev.sh`: Deployment a desarrollo
- `environment.prod.ts`: URLs oficiales del dominio principal
- `deploy/prod/.env.deploy`: Credenciales SSH de producción
- `deploy/prod/Database.php`: Configuración de BD para producción (MySQL)
- `deploy/dev/Database.php`: Configuración de BD para desarrollo (MySQL)

## ✅ Funcionalidades Verificadas en PROD (Latente)
- ✅ Login de usuarios
- ✅ Login de admin
- ✅ Registro de usuarios
- ✅ Registro de dirección de usuario
- ✅ Canjes de códigos
- ✅ Sistema de recompensas
- ✅ Rutas de imágenes y recompensas
- ✅ Google Tag Manager activo
- ✅ Dashboard optimizado

## � Restricciones de Usuario (takis_admin)
- **Menú**: Ocultas opciones "Pedidos" y "Soporte"
- **Dashboard**: Oculto KPI de Visitas y Tabla de Visitas
- **Reportes**: Exportación PDF oculta sección de visitas
- **Propósito**: Vista simplificada para cliente final

## 🔄 Últimos Commits
- `07f82ad` (REVERTIDO) - Configure separate database for DEV environment
- `39bfbd0` - Update WhatsApp stock alert phones (15/Feb/2026)
- `95800d4` - Configure shared uploads between Prod and Dev environments [Force Add] (13/Feb/2026)
- Incluye: script link_uploads_prod.sh, memoria actualizada, uploads compartidos


---
*Documento actualizado el 13 de Febrero de 2026 por Antigravity para continuidad del proyecto.*
