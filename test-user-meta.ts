/**
 * Script para investigar los meta campos de usuarios
 * Esto nos ayudará a identificar cómo el plugin marca usuarios deshabilitados
 */

import 'dotenv/config'
import { wpClient } from './lib/wordpress/client'

async function testUserMeta() {
  console.log('🔍 Investigando meta campos de usuarios...\n')

  try {
    // Obtener algunos usuarios con contexto 'edit' para ver todos los campos
    console.log('1️⃣  Obteniendo usuarios con todos los campos...')
    const users = await wpClient.get<any[]>('/wp/v2/users', {
      per_page: 5,
      context: 'edit'
    })

    console.log(`✅ Usuarios obtenidos: ${users.length}\n`)

    users.forEach((user, index) => {
      console.log(`\n--- Usuario ${index + 1}: ${user.name} (${user.email}) ---`)
      console.log(`ID: ${user.id}`)
      console.log(`Username: ${user.username}`)
      console.log(`Roles: ${user.roles ? user.roles.join(', ') : 'N/A'}`)

      // Mostrar todos los meta datos
      if (user.meta && Object.keys(user.meta).length > 0) {
        console.log('\nMeta datos:')
        Object.entries(user.meta).forEach(([key, value]) => {
          console.log(`  - ${key}: ${JSON.stringify(value)}`)
        })
      } else {
        console.log('\nNo hay meta datos visibles en la API REST')
      }

      // Mostrar capabilities si existen
      if (user.capabilities) {
        console.log('\nCapabilities:')
        Object.entries(user.capabilities).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`)
        })
      }

      console.log('---')
    })

    console.log('\n\n2️⃣  Buscando campos relacionados con "disable", "login", "active", "suspended"...')

    const firstUser = users[0]
    const allFields = Object.keys(firstUser)
    console.log('\nTodos los campos disponibles en el usuario:')
    allFields.forEach(field => {
      console.log(`  - ${field}`)
    })

    console.log('\n\n💡 IMPORTANTE:')
    console.log('Si el plugin "Disable User Login" está activo, busca en los campos anteriores:')
    console.log('  - Campos que contengan "disable", "login", "active", "suspended"')
    console.log('  - Meta campos personalizados')
    console.log('  - Capabilities especiales')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testUserMeta()
