import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Các trang chỉ dành cho người chưa đăng nhập (Auth pages)
const AUTH_PATHS = [
  '/login',
  '/signup',
  '/reset-password',
]

// Các trang yêu cầu phải đăng nhập (Private pages)
const PROTECTED_PATHS = [
  '/profile',
  '/edit-profile',
  '/address',
  '/orders',
  '/ponds',
  '/voucher',
  '/ai-doctor',
  '/cart',
]

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Bỏ qua các đường dẫn static và api
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/images') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('accessToken')?.value ?? req.cookies.get('refreshToken')?.value
  
  const isAuthPath = AUTH_PATHS.some(p => path.startsWith(p))
  const isProtectedPath = PROTECTED_PATHS.some(p => path.startsWith(p)) || path.startsWith('/admin') || path.startsWith('/inventory')

  // 1. Nếu đã đăng nhập mà cố vào trang login/signup -> về trang chủ
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // 2. Nếu chưa đăng nhập mà vào trang yêu cầu tài khoản -> về trang login
  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
