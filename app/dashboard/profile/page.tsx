import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      location: true,
      avatar: true,
      role: true,
      createdAt: true,
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Filtrar contador según el rol
  const countWhere = user.role === 'CUSTOMER'
    ? { status: 'OPEN' as const, customerId: user.id }
    : { status: 'OPEN' as const }
  const openTicketsCount = await prisma.ticket.count({ where: countWhere })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Mi Perfil" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Administra tu información personal y preferencias</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Información del usuario */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 lg:p-6">
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                      <span className="text-2xl lg:text-3xl font-bold text-primary-600">
                        {user.name?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    <span className={`mt-3 px-3 py-1 text-xs font-medium rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'AGENT' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {user.role === 'ADMIN' ? 'Administrador' :
                        user.role === 'AGENT' ? 'Agente' : 'Cliente'}
                    </span>
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 w-full">
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Miembro desde</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(user.createdAt).toLocaleDateString('es', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {user.phone && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Teléfono</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.phone}</p>
                          </div>
                        )}
                        {user.location && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Ubicación</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.location}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario de edición */}
              <div className="lg:col-span-2">
                <ProfileForm user={user} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
