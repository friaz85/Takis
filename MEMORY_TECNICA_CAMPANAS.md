# Memoria Técnica: Campaña de Correos Sprint - Takis Afición Intensa

Este documento registra la configuración y lógica de los correos promocionales creados para el cierre de la promoción.

## Palabra Clave / Contexto
**Keyword:** `TAKIS_AFICION_INTENSA_2024`
**Ambiente:** Solo DEV (Desarrollo)

## Lógica de Selección de Usuarios (12,490 correos por sprint)
El sistema selecciona automáticamente hasta 12,490 usuarios bajo los siguientes criterios de prioridad:

1.  **Segmento A:** Usuarios con **5 o más puntos** acumulados.
2.  **Segmento B:** Usuarios con **de 1 a 4 puntos** que hayan tenido **actividad (login) en el último mes**.
    *   *Nota: Se excluyen usuarios con 0 puntos.*

## Correos Programados
Para enviar cada correo, utiliza el comando correspondiente en la terminal del backend:

### Correo 1: Aún tienes tiempo de ganar
*   **Asunto:** Takis Afición Intensa - Aún tienes tiempo de ganar
*   **Comando:** `php spark email:send-sprint --email 1 --mode mass`

### Correo 2: No te quedes sin recompensas
*   **Asunto:** Takis Afición Intensa - No te quedes sin recompensas
*   **Comando:** `php spark email:send-sprint --email 2 --mode mass`

### Correo 3: Últimos días para canjear tus puntos
*   **Asunto:** Takis Afición Intensa - Últimos días para canjear tus puntos
*   **Comando:** `php spark email:send-sprint --email 3 --mode mass`

### Correo 4: Último día para canjear tus puntos
*   **Asunto:** Takis Afición Intensa - Último día para canjear tus puntos
*   **Comando:** `php spark email:send-sprint --email 4 --mode mass`

## Configuración SMTP (Diferenciado)
Estos correos utilizan un servidor SMTP específico definido en el `.env` bajo las variables `PROM_EMAIL_*`. 
**Estado Actual:** Configurado y activo.
- **Host:** `envios.microbit.com`
- **User:** `contacto@hmmrewards.mx`
- **Puerto:** `2525`
- **Encriptación:** Ninguna (SSL/TLS: no)

## Estatus Actual (21 de Abril 2026)
- **Configuración:** SMTP y Lógica de Logs verificados y desplegados en ambiente **DEV**.
- **Pruebas:** Se enviaron exitosamente 12 correos de prueba (4 emails a 3 destinatarios distintos). Los logs se registran correctamente en `email_campaign_logs`.
- **Pendiente:** Ejecución del envío masivo del **Correo 1** a los segmentos A y B.

## Próximos Pasos (Programado para el 22 de Abril)
1.  **Esperar instrucción explícita del usuario** antes de iniciar cualquier envío masivo.
2.  Cuando se autorice, el comando a ejecutar en el servidor de **DEV** será:
    ```bash
    php spark email:send-sprint --email 1 --mode mass
    ```
    *(Opcional: añadir `--dry-run` primero para verificación final de conteos).*

---
_**Nota:** No repetir estas instrucciones ni iniciar envíos hasta que el usuario lo solicite._
