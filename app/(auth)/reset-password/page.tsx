import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ResetPasswordPage() {
  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>Quên mật khẩu?</CardTitle>
        <CardDescription>
          Nhập email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
        <p className='mt-4 text-center text-sm text-muted-foreground'>
          Nhớ mật khẩu của bạn?{' '}
          <Link href='/login' className='font-medium text-primary underline-offset-4 hover:underline'>
            Đăng nhập
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
