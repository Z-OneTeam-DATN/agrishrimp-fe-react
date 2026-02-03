import { AuthService } from '@/app/services/auth.service'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  // let isForce = false
  // const body = await request.json()
  // isForce = body?.force === true
  // if (isForce) {
  //   const response = NextResponse.json({ message: 'Buộc đăng xuất thành công' }, { status: 200 })
  //  response.cookies.delete('accessToken')
  //  response.cookies.delete('refreshToken')
  //   return response
  // }

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
