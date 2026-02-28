"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminCustomerTable } from "@/components/admin/AdminCustomerTable";
import { customerService } from "@/app/services/customer.service";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react"; // Thêm icon cho Modal
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useRouter } from "next/navigation";

export default function CustomerManagementPage() {
  const { hasPermission, isLoadingAuth } = usePermissions();
  const router = useRouter();
  
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<{ id: number; status: string } | null>(null);

  useEffect(() => {
    if (!isLoadingAuth && !hasPermission(P.CUSTOMER_VIEW)) {
      router.push("/admin/forbidden");
    }
  }, [isLoadingAuth, hasPermission, router]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getAll(
        keyword,
        status,
        page,
        pageSize,
      );
      setCustomers(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Lỗi fetch khách hàng:", error);
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [keyword, status, page]);

  const handleToggleClick = (userId: number, currentStatus: string) => {
    setTargetUser({ id: userId, status: currentStatus });
    setIsModalOpen(true);
  };

  const executeToggleStatus = async () => {
    if (!targetUser) return;
    
    setIsModalOpen(false);

    const isLocking = targetUser.status === "ACTIVE";
    const actionText = isLocking ? "khóa" : "mở khóa";
    const toastId = toast.loading(`Đang xử lý ${actionText} tài khoản #${targetUser.id}...`);

    try {
      await customerService.toggleStatus(targetUser.id);
      
      toast.success(`Đã ${actionText} tài khoản #${targetUser.id} thành công!`, { 
        id: toastId,
        duration: 3000
      });
      
      fetchCustomers();
    } catch (error) {
      console.error(`Lỗi khi ${actionText} tài khoản:`, error);
      toast.error(`Thất bại: Không thể ${actionText} tài khoản #${targetUser.id}!`, { 
        id: toastId,
        duration: 4000
      });
    }
  };

  const statusFilters = [
    { label: "Trạng thái: Tất cả", value: "all" },
    { label: "Đang hoạt động", value: "ACTIVE" },
    { label: "Đang tạm khóa", value: "INACTIVE" },
  ];

  return (
    <div className="space-y-3 relative">
      <AdminPageHeader
        title="Quản lý danh sách khách hàng"
        addBtnLabel="Thêm khách hàng"
        addBtnHref="/admin/customers/add"
        permission={P.CUSTOMER_CREATE}
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên, số điện thoại..."
          filter2Placeholder="Trạng thái tài khoản"
          filter2Options={statusFilters}
          onSearch={(val) => {
            setKeyword(val);
            setPage(0);
          }}
          onFilter2Change={(val) => {
            setStatus(val);
            setPage(0);
          }}
          onRefresh={fetchCustomers}
        />

        {isLoading ? (
          <div className="p-20 text-center flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Đang truy xuất dữ liệu...
            </p>
          </div>
        ) : (
          <AdminCustomerTable 
            customers={customers} 
            onToggleStatus={handleToggleClick}
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </div>

      {isModalOpen && targetUser && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[15px] font-black uppercase text-slate-800 tracking-tight flex items-center gap-2">
                <AlertTriangle size={18} className={targetUser.status === "ACTIVE" ? "text-rose-500" : "text-emerald-500"} />
                Xác nhận thao tác
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn <strong className={targetUser.status === "ACTIVE" ? "text-rose-600" : "text-emerald-600"}>
                  {targetUser.status === "ACTIVE" ? "KHÓA" : "MỞ KHÓA"}
                </strong> tài khoản khách hàng <strong>#{targetUser.id}</strong> không?
              </p>
              {targetUser.status === "ACTIVE" && (
                <p className="text-[12px] text-slate-500 mt-2 italic">
                  * Khách hàng sẽ không thể đăng nhập và mua hàng sau khi bị khóa.
                </p>
              )}
            </div>

            {/* Footer Modal (Nút bấm) */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="text-[12px] font-bold uppercase tracking-widest h-9"
              >
                Hủy bỏ
              </Button>
              <Button 
                onClick={executeToggleStatus}
                className={cn(
                  "text-[12px] font-bold uppercase tracking-widest h-9 text-white shadow-sm hover:shadow-md transition-all",
                  targetUser.status === "ACTIVE" 
                    ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-200" 
                    : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200"
                )}
              >
                {targetUser.status === "ACTIVE" ? "Khóa ngay" : "Mở khóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}