"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminEmployeeTable } from "@/components/admin/AdminEmployeeTable";
import { ShieldCheck, UserPlus } from "lucide-react";
import { EmployeeService } from "@/app/services/employee.service";
import { RoleService } from "@/app/services/RoleService";
import { BranchService } from "@/app/services/branchService";
import { UserResponse } from "@/app/types/employee.schema";
import { toast } from "sonner";

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  
  const [filters, setFilters] = useState({
    keyword: "",
    branchId: "all",
    roleId: "all",
    status: "all",
    page: 0,
    size: 10
  });

  const [roles, setRoles] = useState<{label: string, value: string}[]>([]);
  const [branches, setBranches] = useState<{label: string, value: string}[]>([]);

  const fetchInitData = async () => {
    try {
      const [rolesRes, branchesRes] = await Promise.all([
        RoleService.getAll(),
        BranchService.getAll()
      ]);
      
      const rolesList = (Array.isArray(rolesRes) ? rolesRes : (rolesRes as any).content || [])
        .map((r: any) => ({ label: r.displayName, value: String(r.id) }));
      
      const branchesList = (Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data as any).content || [])
        .map((b: any) => ({ label: b.name, value: String(b.id) }));

      setRoles([{ label: "Tất cả vai trò", value: "all" }, ...rolesList]);
      setBranches([{ label: "Tất cả chi nhánh", value: "all" }, ...branchesList]);
    } catch (e) {
      console.error("Error fetching filter data", e);
    }
  };

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {
        keyword: filters.keyword || undefined,
        branchId: filters.branchId === "all" ? undefined : Number(filters.branchId),
        roleId: filters.roleId === "all" ? undefined : Number(filters.roleId),
        status: filters.status === "all" ? undefined : filters.status,
        page: filters.page,
        size: filters.size
      };

      const data = await EmployeeService.getAll(queryParams);
      setEmployees(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInitData();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const statusFilters = [
    { label: "Tất cả trạng thái", value: "all" },
    { label: "Đang hoạt động", value: "ACTIVE" },
    { label: "Tạm khóa / Ngừng", value: "INACTIVE" },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
        <AdminPageHeader 
          title="Quản lý nhân sự & Hệ thống" 
          addBtnLabel="Thêm nhân viên mới" 
          addBtnHref="/admin/employees/add" 
          secondaryBtnLabel="Quản lý vai trò"
          secondaryBtnHref="/admin/employees/roles"
          secondaryBtnIcon={ShieldCheck}
        />
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm tên, email, SĐT hoặc CCCD..." 
          filter1Placeholder="Chi nhánh"
          filter1Options={branches}
          onFilter1Change={(val) => setFilters(f => ({...f, branchId: val, page: 0}))}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          onFilter2Change={(val) => setFilters(f => ({...f, status: val, page: 0}))}
          onSearch={(val) => setFilters(f => ({...f, keyword: val, page: 0}))}
          onRefresh={fetchEmployees}
        />
        
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium italic">Đang tải danh sách...</div>
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
