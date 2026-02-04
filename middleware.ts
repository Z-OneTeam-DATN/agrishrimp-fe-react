import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


const PUBLIC_PATHS = [
  '/login',
  '/signup', 
  '/reset-password',
  '/account',
  '/ordering',
  '/packing',
  '/shipping-fee',
  '/warranty-policy',
  '/return',
  '/about',
  '/contact',
  '/terms-of-use',
  '/privacy-policy',
  '/cookie-policy',
  '/clinic-policy',
  '/store-locator',
  '/cart',
  '/inventory'
]


export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Skip middleware for error pages during build
  if (path === '/404' || path === '/500' || path === '/_error') {
    return NextResponse.next()
  }

  const token = req.cookies.get('accessToken')?.value ?? req.cookies.get('refreshToken')?.value
  const isPublicPath = PUBLIC_PATHS.includes(path)
  const isAdminPath = path.startsWith('/admin')

  // Nếu đã đăng nhập và truy cập trang public, chuyển hướng về /chat
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Nếu chưa đăng nhập và truy cập trang private, chuyển hướng về /login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
 if (isAdminPath && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Các trường hợp còn lại cho phép truy cập
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}