import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Agri-Shrimp
        </h1>
        <p className="text-xl text-muted-foreground">
          Dự án quản lý nông nghiệp
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="default">Đăng nhập</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">Đăng ký</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
