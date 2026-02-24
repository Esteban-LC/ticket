import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes (en orden por dependencias)
  await prisma.agendaItem.deleteMany()
  await prisma.resultItem.deleteMany()
  await prisma.event.deleteMany()
  await prisma.message.deleteMany()
  await prisma.interaction.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.category.deleteMany()
  await prisma.adminLog.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.organization.deleteMany()

  console.log('✅ Datos existentes eliminados')

  // Crear organización
  const org = await prisma.organization.create({
    data: {
      name: 'LICEO MICHOACANO',
      domain: 'liceomichoacano.edu.mx',
    },
  })

  // Crear departamentos
  const deptSistemas = await prisma.department.create({
    data: { name: 'SISTEMAS', isAdmin: true, description: 'Departamento de Sistemas y Tecnología' },
  })
  await prisma.department.create({ data: { name: 'DIRECCIÓN', description: 'Dirección General' } })
  await prisma.department.create({ data: { name: 'ADMINISTRACIÓN', description: 'Departamento de Administración' } })
  await prisma.department.create({ data: { name: 'ACADEMIA', description: 'Departamento Académico' } })
  await prisma.department.create({ data: { name: 'CONTABILIDAD', description: 'Departamento de Contabilidad' } })
  await prisma.department.create({ data: { name: 'MEDIOS', description: 'Departamento de Medios y Comunicación' } })
  await prisma.department.create({ data: { name: 'VENTAS', description: 'Departamento de Ventas' } })
  await prisma.department.create({ data: { name: 'COORD LIQ', description: 'Coordinación LIQ' } })

  console.log('✅ Departamentos creados')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  // === USUARIOS REALES ===

  // Coordinador de Sistemas (ADMIN + vista departamental de reportes)
  const computo2 = await prisma.user.create({
    data: {
      email: 'computo2@liceomichoacano.edu.mx',
      name: 'Coordinador de Sistemas',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org.id,
      departmentId: deptSistemas.id,
      emailNotifications: true,
      permissions: ['VIEW_DEPARTMENT_REPORTS'],
    },
  })

  // Técnico 2
  await prisma.user.create({
    data: {
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

  // Técnico 3
  await prisma.user.create({
    data: {
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

  console.log('✅ Usuarios creados (contraseña: admin123)')

  // === AGENDA ITEMS (datos reales de computo2) ===
  await prisma.agendaItem.createMany({
    data: [
      { project: 'Página Web Liceo', subproject: 'Rediseño', deliverable: 'Landing page v2', responsible: 'Coordinador Sistemas', date: '2025-03-15', status: 'En Proceso', observations: 'Falta sección de noticias', userId: computo2.id },
      { project: 'Sistema de Tickets', subproject: 'Dashboard', deliverable: 'Módulo de reportes', responsible: 'Coordinador Sistemas', date: '2025-02-28', status: 'En Proceso', observations: '', userId: computo2.id },
      { project: 'Infraestructura Red', subproject: 'Cableado', deliverable: 'Diagrama de red actualizado', responsible: 'Coordinador Sistemas', date: '2025-01-30', status: 'Completado', observations: 'Entregado a dirección', userId: computo2.id },
      { project: 'Migración Correos', subproject: 'Google Workspace', deliverable: 'Migración de 50 cuentas', responsible: 'Coordinador Sistemas', date: '2025-04-01', status: 'Stand by', observations: 'Esperando aprobación de presupuesto', userId: computo2.id },
    ],
  })

  console.log('✅ Agenda de computo2 creada')

  // === RESULT ITEMS (datos reales de computo2) ===
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

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📊 Resumen:')
  console.log('   - 1 Organización: LICEO MICHOACANO')
  console.log('   - 8 Departamentos')
  console.log('   - 3 Usuarios:')
  console.log('     • computo2 (ADMIN + VIEW_DEPARTMENT_REPORTS)')
  console.log('     • computo3 (ADMIN - Técnico 2)')
  console.log('     • computo4 (ADMIN - Técnico 3)')
  console.log('   - 4 Agenda items (computo2)')
  console.log('   - 7 Result items (computo2)')
  console.log('\n🔑 Contraseña de todos los usuarios: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
