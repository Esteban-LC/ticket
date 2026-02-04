'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Server, ShieldCheck, Activity, Mail, Lock, ArrowRight, Moon, Sun } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Cargar modo oscuro desde localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
    }
  }, [])

  // Guardar modo oscuro en localStorage cuando cambie
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError('Credenciales inválidas')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const theme = {
    '--brand': darkMode ? '#3b82f6' : '#1d4ed8',
    '--brand-dark': darkMode ? '#2563eb' : '#1e3a8a',
    '--ink': darkMode ? '#f1f5f9' : '#0f172a',
  } as CSSProperties

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-950'}`} style={theme}>
      {/* Toggle Dark Mode Button */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left Section */}
        <section className={`relative overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-950'} px-8 py-12 text-white lg:px-14`}>
          <div className="absolute inset-0">
            <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(circle_at_top,_#334155,_#1e293b_70%)]' : 'bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_70%)]'}`} />
            <div className={`absolute -left-24 top-24 h-72 w-72 rounded-full ${darkMode ? 'bg-blue-600/20' : 'bg-[#0f172a]'} blur-3xl`} />
            <div className={`absolute -bottom-24 right-10 h-80 w-80 rounded-full ${darkMode ? 'bg-indigo-600/20' : 'bg-[#111827]'} blur-3xl`} />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between gap-12">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-slate-300">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? 'bg-white/20' : 'bg-white/10'}`}>
                <Server className="h-5 w-5" />
              </div>
              <span>IT PORTAL</span>
            </div>

            <div className="max-w-xl space-y-6">
              <p className={`text-sm font-semibold ${darkMode ? 'text-blue-400' : 'text-slate-300'}`}>Tickets LICEO MICHOACANO</p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Gestión Centralizada
                <span className={`block ${darkMode ? 'text-blue-300' : 'text-slate-200'}`}>de Servicios TI</span>
              </h1>
              <p className={`text-base leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-300'} sm:text-lg`}>
                Optimiza el flujo de trabajo, gestiona incidencias y mantén el control de la
                infraestructura tecnológica de tu organización en un solo lugar.
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                <div className={`flex items-center gap-2 rounded-full border ${darkMode ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/5'} px-4 py-2`}>
                  <ShieldCheck className="h-4 w-4" />
                  Seguridad enterprise
                </div>
                <div className={`flex items-center gap-2 rounded-full border ${darkMode ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/5'} px-4 py-2`}>
                  <Activity className="h-4 w-4" />
                  Alta disponibilidad
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Acceso exclusivo para personal autorizado.
            </div>
          </div>
        </section>

        {/* Right Section - Login Form */}
        <section className={`flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-white'} px-8 py-12 lg:px-14`}>
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-2">
              <h2 className={`text-3xl font-semibold ${darkMode ? 'text-white' : 'text-[var(--ink)]'}`}>Bienvenido de nuevo</h2>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className={`${darkMode ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded`}>
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`} htmlFor="email">
                  Correo institucional
                </label>
                <div className="relative">
                  <Mail className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="usuario@liceomichoacano.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900'} py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`} htmlFor="password">
                    Contraseña
                  </label>
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    ¿Problemas? Contacta a Sistemas
                  </span>
                </div>
                <div className="relative">
                  <Lock className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900'} py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] py-3 text-sm font-semibold text-white shadow-lg ${darkMode ? 'shadow-blue-500/30' : 'shadow-blue-500/20'} transition hover:bg-[var(--brand-dark)] disabled:opacity-50`}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className={`pt-6 text-center text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Acceso exclusivo para personal autorizado
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
