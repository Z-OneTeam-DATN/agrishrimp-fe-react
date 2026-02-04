'use client'

import { useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { usePathname } from 'next/navigation';

// 1. Thêm import usePathname
import { usePathname } from 'next/navigation';

import Header from "@/components/site/SiteHeader";
import Navbar from "@/components/site/SiteNavbar";
import Footer from "@/components/site/SiteFooter";

export default function LayoutClient({ children }: Readonly<{ children: React.ReactNode }>) {
<<<<<<< HEAD
  // 2. Lấy đường dẫn hiện tại
  const pathname = usePathname();

  // 3. Kiểm tra xem có phải trang admin không
  // Nếu đường dẫn bắt đầu bằng "/admin", biến này sẽ là true
  const isAdminPage = pathname?.startsWith('/admin');

=======
  const pathname = usePathname();
>>>>>>> 14c61a9c9f25135cd1f72c8fb4fe114cdc9562e3
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
<<<<<<< HEAD

        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            {/* 4. Chỉ hiện Header/Navbar nếu KHÔNG PHẢI là trang Admin */}
            {!isAdminPage && (
              <>
                <Header />
                <Navbar />
              </>
            )}

            <main className="flex-1">
                {children}
            </main>

            {/* 5. Chỉ hiện Footer nếu KHÔNG PHẢI là trang Admin */}
            {!isAdminPage && <Footer />}
        </div>

=======
        
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

>>>>>>> 14c61a9c9f25135cd1f72c8fb4fe114cdc9562e3
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