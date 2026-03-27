"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  Building2,
  User,
  MoreVertical,
  Eye,
  ArrowUpDown,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { InventoryCheckApiService } from "@/app/services/inventory.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

export default function InventoryCheckListPage() {
  const router = useRouter();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"PENDING" | "COMPLETED">("PENDING");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await InventoryCheckApiService.getAll();
      const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
      
      // Filter list based on active tab for better UX, even if BE consolidated endpoints
      const filteredList = list.filter((item: any) => 
        activeTab === "PENDING" ? item.status === "PENDING" : item.status === "COMPLETED"
      );
      
      setData(filteredList);
    } catch (error) {
      console.error("Error fetching inventory checks:", error);
      toast.error("Không thể tải danh sách phiếu kiểm kê");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu kiểm kê này không? Hành động này không thể hoàn tác.")) return;
    
    try {
      toast.promise(InventoryCheckApiService.deleteCheck(id), {
        loading: 'Đang xóa phiếu...',
        success: () => {
          fetchData();
          return 'Đã xóa phiếu thành công';
        },
        error: (err) => {
          return err.response?.data?.message || 'Không thể xóa phiếu (Có thể do phiếu đã chốt hoặc lỗi hệ thống)';
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-bold uppercase">Đã cân kho</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-bold uppercase">Chờ duyệt</Badge>;
      case "CANCELLED":
        return <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] font-bold uppercase">Đã hủy</Badge>;
      default:
        return <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold uppercase">{status}</Badge>;
    }
  };

  if (isLoadingAuth) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (!hasPermission(P.CHECK_VIEW)) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 opacity-30">
      <AlertTriangle size={64} />
      <p className="text-lg font-black uppercase">Bạn không có quyền xem trang này</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <ClipboardCheck className="text-blue-600" size={24} />
            Kiểm kê kho hàng
          </h1>
          <div className="flex items-center gap-4 mt-1">
             <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
               Quản lý và đối soát tồn kho thực tế
             </p>
             <div className="flex bg-slate-200/50 p-0.5 rounded-lg">
                <button 
                  onClick={() => setActiveTab("PENDING")}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all",
                    activeTab === "PENDING" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Lệnh kiểm (Chờ)
                </button>
                <button 
                  onClick={() => setActiveTab("COMPLETED")}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all",
                    activeTab === "COMPLETED" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Phiếu kiểm (Đã chốt)
                </button>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(P.CHECK_CREATE) && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-[12px] px-4 shadow-sm"
              onClick={() => router.push("/admin/inventory-checks/new")}
            >
              <Plus size={16} className="mr-2" /> Tạo phiếu kiểm kê
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm mb-6 overflow-hidden">
        <div className="p-4 bg-white flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Tìm theo mã phiếu, ghi chú..." 
              className="pl-10 h-9 text-[13px] border-slate-200 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-9 text-[12px] font-bold border-slate-200 text-slate-600">
            <Filter size={14} className="mr-2" /> Bộ lọc
          </Button>
          <Button variant="outline" className="h-9 text-[12px] font-bold border-slate-200 text-slate-600">
             Ngày tháng <ArrowUpDown size={14} className="ml-2" />
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="bg-white">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="w-[200px] text-[10px] font-black uppercase text-slate-400">Mã chứng từ</TableHead>
                <TableHead className="w-[200px] text-[10px] font-black uppercase text-slate-400">Ngày kiểm kê</TableHead>
                <TableHead className="w-[200px] text-[10px] font-black uppercase text-slate-400">Kho hàng</TableHead>
                <TableHead className="w-[180px] text-[10px] font-black uppercase text-slate-400">Người tạo / Kiểm kê</TableHead>
                <TableHead className="w-[140px] text-[10px] font-black uppercase text-slate-400 text-center">Trạng thái</TableHead>
                <TableHead className="w-[180px] text-[10px] font-black uppercase text-slate-400 text-right pr-6">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
                    <p className="text-[11px] font-bold text-slate-400 uppercase mt-2">Đang tải dữ liệu...</p>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <FileText size={48} />
                      <p className="text-sm font-black uppercase">Chưa có phiếu kiểm kê nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.filter(item => 
                  item.code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  item.note?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="group hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/inventory-checks/${item.code || `PKK-${item.id}`}`)}
                  >
                    <TableCell className="font-black text-blue-600 text-[13px]">{item.code || `PKK-${item.id}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
                        <Calendar size={13} className="text-slate-400" />
                        {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
                        <Building2 size={13} className="text-slate-400" />
                        {item.branchName || "Kho tổng"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                         <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
                            <User size={13} className="text-slate-400" />
                            {item.createdByName || "Admin"}
                         </div>
                         {item.checkedByName && (
                           <span className="text-[10px] text-slate-400 font-medium ml-5">Kiểm bởi: {item.checkedByName}</span>
                         )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasPermission(P.CHECK_VIEW) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/inventory-checks/${item.code || item.id}`);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                        )}
                        
                        {item.status === "PENDING" && (
                          <>
                            {hasPermission(P.CHECK_UPDATE) && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-amber-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/inventory-checks/${item.code || item.id}?edit=true`);
                                }}
                              >
                                <Pencil size={16} />
                              </Button>
                            )}
                            {hasPermission(P.CHECK_DELETE) && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                onClick={(e) => handleDelete(e, item.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
