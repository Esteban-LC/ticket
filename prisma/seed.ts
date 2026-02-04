import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.event.deleteMany()
  await prisma.message.deleteMany()
  await prisma.interaction.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.category.deleteMany()
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

  console.log('✅ Organización creada')

  // Crear departamentos
  const departamentos = await Promise.all([
    prisma.department.create({
      data: {
        name: 'SISTEMAS',
        isAdmin: true,
        description: 'Departamento de Sistemas - Control total del panel',
      },
    }),
    prisma.department.create({
      data: {
        name: 'ACADEMIA',
        description: 'Departamento Académico',
      },
    }),
    prisma.department.create({
      data: {
        name: 'CONTABILIDAD',
        description: 'Departamento de Contabilidad',
      },
    }),
    prisma.department.create({
      data: {
        name: 'COORD LIQ',
        description: 'Coordinación LIQ',
      },
    }),
    prisma.department.create({
      data: {
        name: 'MEDIOS',
        description: 'Departamento de Medios',
      },
    }),
    prisma.department.create({
      data: {
        name: 'VENTAS',
        description: 'Departamento de Ventas',
      },
    }),
    prisma.department.create({
      data: {
        name: 'AUXILIAR',
        description: 'Personal Auxiliar',
      },
    }),
  ])

  console.log('✅ Departamentos creados')

  // Hash de contraseña
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Crear usuarios con departamentos
  const admin = await prisma.user.create({
    data: {
      email: 'admin@liceomichoacano.edu.mx',
      name: 'Administrador Principal',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+52 443 123 4567',
      location: 'Morelia, Michoacán',
      organizationId: org.id,
      departmentId: departamentos[0].id, // SISTEMAS
      emailNotifications: true,
    },
  })

  const agent1 = await prisma.user.create({
    data: {
      email: 'soporte@liceomichoacano.edu.mx',
      name: 'Carlos Ramírez',
      password: hashedPassword,
      role: 'AGENT',
      phone: '+52 443 234 5678',
      location: 'Morelia, Michoacán',
      organizationId: org.id,
      departmentId: departamentos[4].id, // MEDIOS
    },
  })

  const agent2 = await prisma.user.create({
    data: {
      email: 'maria.lopez@liceomichoacano.edu.mx',
      name: 'María López',
      password: hashedPassword,
      role: 'AGENT',
      phone: '+52 443 345 6789',
      location: 'Morelia, Michoacán',
      organizationId: org.id,
      departmentId: departamentos[1].id, // ACADEMIA
    },
  })

  const customer1 = await prisma.user.create({
    data: {
      email: 'juan.perez@estudiante.edu.mx',
      name: 'Juan Pérez',
      password: hashedPassword,
      role: 'CUSTOMER',
      phone: '+52 443 456 7890',
      organizationId: org.id,
      departmentId: departamentos[6].id, // AUXILIAR
    },
  })

  const customer2 = await prisma.user.create({
    data: {
      email: 'ana.garcia@estudiante.edu.mx',
      name: 'Ana García',
      password: hashedPassword,
      role: 'CUSTOMER',
      phone: '+52 443 567 8901',
      organizationId: org.id,
      departmentId: departamentos[2].id, // CONTABILIDAD
    },
  })

  const customer3 = await prisma.user.create({
    data: {
      email: 'pedro.martinez@estudiante.edu.mx',
      name: 'Pedro Martínez',
      password: hashedPassword,
      role: 'CUSTOMER',
      phone: '+52 443 678 9012',
      organizationId: org.id,
    },
  })

  console.log('✅ Usuarios creados (contraseña: admin123)')

  // Crear categorías
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Soporte Técnico',
        email: 'soporte@liceomichoacano.edu.mx',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Administración',
        email: 'admin@liceomichoacano.edu.mx',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Infraestructura',
        email: 'infraestructura@liceomichoacano.edu.mx',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Académico',
        email: 'academico@liceomichoacano.edu.mx',
      },
    }),
  ])

  console.log('✅ Categorías creadas')

  // Crear tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      subject: 'Problema con acceso a plataforma educativa',
      description: 'No puedo acceder a la plataforma de tareas. Me aparece un error de autenticación.',
      status: 'OPEN',
      priority: 'HIGH',
      type: 'INCIDENT',
      customerId: customer1.id,
      assigneeId: agent1.id,
      categoryId: categories[0].id,
      organizationId: org.id,
      tags: ['plataforma', 'acceso', 'urgente'],
    },
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      subject: 'Solicitud de cambio de horario',
      description: 'Necesito cambiar mi horario de clases debido a un conflicto con otra actividad.',
      status: 'PENDING',
      priority: 'NORMAL',
      type: 'CHANGE_REQUEST',
      customerId: customer2.id,
      assigneeId: agent2.id,
      categoryId: categories[3].id,
      organizationId: org.id,
      tags: ['horario', 'académico'],
    },
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      subject: 'Mantenimiento de laboratorio de computación',
      description: 'Varias computadoras del laboratorio 3 no encienden correctamente.',
      status: 'OPEN',
      priority: 'URGENT',
      type: 'INCIDENT',
      customerId: customer3.id,
      assigneeId: agent1.id,
      categoryId: categories[2].id,
      organizationId: org.id,
      tags: ['laboratorio', 'hardware', 'mantenimiento'],
      hours: 4.5,
    },
  })

  const ticket4 = await prisma.ticket.create({
    data: {
      subject: 'Actualización de datos personales',
      description: 'Necesito actualizar mi dirección y número de teléfono en el sistema.',
      status: 'SOLVED',
      priority: 'LOW',
      type: 'CHANGE_REQUEST',
      customerId: customer1.id,
      assigneeId: agent2.id,
      categoryId: categories[1].id,
      organizationId: org.id,
      tags: ['datos', 'perfil'],
    },
  })

  const ticket5 = await prisma.ticket.create({
    data: {
      subject: 'Instalación de software especializado',
      description: 'Requiero la instalación de AutoCAD en el laboratorio de diseño.',
      status: 'OPEN',
      priority: 'NORMAL',
      type: 'PROJECT',
      customerId: customer2.id,
      categoryId: categories[0].id,
      organizationId: org.id,
      tags: ['software', 'instalación', 'laboratorio'],
    },
  })

  console.log('✅ Tickets creados')

  // Crear mensajes
  await prisma.message.create({
    data: {
      content: 'Hola, he revisado tu caso y estoy trabajando en solucionarlo. ¿Podrías proporcionarme tu nombre de usuario?',
      type: 'COMMENT',
      ticketId: ticket1.id,
      authorId: agent1.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Mi usuario es juan.perez',
      type: 'COMMENT',
      ticketId: ticket1.id,
      authorId: customer1.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Perfecto, he restablecido tu contraseña. Deberías recibir un correo con las instrucciones.',
      type: 'COMMENT',
      ticketId: ticket1.id,
      authorId: agent1.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Verificar con el departamento de sistemas antes de proceder.',
      type: 'NOTE',
      isInternal: true,
      ticketId: ticket1.id,
      authorId: agent1.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Tu solicitud ha sido aprobada. El cambio se hará efectivo la próxima semana.',
      type: 'COMMENT',
      ticketId: ticket2.id,
      authorId: agent2.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Hemos identificado el problema. Se requiere reemplazar 3 fuentes de poder. Estimado de reparación: 2 días.',
      type: 'COMMENT',
      ticketId: ticket3.id,
      authorId: agent1.id,
    },
  })

  console.log('✅ Mensajes creados')

  // Crear eventos de cronograma
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const nextMonth = new Date(now)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  await prisma.event.create({
    data: {
      title: 'Mantenimiento programado de servidores',
      description: 'Mantenimiento preventivo de los servidores principales. El sistema estará fuera de línea de 2:00 AM a 6:00 AM.',
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000), // 4 horas después
      allDay: false,
      color: '#ef4444',
      type: 'MAINTENANCE',
      status: 'PENDING',
      userId: agent1.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Reunión de revisión de tickets',
      description: 'Reunión semanal del equipo de soporte para revisar tickets pendientes y prioridades.',
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // En 2 días
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hora después
      allDay: false,
      color: '#3b82f6',
      type: 'MEETING',
      status: 'PENDING',
      userId: admin.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Completar instalación de AutoCAD',
      description: 'Finalizar la instalación y configuración de AutoCAD en el laboratorio de diseño.',
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      allDay: true,
      color: '#8b5cf6',
      type: 'TASK',
      status: 'IN_PROGRESS',
      ticketId: ticket5.id,
      userId: agent1.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Deadline: Reparación de laboratorio',
      description: 'Fecha límite para completar la reparación de las computadoras del laboratorio 3.',
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      allDay: true,
      color: '#f59e0b',
      type: 'DEADLINE',
      status: 'PENDING',
      ticketId: ticket3.id,
      userId: agent1.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Recordatorio: Actualizar documentación',
      description: 'Actualizar la documentación de procedimientos de soporte técnico.',
      startDate: nextWeek,
      allDay: true,
      color: '#10b981',
      type: 'REMINDER',
      status: 'PENDING',
      userId: agent2.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Capacitación: Nuevo sistema de tickets',
      description: 'Sesión de capacitación para el personal sobre el uso del nuevo sistema de gestión de tickets.',
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000), // 2 horas
      allDay: false,
      color: '#06b6d4',
      type: 'MEETING',
      status: 'PENDING',
      userId: admin.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Revisión mensual de infraestructura',
      description: 'Revisión completa de la infraestructura de red y servidores.',
      startDate: nextMonth,
      allDay: true,
      color: '#ec4899',
      type: 'MAINTENANCE',
      status: 'PENDING',
      userId: agent1.id,
    },
  })

  console.log('✅ Eventos de cronograma creados')

  // Crear interacciones
  await prisma.interaction.create({
    data: {
      type: 'CONVERSATION',
      title: 'Conversación iniciada',
      description: 'El usuario inició una conversación sobre problemas de acceso',
      userId: customer1.id,
      ticketId: ticket1.id,
    },
  })

  console.log('✅ Interacciones creadas')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📊 Resumen:')
  console.log(`   - 1 Organización`)
  console.log(`   - 6 Usuarios (1 Admin, 2 Agentes, 3 Clientes)`)
  console.log(`   - 4 Categorías`)
  console.log(`   - 5 Tickets`)
  console.log(`   - 6 Mensajes`)
  console.log(`   - 7 Eventos de cronograma`)
  console.log(`   - 1 Interacción`)
  console.log('\n🔑 Credenciales de acceso:')
  console.log('   Admin: admin@liceomichoacano.edu.mx / admin123')
  console.log('   Agente: soporte@liceomichoacano.edu.mx / admin123')
  console.log('   Cliente: juan.perez@estudiante.edu.mx / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
