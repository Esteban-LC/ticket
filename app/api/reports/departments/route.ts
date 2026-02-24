import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      select: { id: true, permissions: true },
    })

    if (!user || !user.permissions.includes('VIEW_DEPARTMENT_REPORTS')) {
      return NextResponse.json({ error: 'Acceso restringido' }, { status: 403 })
    }

    const allReports = await prisma.report.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by department → user
    const deptMap: Record<string, {
      departmentId: string
      departmentName: string
      users: Record<string, {
        userId: string
        userName: string | null
        userEmail: string
        reports: typeof allReports
      }>
    }> = {}

    for (const report of allReports) {
      const deptId = report.user.department?.id ?? 'sin-departamento'
      const deptName = report.user.department?.name ?? 'Sin Departamento'
      const userId = report.user.id

      if (!deptMap[deptId]) {
        deptMap[deptId] = { departmentId: deptId, departmentName: deptName, users: {} }
      }
      if (!deptMap[deptId].users[userId]) {
        deptMap[deptId].users[userId] = {
          userId,
          userName: report.user.name,
          userEmail: report.user.email,
          reports: [],
        }
      }
      deptMap[deptId].users[userId].reports.push(report)
    }

    const result = Object.values(deptMap).map(dept => ({
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      users: Object.values(dept.users),
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener reportes por departamento' }, { status: 500 })
  }
}
