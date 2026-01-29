# Instrucciones para Subir el Sitio al Servidor

## Archivos Listos para Subir

Todos los archivos están en la carpeta `public_html/` y también disponibles en el archivo comprimido:
📦 **takis-aficion-intensa-site.zip**

## Opción 1: Subir vía FTP/SFTP (Recomendado)

### Usando FileZilla o Cyberduck:

1. **Conectar al servidor**
   - Host: `takisaficionintensa.com.mx` (o la IP del servidor)
   - Usuario: [tu usuario FTP]
   - Contraseña: [tu contraseña FTP]
   - Puerto: 21 (FTP) o 22 (SFTP)

2. **Navegar a la carpeta correcta**
   - Busca la carpeta `public_html` o `www` o `htdocs` en el servidor
   - Esta es la raíz de tu sitio web

3. **Subir los archivos**
   - Arrastra todos los archivos de la carpeta `public_html/` local
   - Asegúrate de mantener la estructura de carpetas (especialmente `fonts/`)

### Usando Terminal (SFTP):

```bash
# Conectar al servidor
sftp usuario@takisaficionintensa.com.mx

# Navegar a la carpeta correcta
cd public_html

# Subir todos los archivos
put -r /Users/friaz85/Documents/Proyectos/DesaLyL/Takis/takisaficionintensa.com.mx/public_html/*

# Salir
exit
```

## Opción 2: Subir vía cPanel

1. **Acceder a cPanel**
   - Ir a: `https://takisaficionintensa.com.mx:2083` o `https://cpanel.tuhosting.com`
   - Iniciar sesión con tus credenciales

2. **Usar el Administrador de Archivos**
   - Buscar "Administrador de Archivos" o "File Manager"
   - Navegar a `public_html/`

3. **Subir archivos**
   - Opción A: Subir el ZIP y extraerlo en el servidor
   - Opción B: Subir archivos uno por uno usando el botón "Upload"

## Opción 3: Subir vía SCP (Línea de comandos)

```bash
# Desde la carpeta del proyecto
scp -r public_html/* usuario@takisaficionintensa.com.mx:/ruta/a/public_html/
```

## Estructura de Archivos que Debe Quedar en el Servidor

```
public_html/
├── index.html
├── styles.css
├── script.js
├── logo-takis.png
├── takis-texture.jpg
├── background-people.jpg
└── fonts/
    └── Veneer.otf
```

## Verificación Post-Subida

1. **Verificar permisos de archivos**
   - Archivos: 644 (rw-r--r--)
   - Carpetas: 755 (rwxr-xr-x)

2. **Probar el sitio**
   - Visitar: `https://takisaficionintensa.com.mx`
   - Verificar que el logo se vea correctamente
   - Verificar que el contador funcione
   - Verificar que la tipografía Veneer se cargue

3. **Verificar en diferentes dispositivos**
   - Desktop
   - Tablet
   - Mobile

## Solución de Problemas

### Si no se ve el logo:
- Verificar que `logo-takis.png` esté en la raíz de `public_html/`
- Verificar permisos del archivo (debe ser 644)

### Si no se ve la tipografía Veneer:
- Verificar que la carpeta `fonts/` exista
- Verificar que `Veneer.otf` esté dentro de `fonts/`
- Verificar permisos de la carpeta (755) y archivo (644)

### Si no se ven las imágenes de fondo:
- Verificar que `takis-texture.jpg` y `background-people.jpg` estén subidos
- Verificar permisos (644)

## Contacto con Hosting

Si necesitas ayuda con las credenciales FTP/SFTP, contacta a tu proveedor de hosting con:
- Dominio: takisaficionintensa.com.mx
- Solicitar: Credenciales FTP/SFTP o acceso a cPanel

## Archivo ZIP Disponible

El archivo `takis-aficion-intensa-site.zip` contiene todos los archivos listos para subir.
Puedes extraerlo directamente en el servidor o subirlo y extraerlo desde cPanel.
