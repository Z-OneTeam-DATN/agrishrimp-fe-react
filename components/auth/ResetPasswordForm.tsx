'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from 'sonner'
import { ResetPasswordSchema } from '@/app/types/auth.schema'
import { FormTextField } from '../form-control/FormTextField'

type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>

export function ResetPasswordForm() {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  function onSubmit(data: ResetPasswordFormValues) {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: 'Đang gửi yêu cầu...',
      success: () => {
        console.log('Password reset request for:', data.email)
        return 'Đã gửi liên kết đặt lại mật khẩu!'
      },
      error: 'Không thể gửi yêu cầu. Vui lòng thử lại.'
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormTextField
          control={form.control}
          name='email'
          label='Email'
          placeholder='name@example.com'
          type='email'
          autoComplete='email'
        />

        <Button type='submit' className='w-full' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
        </Button>
      </form>
    </Form>
  )
}
