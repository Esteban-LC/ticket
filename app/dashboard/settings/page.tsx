import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import { Settings as SettingsIcon, Mail, Globe, Shield, Bell, Database, Download, Archive } from 'lucide-react'

export const metadata = {
  title: 'Configuración | Tickets LICEO MICHOACANO',
  description: 'Configuración del sistema'
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Obtener usuario completo con su rol
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Validar que solo ADMIN pueda acceder
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Solo ADMIN ve todos los tickets
  const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } })

  // Obtener estadísticas del sistema
  const [stats, softDeleteStats, recentSoftDeletes] = await Promise.all([
    prisma.$transaction([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.ticket.count(),
      prisma.category.count(),
      prisma.user.count({ where: { role: 'ADMIN', deletedAt: null } }),
    ]),
    prisma.$transaction([
      prisma.user.count({ where: { deletedAt: { not: null } } }),
      prisma.wordPressUser.count({ where: { deletedAt: { not: null } } }),
    ]),
    prisma.adminLog.findMany({
      where: { action: 'DELETE_USER' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        targetEmail: true,
        targetName: true,
        details: true,
        createdAt: true,
      },
    }),
  ])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Configuración" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Administra la configuración del sistema</p>
            </div>

            {/* Estadísticas del Sistema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats[0]}</p>
                  </div>
                  <div className="h-10 w-10 lg:h-12 lg:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats[1]}</p>
                  </div>
                  <div className="h-10 w-10 lg:h-12 lg:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categorías</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats[2]}</p>
                  </div>
                  <div className="h-10 w-10 lg:h-12 lg:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administradores</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats[3]}</p>
                  </div>
                  <div className="h-10 w-10 lg:h-12 lg:w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Secciones de Configuración */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-6 lg:mt-8">



              {/* Configuración de Sistema */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <SettingsIcon className="h-5 w-5 lg:h-6 lg:w-6 text-primary-600" />
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">Sistema</h2>
                  </div>
                </div>
                <div className="p-4 lg:p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Versión del Sistema</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">v1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Base de Datos</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">PostgreSQL (Conectado)</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Última Actualización</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">20 de diciembre de 2025</p>
                  </div>
                </div>
              </div>

              {/* Preferencias de Notificaciones */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h2>
                  </div>
                </div>
                <div className="p-4 lg:p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Alertas por correo</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Recibir copia al crear nuevos tickets</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Notificar Cierres</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Avisar cuando se finalice un ticket</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>



              {/* Copia de Seguridad */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">Copia de Seguridad</h2>
                  </div>
                </div>
                <div className="p-4 lg:p-6 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Descarga una copia completa de todos los tickets y usuarios registrados en formato JSON.
                  </p>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                    <Download className="h-4 w-4" />
                    Exportar Base de Datos
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 lg:col-span-2">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <Archive className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">Papelera (Soft Delete)</h2>
                  </div>
                </div>
                <div className="p-4 lg:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-900/20 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-orange-700 dark:text-orange-300">Usuarios internos eliminados</p>
                      <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{softDeleteStats[0]}</p>
                    </div>
                    <div className="rounded-lg border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-900/20 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-orange-700 dark:text-orange-300">Usuarios WordPress eliminados</p>
                      <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{softDeleteStats[1]}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Ultimos eliminados (historial)</p>
                    {recentSoftDeletes.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No hay eliminaciones registradas.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentSoftDeletes.map((entry) => {
                          const details = (entry.details || {}) as Record<string, any>
                          const entity = details.entity || 'USER'
                          return (
                            <div key={entry.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900/40">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {entry.targetName || entry.targetEmail}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {entry.targetEmail} - {entity}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-3">
                                {new Date(entry.createdAt).toLocaleString('es-MX')}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Nota:</strong> Las opciones de configuración están en desarrollo. Próximamente podrás editar todos estos valores y personalizar tu sistema.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


