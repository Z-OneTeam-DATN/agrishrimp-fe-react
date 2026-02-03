import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/reset-password']

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Skip middleware for error pages during build
  if (path === '/404' || path === '/500' || path === '/_error') {
    return NextResponse.next()
  }

  const token = req.cookies.get('accessToken')?.value ?? req.cookies.get('refreshToken')?.value
  const isPublicPath = PUBLIC_PATHS.includes(path)

  // Nếu đã đăng nhập và truy cập trang public, chuyển hướng về /chat
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Nếu chưa đăng nhập và truy cập trang private, chuyển hướng về /login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Các trường hợp còn lại cho phép truy cập
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (thư mục ảnh công khai)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}