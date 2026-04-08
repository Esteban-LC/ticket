'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Mail, User, Calendar, Shield, Lock, Unlock,
  GraduationCap, ShoppingCart, Trash2, Edit,
  AlertTriangle, BookOpen, CheckCircle2, XCircle,
  Package, RefreshCw, DollarSign
} from 'lucide-react'
import ActionDialog from '@/components/ui/ActionDialog'
import ActionPromptDialog from '@/components/ui/ActionPromptDialog'
import EditUserModal from '@/components/wordpress/EditUserModal'

interface WPUser {
  id: number
  username: string
  name: string
  first_name: string
  last_name: string
  email: string
  roles: string[]
  registered_date: string
  isSuspended: boolean
  suspensionReason: string | null
  suspendedAt: string | null
  link?: string
}

interface TutorCourse {
  id: number
  title: { rendered: string }
  status: string
  link: string
  date: string
  relations?: string[]
  lesson_total?: number
  lesson_completed?: number
  quiz_total?: number
  quiz_completed?: number
  assignment_total?: number
  assignment_completed?: number
  progress_percentage?: number
}

interface WooOrder {
  id: number
  number: string
  status: string
  date_created: string
  total: string
  currency_symbol: string
  line_items: { name: string; quantity: number; total: string }[]
}

interface WordPressUserProfileProps {
  userId: number
  userRole: string
  userPermissions: string[]
}

type TabKey = 'info' | 'cursos' | 'ordenes'

export default function WordPressUserProfile({ userId, userRole, userPermissions }: WordPressUserProfileProps) {
  const router = useRouter()
  const [user, setUser] = useState<WPUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('info')

  const [courses, setCourses] = useState<TutorCourse[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  const [orders, setOrders] = useState<WooOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const canManageUsers = userRole === 'ADMIN' || userPermissions.includes('wordpress:manage_users')
  const canManageOrders = userRole === 'ADMIN' || userPermissions.includes('wordpress:manage_orders')
  const isAdmin = user?.roles?.includes('administrator')

  useEffect(() => { fetchUser() }, [userId])
  useEffect(() => {
    if (activeTab === 'cursos' && courses.length === 0 && !coursesLoading) fetchCourses()
    if (activeTab === 'ordenes' && orders.length === 0 && !ordersLoading) fetchOrders()
  }, [activeTab])

  const fetchUser = async () => {
    try {
      setLoading(true); setError(null)
      const res = await fetch(`/api/wordpress/users/${userId}`)
      const data = await res.json()
      if (res.ok) setUser(data.user)
      else setError(data.error || 'Error al cargar usuario')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true); setCoursesError(null)
      const res = await fetch(`/api/wordpress/users/${userId}/courses`)
      const data = await res.json()
      if (res.ok) setCourses(data.courses || [])
      else setCoursesError(data.error || 'Error al cargar cursos')
    } catch { setCoursesError('Error de conexión') }
    finally { setCoursesLoading(false) }
  }

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true); setOrdersError(null)
      const res = await fetch(`/api/wordpress/users/${userId}/orders`)
      const data = await res.json()
      if (res.ok) setOrders(data.orders || [])
      else setOrdersError(data.error || 'Error al cargar órdenes')
    } catch { setOrdersError('Error de conexión') }
    finally { setOrdersLoading(false) }
  }

  const handleSuspend = async (reason: string) => {
    const res = await fetch(`/api/wordpress/users/${userId}/suspend`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al suspender')
    setUser(prev => prev ? { ...prev, isSuspended: true, suspensionReason: reason } : null)
  }

  const handleUnsuspend = async () => {
    const res = await fetch(`/api/wordpress/users/${userId}/suspend`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al habilitar')
    setUser(prev => prev ? { ...prev, isSuspended: false, suspensionReason: null, suspendedAt: null } : null)
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/wordpress/users/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al eliminar')
    router.push('/dashboard/wordpress/students')
  }

  const getRoleLabel = (roles: string[]) =>
    ({ administrator: 'Administrador', tutor_instructor: 'Instructor', subscriber: 'Suscriptor', student: 'Estudiante' }[roles?.[0]] || roles?.[0] || 'Sin rol')

  const getRoleBadge = (roles: string[]) => {
    const r = roles?.[0]
    if (r === 'administrator') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    if (r === 'tutor_instructor') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    if (r === 'subscriber') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const getGradient = (id: number) =>
    ['from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-emerald-500 to-emerald-700',
      'from-orange-500 to-orange-700', 'from-pink-500 to-pink-700', 'from-teal-500 to-teal-700'][id % 6]

  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A'
    const dt = new Date(d)
    return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getOrderStatusLabel = (s: string) =>
    ({ pending: 'Pendiente', processing: 'Procesando', 'on-hold': 'En espera', completed: 'Completado', cancelled: 'Cancelado', refunded: 'Reembolsado', failed: 'Fallido' }[s] || s)

  const getOrderStatusColor = (s: string) =>
    ({ pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', refunded: 'bg-purple-100 text-purple-700', failed: 'bg-red-100 text-red-700', 'on-hold': 'bg-orange-100 text-orange-700' }[s] || 'bg-gray-100 text-gray-600')

  const courseStats = useMemo(() => {
    const enrolled = courses.filter(c => c.relations?.includes('enrolled')).length
    const latestDate = courses.length > 0
      ? [...courses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
      : null
    const avgProgress = courses.length > 0
      ? Math.round(courses.reduce((acc, c) => acc + (c.progress_percentage || 0), 0) / courses.length)
      : 0

    return {
      total: courses.length,
      enrolled,
      latestDate,
      avgProgress,
    }
  }, [courses])

  const getCourseStatusLabel = (status: string) =>
    ({ publish: 'Publicado', draft: 'Borrador', pending: 'Pendiente', private: 'Privado' }[status] || status)

  const getCourseStatusColor = (status: string) =>
    ({ publish: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', private: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' }[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300')

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
        <p className="text-gray-400 text-sm">Cargando perfil...</p>
      </div>
    </div>
  )

  if (error || !user) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{error || 'Usuario no encontrado'}</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
      </div>
    </div>
  )

  const tabs: { key: TabKey; label: string; icon: any; show: boolean }[] = [
    { key: 'info', label: 'Información', icon: User, show: true },
    { key: 'cursos', label: 'Cursos', icon: GraduationCap, show: true },
    { key: 'ordenes', label: 'Órdenes', icon: ShoppingCart, show: canManageOrders },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">

      {/* Botón volver */}
      <button onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {/* Card principal */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">

        {/* Gradiente + avatar */}
        <div className={`bg-gradient-to-r ${getGradient(user.id)} h-20 relative`}>
          <div className={`absolute bottom-0 left-4 translate-y-1/2 h-16 w-16 rounded-xl border-4 border-white dark:border-slate-800 flex items-center justify-center text-white text-xl font-bold shadow-md bg-gradient-to-br ${getGradient(user.id)}`}>
            {getInitials(user.name)}
          </div>
        </div>

        {/* Nombre + info */}
        <div className="px-4 pt-12 pb-0">
          <div className="mb-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {user.name || 'Sin nombre'}
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded ${getRoleBadge(user.roles)}`}>
                {getRoleLabel(user.roles)}
              </span>
              {user.isSuspended && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  Suspendido
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{user.username} · ID #{user.id}
            </p>
          </div>

          {/* Tabs — scroll horizontal en móvil */}
          <div className="flex overflow-x-auto -mx-4 px-4 border-t border-gray-100 dark:border-slate-700 scrollbar-hide">
            {tabs.filter(t => t.show).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido tabs */}
        <div className="p-4">

          {/* ── Tab: Información ── */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Datos */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Datos</p>
                {[
                  { icon: Mail, label: 'Email', value: user.email },
                  { icon: User, label: 'Usuario', value: `@${user.username}` },
                  { icon: Shield, label: 'Rol', value: getRoleLabel(user.roles) },
                  { icon: Calendar, label: 'Registro', value: formatDate(user.registered_date) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="h-7 w-7 bg-white dark:bg-slate-600 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white break-all leading-snug">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Estado + acciones */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</p>
                <div className={`p-3 rounded-lg border ${user.isSuspended
                  ? 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/10'
                  : 'border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/10'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {user.isSuspended
                      ? <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      : <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    }
                    <span className={`text-xs font-semibold ${user.isSuspended ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                      {user.isSuspended ? 'Cuenta suspendida' : 'Cuenta activa'}
                    </span>
                  </div>
                  {user.isSuspended && user.suspensionReason && (
                    <p className="text-xs text-red-600 dark:text-red-400 ml-6">
                      <span className="font-medium">Razón:</span> {user.suspensionReason}
                    </p>
                  )}
                  {user.isSuspended && user.suspendedAt && (
                    <p className="text-xs text-red-500 ml-6 mt-0.5">Desde: {formatDate(user.suspendedAt)}</p>
                  )}
                  {!user.isSuspended && (
                    <p className="text-xs text-green-600 dark:text-green-400 ml-6">Puede iniciar sesión normalmente.</p>
                  )}
                </div>

                {canManageUsers && !isAdmin && (
                  <div className="flex flex-col gap-1.5">
                    {user.isSuspended ? (
                      <button onClick={() => setShowUnsuspendDialog(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                        <Unlock className="h-3.5 w-3.5" /> Habilitar cuenta
                      </button>
                    ) : (
                      <button onClick={() => setShowSuspendDialog(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
                        <Lock className="h-3.5 w-3.5" /> Suspender cuenta
                      </button>
                    )}
                    <button onClick={() => setShowEditModal(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                      <Edit className="h-3.5 w-3.5" /> Editar usuario
                    </button>
                    <button onClick={() => setShowDeleteDialog(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar usuario
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Cursos ── */}
          {activeTab === 'cursos' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cursos inscritos</p>
                <button onClick={fetchCourses} disabled={coursesLoading}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  <RefreshCw className={`h-3 w-3 ${coursesLoading ? 'animate-spin' : ''}`} /> Actualizar
                </button>
              </div>
              {coursesLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600 mb-2" />
                  <p className="text-xs text-gray-400">Cargando cursos...</p>
                </div>
              ) : coursesError ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-2">{coursesError}</p>
                  <button onClick={fetchCourses} className="text-xs text-blue-600 hover:underline">Reintentar</button>
                </div>
              ) : courses.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin cursos inscritos</p>
                </div>
              ) : (
                <>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 p-2.5">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Total cursos</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{courseStats.total}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 p-2.5">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Inscritos</p>
                      <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{courseStats.enrolled}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 p-2.5">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Promedio progreso</p>
                      <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">{courseStats.avgProgress}%</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 p-2.5">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Ultimo movimiento</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">{formatDate(courseStats.latestDate)}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 px-3 py-2">Curso</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 px-3 py-2">Enroll Date</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 px-3 py-2">Lesson</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 px-3 py-2">Quiz</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 px-3 py-2">Assignment</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 px-3 py-2">Progress</th>
                          <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 px-3 py-2">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {courses.map(course => (
                          <tr key={course.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-700/20">
                            <td className="px-3 py-2.5">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate"
                                  dangerouslySetInnerHTML={{ __html: course.title?.rendered || 'Sin titulo' }} />
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[11px] text-gray-400">ID #{course.id}</p>
                                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${getCourseStatusColor(course.status)}`}>
                                    {getCourseStatusLabel(course.status)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">{formatDate(course.date)}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">{(course.lesson_completed ?? 0)}/{(course.lesson_total ?? 0)}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">{(course.quiz_completed ?? 0)}/{(course.quiz_total ?? 0)}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">{(course.assignment_completed ?? 0)}/{(course.assignment_total ?? 0)}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <div className="h-1.5 w-24 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(0, Math.min(100, course.progress_percentage ?? 0))}%` }} />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{course.progress_percentage ?? 0}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <a href={course.link} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                Ver curso
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/15 px-3 py-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Fuente de datos: endpoint custom <span className="font-semibold">/custom/v1/users/{'{id}'}/courses</span> + rutas Tutor LMS para progreso y contenidos.
                    </p>
                  </div>
                </div>
                <ul className="hidden divide-y divide-gray-100 dark:divide-slate-700">
                  {courses.map(course => (
                    <li key={course.id} className="flex items-center gap-3 py-2.5">
                      <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate"
                          dangerouslySetInnerHTML={{ __html: course.title?.rendered || 'Sin título' }} />
                        <p className="text-xs text-gray-400">{formatDate(course.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                </>
              )}
            </div>
          )}

          {/* ── Tab: Órdenes ── */}
          {activeTab === 'ordenes' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Historial de órdenes</p>
                <button onClick={fetchOrders} disabled={ordersLoading}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  <RefreshCw className={`h-3 w-3 ${ordersLoading ? 'animate-spin' : ''}`} /> Actualizar
                </button>
              </div>
              {ordersLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-green-600 mb-2" />
                  <p className="text-xs text-gray-400">Cargando órdenes...</p>
                </div>
              ) : ordersError ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-2">{ordersError}</p>
                  <button onClick={fetchOrders} className="text-xs text-blue-600 hover:underline">Reintentar</button>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="h-8 w-8 text-green-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin órdenes</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                  {orders.map(order => (
                    <li key={order.id} className="flex items-start gap-3 py-2.5">
                      <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">#{order.number}</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${getOrderStatusColor(order.status)}`}>
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </div>
                        {order.line_items?.length > 0 && (
                          <p className="text-xs text-gray-400 truncate">{order.line_items.map(i => i.name).join(', ')}</p>
                        )}
                        <p className="text-xs text-gray-400">{formatDate(order.date_created)}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                        {order.currency_symbol}{order.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modales */}
      <ActionPromptDialog
        isOpen={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={handleSuspend}
        title="Suspender Usuario"
        message={`¿Por qué deseas suspender a ${user.name}?`}
        placeholder="Ej: Pago vencido, violación de términos..."
        confirmText="Suspender"
        cancelText="Cancelar"
        variant="danger"
        loadingMessage="Suspendiendo usuario en WordPress..."
        successMessage="Usuario suspendido correctamente"
        required
        requireTextConfirmation
        confirmationText="SUSPENDER"
        confirmationLabel="Para evitar errores, escribe SUSPENDER para confirmar."
        confirmationPlaceholder="SUSPENDER"
      />
      <ActionDialog
        isOpen={showUnsuspendDialog}
        onClose={() => setShowUnsuspendDialog(false)}
        onConfirm={handleUnsuspend}
        title="Habilitar Usuario"
        message={`¿Deseas reactivar la cuenta de ${user.name}? Podrá iniciar sesión nuevamente.`}
        confirmText="Habilitar"
        cancelText="Cancelar"
        variant="success"
        loadingMessage="Habilitando usuario en WordPress..."
        successMessage="Usuario habilitado correctamente"
      />
      <ActionDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a ${user.name}? Esta acción es permanente.`}
        confirmText="Eliminar permanentemente"
        cancelText="Cancelar"
        variant="danger"
        loadingMessage="Eliminando usuario de WordPress..."
        successMessage="Usuario eliminado correctamente"
        requireTextConfirmation
        confirmationText="ELIMINAR"
        confirmationLabel="Esta accion es irreversible. Escribe ELIMINAR para confirmar."
        confirmationPlaceholder="ELIMINAR"
      />

      <EditUserModal
        isOpen={showEditModal}
        user={user}
        onClose={() => setShowEditModal(false)}
        onSaved={(updated) => {
          setUser(prev => prev ? { ...prev, ...updated } : null)
        }}
      />
    </div>
  )
}
