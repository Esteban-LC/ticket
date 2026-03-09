export type PermissionDefinition = {
  key: string
  label: string
  description: string
}

export const USER_PERMISSION_GROUPS: Array<{
  title: string
  permissions: PermissionDefinition[]
}> = [
  {
    title: 'Workspace',
    permissions: [
      {
        key: 'workspace:view_users',
        label: 'Ver usuarios Workspace',
        description: 'Permite consultar el listado de usuarios de Workspace en modo lectura.',
      },
      {
        key: 'workspace:access',
        label: 'Acceso a Workspace',
        description: 'Permite entrar al modulo de Workspace y sus vistas relacionadas.',
      },
      {
        key: 'workspace:manage_users',
        label: 'Gestionar usuarios Workspace',
        description: 'Permite crear, editar, suspender y eliminar usuarios de Workspace.',
      },
    ],
  },
  {
    title: 'WordPress LMS',
    permissions: [
      {
        key: 'wordpress:view_users',
        label: 'Ver usuarios WP',
        description: 'Permite consultar el listado de usuarios de WordPress en modo lectura.',
      },
      {
        key: 'wordpress:access',
        label: 'Acceso general WordPress',
        description: 'Permite ver modulos de WordPress y Tutor LMS.',
      },
      {
        key: 'wordpress:manage_users',
        label: 'Gestionar usuarios WP',
        description: 'Permite crear, editar, suspender y administrar usuarios de WordPress.',
      },
      {
        key: 'wordpress:manage_enrollments',
        label: 'Gestionar enrolamientos',
        description: 'Permite enrolar usuarios en cursos y administrar asignaciones.',
      },
      {
        key: 'wordpress:manage_orders',
        label: 'Gestionar pedidos WP',
        description: 'Permite consultar y administrar pedidos de WooCommerce.',
      },
      {
        key: 'wordpress:manage_courses',
        label: 'Gestionar cursos WP',
        description: 'Permite consultar y administrar catalogo y detalle de cursos.',
      },
    ],
  },
  {
    title: 'Reportes',
    permissions: [
      {
        key: 'VIEW_DEPARTMENT_REPORTS',
        label: 'Ver reportes por departamento',
        description: 'Permite consultar reportes agrupados por departamento.',
      },
    ],
  },
  {
    title: 'Cobranza',
    permissions: [
      {
        key: 'tuition:manage_status',
        label: 'Gestionar adeudos',
        description: 'Permite marcar usuarios como adeudor, no adeudor o baja por pagos.',
      },
    ],
  },
]

export const ALL_USER_PERMISSIONS = USER_PERMISSION_GROUPS.flatMap((group) => group.permissions)

type PermissionUser = {
  role?: string | null
  permissions?: string[] | null
}

export function hasPermission(user: PermissionUser | null | undefined, permission: string) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  return Array.isArray(user.permissions) && user.permissions.includes(permission)
}

export function canAccessWorkspace(user: PermissionUser | null | undefined) {
  return (
    hasPermission(user, 'workspace:view_users') ||
    hasPermission(user, 'workspace:access') ||
    hasPermission(user, 'workspace:manage_users')
  )
}

export function canManageWorkspace(user: PermissionUser | null | undefined) {
  return hasPermission(user, 'workspace:manage_users') || user?.role === 'ADMIN'
}

export function canViewWordPressUsers(user: PermissionUser | null | undefined) {
  return (
    hasPermission(user, 'wordpress:view_users') ||
    hasPermission(user, 'wordpress:access') ||
    hasPermission(user, 'wordpress:manage_users') ||
    hasPermission(user, 'wordpress:manage_enrollments') ||
    user?.role === 'ADMIN'
  )
}

export function canAccessWordPress(user: PermissionUser | null | undefined) {
  return (
    hasPermission(user, 'wordpress:view_users') ||
    hasPermission(user, 'wordpress:access') ||
    hasPermission(user, 'wordpress:manage_users') ||
    hasPermission(user, 'wordpress:manage_enrollments') ||
    hasPermission(user, 'wordpress:manage_orders') ||
    hasPermission(user, 'wordpress:manage_courses')
  )
}

export function canManageTuitionStatus(user: PermissionUser | null | undefined) {
  return hasPermission(user, 'tuition:manage_status')
}
