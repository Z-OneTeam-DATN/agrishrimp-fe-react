"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminRoleTable } from "@/components/admin/AdminRoleTable";
import { RoleService } from "@/app/services/RoleService";
import { RoleType } from "@/app/types/role.schema";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

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
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const canCreateRole = hasPermission(P.ROLE_CREATE);
  
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
      <div className="mt-2 mb-8">
        <div className="mb-4">
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Quản lý vai trò hệ thống
          </h1>
        </div>

        <AdminSearchFilter 
          placeholder="Tìm kiếm tên vai trò, slug..." 
          containerClassName="bg-transparent border-b-0 px-0 pt-0"
          filter1Placeholder="Lọc theo nhóm"
          filter1Options={typeFilters}
          onFilter1Change={handleTypeChange}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          onFilter2Change={handleStatusChange}
          onSearch={handleSearch}
          onRefresh={fetchRoles}
          hideRefreshButton
          hideSort
          hideSettingsButton
          trailingContent={canCreateRole ? (
            <Link href="/admin/employees/roles/add">
              <Button className="h-[38px] px-4 text-[14px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all">
                <Plus className="mr-2 h-4 w-4" />
                Thêm vai trò mới
              </Button>
            </Link>
          ) : undefined}
        />
        
        {loading ? (
          <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
            <AdminDataSyncLoader />
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

