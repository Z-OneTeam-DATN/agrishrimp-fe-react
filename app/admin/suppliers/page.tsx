"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminSupplierTable } from "@/components/admin/AdminSupplierTable";
import { supplierService } from "@/app/services/supplier.service";
import { Supplier } from "@/app/types/supplier.type";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SupplierListPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State cho tìm kiếm, lọc & phân trang
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [dynamicCategories, setDynamicCategories] = useState<
    { label: string; value: string }[]
  >([]);

  const pageSize = 10;

  // 1. Lấy danh sách danh mục (Sử dụng Service thay vì gọi apiJava trực tiếp)
  const fetchDynamicCategories = async () => {
    try {
      // 👇 Gọi qua service
      const data = await supplierService.getCategories();

      // Map dữ liệu từ API thành format cho Select
      const options = data.map(
        (cat: { id: number | string; name: string }) => ({
          label: cat.name,
          value: cat.id.toString(),
        }),
      );
      setDynamicCategories(options);
    } catch (error) {
      console.error("Không load được danh mục động:", error);
    }
  };

  // 2. Hàm gọi API lấy danh sách nhà cung cấp
  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await supplierService.getAll(
        keyword,
        categoryId === "all" ? undefined : categoryId,
        status === "all" ? undefined : status,
        currentPage,
        pageSize,
      );

      setSuppliers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      toast.error("Không thể tải danh sách nhà cung cấp");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicCategories();
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [keyword, currentPage, categoryId, status]);

  const handleSearch = (val: string) => {
    setKeyword(val);
    setCurrentPage(0);
  };

  return (
    <div className="space-y-3 pb-10">
      <AdminPageHeader
        title="Quản lý nhà cung cấp hàng hóa"
        addBtnLabel="Thêm nhà cung cấp"
        addBtnHref="/admin/suppliers/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên, MST, SĐT..."
          onSearch={handleSearch}
          onRefresh={fetchSuppliers}
          // Đổ danh mục từ database vào Filter 1
          filter1Options={dynamicCategories}
          onFilter1Change={(val) => {
            setCategoryId(val);
            setCurrentPage(0);
          }}
          // Lọc trạng thái vào Filter 2
          onFilter2Change={(val) => {
            setStatus(val);
            setCurrentPage(0);
          }}
        />

        {/* Nội dung bảng */}
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Đang tải dữ liệu...
          </div>
        ) : suppliers.length > 0 ? (
          <>
            <AdminSupplierTable suppliers={suppliers} />

            {/* Thanh phân trang */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#eee] bg-[#f8f9fa]">
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter">
                Hiển thị {suppliers.length}/{totalElements} kết quả
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold bg-white border-[#ddd]"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  <ChevronLeft size={14} className="mr-1" /> Trước
                </Button>

                <span className="text-[11px] font-bold text-gray-600 px-2">
                  Trang {currentPage + 1} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold bg-white border-[#ddd]"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Sau <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center text-gray-500 text-sm">
            Không tìm thấy nhà cung cấp nào phù hợp với điều kiện lọc.
          </div>
        )}
      </div>
    </div>
  );
}
