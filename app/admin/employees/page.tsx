"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminEmployeeTable } from "@/components/admin/AdminEmployeeTable";
import { Loader2, Plus } from "lucide-react";
import { EmployeeService } from "@/app/services/employee.service";
import { branchService } from "@/app/services/branchService";
import { UserResponse } from "@/app/types/employee.schema";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { cn } from "@/lib/utils";

export default function EmployeeManagementPage() {
  const { user: currentUser, isAuthenticated, isLoadingAuth } = useAuthStore();
  const { hasPermission } = usePermissions();
  
  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const roleSlug = typeof currentUser?.role === "object" ? currentUser.role?.slug : currentUser?.role;
  const isAdmin = roleSlug?.toLowerCase() === "admin" || roleSlug?.toLowerCase() === "super_admin";
  
  const [filters, setFilters] = useState({
    keyword: "",
    branchId: isAdmin ? "all" : String(currentUser?.branch?.id || "all"),
    status: "all",
    page: 0,
    size: 20,
    sort: "createdAt,desc" 
  });

  const [branches, setBranches] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(filters.keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.keyword]);

  useEffect(() => {
    if (isLoadingAuth || !currentUser) return;

    setFilters((prev) => {
      const nextBranchId = isAdmin ? "all" : String(currentUser.branch?.id || "all");
      if (prev.branchId === nextBranchId) return prev;
      return { ...prev, branchId: nextBranchId, page: 0 };
    });
  }, [currentUser, isAdmin, isLoadingAuth]);

  const fetchInitData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const fetchBranches = hasPermission(P.BRANCH_VIEW) ? branchService.getAll() : Promise.resolve([]);

      const branchesRes = await fetchBranches;

      const branchesData = Array.isArray(branchesRes) ? branchesRes : (branchesRes as any).content || [];
      let branchesList = branchesData.map((b: any) => ({ label: b.name, value: String(b.id) }));

      // Nếu không phải admin, chỉ được xem chi nhánh của mình (2.2)
      if (!isAdmin && currentUser?.branch?.id) {
        branchesList = branchesList.filter((b: any) => b.value === String(currentUser.branch?.id));
      }

      setBranches([{ label: "Tất cả chi nhánh", value: "all" }, ...branchesList]);
    } catch (e) {
      console.error("Error fetching filter data", e);
    }
  }, [isAuthenticated, currentUser, hasPermission, isAdmin]);

  const fetchEmployees = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const queryParams = {
        keyword: debouncedKeyword || undefined,
        branchId: filters.branchId === "all" ? undefined : Number(filters.branchId),
        status: filters.status === "all" ? undefined : filters.status,
        page: filters.page,
        size: filters.size,
        sort: filters.sort
      };

      const data = await EmployeeService.getAll(queryParams);
      
      // Đảm bảo không hiển thị CUSTOMER (1.2)
      const filteredContent = (data.content || []).filter(emp => 
        emp.role?.slug?.toLowerCase() !== "user" && emp.role?.slug?.toLowerCase() !== "customer"
      );
      
      setEmployees(filteredContent);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, filters.branchId, filters.status, filters.page, filters.size, filters.sort, isAuthenticated]);

  useEffect(() => {
    if (!isLoadingAuth) fetchInitData();
  }, [isLoadingAuth, fetchInitData]);

  useEffect(() => {
    if (!isLoadingAuth) fetchEmployees();
  }, [isLoadingAuth, fetchEmployees]);

  const statusFilters = [
    { label: "Tất cả trạng thái", value: "all" },
    { label: "Đang hoạt động", value: "ACTIVE" },
    { label: "Tạm khóa", value: "INACTIVE" },
    { label: "Bị chặn", value: "BANNED" },
  ];

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8">
        <div className="mb-4">
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Quản lý nhân sự hệ thống
          </h1>
        </div>

        <AdminSearchFilter 
          placeholder="Tìm tên, email, SĐT hoặc CCCD..." 
          containerClassName="bg-transparent border-b-0 px-0 pt-0"
          filter1Placeholder="Tất cả chi nhánh"
          filter1Options={branches}
          onFilter1Change={(val) => setFilters(f => ({...f, branchId: val, page: 0}))}
          filter2Placeholder="Tất cả trạng thái"
          filter2Options={statusFilters}
          onFilter2Change={(val) => setFilters(f => ({...f, status: val, page: 0}))}
          onSortChange={(val) => setFilters(f => ({...f, sort: val, page: 0}))}
          onSearch={(val) => setFilters(f => ({...f, keyword: val, page: 0}))}
          onRefresh={fetchEmployees}
          hideRefreshButton
          hideSettingsButton
          trailingContent={
            <>
              {hasPermission(P.STAFF_CREATE) && (
                <Link href="/admin/employees/add">
                  <Button className="h-[38px] px-4 text-[14px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm nhân viên mới
                  </Button>
                </Link>
              )}
            </>
          }
        />
        
        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          {loading && employees.length === 0 ? (
            <AdminDataSyncLoader />
          ) : (
            <div className={cn("relative transition-opacity duration-200", loading && "opacity-60 pointer-events-none")}>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/20 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              )}
              <AdminEmployeeTable 
                employees={employees} 
                onRefresh={fetchEmployees}
                totalElements={totalElements}
                currentPage={filters.page}
                pageSize={filters.size}
                onPageChange={(p) => setFilters(f => ({...f, page: p}))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

