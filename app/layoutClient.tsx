'use client'

import { useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { usePathname } from 'next/navigation';

import Header from "@/components/site/SiteHeader";
import Navbar from "@/components/site/SiteNavbar";
import Footer from "@/components/site/SiteFooter";

export default function LayoutClient({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const queryClientRef = useRef<QueryClient>()

  // Các route không hiển thị Header/Footer chung của trang chủ
  const isHideLayout = pathname.startsWith('/inventory') || 
                       pathname.startsWith('/login') || 
                       pathname.startsWith('/signup') || 
                       pathname.startsWith('/reset-password');

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 0
        }
      }
    })
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
        
        {isHideLayout ? (
          // Giao diện cho trang quản lý/xác thực (Không Header/Footer trang chủ)
          <>
            {children}
          </>
        ) : (
          // Giao diện chính cho trang khách (Landing, Home...)
          <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
              <Header />
              <Navbar />
              <main className="flex-1">
                  {children}
              </main>
              <Footer />
          </div>
        )}

        <ToastContainer
          position='top-right'
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='colored'
        />
        <Toaster position='top-right' />
      </ThemeProvider>
    </QueryClientProvider>
  )
}