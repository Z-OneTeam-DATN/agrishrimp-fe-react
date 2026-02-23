"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminRoleTable } from "@/components/admin/AdminRoleTable";
import { Users } from "lucide-react";
import { RoleService } from "@/app/services/RoleService";
import { RoleType } from "@/app/types/role.schema";
import { toast } from "sonner";

const typeFilters = [
  { label: "Tất cả nhóm", value: "all" },
  { label: "Vai trò hệ thống", value: "system" },
  { label: "Vai trò tự tạo", value: "custom" },
];

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Tạm ngưng", value: "INACTIVE" },
];

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  
  const [filters, setFilters] = useState({
    keyword: "",
    type: "all",
    status: "all",
    page: 0,
    size: 10
  });

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      
      const queryParams: any = {
        page: filters.page,
        size: filters.size,
        keyword: filters.keyword || undefined,
        type: filters.type === "all" ? undefined : filters.type.toUpperCase(),
        status: filters.status === "all" ? undefined : filters.status.toUpperCase(),
      };

      const data = await RoleService.getAll(queryParams);
      
      if (data && data.content) {
        setRoles(data.content);
        setTotalElements(data.totalElements);
      } else {
        setRoles(Array.isArray(data) ? data : []);
        setTotalElements(Array.isArray(data) ? data.length : 0);
      }
    } catch (error: any) {
      console.error("Failed to fetch roles:", error);
      if (error.message === "Network Error") {
        toast.error("Không thể kết nối tới máy chủ. Vui lòng kiểm tra Backend đã chạy chưa.");
      } else {
        toast.error("Không thể tải danh sách vai trò");
      }
      setRoles([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Handlers
  const handleSearch = (val: string) => {
    setFilters(prev => ({ ...prev, keyword: val, page: 0 }));
  };

  const handleTypeChange = (val: string) => {
    setFilters(prev => ({ ...prev, type: val, page: 0 }));
  };

  const handleStatusChange = (val: string) => {
    setFilters(prev => ({ ...prev, status: val, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
        <AdminPageHeader 
          title="Danh sách vai trò hệ thống" 
          addBtnLabel="Thêm vai trò mới" 
          addBtnHref="/admin/employees/roles/add" 
          secondaryBtnLabel="Quản lý nhân sự"
          secondaryBtnHref="/admin/employees"
          secondaryBtnIcon={Users}
        />
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm kiếm tên vai trò, slug..." 
          filter1Placeholder="Lọc theo nhóm"
          filter1Options={typeFilters}
          onFilter1Change={handleTypeChange}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          onFilter2Change={handleStatusChange}
          onSearch={handleSearch}
          onRefresh={fetchRoles}
        />
        
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium italic">
            Đang tải dữ liệu...
          </div>
        ) : (
          <AdminRoleTable 
            roles={roles || []} 
            onRefresh={fetchRoles} 
            totalElements={totalElements}
            currentPage={filters.page}
            pageSize={filters.size}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
