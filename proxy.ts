import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy/Middleware in Next.js 16 für Routing & Session-Management
 */
export function proxy(request: NextRequest) {
  const demoRole = request.cookies.get('m_one_demo_role')?.value
  const pathname = request.nextUrl.pathname

  // Login-Seite und Root-Seite immer sauber durchlassen
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.next()
  }

  // Demo-Rollen durchlassen
  if (demoRole === 'admin' || demoRole === 'driver') {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const middleware = proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
