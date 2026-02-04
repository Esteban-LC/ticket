import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import CreateUserForm from '@/components/users/CreateUserForm'

export default async function NewUserPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Obtener usuario completo con su rol
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
    select: { id: true, name: true, email: true, role: true }
  })

  if (!user) {
    redirect('/login')
  }

  // Validar que solo ADMIN pueda acceder a esta página
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // ADMIN ve todos los tickets
  const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } })

  // Obtener todas las organizaciones disponibles
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      domain: true,
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Obtener todos los departamentos disponibles
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
      isAdmin: true,
      description: true,
    },
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Nuevo Usuario" />

        <main className="flex-1 overflow-y-auto">
          <CreateUserForm organizations={organizations} departments={departments} />
        </main>
      </div>
    </div>
  )
}
