"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  X, 
  Settings, 
  RotateCw, 
  FileDown, 
  ChevronUp,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [status, setStatus] = useState("Chưa thực hiện");
  const [items, setItems] = useState([
    { code: "TA001", name: "Thức ăn tôm Grobest", unit: "Bao", status: "Chưa kiểm kê", bookQty: 540.00, actualQty: 0, diffQty: -540.00, qualityGood: 0, qualityBad: 0 },
    { code: "VS005", name: "Vi sinh xử lý đáy", unit: "Gói", status: "Chưa kiểm kê", bookQty: 120.00, actualQty: 0, diffQty: -120.00, qualityGood: 0, qualityBad: 0 },
  ]);

  const handleActualQtyChange = (index: number, val: string) => {
    const qty = parseFloat(val) || 0;
    const newItems = [...items];
    newItems[index].actualQty = qty;
    newItems[index].diffQty = qty - newItems[index].bookQty;
    newItems[index].status = qty > 0 ? "Đã kiểm kê" : "Chưa kiểm kê";
    setItems(newItems);
  };

  const startInventory = () => {
    setStatus("Đang kiểm kê");
    toast.info("Trạng thái đã chuyển sang Đang kiểm kê. Vui lòng nhập kết quả.");
  };

  const completeInventory = () => {
    setStatus("Đã hoàn thành");
    toast.success("Đã hoàn thành kiểm kê kho.");
  };

  return (
    <div className="space-y-3 pb-[100px]">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-[18px] font-bold text-[#1f1f1f]">Phiếu kiểm kê <span className="text-[#007bff]">{code}</span></h4>
        <div className="flex items-center gap-3 text-gray-400">
          <Settings size={20} className="cursor-pointer hover:text-gray-600" />
          <X size={20} className="cursor-pointer hover:text-gray-600" onClick={() => router.back()} />
        </div>
      </div>

      <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3">
          <div className="md:col-span-12 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Mục đích</Label>
            <Input className="h-[32px] text-[13px]" defaultValue="Kiểm kê định kỳ tháng 1/2026" />
          </div>
          
          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Kiểm kê kho</Label>
            <Input className="h-[32px] text-[13px] bg-[#f8f9fa]" value="Kho hàng hóa" readOnly />
          </div>
          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Chi nhánh</Label>
            <Input className="h-[32px] text-[13px] bg-[#f8f9fa]" value="Chi nhánh A" readOnly />
          </div>
          <div className="md:col-span-3 border-l ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Số phiếu kiểm kê</Label>
            <Input className="h-[32px] text-[13px] bg-[#f8f9fa]" value={code} readOnly />
          </div>
          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Ngày kiểm kê</Label>
            <Input className="h-[32px] text-[13px] bg-[#f8f9fa]" value="2026-01-25 08:30" readOnly />
          </div>

          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Kiểm kê theo</Label>
            <Input className="h-[32px] text-[13px] bg-[#f8f9fa]" value="Tất cả VTHH" readOnly />
          </div>
          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tham chiếu</Label>
            <div className="flex gap-1 items-center h-[32px]">
               <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                 YCKK00009 <X size={10} className="cursor-pointer" />
               </span>
            </div>
          </div>
          <div className="md:col-span-3 border-l ps-4 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Kiểm kê đến ngày</Label>
            <Input className="h-[32px] text-[13px] bg-[#f8f9fa]" value="2026-01-25" readOnly />
          </div>
          <div className="md:col-span-3 space-y-[2px]">
            <Label className="text-[12px] font-bold text-[#555]">Tình trạng thực hiện</Label>
            <Input 
              className={cn(
                "h-[32px] text-[13px] font-bold bg-[#f8f9fa]",
                status === "Đã hoàn thành" ? "text-green-600" : status === "Đang kiểm kê" ? "text-blue-600" : "text-orange-500"
              )} 
              value={status} 
              readOnly 
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex border-b border-[#eee] bg-[#f8f9fa] text-[12px] font-bold text-[#555]">
          <div className="px-4 py-2 text-blue-600 border-b-2 border-blue-600">Vật tư hàng hóa ({items.length})</div>
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Thành viên tham gia (1)</div>
        </div>

        <div className="flex justify-end p-2 gap-2 bg-white">
          <Button variant="outline" size="sm" className="h-[28px] text-[11px] border-[#ddd] bg-white text-[#555]">
            <RotateCw size={12} className="mr-1" /> Lấy lại số tồn
          </Button>
          <Button variant="outline" size="sm" className="h-[28px] text-[11px] border-[#ddd] bg-white text-[#555]">
            <FileSpreadsheet size={12} className="mr-1 text-green-600" /> Xuất Excel
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="table-custom border-t border-[#eee]">
            <TableHeader>
              <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
                <TableHead className="w-[40px] text-center p-[8px]">#</TableHead>
                <TableHead className="w-[120px] p-[8px] font-bold text-[12px] text-[#333] uppercase">Mã hàng</TableHead>
                <TableHead className="p-[8px] font-bold text-[12px] text-[#333] uppercase">Tên hàng</TableHead>
                <TableHead className="w-[80px] p-[8px] font-bold text-[12px] text-[#333] uppercase">ĐVT</TableHead>
                <TableHead className="w-[120px] p-[8px] font-bold text-[12px] text-[#333] uppercase">Tình trạng</TableHead>
                <TableHead className="w-[120px] text-right p-[8px] font-bold text-[12px] text-[#333] uppercase">Số sách</TableHead>
                <TableHead className="w-[120px] text-right p-[8px] font-bold text-[12px] text-[#333] uppercase">Kiểm kê</TableHead>
                <TableHead className="w-[120px] text-right p-[8px] font-bold text-[12px] text-[#333] uppercase">Chênh lệch</TableHead>
                <TableHead className="w-[100px] text-right p-[8px] font-bold text-[12px] text-[#333] uppercase">Tốt 100%</TableHead>
                <TableHead className="w-[100px] text-right p-[8px] font-bold text-[12px] text-[#333] uppercase">Kém</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={item.code} className="border-b border-[#eee] hover:bg-[#f0f8ff]">
                  <TableCell className="text-center p-[8px] text-gray-400">{idx + 1}</TableCell>
                  <TableCell className="p-[8px] text-[#555]">{item.code}</TableCell>
                  <TableCell className="p-[8px] font-medium text-[#1f1f1f]">{item.name}</TableCell>
                  <TableCell className="p-[8px] text-[#555]">{item.unit}</TableCell>
                  <TableCell className={cn("p-[8px] text-[11px]", item.status === "Đã kiểm kê" ? "text-green-600 font-bold" : "text-gray-400")}>
                    {item.status}
                  </TableCell>
                  <TableCell className="p-[8px] text-right font-bold text-[#1f1f1f]">{item.bookQty.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="p-[4px]">
                    <Input 
                      type="number"
                      disabled={status === "Chưa thực hiện" || status === "Đã hoàn thành"}
                      className="h-7 text-right text-[13px] border-[#ccc] focus-visible:ring-1 focus-visible:ring-[#007bff] bg-white"
                      value={item.actualQty}
                      onChange={(e) => handleActualQtyChange(idx, e.target.value)}
                    />
                  </TableCell>
                  <TableCell className={cn("p-[8px] text-right font-bold", item.diffQty < 0 ? "text-red-500" : item.diffQty > 0 ? "text-green-600" : "text-[#1f1f1f]")}>
                    {item.diffQty < 0 ? `(${Math.abs(item.diffQty).toLocaleString("vi-VN", { minimumFractionDigits: 2 })})` : item.diffQty.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="p-[4px]">
                    <Input disabled={status === "Chưa thực hiện" || status === "Đã hoàn thành"} className="h-7 text-right text-[13px] border-[#ccc] bg-white" defaultValue={0} />
                  </TableCell>
                  <TableCell className="p-[4px]">
                    <Input disabled={status === "Chưa thực hiện" || status === "Đã hoàn thành"} className="h-7 text-right text-[13px] border-[#ccc] bg-white" defaultValue={0} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <Label className="font-bold text-[#555] text-[13px]">Kết luận</Label>
            <div className="flex items-center gap-2">
              <Checkbox id="processed" disabled />
              <Label htmlFor="processed" className="text-[12px] cursor-not-allowed text-gray-400">Đã xử lý</Label>
            </div>
          </div>
          <Textarea placeholder="Nhập kết luận kiểm kê..." className="min-h-[60px] text-[13px] border-[#ccc]" />
        </div>

        <div className="border-2 border-dashed border-[#ccc] rounded-[6px] p-6 text-center bg-[#f9f9f9] hover:bg-[#f0f8ff] hover:border-[#007bff] cursor-pointer transition-all group">
            <div className="text-[#007bff] font-bold mb-1 text-[13px]">Chọn tệp hoặc kéo và thả tệp vào đây</div>
            <p className="text-gray-400 text-[11px]">Định dạng .xls, .xlsx (tối đa 20MB)</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-between z-[999]">
        <div className="flex gap-2">
          <Button variant="outline" className="h-[32px] text-[12px] font-bold text-[#555] border-[#ccc] bg-white">
            Khác <ChevronUp size={14} className="ml-1" />
          </Button>
          <Button variant="outline" className="h-[32px] text-[12px] font-bold text-[#555] border-[#ccc] bg-white">
            Lập phiếu xuất
          </Button>
        </div>

        <div className="flex gap-2">
          {status === "Chưa thực hiện" && (
            <Button onClick={startInventory} className="h-[32px] text-[13px] font-bold bg-[#007bff] hover:bg-[#0069d9] text-white rounded-[4px] px-6">
              Bắt đầu kiểm kê
            </Button>
          )}
          {status === "Đang kiểm kê" && (
            <>
              <Button variant="outline" className="h-[32px] text-[13px] font-bold border-[#ccc] bg-white text-[#1f1f1f]">Lưu</Button>
              <Button onClick={completeInventory} className="h-[32px] text-[13px] font-bold bg-[#007bff] hover:bg-[#0069d9] text-white rounded-[4px] px-6">
                Hoàn thành kiểm kê
              </Button>
            </>
          )}
          {status === "Đã hoàn thành" && (
            <Button disabled className="h-[32px] text-[13px] font-bold bg-green-600 text-white rounded-[4px] px-6 opacity-70">
              Đã kiểm kê
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
