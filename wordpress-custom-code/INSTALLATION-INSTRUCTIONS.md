# Instrucciones de Instalación - User Suspension API

Este código personalizado permite suspender y habilitar usuarios de WordPress desde tu panel Next.js.

## Opción 1: Crear un Plugin Personalizado (Recomendado)

1. Conéctate a tu servidor WordPress via FTP o File Manager de cPanel

2. Navega a la carpeta: `wp-content/plugins/`

3. Crea una nueva carpeta llamada: `user-suspension-api`

4. Dentro de esa carpeta, crea un archivo llamado: `user-suspension-api.php`

5. Copia todo el contenido del archivo `user-suspension-api.php` en ese nuevo archivo

6. Ve al panel de administración de WordPress

7. En el menú lateral, ve a **Plugins** → **Plugins Instalados**

8. Busca "User Suspension API" y haz clic en **Activar**

## Opción 2: Agregar al functions.php (Más Rápido)

1. Ve al panel de administración de WordPress

2. En el menú lateral, ve a **Apariencia** → **Editor de archivos del tema**

3. En la barra lateral derecha, selecciona **Funciones del tema (functions.php)**

4. Al final del archivo, pega todo el contenido del archivo `user-suspension-api.php` (EXCEPTO las primeras líneas que dicen `<?php`)

5. Haz clic en **Actualizar archivo**

⚠️ **ADVERTENCIA**: Si cometes algún error al editar functions.php, tu sitio podría dejar de funcionar. Haz un respaldo antes de editar.

## Verificar que Funciona

1. Después de instalar, ve a tu navegador

2. Visita: `https://liq.com.mx/wp-json/custom/v1/`

3. Deberías ver las rutas disponibles (o un error 401 de autenticación, lo cual es normal)

## Endpoints Disponibles

Una vez instalado, estos endpoints estarán disponibles:

- `POST /wp-json/custom/v1/users/{id}/suspend` - Suspender usuario
- `POST /wp-json/custom/v1/users/{id}/unsuspend` - Habilitar usuario
- `GET /wp-json/custom/v1/users/{id}/suspension-status` - Ver estado de suspensión

## ¿Qué Hace Este Código?

1. **Suspende usuarios**: Marca al usuario como suspendido en la base de datos de WordPress
2. **Bloquea el login**: Usuarios suspendidos NO pueden iniciar sesión en WordPress
3. **Cierra sesiones activas**: Cuando suspendes un usuario, se cierra su sesión automáticamente
4. **Guarda la razón**: Almacena por qué fue suspendido el usuario
5. **Protege administradores**: No permite suspender usuarios con rol de Administrador

## Próximo Paso

Después de instalar este código en WordPress, tu panel Next.js podrá suspender usuarios realmente, no solo marcarlos localmente.
