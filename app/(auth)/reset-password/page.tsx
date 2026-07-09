import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { AUTH_ACCENT_SOLID, AUTH_ACCENT_TEXT, AUTH_CARD } from "@/components/auth/auth-theme";

export default function ResetPasswordPage() {
  return (
    <Card className={`w-full max-w-md border-none ${AUTH_CARD}`}>
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Quên mật khẩu?</CardTitle>
        <CardDescription className="text-slate-500">
          Nhập email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại
          mật khẩu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
        <p className="mt-5 text-center text-sm text-slate-500">
          Nhớ mật khẩu của bạn?{" "}
          <Link
            href="/login"
            className={`font-semibold underline-offset-4 hover:underline ${AUTH_ACCENT_TEXT}`}
          >
            Đăng nhập
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
