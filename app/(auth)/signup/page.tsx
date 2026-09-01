import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import SignupForm from "@/components/auth/SignupForm";
import GoogleLoginBtn from "@/components/auth/GoogleLoginBtn";
import { AUTH_MOBILE_LOGO_SHADOW } from "@/components/auth/auth-theme";
export const metadata = {
  title: "Đăng ký tài khoản - AgriShrimp",
  description: "Tạo tài khoản mới để bắt đầu quản lý trại tôm.",
};

export default function SignupPage() {
  return (
    <div className="min-h-[100dvh] w-full flex font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden bg-white">
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden group">
        <div className="absolute inset-0 transition-transform [transition-duration:20s] ease-in-out group-hover:scale-105">
          <Image
            src="/images/register-bg.png"
            alt="AgriShrimp Farmer"
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
                Join The Future
              </span>
            </div>
          </div>
          <div className="mb-4 relative">
            <div className="w-16 h-1.5 bg-gradient-to-r from-blue-400 to-transparent mb-6 rounded-full"></div>
            <h2 className="text-4xl lg:text-[3rem] font-extrabold tracking-tight mb-4 leading-[1.1]">
              Kiến tạo <br />{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200">
                Thành công mới
              </span>
            </h2>
            <p className="text-blue-50/80 text-base max-w-lg leading-relaxed font-light border-l border-white/20 pl-6">
              "Người nuôi tôm thông minh không chỉ làm việc chăm chỉ, mà còn
              biết tận dụng công nghệ để bứt phá."
            </p>
            <div className="mt-8 flex gap-8 border-t border-white/10 pt-6">
              <div>
                <p className="text-xl font-bold text-white">2.5k+</p>
                <p className="text-[10px] text-blue-200/60 uppercase tracking-widest font-semibold">
                  Trang trại
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">98%</p>
                <p className="text-[10px] text-blue-200/60 uppercase tracking-widest font-semibold">
                  Hài lòng
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-blue-200/50 font-medium tracking-wide">
            <span>© 2024 AGRISHRIMP INC.</span>
          </div>
        </div>
      </div>

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
                Đăng ký tài khoản
              </h2>
              <p className="text-sm text-slate-500">
                Nhập thông tin để bắt đầu
              </p>
            </div>

            <SignupForm />

            <div className="relative flex items-center gap-4 py-1 mt-5 mb-5">
              <div className="flex-grow h-px bg-slate-200"></div>
              <span className="flex-shrink-0 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Hoặc Google
              </span>
              <div className="flex-grow h-px bg-slate-200"></div>
            </div>

            <GoogleLoginBtn />
          </div>
        </div>
      </div>
    </div>
  );
}

