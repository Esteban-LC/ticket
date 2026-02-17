# 🔧 Código Personalizado para WordPress

Esta carpeta contiene código PHP que necesitas instalar en tu sitio WordPress para habilitar la funcionalidad de suspensión de usuarios desde tu panel Next.js.

## 📋 ¿Qué Hace Este Código?

El código en `user-suspension-api.php` agrega las siguientes funcionalidades a WordPress:

✅ **Suspende usuarios realmente** - No solo marca en tu panel, sino que **bloquea el login en WordPress**
✅ **Cierra sesiones activas** - Cuando suspendes un usuario, se desconecta automáticamente
✅ **Guarda la razón** - Almacena por qué fue suspendido cada usuario
✅ **Endpoints REST API** - Tu panel Next.js puede comunicarse con WordPress
✅ **Protege administradores** - No permite suspender usuarios con rol de Administrador

## 🚀 Instalación Rápida

### Opción 1: Plugin Personalizado (Recomendado)

1. **Crea una carpeta** en tu servidor WordPress:
   ```
   wp-content/plugins/user-suspension-api/
   ```

2. **Sube el archivo** `user-suspension-api.php` a esa carpeta

3. **Activa el plugin** en WordPress:
   - Panel de WordPress → Plugins → Plugins Instalados
   - Busca "User Suspension API"
   - Haz clic en "Activar"

### Opción 2: functions.php (Más Rápido, Menos Seguro)

1. **Abre el editor de temas** en WordPress:
   - Panel de WordPress → Apariencia → Editor de archivos del tema

2. **Selecciona functions.php** en la barra lateral derecha

3. **Al final del archivo**, pega el contenido de `user-suspension-api.php`
   - ⚠️ **NO pegues** las primeras líneas que dicen `<?php`
   - ⚠️ **Haz un respaldo** antes de editar

4. **Guarda el archivo**

## ✅ Verificar Instalación

Después de instalar, verifica que funciona visitando:

```
https://liq.com.mx/wp-json/custom/v1/
```

Deberías ver información sobre las rutas disponibles (o un error 401, que es normal).

## 🔌 Endpoints Disponibles

Una vez instalado, tu panel Next.js usará estos endpoints automáticamente:

- `POST /wp-json/custom/v1/users/{id}/suspend` - Suspender usuario
- `POST /wp-json/custom/v1/users/{id}/unsuspend` - Habilitar usuario
- `GET /wp-json/custom/v1/users/{id}/suspension-status` - Ver estado

## 🛡️ Seguridad

- ✅ Solo usuarios con permisos `edit_users` pueden usar estos endpoints
- ✅ Los administradores NO pueden ser suspendidos
- ✅ Usa la autenticación de WordPress (Application Passwords)
- ✅ Todas las entradas se sanitizan antes de guardar

## 📝 ¿Qué Pasa Cuando Suspendes un Usuario?

1. Se marca como suspendido en WordPress
2. Se cierra su sesión activa inmediatamente
3. Si intenta iniciar sesión, ve el mensaje: "Tu cuenta ha sido suspendida. Razón: [razón]"
4. Se guarda quién lo suspendió y cuándo
5. Tu panel Next.js muestra el estado actualizado

## 🔄 ¿Cómo Habilitar un Usuario Suspendido?

Desde tu panel Next.js, haz clic en el botón "Habilitar" del usuario suspendido. El código automáticamente:

1. Elimina la marca de suspensión
2. El usuario puede volver a iniciar sesión
3. Se registra la acción en el log

## 🆘 Problemas Comunes

### "Error 404" al suspender usuario
**Solución:** El plugin no está instalado. Revisa los pasos de instalación arriba.

### "Error 401 Unauthorized"
**Solución:** Verifica que tu archivo `.env` tiene las credenciales correctas de WordPress:
```
WORDPRESS_API_URL="https://liq.com.mx/wp-json"
WORDPRESS_USERNAME="Paco"
WORDPRESS_APP_PASSWORD="CpIt 8N7C laUL eyvB E2bZ RevS"
```

### "Cannot suspend admin users"
**Solución:** Esto es normal. El código no permite suspender administradores por seguridad.

### El sitio dejó de funcionar después de editar functions.php
**Solución:** Restaura el respaldo de functions.php o usa la Opción 1 (plugin) en su lugar.

## 📞 Soporte

Si tienes problemas con la instalación, verifica:

1. ✅ El archivo está en la carpeta correcta
2. ✅ El plugin está activado (si usaste Opción 1)
3. ✅ Tus credenciales de API son correctas
4. ✅ WordPress está actualizado a la versión más reciente

## 📄 Archivos en Esta Carpeta

- `user-suspension-api.php` - Código principal del plugin
- `INSTALLATION-INSTRUCTIONS.md` - Instrucciones detalladas paso a paso
- `README.md` - Este archivo

---

**¿Listo para probar?** Después de instalar, intenta suspender un usuario desde tu panel Next.js. ¡Debería funcionar de inmediato! 🎉
