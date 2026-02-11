import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import CategoriesTable from '@/components/categories/CategoriesTable'
import CreateCategoryButton from '@/components/categories/CreateCategoryButton'

export const metadata: Metadata = {
  title: 'Categorías | Tickets LICEO MICHOACANO',
  description: 'Gestión de categorías'
}

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Obtener usuario completo con su rol
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
    select: { id: true, name: true, email: true, role: true, permissions: true }
  })

  if (!user) {
    redirect('/login')
  }

  // Validar que VIEWER y EDITOR no puedan acceder a esta página
  if (user.role === 'VIEWER' || user.role === 'EDITOR') {
    redirect('/dashboard')
  }

  // COORDINATOR y ADMIN ven todos los tickets
  const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Categorías" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <div className="mb-6 lg:mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Categorías</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Gestiona las categorías del sistema
                </p>
              </div>
              <CreateCategoryButton />
            </div>

            <CategoriesTable />
          </div>
        </main>
      </div>
    </div>
  )
}
