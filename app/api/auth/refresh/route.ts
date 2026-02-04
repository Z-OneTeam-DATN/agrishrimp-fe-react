import { AuthService } from '@/app/services/auth.service'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(_request: Request) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')
  if (!refreshToken) {
    return NextResponse.json({
      detail: 'Không nhận được refreshToken',
      status: 401
    })
  }
  const res = await AuthService.refresh(refreshToken.value as string)

  const accessToken = jwtDecode<JwtPayload>(res.accessToken)
  const expiresDateAccessToken =
    typeof accessToken.exp === 'number'
      ? new Date(accessToken.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const response = NextResponse.json(res, { status: 200 })

  response.cookies.set({
    name: 'accessToken',
    value: res.accessToken,
    path: '/',
    httpOnly: true,
    expires: expiresDateAccessToken,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  return response
}
