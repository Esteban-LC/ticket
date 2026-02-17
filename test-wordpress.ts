/**
 * Script de prueba para verificar la conexión con WordPress
 * Ejecutar con: npx tsx test-wordpress.ts
 */

import 'dotenv/config'
import { wpUserService } from './lib/wordpress/users'
import { tutorLMSService } from './lib/wordpress/tutor-lms'
import { wooCommerceService } from './lib/wordpress/woocommerce'

async function testWordPressConnection() {
  console.log('🔍 Probando conexión con WordPress...\n')

  try {
    // Test 1: Obtener usuario actual
    console.log('1️⃣  Probando autenticación...')
    const currentUser = await wpUserService.getCurrentUser()
    console.log('✅ Autenticación exitosa!')
    console.log(`   Usuario: ${currentUser.name} (${currentUser.email})`)
    console.log(`   Roles: ${currentUser.roles ? currentUser.roles.join(', ') : 'N/A'}\n`)

    // Test 2: Obtener usuarios
    console.log('2️⃣  Obteniendo lista de usuarios...')
    const users = await wpUserService.getUsers({ per_page: 5 })
    console.log(`✅ Usuarios obtenidos: ${users.length}`)
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.roles ? user.roles.join(', ') : 'N/A'}`)
    })
    console.log('')

    // Test 3: Obtener cursos
    console.log('3️⃣  Obteniendo lista de cursos de Tutor LMS...')
    try {
      const courses = await tutorLMSService.getCourses({ per_page: 5 })
      console.log(`✅ Cursos obtenidos: ${courses.length}`)
      courses.forEach(course => {
        console.log(`   - ${course.title.rendered}`)
      })
    } catch (error: any) {
      console.log(`⚠️  Error al obtener cursos: ${error.message}`)
      console.log('   (Esto puede ser normal si no hay cursos publicados)')
    }
    console.log('')

    // Test 4: Obtener pedidos de WooCommerce
    console.log('4️⃣  Obteniendo pedidos de WooCommerce...')
    try {
      const orders = await wooCommerceService.getOrders({ per_page: 5 })
      console.log(`✅ Pedidos obtenidos: ${orders.length}`)
      orders.forEach(order => {
        console.log(`   - Pedido #${order.number} - ${order.status} - $${order.total}`)
      })
    } catch (error: any) {
      console.log(`⚠️  Error al obtener pedidos: ${error.message}`)
      console.log('   (Esto puede ser normal si no hay pedidos)')
    }
    console.log('')

    console.log('✨ ¡Todas las pruebas completadas!\n')
  } catch (error: any) {
    console.error('❌ Error durante las pruebas:', error.message)
    console.error('Detalles:', error)
  }
}

testWordPressConnection()
