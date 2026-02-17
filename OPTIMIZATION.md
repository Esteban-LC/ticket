# Guía de Optimización - Tickets LICEO MICHOACANO

## ✅ Optimizaciones Aplicadas

### 1. **Configuración de Next.js** (`next.config.js`)
- ✅ Optimización de imágenes con formatos AVIF y WebP
- ✅ Compresión habilitada
- ✅ Minificación con SWC
- ✅ Eliminación de console.log en producción
- ✅ Importaciones optimizadas para lucide-react y date-fns
- ✅ Tree-shaking mejorado para íconos

### 2. **Middleware de Cache** (`middleware.ts`)
- ✅ Headers de seguridad (X-Frame-Options, X-Content-Type-Options)
- ✅ Cache inmutable para assets estáticos (1 año)
- ✅ Cache con revalidación para API (10s + stale-while-revalidate)
- ✅ DNS prefetch habilitado

### 3. **Optimización de Fuentes** (`app/layout.tsx`)
- ✅ Font display: swap para evitar FOIT (Flash of Invisible Text)
- ✅ Preload de fuentes
- ✅ Variables CSS para fuentes

### 4. **Scripts Adicionales** (`package.json`)
- ✅ `build:analyze` - Analizar tamaño del bundle
- ✅ `start:prod` - Iniciar en modo producción

---

## 🚀 Recomendaciones para Compartir por IP

### 1. **Build de Producción**
```bash
# Generar el build optimizado
npm run build

# Iniciar el servidor en producción
npm run start:prod
```

### 2. **Configurar la IP en .env.local**
```env
# Reemplaza TU_IP con tu IP local (ej: 192.168.1.100)
NEXTAUTH_URL="http://TU_IP:3000"
```

### 3. **Abrir puerto en firewall**
```bash
# Windows - Abrir PowerShell como administrador
netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000

# Verificar que tu IP esté accesible
ipconfig
```

---

## 📊 Optimizaciones Adicionales Recomendadas

### 1. **Base de Datos**
```prisma
// Asegúrate de tener índices en campos frecuentemente consultados
// En schema.prisma:

model Ticket {
  // ...
  @@index([status])
  @@index([customerId])
  @@index([assigneeId])
  @@index([updatedAt])
}

model User {
  // ...
  @@index([email])
  @@index([role])
}
```

### 2. **Paginación Eficiente**
Para tablas grandes, usa cursor-based pagination:
```typescript
// Ejemplo: en lugar de skip/take
const tickets = await prisma.ticket.findMany({
  take: 20,
  cursor: lastTicketId ? { id: lastTicketId } : undefined,
  orderBy: { createdAt: 'desc' }
})
```

### 3. **React Query / SWR (Opcional)**
Considera implementar cache en el cliente:
```bash
npm install @tanstack/react-query
```

### 4. **Imágenes Optimizadas**
Asegúrate de usar el componente Image de Next.js:
```tsx
import Image from 'next/image'

<Image
  src="/img/logo.png"
  width={200}
  height={200}
  alt="Logo"
  priority // Para imágenes above-the-fold
/>
```

### 5. **Lazy Loading de Componentes Grandes**
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Cargando...</p>,
  ssr: false // Si no necesitas SSR
})
```

---

## 🔍 Análisis de Performance

### Herramientas Recomendadas:

1. **Lighthouse** (Chrome DevTools)
   - F12 → Lighthouse → Analizar página

2. **Next.js Bundle Analyzer**
   ```bash
   npm run build:analyze
   ```

3. **Prisma Query Analysis**
   ```typescript
   // Habilita logging en development
   const prisma = new PrismaClient({
     log: ['query', 'info', 'warn', 'error'],
   })
   ```

---

## 📝 Checklist antes de Compartir

- [ ] `npm run build` exitoso
- [ ] Variables de entorno configuradas (especialmente NEXTAUTH_URL)
- [ ] Base de datos accesible desde la red
- [ ] Puerto 3000 abierto en firewall
- [ ] IP configurada en next-auth
- [ ] Prisma migrations aplicadas
- [ ] Assets optimizados (imágenes comprimidas)

---

## 🐛 Troubleshooting

### "Sesión no válida" al acceder por IP
```env
# En .env.local
NEXTAUTH_URL="http://192.168.1.XXX:3000"
```

### Lentitud en queries
```bash
# Verifica las queries en logs
npm run prisma:studio
```

### Bundle muy grande
```bash
npm run build:analyze
# Revisa qué paquetes ocupan más espacio
```

---

## 🎯 Performance Goals

- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **TBT** (Total Blocking Time): < 200ms
- **CLS** (Cumulative Layout Shift): < 0.1

---

## 📚 Recursos Adicionales

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Web Vitals](https://web.dev/vitals/)
