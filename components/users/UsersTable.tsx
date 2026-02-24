'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { UserRole } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { Mail, Ticket, UserCog } from 'lucide-react'
import EditUserModal from './EditUserModal'

interface User {
  id: string
  name: string | null
  email: string
  avatar: string | null
  role: UserRole
  permissions: string[]
  createdAt: Date
  department?: {
    id: string
    name: string
    isAdmin: boolean
  } | null
  _count: {
    createdTickets: number
    assignedTickets: number
  }
}

interface UsersTableProps {
  users: User[]
}

const roleLabels = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordinador',
  EDITOR: 'Editor',
  VIEWER: 'Lector',
}

const departmentColors: Record<string, string> = {
  'SISTEMAS': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'ACADEMIA': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'CONTABILIDAD': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'COORD LIQ': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'MEDIOS': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'VENTAS': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'AUXILIAR': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'default': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
}

export default function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [editingUser, setEditingUser] = useState<User | null>(null)

  if (users.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron usuarios</p>
        <p className="text-gray-400 dark:text-gray-500 mt-2">Intenta ajustar los filtros</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow hover:shadow-md transition">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-lg">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {user.name || 'Sin nombre'}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.department
                      ? departmentColors[user.department.name] || departmentColors['default']
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                      {user.department ? user.department.name : 'Sin departamento'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setEditingUser(user)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <UserCog className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">{user.email}</span>
                </div>

              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Ticket className="h-3 w-3 mr-1" />
                    Tickets creados
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {user._count.createdTickets}
                  </p>
                </div>

                {(user.role === 'ADMIN' || user.role === 'COORDINATOR') && (
                  <div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Ticket className="h-3 w-3 mr-1" />
                      Tickets asignados
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {user._count.assignedTickets}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Registrado: {format(new Date(user.createdAt), 'PP', { locale: es })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  )
}
