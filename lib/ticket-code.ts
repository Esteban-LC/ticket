import { Prisma, PrismaClient } from '@prisma/client'

const AREA_CODE_MAP: Record<string, string> = {
  SISTEMAS: 'SIS',
  DIRECCION: 'DIR',
  ADMINISTRACION: 'ADM',
  ACADEMIA: 'ACA',
  CONTABILIDAD: 'CON',
  MEDIOS: 'MED',
  VENTAS: 'VTA',
  'COORD LIQ': 'CLQ',
}

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeAreaName(value?: string | null) {
  if (!value) return ''

  return stripAccents(value)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolveAreaCode(area?: string | null) {
  const normalizedArea = normalizeAreaName(area)

  if (!normalizedArea) {
    return 'GEN'
  }

  if (AREA_CODE_MAP[normalizedArea]) {
    return AREA_CODE_MAP[normalizedArea]
  }

  const lettersOnly = normalizedArea.replace(/[^A-Z]/g, '')
  if (!lettersOnly) {
    return 'GEN'
  }

  return lettersOnly.slice(0, 3).padEnd(3, 'X')
}

export function buildTicketCode(areaCode: string, date: Date, sequence: number) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const sequencePart = String(sequence).padStart(5, '0')

  return `${areaCode}-${year}${month}${day}-${sequencePart}`
}

export async function generateTicketCode(
  db: PrismaExecutor,
  input: {
    area?: string | null
    createdAt?: Date
  }
) {
  const createdAt = input.createdAt ?? new Date()
  const areaCode = resolveAreaCode(input.area)
  const dateKey = buildTicketCode(areaCode, createdAt, 0).split('-')[1]

  const sequence = await db.ticketSequence.upsert({
    where: {
      areaCode_dateKey: {
        areaCode,
        dateKey,
      },
    },
    create: {
      areaCode,
      dateKey,
      lastValue: 1,
    },
    update: {
      lastValue: {
        increment: 1,
      },
    },
    select: {
      lastValue: true,
    },
  })

  return buildTicketCode(areaCode, createdAt, sequence.lastValue)
}
