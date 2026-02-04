import AdminSidebar from "@/components/admin/shared/AdminSidebar";
import AdminTopHeader from "@/components/admin/shared/AdminTopHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopHeader />
        <main className="flex-1 overflow-y-auto p-[15px] pt-[20px]">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
