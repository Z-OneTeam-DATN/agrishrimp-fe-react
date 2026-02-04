'use client'

import { useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';

import Header from "@/components/site/SiteHeader";
import Navbar from "@/components/site/SiteNavbar";
import Footer from "@/components/site/SiteFooter";

export default function LayoutClient({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClientRef = useRef<QueryClient>()
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
        
        {/* Cấu trúc giao diện chính nằm ở đây */}
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            {/* 1. Header & Navbar */}
            <Header />
            <Navbar />

            {/* 2. Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* 3. Footer */}
            <Footer />
        </div>

        {/* Các thành phần thông báo (Toast) */}
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