import { AuthService } from '@/app/services/auth.service'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')
  if (!accessToken) {
    const response = NextResponse.json(
      {
        detail: 'Không nhận được accessToken',
        status: 401
      },
      { status: 401 }
    )
    return response
  }
  const result = await AuthService.logout()
  const res200 = NextResponse.json(result, { status: 200 })
  res200.cookies.delete('accessToken')
  res200.cookies.delete('refreshToken')
  return res200
}
