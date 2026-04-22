# 📜 Historial Completo del Proyecto Takis (Hasta Marzo 2026)

Este documento es una recopilación exhaustiva de **todas las implementaciones, mejoras de seguridad y nuevas características** desarrolladas desde el inicio del proyecto hasta la fecha actual. Está dividido por áreas lógicas para su fácil lectura.

---

## 🛡️ 1. Seguridad y Antifraude (Blindaje Total)

El sistema ha sido reestructurado para operar bajo una política de "Tolerancia Cero" contra bots y abusos de usuarios, protegiendo tanto el Login (OTP) como el canje de recompensas.

*   **Protección Anti-Fuerza Bruta en Login OTP:** Si se detectan más de 5 intentos fallidos en 60 segundos, se realiza un bloqueo permanente de IP y Usuario (`is_blocked = 1`).
*   **Honeypot (Trampa de Miel):** Campos invisibles en formularios para detectar y bloquear bots automáticamente (Error 403).
*   **Time Trap (Trampa de Velocidad):** Rechazo de envíos de formularios anómalamente rápidos (menos de 2 segundos).
*   **Fingerprint Anti-Multicuenta:** Se bloquean masivamente cuentas asociadas si se detectan 2 o más cuentas operando desde un mismo dispositivo en menos de 1 hora.
*   **Header Guard:** Bloqueo de peticiones cURL o automatizadas limitando el tráfico estrictamente al dominio oficial.
*   **Entropy Check (Secuencialidad):** Detección matemática de patrones predecibles. Si un usuario prueba códigos con >80% de similitud de forma consecutiva, su cuenta es bloqueada de por vida.
*   **Bloqueo de Dominios de Correo Inválidos:** Función para restringir automáticamente registros o accesos procedentes de dominios de email específicos detectados como maliciosos o temporales.
*   **Rate Limiting Actualizado:** 
    * Bloqueo si una IP realiza > 4 intentos de canje por minuto.
    * Bloqueo si un usuario falla 5 códigos en 10 minutos.

---

## 📈 2. Analítica y Tracking (Pixeles)

*   **Google Ads & DataLayer (Conversiones):** Implementación técnica de los eventos de analítica en el frontend. Principalmente, la inyección del evento `dataLayer.push({'event': 'canje_recompensa'})` que se dispara de manera confiable justo después de que un usuario canjea con éxito una recompensa. Esto permitió sincronizar las conversiones con las campañas de rendimiento en Google Ads de manera efectiva.
*   **Meta Pixel (Facebook):** Inyección del script `fbq` para capturar eventos clave del ecosistema de Meta. Adaptación especial para arquitecturas SPA (Single Page Application) en Angular interceptando los cambios de ruta para disparar correctamente los eventos de enrutamiento `PageView`.
*   **TikTok Pixel (`ttq`):** Incorporación del tracking avanzado de conversiones para campañas de TikTok Ads. Al igual que Meta, TikTok incluye compatibilidad SPA para medir correctamente el cambio de páginas virtuales (`ttq.page()`). Adicionalmente, se corrigió la alerta técnica "Purchase value is not valid in your events" removiendo envíos monetarios estáticos (`value: 0`, `currency: USD`) de eventos informativos como `ViewContent`.

---

## 🧑‍💻 3. Experiencia de Usuario (Cliente)

*   **Recompensas Digitales (Wallpapers):** Se reestructuró el sistema para permitir, subir y entregar no solo documentos PDF dinámicos, sino imágenes directas (`.jpg`, `.png`, `.jpeg`) como recompensas (por ejemplo: Wallpapers de Sicao/Takis).
*   **Links Legales y Terminología:** 
    * Se incluyó la casilla unificada de aceptación de "Términos y Condiciones" y el "Aviso de Privacidad" para agilizar el proceso del registro.
    * Inclusión del link de Términos y Condiciones directamente debajo del periodo de vigencia en las páginas principales.
*   **UI/UX e Identidad de Marca:** 
    * Modificaciones visuales alineadas a requerimientos específicos, ajustes del Modo Claro (Light Theme) para evitar pantallas oscuras incorrectas.
    * Rediseños varios incluyendo ajustes temáticos puntuales orientados a la estética general de las dinámicas Sicao/Takis.
*   **Tuning de Audio / URLs (Validaciones en Beta):** Ajustes en sonidos del juego de validación, así como mejoras en los mensajes de sistema (Toasts extra ocultos para no interrumpir el flujo del juego de 5 vidas).

---

## 🔧 4. Panel de Administración y Herramientas Operativas

*   **Sistema de Seguimiento (Tracking de Paquetería):** 
    * Se implementó el módulo completo de envíos en el panel de Admin para recompensas físicas con número de guía de paquetería, URL de rastreo y fecha de entrega.
*   **Módulo de Mails Automáticos por Estatus de Envío:**
    * **Procesando:** "Tu pedido está siendo procesado"
    * **Enviado:** "Tu paquete va en camino" (con hipervínculo de la guía)
    * **Entregado:** Agradecimiento final (con imagen especial para compartir en redes sociales).
*   **Sistema Completo de Soporte (Tickets):** 
    * Se creó un sistema interno con API (`/admin/support`) donde los administradores pueden gestionar, filtrar y priorizar quejas/dudas (alta, media, baja) y gestionar respuestas.
*   **Gestión de Usuarios ("Switch" de Bloqueo):** 
    * Desarrollo del toggle visual para bloquear/desbloquear usuarios temporal o permanentemente directamente desde la tabla de administración.
*   **Dashboard Optimizado:** 
    * La tabla principal fue conectada directamente con los *Logs de Seguridad* para mostrar los movimientos, canjes y bloqueos en tiempo real. 
    * Preparación del backend para gráficas de Chart.js con filtros avanzados, análisis estadístico de éxito vs fallos y exportación PDF.

---

## 📱 5. Integraciones de Terceros

*   **SDK de Ultramsg (WhatsApp):** Instalación, configuración y uso de la API v2.0.8 de Ultramsg para automatizar alertas.
    * *Notificación de Stock Bajo:* Si una recompensa digital tiene menos de 10 unidades de inventario restantes al momento de un canje, el sistema dispara automáticamente un mensaje de WhatsApp advirtiéndole al administrador del sistema.
    * *API Interna Lista:* Tres endpoints listos (`/api/ultramsg/...`) para ser usados publicamente en un futuro si se requiere conectar flujos de WhatsApp bot automatizados.

---

_**Última Actualización:** 17 de Marzo de 2026._
