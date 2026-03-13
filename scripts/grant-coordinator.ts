/**
 * Script de uso único para otorgar el permiso tickets:coordinator a computo2.
 * Ejecutar con: npx ts-node scripts/grant-coordinator.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'computo2@liceomichoacano.edu.mx'

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, name: true, permissions: true },
  })

  if (!user) {
    console.error(`No se encontró el usuario con email: ${email}`)
    process.exit(1)
  }

  if (user.permissions.includes('tickets:coordinator')) {
    console.log(`${user.name} ya tiene el permiso tickets:coordinator`)
    process.exit(0)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { permissions: { push: 'tickets:coordinator' } },
  })

  console.log(`✓ Permiso tickets:coordinator otorgado a ${user.name} (${email})`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
