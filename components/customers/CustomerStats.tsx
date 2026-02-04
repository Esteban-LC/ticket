import { Users, Ticket, AlertCircle } from 'lucide-react'

interface CustomerStatsProps {
  totalCustomers: number
  openTickets: number
  totalTickets: number
}

export default function CustomerStats({ totalCustomers, openTickets, totalTickets }: CustomerStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalCustomers}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <Users className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tickets Abiertos</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{openTickets}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalTickets}</p>
          </div>
          <div className="bg-primary-100 p-3 rounded-lg">
            <Ticket className="h-6 w-6 text-primary-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
