import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Loader2 } from "lucide-react";
import { ResetPasswordConfirmForm } from "@/components/auth/ResetPasswordConfirmForm";
import { AUTH_MOBILE_LOGO_SHADOW } from "@/components/auth/auth-theme";

export const metadata = {
  title: "Đặt lại mật khẩu - AgriShrimp",
  description: "Đặt mật khẩu mới cho tài khoản AgriShrimp của bạn.",
};

export default function ResetPasswordConfirmPage() {
  return (
    <div className="min-h-[100dvh] w-full flex font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden bg-white">
      {/* --- LEFT SIDE (Desktop Image) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden group">
        <div className="absolute inset-0 transition-transform [transition-duration:20s] ease-in-out group-hover:scale-105">
          <Image
            src="/images/shrimp-farm-bg.png"
            alt="AgriShrimp Background"
            fill
            className="object-cover opacity-90"
            priority
            sizes="50vw"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-blue-900/70 to-blue-900/30" />

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-5">
            <div className="relative group/logo cursor-default">
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl blur-md opacity-50 group-hover/logo:opacity-100 transition duration-500"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                <Image
                  src="/images/logo_arishrimp.jpg"
                  width={40}
                  height={40}
                  alt="Logo"
                  className="rounded-xl object-cover w-full h-full p-0.5"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-wide text-white drop-shadow-md">
                Agri<span className="text-blue-300">Shrimp</span>
              </h1>
              <span className="text-[10px] text-blue-100 uppercase tracking-[0.2em] font-medium border-l-2 border-blue-400 pl-2 opacity-80">
                Smart Farming
              </span>
            </div>
          </div>

          <div className="mb-4 relative">
            <div className="w-16 h-1.5 bg-gradient-to-r from-blue-400 to-transparent mb-6 rounded-full"></div>

            <h2 className="text-4xl lg:text-[3rem] font-extrabold tracking-tight mb-4 leading-[1.1]">
              Mật khẩu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 animate-pulse-slow">
                Mới an toàn
              </span>
            </h2>

            <p className="text-blue-50/80 text-base max-w-lg leading-relaxed font-light border-l border-white/20 pl-6">
              "Chọn một mật khẩu mạnh để bảo vệ tài khoản AgriShrimp của bạn."
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-blue-200/50 font-medium tracking-wide">
            <span>© 2024 AGRISHRIMP INC.</span>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE (FORM) --- */}
      <div className="w-full lg:w-1/2 bg-white relative overflow-y-auto h-screen">
        <div className="fixed top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full opacity-50 pointer-events-none z-0" />

        <Link
          href="/"
          className="fixed top-4 right-4 lg:absolute lg:top-6 lg:right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200 z-50 bg-white/50 backdrop-blur-sm lg:bg-transparent"
        >
          <X size={20} />
        </Link>

        <div className="min-h-full flex flex-col justify-center items-center py-8 px-6">
          <div className="w-full max-w-[420px] relative z-10">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center mb-6">
              <div className={`relative w-16 h-16 rounded-xl ${AUTH_MOBILE_LOGO_SHADOW} overflow-hidden border-4 border-white mb-3`}>
                <Image
                  src="/images/logo_arishrimp.jpg"
                  alt="Logo"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Agri<span className="text-blue-600">Shrimp</span>
              </h1>
            </div>

            <div className="mb-4 text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 mb-1">
                Đặt mật khẩu mới
              </h2>
              <p className="text-sm text-slate-500">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              }
            >
              <ResetPasswordConfirmForm />
            </Suspense>

            <div className="mt-8 flex justify-center gap-6 text-xs text-slate-400 pb-4">
              <Link href="#" className="hover:text-blue-600 transition-colors">
                Điều khoản
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="#" className="hover:text-blue-600 transition-colors">
                Bảo mật
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="#" className="hover:text-blue-600 transition-colors">
                Trợ giúp
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
