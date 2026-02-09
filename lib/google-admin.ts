import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

function findCredentialsFile(): string | null {
  // Buscar archivos de credenciales JSON en la raíz del proyecto
  const cwd = process.cwd()
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(cwd, 'google-credentials.json'),
    path.join(cwd, 'gmail-correo-447916-88771ea8dd50.json'),
  ].filter(Boolean) as string[]

  // También buscar cualquier archivo que coincida con patrones comunes de service account
  try {
    const files = fs.readdirSync(cwd)
    for (const file of files) {
      if (file.endsWith('.json') && (file.includes('credentials') || file.includes('service-account') || file.includes('gmail-correo'))) {
        const fullPath = path.join(cwd, file)
        if (!candidates.includes(fullPath)) {
          candidates.push(fullPath)
        }
      }
    }
  } catch {
    // Ignorar errores al listar directorio
  }

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }
  return null
}

function normalizePrivateKey(key: string): string {
  let normalized = key
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .trim()

  if (!normalized.includes('-----BEGIN')) {
    throw new Error('GOOGLE_PRIVATE_KEY no contiene un header PEM válido (-----BEGIN PRIVATE KEY-----)')
  }

  return normalized
}

function getCredentials() {
  // Opción 1 (PRIORITARIA): Archivo JSON local — no tiene problemas de escape
  const credentialsFile = findCredentialsFile()
  if (credentialsFile) {
    console.log('[Google Admin] Usando credenciales desde archivo:', credentialsFile)
    return JSON.parse(fs.readFileSync(credentialsFile, 'utf-8'))
  }

  // Opción 2: Variables individuales (para Vercel/deployments)
  if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    console.log('[Google Admin] Usando credenciales desde variables de entorno individuales')
    const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)
    return {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID || '',
      private_key: privateKey,
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      token_uri: 'https://oauth2.googleapis.com/token',
    }
  }

  // Opción 3: JSON completo en variable de entorno
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    console.log('[Google Admin] Usando credenciales desde GOOGLE_CREDENTIALS_JSON')
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    if (credentials.private_key) {
      credentials.private_key = normalizePrivateKey(credentials.private_key)
    }
    return credentials
  }

  throw new Error(
    'No se encontraron credenciales de Google. Coloca el archivo JSON de service account en la raíz del proyecto, o configura GOOGLE_PRIVATE_KEY y GOOGLE_SERVICE_ACCOUNT_EMAIL en tu .env'
  )
}

function getAuth() {
  const credentials = getCredentials()

  // El subject debe ser un admin del dominio que delegó acceso a la service account
  const subject = process.env.GOOGLE_ADMIN_EMAIL

  if (!subject) {
    throw new Error(
      'Configura GOOGLE_ADMIN_EMAIL en tu .env con el email del administrador del dominio'
    )
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user',
      'https://www.googleapis.com/auth/admin.directory.orgunit',
      'https://www.googleapis.com/auth/admin.directory.user.security',
    ],
    clientOptions: {
      subject,
    },
  })

  return auth
}

export function getAdminDirectory() {
  const auth = getAuth()
  return google.admin({ version: 'directory_v1', auth })
}

// === USUARIOS ===

export async function listWorkspaceUsers(params?: {
  query?: string
  orgUnitPath?: string
  maxResults?: number
  pageToken?: string
}) {
  const directory = getAdminDirectory()
  const customer = process.env.GOOGLE_CUSTOMER_ID || 'my_customer'

  const response = await directory.users.list({
    customer,
    query: params?.query || undefined,
    maxResults: params?.maxResults || 100,
    pageToken: params?.pageToken || undefined,
    orderBy: 'familyName',
    projection: 'full',
  })

  return {
    users: response.data.users || [],
    nextPageToken: response.data.nextPageToken,
  }
}

export async function getWorkspaceUser(userKey: string) {
  const directory = getAdminDirectory()
  const response = await directory.users.get({
    userKey,
    projection: 'full',
  })
  return response.data
}

export async function createWorkspaceUser(userData: {
  primaryEmail: string
  name: { givenName: string; familyName: string }
  password: string
  orgUnitPath?: string
  changePasswordAtNextLogin?: boolean
}) {
  const directory = getAdminDirectory()
  const response = await directory.users.insert({
    requestBody: {
      primaryEmail: userData.primaryEmail,
      name: userData.name,
      password: userData.password,
      orgUnitPath: userData.orgUnitPath || '/',
      changePasswordAtNextLogin: userData.changePasswordAtNextLogin ?? true,
    },
  })
  return response.data
}

export async function updateWorkspaceUser(
  userKey: string,
  userData: {
    name?: { givenName?: string; familyName?: string }
    suspended?: boolean
    orgUnitPath?: string
    password?: string
    changePasswordAtNextLogin?: boolean
  }
) {
  const directory = getAdminDirectory()
  const response = await directory.users.update({
    userKey,
    requestBody: userData,
  })
  return response.data
}

export async function deleteWorkspaceUser(userKey: string) {
  const directory = getAdminDirectory()
  await directory.users.delete({ userKey })
  return { success: true }
}

export async function suspendWorkspaceUser(userKey: string, suspended: boolean) {
  return updateWorkspaceUser(userKey, { suspended })
}

// === UNIDADES ORGANIZATIVAS ===

export async function listOrgUnits() {
  const directory = getAdminDirectory()
  const customer = process.env.GOOGLE_CUSTOMER_ID || 'my_customer'

  const response = await directory.orgunits.list({
    customerId: customer,
    type: 'all',
  })

  return response.data.organizationUnits || []
}

export async function getOrgUnit(orgUnitPath: string) {
  const directory = getAdminDirectory()
  const customer = process.env.GOOGLE_CUSTOMER_ID || 'my_customer'

  const response = await directory.orgunits.get({
    customerId: customer,
    orgUnitPath: orgUnitPath.startsWith('/') ? orgUnitPath.substring(1) : orgUnitPath,
  })

  return response.data
}

export async function listUsersByOrgUnit(orgUnitPath: string) {
  const directory = getAdminDirectory()
  const customer = process.env.GOOGLE_CUSTOMER_ID || 'my_customer'

  const response = await directory.users.list({
    customer,
    query: `orgUnitPath='${orgUnitPath}'`,
    maxResults: 500,
    projection: 'full',
  })

  return response.data.users || []
}
