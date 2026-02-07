import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

function getAuth() {
  // Opción 1: Variable de entorno con la ruta al archivo JSON
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(process.cwd(), 'google-credentials.json')

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      'No se encontró el archivo de credenciales de Google. ' +
      'Coloca tu archivo google-credentials.json en la raíz del proyecto ' +
      'o configura GOOGLE_APPLICATION_CREDENTIALS en tu .env'
    )
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'))

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
