import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tickets LICEO MICHOACANO',
    short_name: 'Tickets',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#1d4ed8',
    icons: [],
  }
}

