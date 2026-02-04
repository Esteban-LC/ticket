'use client'

import Link from 'next/link'
import { MessageSquare, Clock, CheckCircle, Circle, TrendingUp } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    open: number
    pending: number
    solved: number
    total: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Abiertos',
      value: stats.open,
      icon: Circle,
      gradient: 'from-red-500 to-pink-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      link: '/dashboard/tickets?status=OPEN',
    },
    {
      title: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      link: '/dashboard/tickets?status=PENDING',
    },
    {
      title: 'Resueltos',
      value: stats.solved,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      link: '/dashboard/tickets?status=SOLVED',
    },
    {
      title: 'Total',
      value: stats.total,
      icon: MessageSquare,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      link: '/dashboard/tickets',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Link
            key={card.title}
            href={card.link}
            className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700"
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            {/* Content */}
            <div className="relative p-3 lg:p-6">
              <div className="flex items-center justify-between mb-2 lg:mb-4">
                <div className={`${card.iconBg} dark:bg-opacity-20 p-2 lg:p-3 rounded-lg lg:rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-4 w-4 lg:h-6 lg:w-6 ${card.iconColor}`} />
                </div>
                <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                  {card.value}
                </p>
              </div>

              {/* Bottom gradient bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
            </div>
          </Link>
        )
      })}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
