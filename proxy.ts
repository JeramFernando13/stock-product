import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const session = request.cookies.get('stock-session')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isRegisterPage = request.nextUrl.pathname.startsWith('/register')

  if (!session && !isAuthPage && !isRegisterPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}