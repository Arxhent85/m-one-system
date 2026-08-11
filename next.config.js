/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com', '*.loca.lt', '192.168.88.101', 'localhost:*', '*'],
  typescript: {
    // ⚠ TEMPORARY: ignoriert TS-Fehler bis echte Supabase-Typen via
    // `supabase gen types typescript --project-id <id>` generiert werden.
    // Nach dem Setup entfernen.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
