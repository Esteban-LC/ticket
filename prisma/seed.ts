import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
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

  console.log('✅ Organización creada')

  // Crear departamentos
  const deptSistemas = await prisma.department.create({
    data: { name: 'SISTEMAS', isAdmin: true, description: 'Departamento de Sistemas y Tecnología' },
  })
  const deptDireccion = await prisma.department.create({
    data: { name: 'DIRECCIÓN', description: 'Dirección General' },
  })
  const deptAdministracion = await prisma.department.create({
    data: { name: 'ADMINISTRACIÓN', description: 'Departamento de Administración' },
  })
  const deptAcademia = await prisma.department.create({
    data: { name: 'ACADEMIA', description: 'Departamento Académico' },
  })
  const deptContabilidad = await prisma.department.create({
    data: { name: 'CONTABILIDAD', description: 'Departamento de Contabilidad' },
  })
  const deptMedios = await prisma.department.create({
    data: { name: 'MEDIOS', description: 'Departamento de Medios y Comunicación' },
  })
  const deptVentas = await prisma.department.create({
    data: { name: 'VENTAS', description: 'Departamento de Ventas' },
  })
  const deptCoordLiq = await prisma.department.create({
    data: { name: 'COORD LIQ', description: 'Coordinación LIQ' },
  })

  console.log('✅ Departamentos creados')

  // Hash de contraseña
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // === USUARIOS ===

  // Admin principal - Coordinador de Sistemas (tú)
  const admin = await prisma.user.create({
    data: {
      email: 'computo2@liceomichoacano.edu.mx',
      name: 'Coordinador de Sistemas',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+52 443 123 4567',
      location: 'Morelia, Michoacán',
      organizationId: org.id,
      departmentId: deptSistemas.id,
      emailNotifications: true,
      permissions: [],
    },
  })

  // Coordinador de Sistemas (técnico líder)
  const tecnico = await prisma.user.create({
    data: {
      email: 'soporte@liceomichoacano.edu.mx',
      name: 'Luis Hernández',
      password: hashedPassword,
      role: 'COORDINATOR',
      phone: '+52 443 234 5678',
      location: 'Morelia, Michoacán',
      organizationId: org.id,
      departmentId: deptSistemas.id,
    },
  })

  // Dirección
  const direccion = await prisma.user.create({
    data: {
      email: 'direccion@liceomichoacano.edu.mx',
      name: 'Roberto Sánchez',
      password: hashedPassword,
      role: 'COORDINATOR',
      phone: '+52 443 345 6789',
      location: 'Morelia, Michoacán',
      organizationId: org.id,
      departmentId: deptDireccion.id,
    },
  })

  // Administración
  const administracion = await prisma.user.create({
    data: {
      email: 'administracion@liceomichoacano.edu.mx',
      name: 'Patricia Morales',
      password: hashedPassword,
      role: 'EDITOR',
      phone: '+52 443 456 7890',
      organizationId: org.id,
      departmentId: deptAdministracion.id,
    },
  })

  // Academia
  const academia = await prisma.user.create({
    data: {
      email: 'academia@liceomichoacano.edu.mx',
      name: 'María López',
      password: hashedPassword,
      role: 'EDITOR',
      phone: '+52 443 567 8901',
      organizationId: org.id,
      departmentId: deptAcademia.id,
    },
  })

  // Contabilidad
  const contabilidad = await prisma.user.create({
    data: {
      email: 'contabilidad@liceomichoacano.edu.mx',
      name: 'Ana García',
      password: hashedPassword,
      role: 'VIEWER',
      organizationId: org.id,
      departmentId: deptContabilidad.id,
    },
  })

  // Medios
  const medios = await prisma.user.create({
    data: {
      email: 'medios@liceomichoacano.edu.mx',
      name: 'Carlos Ramírez',
      password: hashedPassword,
      role: 'EDITOR',
      organizationId: org.id,
      departmentId: deptMedios.id,
    },
  })

  console.log('✅ Usuarios creados (contraseña: admin123)')

  // Crear categorías
  const catSoporte = await prisma.category.create({
    data: { name: 'Soporte Técnico', email: 'computo2@liceomichoacano.edu.mx' },
  })
  const catAdmin = await prisma.category.create({
    data: { name: 'Administración', email: 'administracion@liceomichoacano.edu.mx' },
  })
  const catInfra = await prisma.category.create({
    data: { name: 'Infraestructura', email: 'computo2@liceomichoacano.edu.mx' },
  })
  const catAcademico = await prisma.category.create({
    data: { name: 'Académico', email: 'academia@liceomichoacano.edu.mx' },
  })

  console.log('✅ Categorías creadas')

  // === TICKETS ===

  // Ticket 1: Academia reporta problema con proyector
  const ticket1 = await prisma.ticket.create({
    data: {
      subject: 'Proyector del aula 12 no enciende',
      description: 'El proyector del aula 12 dejó de funcionar desde el lunes. Los profesores no pueden dar clases con presentaciones.',
      status: 'OPEN',
      priority: 'HIGH',
      type: 'INCIDENT',
      customerId: academia.id,
      assigneeId: tecnico.id,
      categoryId: catSoporte.id,
      organizationId: org.id,
      tags: ['hardware', 'proyector', 'aula'],
    },
  })

  // Ticket 2: Contabilidad necesita acceso a sistema
  const ticket2 = await prisma.ticket.create({
    data: {
      subject: 'Crear correo para nuevo personal de contabilidad',
      description: 'Se incorporó una nueva persona al departamento y necesita su correo institucional.',
      status: 'OPEN',
      priority: 'NORMAL',
      type: 'CHANGE_REQUEST',
      customerId: contabilidad.id,
      assigneeId: admin.id,
      categoryId: catAdmin.id,
      organizationId: org.id,
      tags: ['correo', 'nuevo-usuario', 'workspace'],
    },
  })

  // Ticket 3: Dirección - Internet lento
  const ticket3 = await prisma.ticket.create({
    data: {
      subject: 'Internet muy lento en edificio principal',
      description: 'Desde hace una semana el internet está extremadamente lento en todo el edificio principal. Afecta las operaciones diarias.',
      status: 'PENDING',
      priority: 'URGENT',
      type: 'INCIDENT',
      customerId: direccion.id,
      assigneeId: admin.id,
      categoryId: catInfra.id,
      organizationId: org.id,
      tags: ['internet', 'red', 'urgente'],
      hours: 3,
    },
  })

  // Ticket 4: Medios - Instalación de software
  const ticket4 = await prisma.ticket.create({
    data: {
      subject: 'Instalar Adobe Premiere en sala de edición',
      description: 'Se necesita instalar Adobe Premiere Pro en las 5 computadoras de la sala de edición para el proyecto de video institucional.',
      status: 'OPEN',
      priority: 'NORMAL',
      type: 'PROJECT',
      customerId: medios.id,
      assigneeId: tecnico.id,
      categoryId: catSoporte.id,
      organizationId: org.id,
      tags: ['software', 'instalación', 'adobe'],
    },
  })

  // Ticket 5: Administración - Impresora
  const ticket5 = await prisma.ticket.create({
    data: {
      subject: 'Impresora de administración no imprime',
      description: 'La impresora HP del departamento de administración muestra error de papel atascado pero no hay papel atascado.',
      status: 'SOLVED',
      priority: 'NORMAL',
      type: 'INCIDENT',
      customerId: administracion.id,
      assigneeId: tecnico.id,
      categoryId: catSoporte.id,
      organizationId: org.id,
      tags: ['impresora', 'hardware'],
      hours: 1,
    },
  })

  console.log('✅ Tickets creados')

  // === MENSAJES ===

  await prisma.message.create({
    data: {
      content: 'Voy a pasar a revisarlo mañana a primera hora. ¿A qué hora inician las clases en esa aula?',
      type: 'COMMENT',
      ticketId: ticket1.id,
      authorId: tecnico.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Las clases inician a las 7:30 AM. El profesor García es quien más lo utiliza.',
      type: 'COMMENT',
      ticketId: ticket1.id,
      authorId: academia.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Ya tengo los datos del nuevo personal. Voy a crear el correo hoy.',
      type: 'COMMENT',
      ticketId: ticket2.id,
      authorId: admin.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Revisé el router principal y parece que hay un problema con el ISP. Ya levanté un reporte con ellos.',
      type: 'COMMENT',
      ticketId: ticket3.id,
      authorId: admin.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Contactar al ISP para verificar el contrato de ancho de banda.',
      type: 'NOTE',
      isInternal: true,
      ticketId: ticket3.id,
      authorId: admin.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Se limpió el mecanismo de arrastre de papel y se actualizaron los drivers. La impresora ya funciona correctamente.',
      type: 'COMMENT',
      ticketId: ticket5.id,
      authorId: tecnico.id,
    },
  })

  await prisma.message.create({
    data: {
      content: 'Muchas gracias, ya está imprimiendo bien.',
      type: 'COMMENT',
      ticketId: ticket5.id,
      authorId: administracion.id,
    },
  })

  console.log('✅ Mensajes creados')

  // === EVENTOS ===
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextMonth = new Date(now)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  // Eventos del admin
  await prisma.event.create({
    data: {
      title: 'Mantenimiento de servidores',
      description: 'Mantenimiento preventivo de los servidores principales.',
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
      allDay: false,
      color: '#ef4444',
      type: 'MAINTENANCE',
      status: 'PENDING',
      userId: admin.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Reunión con ISP por internet lento',
      description: 'Seguimiento al reporte de internet lento en edificio principal.',
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      allDay: false,
      color: '#3b82f6',
      type: 'MEETING',
      status: 'PENDING',
      ticketId: ticket3.id,
      userId: admin.id,
    },
  })

  // Eventos del técnico
  await prisma.event.create({
    data: {
      title: 'Revisar proyector aula 12',
      description: 'Diagnóstico del proyector reportado por academia.',
      startDate: tomorrow,
      allDay: false,
      color: '#8b5cf6',
      type: 'TASK',
      status: 'PENDING',
      ticketId: ticket1.id,
      userId: tecnico.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Instalar Adobe Premiere - Sala edición',
      description: 'Instalación de Adobe Premiere en 5 equipos.',
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      allDay: true,
      color: '#06b6d4',
      type: 'TASK',
      status: 'PENDING',
      ticketId: ticket4.id,
      userId: tecnico.id,
    },
  })

  // Evento compartido
  await prisma.event.create({
    data: {
      title: 'Capacitación: Sistema de tickets',
      description: 'Capacitación para todo el personal sobre cómo usar el sistema de tickets.',
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000),
      allDay: false,
      color: '#10b981',
      type: 'MEETING',
      status: 'PENDING',
      userId: admin.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Revisión mensual de infraestructura',
      description: 'Revisión completa de red, servidores y equipos.',
      startDate: nextMonth,
      allDay: true,
      color: '#ec4899',
      type: 'MAINTENANCE',
      status: 'PENDING',
      userId: admin.id,
    },
  })

  console.log('✅ Eventos creados')

  // === AGENDA ITEMS (por usuario) ===

  // Agenda del admin (Coordinador Sistemas)
  await prisma.agendaItem.createMany({
    data: [
      { project: 'Página Web Liceo', subproject: 'Rediseño', deliverable: 'Landing page v2', responsible: 'Coordinador Sistemas', date: '2025-03-15', status: 'En Proceso', observations: 'Falta sección de noticias', userId: admin.id },
      { project: 'Sistema de Tickets', subproject: 'Dashboard', deliverable: 'Módulo de reportes', responsible: 'Coordinador Sistemas', date: '2025-02-28', status: 'En Proceso', observations: '', userId: admin.id },
      { project: 'Infraestructura Red', subproject: 'Cableado', deliverable: 'Diagrama de red actualizado', responsible: 'Coordinador Sistemas', date: '2025-01-30', status: 'Completado', observations: 'Entregado a dirección', userId: admin.id },
      { project: 'Migración Correos', subproject: 'Google Workspace', deliverable: 'Migración de 50 cuentas', responsible: 'Coordinador Sistemas', date: '2025-04-01', status: 'Stand by', observations: 'Esperando aprobación de presupuesto', userId: admin.id },
    ],
  })

  // Agenda del técnico
  await prisma.agendaItem.createMany({
    data: [
      { project: 'Mantenimiento Equipos', subproject: 'Laboratorio 1', deliverable: 'Limpieza y actualización de 20 PCs', responsible: 'Luis Hernández', date: '2025-02-20', status: 'En Proceso', observations: 'Faltan 8 equipos', userId: tecnico.id },
      { project: 'Instalación Adobe', subproject: 'Sala Edición', deliverable: 'Adobe Premiere en 5 equipos', responsible: 'Luis Hernández', date: '2025-03-01', status: 'Stand by', observations: 'Licencias pendientes', userId: tecnico.id },
      { project: 'Inventario', subproject: 'Equipos de cómputo', deliverable: 'Lista actualizada de equipos', responsible: 'Luis Hernández', date: '2025-02-15', status: 'Completado', observations: '', userId: tecnico.id },
    ],
  })

  // Agenda de Dirección
  await prisma.agendaItem.createMany({
    data: [
      { project: 'Plan Estratégico 2025', subproject: 'Tecnología', deliverable: 'Propuesta de digitalización', responsible: 'Roberto Sánchez', date: '2025-03-30', status: 'En Proceso', observations: '', userId: direccion.id },
      { project: 'Presupuesto TI', subproject: 'Aprobación', deliverable: 'Documento de presupuesto', responsible: 'Roberto Sánchez', date: '2025-02-28', status: 'Stand by', observations: 'En revisión con contabilidad', userId: direccion.id },
    ],
  })

  // Agenda de Academia
  await prisma.agendaItem.createMany({
    data: [
      { project: 'Plataforma Virtual', subproject: 'Capacitación', deliverable: 'Manual de uso para profesores', responsible: 'María López', date: '2025-03-15', status: 'En Proceso', observations: '', userId: academia.id },
      { project: 'Evaluaciones en Línea', subproject: 'Piloto', deliverable: 'Sistema de exámenes', responsible: 'María López', date: '2025-04-01', status: 'Stand by', observations: 'Depende de plataforma virtual', userId: academia.id },
    ],
  })

  console.log('✅ Agenda items creados')

  // === RESULT ITEMS (por usuario) ===

  // Resultados del admin
  await prisma.resultItem.createMany({
    data: [
      { project: 'Liceo Michoacano - Página Web', description: 'Se tiene pensado entregar una página web completa con varias secciones', status: 'En proceso', observations: 'Por ahora hay una landing page funcional', userId: admin.id },
      { project: 'Biometricos Liceo', description: 'Sistema para capturar huellas y convertirlas a formato requerido de la UNAM', status: 'Completado', observations: '', userId: admin.id },
      { project: 'Sistema Capturador de Firmas', description: 'Página para capturar firmas en un entorno local', status: 'Completado', observations: 'Falta dispositivo designado para captura', userId: admin.id },
      { project: 'Software de creación de etiquetas', description: 'Programa que genera etiquetas en PDF con la información especificada', status: 'Entregado', observations: '', userId: admin.id },
      { project: 'Generador de imágenes bienvenida', description: 'Página que permite generar imágenes con los datos de los nuevos cursistas', status: 'Entregado', observations: '', userId: admin.id },
      { project: 'Dashboard administrativo', description: 'Dashboard donde se centraliza datos de información de citas, formularios y analíticas', status: 'En proceso', observations: '', userId: admin.id },
      { project: 'Generador de Links Material LIQ', description: 'Página que permite generar un enlace funcional para introducirlo como material', status: 'Entregado', observations: '', userId: admin.id },
    ],
  })

  // Resultados del técnico
  await prisma.resultItem.createMany({
    data: [
      { project: 'Mantenimiento preventivo semestral', description: 'Limpieza y actualización de todos los equipos de cómputo del Liceo', status: 'En proceso', observations: 'Faltan laboratorios 2 y 3', userId: tecnico.id },
      { project: 'Inventario de equipos', description: 'Registro actualizado de todos los equipos de cómputo con sus especificaciones', status: 'Completado', observations: '', userId: tecnico.id },
      { project: 'Configuración de red WiFi', description: 'Instalación y configuración de puntos de acceso nuevos', status: 'Entregado', observations: 'Se instalaron 5 access points', userId: tecnico.id },
    ],
  })

  // Resultados de Dirección
  await prisma.resultItem.createMany({
    data: [
      { project: 'Plan de digitalización', description: 'Documento estratégico para la transformación digital del Liceo', status: 'En proceso', observations: 'En revisión con departamentos', userId: direccion.id },
      { project: 'Informe de gestión TI', description: 'Informe semestral de actividades del área de tecnología', status: 'Pausado', observations: 'Esperando datos de contabilidad', userId: direccion.id },
    ],
  })

  // Resultados de Academia
  await prisma.resultItem.createMany({
    data: [
      { project: 'Manual de plataforma virtual', description: 'Guía paso a paso para profesores sobre el uso de la plataforma educativa', status: 'En proceso', observations: '', userId: academia.id },
      { project: 'Banco de exámenes digitales', description: 'Repositorio de exámenes para aplicación en línea', status: 'Pausado', observations: 'Depende de la plataforma virtual', userId: academia.id },
    ],
  })

  // Resultados de Medios
  await prisma.resultItem.createMany({
    data: [
      { project: 'Video institucional 2025', description: 'Producción del video promocional del Liceo', status: 'En proceso', observations: 'Grabación completada, en edición', userId: medios.id },
      { project: 'Rediseño redes sociales', description: 'Nueva imagen y estrategia de contenido para redes del Liceo', status: 'Entregado', observations: '', userId: medios.id },
    ],
  })

  console.log('✅ Result items creados')

  // Crear interacciones
  await prisma.interaction.create({
    data: {
      type: 'CONVERSATION',
      title: 'Reporte de proyector',
      description: 'Academia reportó falla en proyector del aula 12',
      userId: academia.id,
      ticketId: ticket1.id,
    },
  })

  console.log('✅ Interacciones creadas')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📊 Resumen:')
  console.log('   - 1 Organización: LICEO MICHOACANO')
  console.log('   - 8 Departamentos')
  console.log('   - 7 Usuarios:')
  console.log('     • 1 ADMIN (Coordinador Sistemas)')
  console.log('     • 2 COORDINATOR (Técnico Sistemas, Dirección)')
  console.log('     • 3 EDITOR (Administración, Academia, Medios)')
  console.log('     • 1 VIEWER (Contabilidad)')
  console.log('   - 4 Categorías')
  console.log('   - 5 Tickets')
  console.log('   - 7 Mensajes')
  console.log('   - 6 Eventos')
  console.log('   - 11 Agenda Items (por usuario)')
  console.log('   - 14 Result Items (por usuario)')
  console.log('\n🔑 Credenciales de acceso:')
  console.log('   Admin:    computo2@liceomichoacano.edu.mx / admin123')
  console.log('   Técnico:  soporte@liceomichoacano.edu.mx / admin123')
  console.log('   Dirección: direccion@liceomichoacano.edu.mx / admin123')
  console.log('   Academia: academia@liceomichoacano.edu.mx / admin123')
  console.log('   Contab:   contabilidad@liceomichoacano.edu.mx / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
