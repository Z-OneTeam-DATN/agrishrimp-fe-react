"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Save, X, Shield, 
  ChevronDown, ChevronRight, CheckSquare, Square,
  Package, ShoppingCart, Truck, ClipboardCheck, 
  TrendingUp, Users, UserCircle, FileText, 
  Settings, CreditCard, PieChart, Tag, Mail, 
  BadgePercent, Star, Globe, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Permission {
  id: string;
  label: string;
  checked: boolean;
  type?: 'view' | 'create' | 'edit' | 'delete' | 'other';
}

interface PermissionGroup {
  id: string;
  label: string;
  isOpen: boolean;
  checked: boolean;
  icon: any;
  permissions: Permission[];
}

export default function AddRolePage() {
  const router = useRouter();
  const [roleName, setRoleName] = useState("");
  const [note, setNote] = useState("");

  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([
    {
      id: "product",
      label: "Sản phẩm",
      icon: Package,
      isOpen: true,
      checked: false,
      permissions: [
        { id: "view_product", label: "Xem sản phẩm", checked: false, type: 'view' },
        { id: "create_product", label: "Tạo sản phẩm", checked: false, type: 'create' },
        { id: "edit_product", label: "Sửa sản phẩm", checked: false, type: 'edit' },
        { id: "delete_product", label: "Xóa sản phẩm", checked: false, type: 'delete' },
        { id: "export_product", label: "Xuất file sản phẩm", checked: false, type: 'other' },
        { id: "import_product", label: "Nhập file sản phẩm", checked: false, type: 'other' },
      ]
    },
    {
      id: "purchase_order",
      label: "Đặt hàng nhập",
      icon: ShoppingCart,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_po", label: "Xem đơn đặt hàng nhập", checked: false, type: 'view' },
        { id: "create_po", label: "Tạo đơn đặt hàng nhập", checked: false, type: 'create' },
        { id: "edit_po", label: "Sửa đơn đặt hàng nhập", checked: false, type: 'edit' },
        { id: "cancel_po", label: "Hủy đơn đặt hàng nhập", checked: false, type: 'other' },
        { id: "finish_po", label: "Kết thúc đơn đặt hàng nhập", checked: false, type: 'other' },
        { id: "export_po", label: "Xuất file đơn đặt hàng nhập", checked: false, type: 'other' },
        { id: "import_po", label: "Nhập file đơn đặt hàng nhập", checked: false, type: 'other' },
      ]
    },
    {
      id: "import",
      label: "Nhập hàng",
      icon: Truck,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_import", label: "Xem đơn nhập", checked: false, type: 'view' },
        { id: "create_import", label: "Tạo đơn nhập", checked: false, type: 'create' },
        { id: "edit_import", label: "Sửa đơn nhập", checked: false, type: 'edit' },
        { id: "pay_import", label: "Thanh toán đơn nhập", checked: false, type: 'other' },
        { id: "return_import", label: "Hoàn trả đơn nhập", checked: false, type: 'other' },
        { id: "receive_import", label: "Nhận hàng vào kho", checked: false, type: 'other' },
        { id: "finish_import", label: "Kết thúc đơn nhập", checked: false, type: 'other' },
        { id: "cancel_import", label: "Hủy đơn nhập", checked: false, type: 'other' },
      ]
    },
    {
      id: "order",
      label: "Đơn hàng",
      icon: ShoppingCart,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_assigned_order", label: "Xem đơn hàng được phụ trách", checked: false, type: 'view' },
        { id: "view_all_order", label: "Xem tất cả đơn hàng", checked: false, type: 'view' },
        { id: "create_order", label: "Tạo đơn hàng", checked: false, type: 'create' },
        { id: "edit_order", label: "Sửa đơn hàng", checked: false, type: 'edit' },
        { id: "approve_order", label: "Duyệt đơn hàng", checked: false, type: 'other' },
        { id: "pack_ship_order", label: "Đóng gói và giao hàng", checked: false, type: 'other' },
        { id: "pay_order", label: "Thanh toán đơn hàng", checked: false, type: 'other' },
        { id: "cancel_order", label: "Hủy đơn hàng", checked: false, type: 'other' },
      ]
    },
    {
      id: "inventory_check",
      label: "Kiểm hàng",
      icon: ClipboardCheck,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_check", label: "Xem phiếu kiểm hàng", checked: false, type: 'view' },
        { id: "create_check", label: "Tạo phiếu kiểm hàng", checked: false, type: 'create' },
        { id: "edit_check", label: "Sửa phiếu kiểm hàng", checked: false, type: 'edit' },
        { id: "balance_stock", label: "Cân bằng kho", checked: false, type: 'other' },
        { id: "delete_check", label: "Xóa phiếu kiểm hàng", checked: false, type: 'delete' },
      ]
    },
    {
      id: "cost_adjustment",
      label: "Điều chỉnh giá vốn",
      icon: TrendingUp,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_cost", label: "Xem phiếu điều chỉnh", checked: false, type: 'view' },
        { id: "create_cost", label: "Tạo phiếu điều chỉnh", checked: false, type: 'create' },
        { id: "edit_cost", label: "Sửa phiếu điều chỉnh", checked: false, type: 'edit' },
        { id: "approve_cost", label: "Điều chỉnh giá", checked: false, type: 'other' },
        { id: "delete_cost", label: "Xóa phiếu điều chỉnh", checked: false, type: 'delete' },
      ]
    },
    {
      id: "supplier",
      label: "Nhà cung cấp",
      icon: Users,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_supplier", label: "Xem nhà cung cấp", checked: false, type: 'view' },
        { id: "create_supplier", label: "Tạo nhà cung cấp", checked: false, type: 'create' },
        { id: "edit_supplier", label: "Sửa nhà cung cấp", checked: false, type: 'edit' },
        { id: "delete_supplier", label: "Xóa nhà cung cấp", checked: false, type: 'delete' },
      ]
    },
    {
      id: "customer",
      label: "Khách hàng",
      icon: UserCircle,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_assigned_customer", label: "Xem khách hàng được phụ trách", checked: false, type: 'view' },
        { id: "view_all_customer", label: "Xem tất cả khách hàng", checked: false, type: 'view' },
        { id: "create_customer", label: "Tạo khách hàng", checked: false, type: 'create' },
        { id: "edit_customer", label: "Sửa khách hàng", checked: false, type: 'edit' },
        { id: "delete_customer", label: "Xóa khách hàng", checked: false, type: 'delete' },
      ]
    },
    {
      id: "vouchers",
      label: "Phiếu thu & Phiếu chi",
      icon: CreditCard,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_receipt", label: "Xem phiếu thu", checked: false, type: 'view' },
        { id: "create_receipt", label: "Tạo phiếu thu", checked: false, type: 'create' },
        { id: "view_payment", label: "Xem phiếu chi", checked: false, type: 'view' },
        { id: "create_payment", label: "Tạo phiếu chi", checked: false, type: 'create' },
      ]
    },
    {
      id: "reports",
      label: "Báo cáo & Phân tích",
      icon: PieChart,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "view_financial_report", label: "Xem báo cáo tài chính", checked: false },
        { id: "view_inventory_report", label: "Xem báo cáo kho", checked: false },
        { id: "view_sales_report", label: "Xem báo cáo bán hàng", checked: false },
        { id: "view_eod_report", label: "Xem báo cáo cuối ngày", checked: false },
      ]
    },
    {
      id: "system",
      label: "Cấu hình và ứng dụng",
      icon: Settings,
      isOpen: false,
      checked: false,
      permissions: [
        { id: "manage_employee", label: "Quản lý nhân viên, phân quyền vai trò", checked: false },
        { id: "manage_branch", label: "Quản lý chi nhánh", checked: false },
        { id: "manage_promotion", label: "Khuyến mại & Tích điểm", checked: false },
        { id: "manage_marketing", label: "Marketing", checked: false },
        { id: "manage_einvoice", label: "Hóa đơn điện tử", checked: false },
      ]
    }
  ]);

  const toggleGroupOpen = (groupId: string) => {
    setPermissionGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, isOpen: !group.isOpen } : group
    ));
  };

  const handleGroupCheck = (groupId: string, checked: boolean) => {
    setPermissionGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          checked,
          permissions: group.permissions.map(p => ({ ...p, checked }))
        };
      }
      return group;
    }));
  };

  const handlePermissionCheck = (groupId: string, permissionId: string, checked: boolean) => {
    setPermissionGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        let updatedPermissions = group.permissions.map(p => 
          p.id === permissionId ? { ...p, checked } : p
        );

        // Logic: Nếu chọn Tạo/Sửa/Xóa thì tự động chọn Xem
        const currentPermission = updatedPermissions.find(p => p.id === permissionId);
        if (checked && (currentPermission?.type === 'create' || currentPermission?.type === 'edit' || currentPermission?.type === 'delete')) {
          updatedPermissions = updatedPermissions.map(p => 
            p.type === 'view' ? { ...p, checked: true } : p
          );
        }

        const allChecked = updatedPermissions.every(p => p.checked);
        return {
          ...group,
          permissions: updatedPermissions,
          checked: allChecked
        };
      }
      return group;
    }));
  };

  const handleSave = () => {
    if (!roleName) {
      toast.error("Vui lòng nhập tên vai trò");
      return;
    }
    toast.success("Đã lưu vai trò mới thành công");
    router.push("/admin/employees/roles");
  };

  return (
    <div className="space-y-4 pb-[100px] bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button 
          onClick={() => router.push("/admin/employees/roles")}
          className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ChevronLeft size={18} /> Quay lại Danh sách vai trò
        </button>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="h-[34px] px-6 text-[12px] font-bold border-blue-500 text-blue-600 hover:bg-blue-50 rounded-none uppercase"
          >
            Thoát
          </Button>
          <Button 
            onClick={handleSave}
            className="h-[34px] px-8 text-[12px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-md uppercase"
          >
            Lưu
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <h1 className="text-[22px] font-black text-slate-800 uppercase tracking-tight">Thêm mới vai trò quản trị</h1>

        {/* Thông tin chung */}
        <div className="bg-white border border-[#dcdcdc] p-8 rounded-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tên vai trò *</Label>
              <Input 
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Ví dụ: QUẢN LÝ KHO, NHÂN VIÊN BÁN HÀNG..." 
                className="h-[42px] text-[14px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Ghi chú vai trò</Label>
              <Input 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Mô tả tóm tắt quyền hạn của vai trò này..." 
                className="h-[42px] text-[14px] border-[#ccc] rounded-none focus:border-blue-500 shadow-none" 
              />
            </div>
          </div>
        </div>

        {/* Phân quyền chi tiết */}
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-[#fcfcfc] flex items-center justify-between">
            <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-blue-600" /> Thiết lập phân quyền chi tiết
            </h3>
            <span className="text-[11px] text-slate-400 italic">Lưu ý: Quyền Tạo/Sửa/Xóa sẽ bao gồm quyền Xem</span>
          </div>

          <div className="divide-y divide-slate-100">
            {permissionGroups.map((group) => (
              <div key={group.id} className="bg-white">
                {/* Group Header */}
                <div 
                  className={cn(
                    "flex items-center px-8 py-5 transition-all hover:bg-slate-50 cursor-pointer",
                    group.isOpen && "bg-slate-50/50 border-l-4 border-l-blue-600"
                  )}
                  onClick={() => toggleGroupOpen(group.id)}
                >
                  <div className="flex items-center gap-5 flex-1">
                    <Checkbox 
                      id={group.id}
                      checked={group.checked}
                      onCheckedChange={(checked) => handleGroupCheck(group.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 rounded-none border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="flex items-center gap-3">
                       <group.icon size={18} className={cn(group.isOpen ? "text-blue-600" : "text-slate-400")} />
                       <label 
                        htmlFor={group.id}
                        className={cn(
                          "text-[14px] font-black uppercase tracking-tight cursor-pointer",
                          group.isOpen ? "text-blue-700" : "text-slate-700"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {group.label}
                      </label>
                    </div>
                  </div>
                  {group.isOpen ? (
                    <ChevronDown size={20} className="text-blue-600" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-300" />
                  )}
                </div>

                {/* Sub Permissions */}
                {group.isOpen && group.permissions.length > 0 && (
                  <div className="px-24 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-5 bg-white border-t border-slate-50">
                    {group.permissions.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 group">
                        <Checkbox 
                          id={p.id}
                          checked={p.checked}
                          onCheckedChange={(checked) => handlePermissionCheck(group.id, p.id, checked as boolean)}
                          className="h-4.5 w-4.5 rounded-none border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <label 
                          htmlFor={p.id}
                          className={cn(
                            "text-[13px] font-bold cursor-pointer transition-colors",
                            p.checked ? "text-blue-600" : "text-slate-600 group-hover:text-blue-500"
                          )}
                        >
                          {p.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}