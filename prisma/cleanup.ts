import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const KEEP_EMAILS = [
  'computo2@liceomichoacano.edu.mx',
  'computo3@liceomichoacano.edu.mx',
  'computo4@liceomichoacano.edu.mx',
]

async function main() {
  console.log('🧹 Iniciando limpieza de base de datos...\n')

  // 1. Borrar datos de ejemplo (tickets y todo lo relacionado)
  const deletedMessages = await prisma.message.deleteMany()
  const deletedInteractions = await prisma.interaction.deleteMany()
  const deletedEvents = await prisma.event.deleteMany()
  const deletedTickets = await prisma.ticket.deleteMany()
  const deletedCategories = await prisma.category.deleteMany()
  console.log(`✅ Eliminados: ${deletedTickets.count} tickets, ${deletedMessages.count} mensajes, ${deletedEvents.count} eventos, ${deletedInteractions.count} interacciones, ${deletedCategories.count} categorías`)

  // 2. Encontrar usuarios a eliminar (todos excepto computo2/3/4)
  const usersToDelete = await prisma.user.findMany({
    where: { email: { notIn: KEEP_EMAILS } },
    select: { id: true, email: true },
  })

  if (usersToDelete.length > 0) {
    const ids = usersToDelete.map(u => u.id)
    await prisma.adminLog.deleteMany({ where: { adminId: { in: ids } } })
    await prisma.agendaItem.deleteMany({ where: { userId: { in: ids } } })
    await prisma.resultItem.deleteMany({ where: { userId: { in: ids } } })
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
    console.log(`✅ Eliminados ${usersToDelete.length} usuarios de ejemplo: ${usersToDelete.map(u => u.email).join(', ')}`)
  } else {
    console.log('ℹ️  No hay usuarios de ejemplo para eliminar')
  }

  // 3. Obtener organización y departamento SISTEMAS
  const org = await prisma.organization.findFirst()
  const deptSistemas = await prisma.department.findFirst({ where: { name: 'SISTEMAS' } })

  if (!org) {
    console.error('❌ No se encontró organización. Corre el seed primero.')
    process.exit(1)
  }
  if (!deptSistemas) {
    console.error('❌ No se encontró departamento SISTEMAS. Corre el seed primero.')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 4. Crear computo3 y computo4 si no existen
  const computo3 = await prisma.user.upsert({
    where: { email: 'computo3@liceomichoacano.edu.mx' },
    update: {},
    create: {
      email: 'computo3@liceomichoacano.edu.mx',
      name: 'Técnico Sistemas 2',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org.id,
      departmentId: deptSistemas.id,
      emailNotifications: true,
      permissions: [],
    },
  })

  const computo4 = await prisma.user.upsert({
    where: { email: 'computo4@liceomichoacano.edu.mx' },
    update: {},
    create: {
      email: 'computo4@liceomichoacano.edu.mx',
      name: 'Técnico Sistemas 3',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org.id,
      departmentId: deptSistemas.id,
      emailNotifications: true,
      permissions: [],
    },
  })
  console.log(`✅ computo3 y computo4 verificados/creados`)

  // 5. Asegurar que computo2 tenga el permiso VIEW_DEPARTMENT_REPORTS
  await prisma.user.update({
    where: { email: 'computo2@liceomichoacano.edu.mx' },
    data: {
      permissions: { set: ['VIEW_DEPARTMENT_REPORTS'] },
    },
  }).catch(() => null) // Si no existe aún, ignorar

  // 6. Verificar agenda y resultados de computo2 (datos reales)
  const computo2 = await prisma.user.findUnique({ where: { email: 'computo2@liceomichoacano.edu.mx' } })

  if (computo2) {
    const agendaCount = await prisma.agendaItem.count({ where: { userId: computo2.id } })
    const resultCount = await prisma.resultItem.count({ where: { userId: computo2.id } })

    // Si no tiene datos de agenda, crearlos
    if (agendaCount === 0) {
      await prisma.agendaItem.createMany({
        data: [
          { project: 'Página Web Liceo', subproject: 'Rediseño', deliverable: 'Landing page v2', responsible: 'Coordinador Sistemas', date: '2025-03-15', status: 'En Proceso', observations: 'Falta sección de noticias', userId: computo2.id },
          { project: 'Sistema de Tickets', subproject: 'Dashboard', deliverable: 'Módulo de reportes', responsible: 'Coordinador Sistemas', date: '2025-02-28', status: 'En Proceso', observations: '', userId: computo2.id },
          { project: 'Infraestructura Red', subproject: 'Cableado', deliverable: 'Diagrama de red actualizado', responsible: 'Coordinador Sistemas', date: '2025-01-30', status: 'Completado', observations: 'Entregado a dirección', userId: computo2.id },
          { project: 'Migración Correos', subproject: 'Google Workspace', deliverable: 'Migración de 50 cuentas', responsible: 'Coordinador Sistemas', date: '2025-04-01', status: 'Stand by', observations: 'Esperando aprobación de presupuesto', userId: computo2.id },
        ],
      })
      console.log('✅ Agenda de computo2 creada')
    } else {
      console.log(`ℹ️  computo2 ya tiene ${agendaCount} items en agenda (conservados)`)
    }

    // Si no tiene resultados, crearlos
    if (resultCount === 0) {
      await prisma.resultItem.createMany({
        data: [
          { project: 'Liceo Michoacano - Página Web', description: 'Se tiene pensado entregar una página web completa con varias secciones', status: 'En proceso', observations: 'Por ahora hay una landing page funcional', userId: computo2.id },
          { project: 'Biometricos Liceo', description: 'Sistema para capturar huellas y convertirlas a formato requerido de la UNAM', status: 'Completado', observations: '', userId: computo2.id },
          { project: 'Sistema Capturador de Firmas', description: 'Página para capturar firmas en un entorno local', status: 'Completado', observations: 'Falta dispositivo designado para captura', userId: computo2.id },
          { project: 'Software de creación de etiquetas', description: 'Programa que genera etiquetas en PDF con la información especificada', status: 'Entregado', observations: '', userId: computo2.id },
          { project: 'Generador de imágenes bienvenida', description: 'Página que permite generar imágenes con los datos de los nuevos cursistas', status: 'Entregado', observations: '', userId: computo2.id },
          { project: 'Dashboard administrativo', description: 'Dashboard donde se centraliza datos de información de citas, formularios y analíticas', status: 'En proceso', observations: '', userId: computo2.id },
          { project: 'Generador de Links Material LIQ', description: 'Página que permite generar un enlace funcional para introducirlo como material', status: 'Entregado', observations: '', userId: computo2.id },
        ],
      })
      console.log('✅ Resultados de computo2 creados')
    } else {
      console.log(`ℹ️  computo2 ya tiene ${resultCount} resultados (conservados)`)
    }
  }

  // 6. Resumen final
  const finalUsers = await prisma.user.findMany({ select: { email: true, role: true, name: true } })
  const finalAgenda = await prisma.agendaItem.count()
  const finalResults = await prisma.resultItem.count()

  console.log('\n📊 Estado final de la base de datos:')
  console.log('   Usuarios activos:')
  finalUsers.forEach(u => console.log(`   • ${u.email} (${u.role}) - ${u.name}`))
  console.log(`   Agenda items: ${finalAgenda}`)
  console.log(`   Resultados: ${finalResults}`)
  console.log(`   Tickets: 0`)
  console.log('\n🎉 Limpieza completada exitosamente!')
  console.log('\n🔑 Contraseña de acceso (todos): admin123')
}

main()
  .catch(e => {
    console.error('❌ Error durante la limpieza:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
