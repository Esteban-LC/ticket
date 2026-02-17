# 🎯 Guía: Suspender Usuarios de WordPress desde tu Panel

## 📝 Resumen del Problema

Antes, cuando suspendías un usuario desde tu panel Next.js, solo se marcaba como "suspendido" en tu base de datos local, pero **el usuario podía seguir iniciando sesión en WordPress normalmente**.

Ahora, con el código personalizado que creé, cuando suspendes un usuario:
- ✅ Se marca en tu panel Next.js
- ✅ **Se suspende REALMENTE en WordPress**
- ✅ **No puede iniciar sesión** en WordPress
- ✅ **Se cierra su sesión activa** automáticamente

## 🛠️ Lo Que Necesitas Hacer

Para que la suspensión funcione realmente en WordPress, necesitas instalar un código PHP personalizado en tu sitio WordPress.

### Paso 1: Encontrar el Código

El código está en la carpeta de tu proyecto:

```
C:\Users\Ti\ticket\wordpress-custom-code\
```

Ahí encontrarás:
- `user-suspension-api.php` - El código principal
- `README.md` - Instrucciones detalladas
- `INSTALLATION-INSTRUCTIONS.md` - Guía paso a paso

### Paso 2: Instalarlo en WordPress

**Opción A: Como Plugin (Recomendado)**

1. Conecta via FTP a tu servidor WordPress
2. Ve a: `wp-content/plugins/`
3. Crea carpeta: `user-suspension-api/`
4. Sube el archivo `user-suspension-api.php` ahí
5. En WordPress admin: Plugins → Activar "User Suspension API"

**Opción B: En functions.php (Más Rápido)**

1. WordPress admin → Apariencia → Editor de archivos
2. Abre `functions.php`
3. Al final, pega el contenido de `user-suspension-api.php` (sin la primera línea `<?php`)
4. Guarda

### Paso 3: Verificar

Visita en tu navegador:
```
https://liq.com.mx/wp-json/custom/v1/
```

Si ves información de rutas (o error 401), ¡funciona! ✅

## 🚀 Cómo Usar

Una vez instalado el código en WordPress:

1. **Suspender un usuario:**
   - Ve a tu panel → WordPress LMS → Estudiantes WP
   - Busca el usuario
   - Click en "Suspender"
   - Escribe la razón
   - ¡Listo! El usuario NO podrá iniciar sesión en WordPress

2. **Habilitar un usuario:**
   - Busca el usuario suspendido (tiene fondo rojo)
   - Click en "Habilitar"
   - El usuario puede volver a iniciar sesión

## 🔒 Qué Hace el Código

El código PHP que instalas en WordPress:

1. **Bloquea el login:** Usuarios suspendidos ven: "Tu cuenta ha sido suspendida. Razón: [razón]"
2. **Cierra sesiones:** Si el usuario estaba conectado, lo desconecta automáticamente
3. **Guarda información:** Quién suspendió, cuándo, y por qué
4. **Protege admins:** No permite suspender usuarios Administradores
5. **API REST:** Crea endpoints que tu panel usa para suspender/habilitar

## ⚠️ Importante

**ANTES de instalar el código:**
- Tu panel podía marcar usuarios como suspendidos localmente
- Pero en WordPress seguían "normales" (podían iniciar sesión)

**DESPUÉS de instalar el código:**
- Tu panel suspende usuarios REALMENTE en WordPress
- No pueden iniciar sesión
- Se cierran sus sesiones activas

## 🧪 Cómo Probar

1. Instala el código en WordPress (siguiendo Paso 2)
2. Ve a tu panel: http://localhost:1234/dashboard/wordpress/students
3. Suspende un usuario de prueba
4. Intenta iniciar sesión con ese usuario en WordPress
5. Deberías ver: "Tu cuenta ha sido suspendida"

## 🆘 Solución de Problemas

### "Error 424: Plugin no instalado"

**Problema:** Intentaste suspender pero el código no está instalado en WordPress

**Solución:** Sigue el Paso 2 arriba para instalar el código PHP

### El usuario sigue pudiendo iniciar sesión

**Problema:** Instalaste mal el código o no se activó

**Solución:**
1. Verifica que el plugin esté activado en WordPress
2. O revisa que pegaste bien el código en functions.php
3. Visita `https://liq.com.mx/wp-json/custom/v1/` para verificar

### Error 401 Unauthorized

**Problema:** Tus credenciales de API no son correctas

**Solución:** Verifica tu archivo `.env`:
```
WORDPRESS_API_URL="https://liq.com.mx/wp-json"
WORDPRESS_USERNAME="Paco"
WORDPRESS_APP_PASSWORD="CpIt 8N7C laUL eyvB E2bZ RevS"
```

## 📁 Archivos Modificados

Para referencia, estos son los archivos que actualicé en tu proyecto:

1. `wordpress-custom-code/user-suspension-api.php` - Código PHP para WordPress
2. `wordpress-custom-code/README.md` - Instrucciones detalladas
3. `lib/wordpress/users.ts` - Agregué funciones para suspender/habilitar
4. `app/api/wordpress/users/[id]/suspend/route.ts` - Actualizado para usar WordPress API
5. `components/wordpress/WordPressStudentsClient.tsx` - Manejo de errores mejorado

## 💡 Próximos Pasos

Después de instalar el código y probar que funciona, puedes:

1. ✅ Crear nuevos usuarios
2. ✅ Editar usuarios existentes
3. ✅ Eliminar usuarios
4. ✅ Inscribir/desinscribir de cursos
5. ✅ Ver órdenes de WooCommerce

Estos ya están en el código, solo falta implementar la interfaz. ¿Quieres que trabaje en alguno de estos?

---

**¿Tienes dudas?** Avísame y te ayudo con la instalación del código en WordPress.
