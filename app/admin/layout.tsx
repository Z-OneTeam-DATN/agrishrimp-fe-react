import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopHeader from "@/components/admin/AdminTopHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      {/* Sidebar cố định */}
      <AdminSidebar />

      {/* Nội dung chính bên phải */}
      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader />
        <main className="p-8 max-w-[1600px]">
          {children}
        </main>
      </div>
    </div>
  );
}