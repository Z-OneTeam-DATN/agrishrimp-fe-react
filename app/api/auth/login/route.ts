import { AuthService } from '@/app/services/auth.service'
import { LoginFormValues } from '@/app/types/user.schema'
import { AxiosError } from 'axios'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const req = (await request.json()) as LoginFormValues
  try {
    const res = await AuthService.login(req)

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

    const refreshToken = jwtDecode<JwtPayload>(res.refreshToken)
    const expiresDateRefreshToken =
      typeof refreshToken.exp === 'number'
        ? new Date(refreshToken.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    response.cookies.set({
      name: 'refreshToken',
      value: res.refreshToken,
      path: '/',
      httpOnly: true,
      expires: expiresDateRefreshToken,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    return response
  } catch (e) {
    if (e instanceof AxiosError) {
      return NextResponse.json({ message: e.message }, { status: e.status || 500 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
