"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminCustomerTable } from "@/components/admin/AdminCustomerTable";
import { customerService } from "@/app/services/customer.service";
import { toast } from "sonner";

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");

  // Thêm state để quản lý phân trang
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Fetch dữ liệu từ API
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // Gửi keyword, status (viết hoa), page và size xuống Backend
      const data = await customerService.getAll(
        keyword,
        status,
        page,
        pageSize,
      );

      // Backend trả về Page object nên lấy content và totalElements
      setCustomers(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error("Lỗi fetch khách hàng:", error);
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi lại API mỗi khi keyword, status hoặc page thay đổi
  useEffect(() => {
    fetchCustomers();
  }, [keyword, status, page]);

  // ⚠️ Sửa value thành chữ HOA để khớp Enum Backend
  const statusFilters = [
    { label: "Trạng thái: Tất cả", value: "all" },
    { label: "Đang hoạt động", value: "ACTIVE" },
    { label: "Đang tạm khóa", value: "LOCKED" },
  ];

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Quản lý danh sách khách hàng"
        addBtnLabel="Thêm khách hàng"
        addBtnHref="/admin/customers/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên, số điện thoại..."
          filter2Placeholder="Trạng thái tài khoản"
          filter2Options={statusFilters}
          onSearch={(val) => {
            setKeyword(val);
            setPage(0); // Reset về trang đầu khi tìm kiếm
          }}
          onFilter2Change={(val) => {
            setStatus(val);
            setPage(0); // Reset về trang đầu khi lọc
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
          <AdminCustomerTable customers={customers} />
        )}
      </div>
    </div>
  );
}
