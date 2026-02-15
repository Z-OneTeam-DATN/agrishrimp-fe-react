"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Settings,
  ChevronRight,
  ClipboardCheck,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  Info,
  ChevronUp,
  RotateCw,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  LayoutDashboard,
  Box,
  Trash2,
  Search,
  Plus,
  HelpCircle,
  Lock,
  History,
  Calculator,
  ScanLine,
  MessageSquare,
  Printer,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewInventoryAuditPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-4 pb-[80px] bg-slate-50/30 p-4 min-h-screen">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <ShieldCheck size={12} /> Warehouse Pro
          <ChevronRight size={10} />
          <span>Tạo đợt kiểm kê mới</span>
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Thiết lập đợt kiểm kê
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400"
            >
              <X size={20} onClick={() => router.back()} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Config */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#dcdcdc] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl">
                <ClipboardCheck size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  Thông tin cơ bản
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Xác định thời gian và phạm vi kiểm kê
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">
                  Mã đợt kiểm kê
                </Label>
                <Input
                  className="h-10 text-[13px] font-bold bg-slate-50 border-slate-200"
                  value="AUD-2026-003"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">
                  Ngày kiểm kê
                </Label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <Input
                    type="date"
                    className="h-10 pl-10 text-[13px] border-slate-200"
                    defaultValue="2026-02-13"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">
                  Kho hàng thực hiện
                </Label>
                <Select defaultValue="wh-hn">
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Chọn kho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wh-hn">Kho Tổng Hà Nội</SelectItem>
                    <SelectItem value="wh-st">Kho Sóc Trăng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">
                  Người phụ trách chính
                </Label>
                <Select defaultValue="admin">
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Chọn người dùng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      Lê Văn Admin (Quản trị)
                    </SelectItem>
                    <SelectItem value="nhien">Nhiên Lê (Thủ kho)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">
                  Ghi chú / Mục đích
                </Label>
                <Textarea
                  className="min-h-[80px] text-[13px] border-slate-200"
                  placeholder="Ví dụ: Kiểm kê định kỳ tháng 02/2026..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded-xl">
                <Box size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  Phạm vi kiểm kê
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Lựa chọn danh mục hàng hóa cần kiểm
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Checkbox id="scope-all" defaultChecked />
                  <Label
                    htmlFor="scope-all"
                    className="text-[12px] font-bold text-slate-700"
                  >
                    Tất cả hàng hóa trong kho
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="scope-group" />
                  <Label
                    htmlFor="scope-group"
                    className="text-[12px] font-bold text-slate-700"
                  >
                    Theo nhóm hàng
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 opacity-50 pointer-events-none">
                {["Thức ăn", "Thuốc/Hóa chất", "Dụng cụ nuôi", "Khác"].map(
                  (group) => (
                    <div
                      key={group}
                      className="flex items-center gap-2 p-3 border rounded-md bg-white"
                    >
                      <Checkbox id={group} />
                      <Label
                        htmlFor={group}
                        className="text-[11px] font-medium"
                      >
                        {group}
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0f172a] text-white p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={80} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-4">
              Cấu hình nâng cao
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <div className="space-y-0.5">
                  <p className="text-[12px] font-bold">
                    Kiểm kê mù (Blind Audit)
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    Ẩn số tồn hệ thống khi nhân viên kiểm
                  </p>
                </div>
                <Checkbox className="border-slate-700 data-[state=checked]:bg-blue-500" />
              </div>
              <div className="flex items-center justify-between group">
                <div className="space-y-0.5">
                  <p className="text-[12px] font-bold">Cho phép nhập mã mới</p>
                  <p className="text-[10px] text-slate-400 italic">
                    Thêm hàng hóa không có trong danh sách
                  </p>
                </div>
                <Checkbox className="border-slate-700 data-[state=checked]:bg-blue-500" />
              </div>
              <div className="flex items-center justify-between group">
                <div className="space-y-0.5">
                  <p className="text-[12px] font-bold">Tự động chốt tồn</p>
                  <p className="text-[10px] text-slate-400 italic">
                    Cập nhật kho ngay khi hoàn tất duyệt
                  </p>
                </div>
                <Checkbox
                  className="border-slate-700 data-[state=checked]:bg-blue-500"
                  defaultChecked
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-start gap-2 text-[10px] text-slate-400 bg-white/5 p-3 rounded">
                <Info size={14} className="text-blue-400 shrink-0" />
                <span>
                  Lưu ý: Sau khi bấm "Khởi tạo", hệ thống sẽ CHỐT số tồn tại
                  thời điểm hiện tại để làm căn cứ đối chiếu.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider shadow-lg shadow-blue-500/20"
                onClick={() =>
                  router.push("/admin/inventory-checks/AUD-2026-003")
                }
              >
                Khởi tạo đợt kiểm kê
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 border-slate-200 text-slate-500 font-bold uppercase"
                onClick={() => router.back()}
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
