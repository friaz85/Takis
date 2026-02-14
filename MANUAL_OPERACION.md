# 📘 Manual de Operación - Plataforma Takis "Afición Intensa"

Este documento sirve como guía para la administración y uso de la plataforma **Takis Afición Intensa**, detallando los flujos principales, gestión de contenido y funcionalidades del sistema.

---

## 1. 🌍 Acceso a la Plataforma

### URLs del Sistema
- **Sitio Público (Usuarios)**: `https://takisaficionintensa.com.mx`  
  *(Actualmente redirecciona a 'Próximamente' hasta el lanzamiento oficial el 16 de Febrero)*
- **Panel Administrativo**: `https://takisaficionintensa.com.mx/#/admin/login`

### Tipos de Usuarios (Roles)
1.  **Administrador General (`admin`)**: Acceso total a todas las funcionalidades, configuración y logs.
2.  **Administrador Takis (`takis_admin`)**: Perfil ejecutivo con vista simplificada.
    *   *Restricciones*: No ve "Pedidos", "Soporte" ni estadísticas técnicas de "Visitas".
3.  **Usuario Final (Fan)**: Participante de la promoción que registra códigos y canjea premios.

---

## 2. 👥 Portal de Usuario (Experiencia del Fan)

### Registro y Login
*   **Registro**: Los usuarios deben crear una cuenta proporcionando Nombre, Email, Teléfono y creando una contraseña.
*   **Validación**: El sistema envía un correo de bienvenida (opcionalmente validación por OTP si está activo).
*   **Login**: Acceso con Email/Usuario y Contraseña.

### Dinámica de Participación
1.  **Registrar Códigos**: El usuario ingresa códigos alfanuméricos encontrados en productos Takis.
    *   El sistema valida si el código existe, si ya fue usado o si es inválido.
    *   **Puntos**: Cada código válido suma puntos a su "Saldo Actual".
2.  **Catálogo de Recompensas**:
    *   El usuario navega por los premios disponibles.
    *   Puede ver detalles, fotos y costo en puntos.
    *   Solo puede canjear si tiene saldo suficiente y hay stock disponible.
3.  **Canje de Premios**:
    *   Al canjear, se descuentan los puntos inmediatamente.
    *   Si es un producto físico, se solicita/confirma la dirección de envío.
    *   Se genera un registro en "Mis Canjes".

---

## 3. 🛡️ Panel Administrativo (Gestión)

### 📊 Dashboard (Tablero de Control)
Vista general del rendimiento de la promoción.
*   **KPIs (Indicadores Clave)**:
    *   **Usuarios Registrados**: Total de participantes.
    *   **Códigos Registrados**: Total de códigos Takis validados exitosamente.
    *   **Canjes Realizados**: Total de premios entregados/solicitados.
    *   *Visitas (Solo Admin General)*: Tráfico del sitio web.
*   **Gráficas**:
    *   **Actividad (7 días)**: Tendencia de nuevos usuarios vs. canjes.
    *   **Distribución de Premios**: Qué recompensas son las más populares.
*   **Filtros**: Permite filtrar toda la data por rango de fechas (Desde - Hasta).
*   **Exportar**: Botón para generar un reporte PDF/Impreso de la vista actual.

### 🎁 Gestión de Recompensas (`/admin/rewards`)
Aquí se administran los premios del catálogo.
*   **Crear/Editar**:
    *   **Título y Descripción**.
    *   **Costo en Puntos**.
    *   **Stock**: Cantidad disponible. El sistema descuenta automáticamente (cierra el canje al llegar a 0).
    *   **Imagen**: Carga de fotografías (formato recomendado: JPG/PNG cuadrado, 800x800px).
*   **Estado**: Activo (visible) o Inactivo (oculto en el catálogo).

### 📦 Gestión de Pedidos (`/admin/orders`)
*(No visible para `takis_admin`)*
Control logístico de los premios físicos canjeados.
*   **Listado**: Muestra todos los canjes con datos del usuario y dirección.
*   **Cambio de Estatus**:
    *   **Pendiente**: Recién canjeado.
    *   **En Proceso**: Preparando envío.
    *   **Enviado**: Paquete entregado a paquetería (permite ingresar # de Guía).
    *   **Entregado**: Confirmación final.
    *   **Cancelado**: Devuelve los puntos al usuario (opcional).

### 🎫 Códigos y Canjes
*   **Códigos Registrados (`/admin/promo-codes`)**:
    *   Historial de todos los códigos ingresados por los usuarios.
    *   Muestra: Código, Usuario, Fecha y Puntos otorgados.
    *   *Nota*: Por optimización, muestra por defecto los códigos *usados*.
*   **Canjes Realizados (`/admin/entry-codes`)**:
    *   Bitácora histórica de todos los premios redimidos.

### 👥 Gestión de Usuarios (`/admin/users`)
Directorio de participantes.
*   **Búsqueda**: Por nombre, email o teléfono.
*   **Detalle**: Ver historial de puntos, canjes y direcciones de un usuario específico.
*   **Acciones**: Editar datos, bloquear usuario (ban), restablecer contraseña.

### 💬 Soporte (`/admin/support`)
*(No visible para `takis_admin`)*
*   Bandeja de entrada de mensajes de contacto (normalmente vía WhatsApp o formulario).
*   Permite marcar tickets como "Atendidos".

---

## 4. ⚙️ Especificaciones Técnicas y Mantenimiento

### Imágenes
*   **Ruta de Carga**: Las imágenes se guardan en el servidor y se replican automáticamente entre entornos (Dev/Prod).
*   **Optimización**: Se recomienda subir imágenes optimizadas (menos de 500KB) para asegurar carga rápida en móviles.

### Reportes
*   El sistema permite exportar tablas a **CSV (Excel)** desde las secciones de Usuarios, Pedidos y Códigos.
*   El Dashboard permite impresión directa a **PDF** (Ctrl+P o botón Exportar).

### Seguridad
*   **Sesión**: El panel cierra sesión automáticamente tras inactividad prolongada (Token JWT).
*   **Contraseñas**: Encriptadas en base de datos. Nadie las puede leer, solo restablecerlas.

---

**Soporte Técnico**:
Para temas de servidor, base de datos o errores del sistema, contactar al equipo de desarrollo (Antigravity / LyL).

*Última actualización: 13 de Febrero, 2026*
