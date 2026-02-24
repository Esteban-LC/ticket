/**
 * Servicio para gestión de usuarios en WordPress
 */

import { wpClient } from './client'

export interface WordPressUser {
  id: number
  username: string
  name: string
  first_name: string
  last_name: string
  email: string
  url: string
  description: string
  link: string
  locale: string
  nickname: string
  slug: string
  roles: string[]
  registered_date: string
  capabilities: Record<string, boolean>
  extra_capabilities: Record<string, boolean>
  avatar_urls: Record<string, string>
  meta: any[]
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
  name?: string
  roles?: string[]
  description?: string
  locale?: string
}

export interface UpdateUserData {
  email?: string
  password?: string
  first_name?: string
  last_name?: string
  name?: string
  roles?: string[]
  description?: string
  locale?: string
}

export interface BatchResultItem {
  user_id?: number
  index?: number
  success: boolean
  code?: string | null
  message: string
  status: number
  generated_password?: string
  username?: string
  email?: string
  role?: string
}

export interface BatchResponse {
  success: boolean
  summary: {
    requested: number
    successful: number
    failed: number
  }
  results: BatchResultItem[]
}

export class WordPressUserService {
  /**
   * Obtener todos los usuarios
   */
  async getUsers(params?: {
    page?: number
    per_page?: number
    search?: string
    roles?: string[]
    orderby?: string
    order?: 'asc' | 'desc'
  }): Promise<WordPressUser[]> {
    const queryParams: Record<string, any> = {
      ...params,
      context: 'edit', // Contexto 'edit' devuelve más campos incluyendo email y roles
    }

    if (params?.roles && params.roles.length > 0) {
      queryParams.roles = params.roles.join(',')
    }

    return wpClient.get<WordPressUser[]>('/wp/v2/users', queryParams)
  }

  /**
   * Obtener total de usuarios (X-WP-Total)
   */
  async getUsersCount(params?: {
    search?: string
    roles?: string[]
  }): Promise<number> {
    const queryParams: Record<string, any> = {
      ...params,
      context: 'edit',
    }

    if (params?.roles && params.roles.length > 0) {
      queryParams.roles = params.roles.join(',')
    }

    return wpClient.getCount('/wp/v2/users', queryParams)
  }

  /**
   * Obtener un usuario por ID
   */
  async getUser(userId: number): Promise<WordPressUser> {
    return wpClient.get<WordPressUser>(`/wp/v2/users/${userId}`, { context: 'edit' })
  }

  /**
   * Crear un nuevo usuario
   */
  async createUser(data: CreateUserData): Promise<WordPressUser> {
    return wpClient.post<WordPressUser>('/wp/v2/users', data)
  }

  /**
   * Actualizar un usuario
   */
  async updateUser(userId: number, data: UpdateUserData): Promise<WordPressUser> {
    return wpClient.put<WordPressUser>(`/wp/v2/users/${userId}`, data)
  }

  /**
   * Eliminar un usuario
   */
  async deleteUser(userId: number, reassign?: number): Promise<{ deleted: boolean; previous: WordPressUser }> {
    const params = reassign ? { reassign } : {}
    return wpClient.delete(`/wp/v2/users/${userId}?force=true${reassign ? `&reassign=${reassign}` : ''}`)
  }

  /**
   * Obtener el usuario actual (autenticado)
   */
  async getCurrentUser(): Promise<WordPressUser> {
    return wpClient.get<WordPressUser>('/wp/v2/users/me', { context: 'edit' })
  }

  /**
   * Cambiar contraseña de un usuario
   */
  async changePassword(userId: number, newPassword: string): Promise<WordPressUser> {
    return this.updateUser(userId, { password: newPassword })
  }

  /**
   * Actualizar roles de un usuario
   */
  async updateUserRoles(userId: number, roles: string[]): Promise<WordPressUser> {
    return this.updateUser(userId, { roles })
  }

  /**
   * Buscar usuarios por email
   */
  async searchUsersByEmail(email: string): Promise<WordPressUser[]> {
    return this.getUsers({ search: email })
  }

  /**
   * Obtener usuarios por rol
   */
  async getUsersByRole(role: string, params?: { page?: number; per_page?: number }): Promise<WordPressUser[]> {
    return this.getUsers({ roles: [role], ...params })
  }

  /**
   * Verificar si un usuario existe por email
   */
  async userExists(email: string): Promise<boolean> {
    try {
      const users = await this.searchUsersByEmail(email)
      return users.length > 0
    } catch {
      return false
    }
  }

  /**
   * Suspender un usuario en WordPress (usando custom endpoint)
   */
  async suspendUser(userId: number, reason?: string): Promise<{
    success: boolean
    message: string
    user_id: number
    suspended: boolean
    reason: string
  }> {
    const data: Record<string, any> = {}
    if (reason) {
      data.reason = reason
    }
    return wpClient.post(`/custom/v1/users/${userId}/suspend`, data)
  }

  /**
   * Habilitar un usuario suspendido en WordPress (usando custom endpoint)
   */
  async unsuspendUser(userId: number): Promise<{
    success: boolean
    message: string
    user_id: number
    suspended: boolean
  }> {
    return wpClient.post(`/custom/v1/users/${userId}/unsuspend`, {})
  }

  /**
   * Obtener estado de suspensión de un usuario (usando custom endpoint)
   */
  async getSuspensionStatus(userId: number): Promise<{
    user_id: number
    suspended: boolean
    reason: string | null
    suspended_at: string | null
    suspended_by: number | null
  }> {
    return wpClient.get(`/custom/v1/users/${userId}/suspension-status`)
  }

  async suspendUsersBatch(userIds: number[], reason?: string): Promise<BatchResponse> {
    return wpClient.post('/custom/v1/users/batch/suspend', {
      user_ids: userIds,
      reason: reason || '',
    })
  }

  async unsuspendUsersBatch(userIds: number[]): Promise<BatchResponse> {
    return wpClient.post('/custom/v1/users/batch/unsuspend', {
      user_ids: userIds,
    })
  }

  async deleteUsersBatch(userIds: number[], reassign?: number): Promise<BatchResponse> {
    const payload: Record<string, any> = { user_ids: userIds }
    if (typeof reassign === 'number' && reassign > 0) {
      payload.reassign = reassign
    }
    return wpClient.post('/custom/v1/users/batch/delete', payload)
  }

  async createUsersBatch(users: Array<{
    username: string
    email: string
    role?: string
    first_name?: string
    last_name?: string
    password?: string
  }>): Promise<BatchResponse> {
    return wpClient.post('/custom/v1/users/batch/create', { users })
  }
}

// Instancia singleton del servicio
export const wpUserService = new WordPressUserService()
