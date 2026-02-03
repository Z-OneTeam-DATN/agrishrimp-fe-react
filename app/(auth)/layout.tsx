import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className='flex h-screen w-full items-center justify-center bg-background p-4'>{children}</div>
}
