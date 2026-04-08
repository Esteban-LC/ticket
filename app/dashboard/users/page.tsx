import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import UsersTable from '@/components/users/UsersTable'
import CreateUserButton from '@/components/users/CreateUserButton'
import UserFilters from '@/components/users/UserFilters'
import { Shield, UserCog, Users } from 'lucide-react'

interface SearchParams {
  department?: string
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
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

  // Validar que solo ADMIN pueda acceder a esta página
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const whereClause: any = {}

  if (searchParams.department) {
    whereClause.departmentId = searchParams.department
  }

  const [users, adminCount, coordinatorCount, editorCount, viewerCount, departments, openTicketsCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        permissions: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
            isAdmin: true,
          }
        },
        _count: {
          select: {
            createdTickets: true,
            assignedTickets: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'COORDINATOR' } }),
    prisma.user.count({ where: { role: 'EDITOR' } }),
    prisma.user.count({ where: { role: 'VIEWER' } }),
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.ticket.count({ where: { status: 'OPEN' } })
  ])



  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Usuarios" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 lg:mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona usuarios, roles y permisos</p>
              </div>
              <CreateUserButton />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administradores</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2">{adminCount}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coordinadores</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2">{coordinatorCount}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <UserCog className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Editores</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2">{editorCount}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lectores</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2">{viewerCount}</p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            <UserFilters currentDepartment={searchParams.department} departments={departments} />

            <UsersTable users={users} />
          </div>
        </main>
      </div>
    </div>
  )
}
