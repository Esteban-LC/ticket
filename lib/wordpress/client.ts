/**
 * Cliente base para WordPress REST API
 * Maneja autenticación y requests comunes
 */

export interface WordPressConfig {
  apiUrl: string
  username: string
  appPassword: string
}

export class WordPressClient {
  private config: WordPressConfig
  private authHeader: string

  constructor(config?: WordPressConfig) {
    this.config = config || {
      apiUrl: process.env.WORDPRESS_API_URL || '',
      username: process.env.WORDPRESS_USERNAME || '',
      appPassword: process.env.WORDPRESS_APP_PASSWORD || '',
    }

    // Crear el header de autenticación Basic Auth
    const credentials = Buffer.from(
      `${this.config.username}:${this.config.appPassword.replace(/\s/g, '')}`
    ).toString('base64')

    this.authHeader = `Basic ${credentials}`
  }

  /**
   * Parsear respuesta de WordPress de forma segura.
   * Evita errores cuando WP responde HTML (login, error fatal, mantenimiento, etc).
   */
  private async parseResponse<T>(response: Response, requestUrl?: string): Promise<T> {
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.toLowerCase().includes('application/json')
    const urlInfo = requestUrl || response.url || 'unknown-url'

    if (!response.ok) {
      if (isJson) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          `WordPress API Error: ${response.status} - ${error.message || response.statusText} [${urlInfo}]`
        )
      }

      const text = await response.text().catch(() => '')
      const preview = text.replace(/\s+/g, ' ').trim().slice(0, 180)
      throw new Error(
        `WordPress API Error: ${response.status} - Respuesta no JSON (${contentType || 'sin content-type'}) [${urlInfo}]. ${preview}`
      )
    }

    if (!isJson) {
      const text = await response.text().catch(() => '')
      const preview = text.replace(/\s+/g, ' ').trim().slice(0, 180)
      throw new Error(
        `WordPress API Error: respuesta inesperada no JSON (${contentType || 'sin content-type'}) [${urlInfo}]. ${preview}`
      )
    }
    try {
      return await response.json()
    } catch {
      const text = await response.text().catch(() => '')
      const preview = text.replace(/\s+/g, ' ').trim().slice(0, 180)
      throw new Error(
        `WordPress API Error: JSON inválido (${contentType || 'sin content-type'}) [${urlInfo}]. ${preview}`
      )
    }
  }

  /**
   * Realizar una petición GET
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.config.apiUrl}${endpoint}`)

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]))
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    return this.parseResponse<T>(response, url.toString())
  }

  /**
   * Obtener solo el total de registros (lee X-WP-Total del header)
   */
  async getCount(endpoint: string, params?: Record<string, any>): Promise<number> {
    const url = new URL(`${this.config.apiUrl}${endpoint}`)
    url.searchParams.append('per_page', '1')
    url.searchParams.append('page', '1')

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]))
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) return 0
    return parseInt(response.headers.get('X-WP-Total') || '0', 10)
  }

  /**
   * Realizar una petición POST
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return this.parseResponse<T>(response, `${this.config.apiUrl}${endpoint}`)
  }

  /**
   * Realizar una petición PUT
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return this.parseResponse<T>(response, `${this.config.apiUrl}${endpoint}`)
  }

  /**
   * Realizar una petición PATCH
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return this.parseResponse<T>(response, `${this.config.apiUrl}${endpoint}`)
  }

  /**
   * Realizar una petición DELETE
   */
  async delete<T>(endpoint: string, force: boolean = false): Promise<T> {
    const url = new URL(`${this.config.apiUrl}${endpoint}`)
    if (force) {
      url.searchParams.append('force', 'true')
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
    })

    return this.parseResponse<T>(response, url.toString())
  }
}

// Instancia singleton del cliente
export const wpClient = new WordPressClient()
