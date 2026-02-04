import { InventorySidebar } from "@/components/site/InventorySidebar";
import { InventoryTopbar } from "@/components/site/InventoryTopbar";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f2f3f5] text-[13px] text-[#1f1f1f]">
      {/* Sidebar - Cố định 260px */}
      <div className="hidden lg:block h-full w-[260px] flex-shrink-0">
        <InventorySidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <InventoryTopbar />
        
        <main className="flex-1 overflow-y-auto p-[15px] pt-[20px]">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
