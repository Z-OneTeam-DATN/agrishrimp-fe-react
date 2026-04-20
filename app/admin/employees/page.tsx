"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminEmployeeTable } from "@/components/admin/AdminEmployeeTable";
import { ShieldCheck, Loader2 } from "lucide-react";
import { EmployeeService } from "@/app/services/employee.service";
import { RoleService } from "@/app/services/RoleService";
import { branchService } from "@/app/services/branchService";
import { UserResponse } from "@/app/types/employee.schema";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export default function EmployeeManagementPage() {
  const { user: currentUser, isAuthenticated, isLoadingAuth } = useAuthStore();
  const { hasPermission } = usePermissions();
  
  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

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

  const [roles, setRoles] = useState<{label: string, value: string}[]>([]);
  const [branches, setBranches] = useState<{label: string, value: string}[]>([]);

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
      const fetchRoles = hasPermission(P.ROLE_VIEW) ? RoleService.getAll() : Promise.resolve([]);
      const fetchBranches = hasPermission(P.BRANCH_VIEW) ? branchService.getAll() : Promise.resolve([]);

      const [rolesRes, branchesRes] = await Promise.all([
        fetchRoles,
        fetchBranches
      ]);
      
      let rolesList = (Array.isArray(rolesRes) ? rolesRes : (rolesRes as any).content || [])
        .map((r: any) => ({ label: r.displayName, value: String(r.id), slug: r.slug }));
      
      // Không hiển thị role USER (1.2)
      rolesList = rolesList.filter((r: any) => r.slug.toLowerCase() !== "user" && r.slug.toLowerCase() !== "customer");

      const branchesData = Array.isArray(branchesRes) ? branchesRes : (branchesRes as any).content || [];
      let branchesList = branchesData.map((b: any) => ({ label: b.name, value: String(b.id) }));

      // Nếu không phải admin, chỉ được xem chi nhánh của mình (2.2)
      if (!isAdmin && currentUser?.branch?.id) {
        branchesList = branchesList.filter((b: any) => b.value === String(currentUser.branch?.id));
      }

      setRoles([{ label: "Tất cả vai trò", value: "all" }, ...rolesList]);
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
        keyword: filters.keyword || undefined,
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
  }, [filters, isAuthenticated]);

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
    <div className="space-y-4">
      <div className="bg-white px-6 py-4 border-b border-slate-100">
        <AdminPageHeader 
          title="Quản lý nhân sự & Hệ thống" 
          addBtnLabel="Thêm nhân viên mới"
          addBtnHref="/admin/employees/add" 
          permission={P.STAFF_CREATE}
          secondaryBtnLabel={hasPermission(P.ROLE_VIEW) ? "Quản lý quyền" : undefined}
          secondaryBtnHref="/admin/employees/roles"
          secondaryBtnIcon={ShieldCheck}
        />
      </div>

      <div className="mx-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm tên, email, SĐT hoặc CCCD..." 
          filter1Placeholder="Tất cả chi nhánh"
          filter1Options={branches}
          onFilter1Change={(val) => setFilters(f => ({...f, branchId: val, page: 0}))}
          filter2Placeholder="Tất cả trạng thái"
          filter2Options={statusFilters}
          onFilter2Change={(val) => setFilters(f => ({...f, status: val, page: 0}))}
          onSortChange={(val) => setFilters(f => ({...f, sort: val, page: 0}))}
          onSearch={(val) => setFilters(f => ({...f, keyword: val, page: 0}))}
          onRefresh={fetchEmployees}
        />
        
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium italic">
            <Loader2 className="animate-spin mx-auto mb-2 text-emerald-600" />
            Đang tải danh sách nhân sự...
          </div>
        ) : (
          <AdminEmployeeTable 
            employees={employees} 
            onRefresh={fetchEmployees}
            totalElements={totalElements}
            currentPage={filters.page}
            onPageChange={(p) => setFilters(f => ({...f, page: p}))}
          />
        )}
      </div>
    </div>
  );
}
