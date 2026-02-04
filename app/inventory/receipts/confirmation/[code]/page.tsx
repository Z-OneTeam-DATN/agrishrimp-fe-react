"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ChevronLeft,
  Save,
  ScanLine,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReceiptVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  // Mock data chi tiết phiếu nhập đang chờ (PENDING)
  const [items, setItems] = useState([
    { id: 1, code: "TA001", name: "Thức ăn tôm Grobest 40% đạm", unit: "Bao", planned: 100, actual: 0, damaged: 0, note: "" },
    { id: 2, code: "VS005", name: "Men vi sinh xử lý đáy (BZT)", unit: "Gói", planned: 50, actual: 0, damaged: 0, note: "" },
    { id: 3, code: "HC003", name: "Khoáng tạt Azomite", unit: "Kg", planned: 200, actual: 0, damaged: 0, note: "" },
  ]);

  const handleQtyChange = (id: number, field: 'actual' | 'damaged' | 'note', value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const onConfirm = () => {
    const hasIncomplete = items.some(i => i.actual === 0);
    if (hasIncomplete) {
      toast.warning("Vẫn còn mặt hàng có số lượng thực nhập bằng 0. Bạn có chắc chắn?");
    }
    toast.success("Xác nhận nhập kho thành công. Hàng đã được cộng vào tồn kho.");
    router.push("/inventory/receipts");
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-[18px] font-black text-slate-900 leading-none">KIỂM ĐẾM & NHẬP KHO</h1>
            <p className="text-[12px] text-slate-500 mt-1">Mã phiếu: <span className="font-bold text-blue-600">{code}</span> | Trạng thái: <span className="text-orange-500 font-bold uppercase">Chờ đối soát</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 text-[13px] border-slate-200 font-bold text-slate-600">
            <ScanLine size={16} className="mr-2" /> Quét Barcode
          </Button>
          <Button variant="outline" className="h-9 text-[13px] border-slate-200 font-bold text-slate-600">
            <Save size={16} className="mr-2" /> Lưu nháp
          </Button>
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nhà cung cấp</Label>
          <p className="text-[14px] font-bold text-slate-800">GROBEST VIỆT NAM</p>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kho tiếp nhận</Label>
          <p className="text-[14px] font-bold text-slate-800">Kho Thức ăn - Chi nhánh Cà Mau</p>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Người giao hàng</Label>
          <p className="text-[14px] font-bold text-slate-800">Trần Văn Giao (090xxxx123)</p>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Thời gian tạo phiếu</Label>
          <p className="text-[14px] font-bold text-slate-800">19/02/2026 08:30</p>
        </div>
      </div>

      {/* Main Table Verification */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
            <Info size={16} className="text-blue-500" /> Danh sách mặt hàng cần kiểm đếm
          </h2>
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-500">
            {items.length} Mặt hàng
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white border-b border-slate-200">
                <TableHead className="w-[50px] text-center font-bold text-[12px] text-slate-500 uppercase">#</TableHead>
                <TableHead className="font-bold text-[12px] text-slate-500 uppercase">Thông tin hàng hóa</TableHead>
                <TableHead className="w-[100px] text-center font-bold text-[12px] text-slate-500 uppercase">ĐVT</TableHead>
                <TableHead className="w-[120px] text-right font-bold text-[12px] text-slate-500 uppercase bg-blue-50/30">Dự kiến (Số sách)</TableHead>
                <TableHead className="w-[140px] text-right font-bold text-[12px] text-slate-900 uppercase">Thực nhập</TableHead>
                <TableHead className="w-[120px] text-right font-bold text-[12px] text-rose-600 uppercase">Hư hỏng</TableHead>
                <TableHead className="w-[120px] text-right font-bold text-[12px] text-slate-500 uppercase">Chênh lệch</TableHead>
                <TableHead className="w-[200px] font-bold text-[12px] text-slate-500 uppercase">Ghi chú kiểm đếm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const diff = item.actual - item.planned;
                return (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="text-center text-slate-400 font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="text-[11px] text-slate-400">{item.code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-600">{item.unit}</TableCell>
                    <TableCell className="text-right font-black text-slate-400 bg-blue-50/10">
                      {item.planned.toLocaleString()}
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        type="number"
                        className={cn(
                          "h-9 text-right font-bold text-[15px] border-slate-200 focus-visible:ring-blue-500",
                          item.actual > 0 && item.actual === item.planned ? "text-emerald-600 border-emerald-200 bg-emerald-50/30" : "",
                          item.actual > 0 && item.actual !== item.planned ? "text-rose-600 border-rose-200 bg-rose-50/30" : ""
                        )}
                        value={item.actual || ""}
                        onChange={(e) => handleQtyChange(item.id, 'actual', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        type="number"
                        className={cn(
                          "h-9 text-right font-bold text-rose-600 border-slate-200",
                          item.damaged > 0 ? "bg-rose-50 border-rose-200" : ""
                        )}
                        value={item.damaged || ""}
                        onChange={(e) => handleQtyChange(item.id, 'damaged', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {diff !== 0 ? (
                        <div className={cn(
                          "flex items-center justify-end font-black text-[13px]",
                          diff > 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {diff > 0 ? "+" : ""}{diff.toLocaleString()}
                          {diff < 0 ? <AlertTriangle size={12} className="ml-1" /> : ""}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        placeholder="Lý do chênh lệch..."
                        className="h-9 text-[12px] border-transparent bg-transparent hover:border-slate-200 focus:bg-white"
                        value={item.note}
                        onChange={(e) => handleQtyChange(item.id, 'note', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Final Conclusion */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-[14px]">Kết luận kiểm định chất lượng</h3>
        <Textarea 
          placeholder="Ghi chú tổng quát về lô hàng (ví dụ: hàng về đủ, bao bì nguyên vẹn, 2 bao bị ướt đã tách riêng...)"
          className="min-h-[80px] border-slate-200 focus-visible:ring-blue-500"
        />
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 flex items-center justify-between z-50 px-8">
        <div className="flex items-center gap-4 text-[13px]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-slate-500">Khớp số liệu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-rose-500 rounded-full" />
            <span className="text-slate-500">Có chênh lệch</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="min-w-[120px] font-bold text-slate-600 border-slate-200 rounded-lg" onClick={() => router.back()}>
            Hủy bỏ
          </Button>
          <Button 
            className="min-w-[180px] bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg shadow-lg shadow-blue-200 flex items-center gap-2"
            onClick={onConfirm}
          >
            <CheckCircle2 size={18} /> XÁC NHẬN & VÀO KHO
          </Button>
        </div>
      </div>
    </div>
  );
}
