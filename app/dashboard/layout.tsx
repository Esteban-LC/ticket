import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SidebarProvider } from '@/contexts/SidebarContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  )
}
