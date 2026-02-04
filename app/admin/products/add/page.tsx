"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  X, Settings, HelpCircle, Plus, Trash2, Save, 
  ChevronLeft, Image as ImageIcon, Layers, Camera, Upload, Tag, Box,
  AlertCircle,
  Settings2,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Package,
  ScanLine,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function AddProductPage() {
  const router = useRouter();
  const mainImagesRef = useRef<HTMLInputElement>(null);
  
  const [mainImages, setMainImages] = useState<string[]>([]);
  const [isVariantEnabled, setIsVariantEnabled] = useState(true);
  const [expandedVariants, setExpandedVariants] = useState<number[]>([]);
  
  const [variants, setVariants] = useState<any[]>([
    { id: 1001, formulation: "", packaging: "", weight: "", unit: "ml", price: 0, barcode: "", image: null, customSpecs: [] }
  ]);

  const toggleVariantExpand = (id: number) => {
    setExpandedVariants(prev => 
      prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
    );
  };

  const addVariantRow = () => {
    const newId = Date.now();
    setVariants([...variants, { id: newId, formulation: "", packaging: "", weight: "", unit: "ml", price: 0, barcode: "", image: null, customSpecs: [] }]);
    setExpandedVariants([...expandedVariants, newId]); // Tự động mở rộng dòng mới
  };

  const removeVariantRow = (id: number) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const addCustomSpec = (variantId: number) => {
    setVariants(prev => prev.map(v => {
      if (v.id === variantId) {
        return { ...v, customSpecs: [...v.customSpecs, { id: Date.now(), key: "", value: "" }] };
      }
      return v;
    }));
  };

  const removeCustomSpec = (variantId: number, specId: number) => {
    setVariants(prev => prev.map(v => {
      if (v.id === variantId) {
        return { ...v, customSpecs: v.customSpecs.filter((s: any) => s.id !== specId) };
      }
      return v;
    }));
  };

  const handleVariantImageChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setVariants(prev => prev.map(v => v.id === id ? { ...v, image: preview } : v));
    }
  };

  const handleMainImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setMainImages(prev => [...prev, ...newPreviews]);
    }
  };

  const onSave = () => {
    toast.success("Đã lưu dữ liệu sản phẩm thành công!");
    router.push("/admin/products");
  };

  const onSaveAndAdd = () => {
    toast.success("Đã lưu và chuẩn bị thêm sản phẩm mới");
    setMainImages([]);
    setVariants([{ id: 1001, formulation: "", packaging: "", weight: "", unit: "ml", price: 0, barcode: "", image: null, customSpecs: [] }]);
  };

  return (
    <div className="space-y-3 pb-[100px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Thiết lập sản phẩm mới
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9 space-y-3">
          
          {/* Box 1: Định danh */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <AlertCircle size={16} /> 1. Thông tin sản phẩm chính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <div className="md:col-span-2 space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Tên sản phẩm *</Label>
                <Input placeholder="Ví dụ: Kháng sinh Enrofloxacin 20%" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none" />
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Danh mục *</Label>
                <Select><SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none"><SelectValue placeholder="-- Chọn --" /></SelectTrigger><SelectContent><SelectItem value="thuoc">Thuốc & Chế phẩm</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Thương hiệu</Label>
                <Input placeholder="Hãng sản xuất" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Xuất xứ</Label>
                <Input placeholder="Quốc gia" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Mã SKU gốc</Label>
                <Input placeholder="SKU-PRO-001" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-mono shadow-none" />
              </div>
            </div>
          </div>

          {/* Box 2: Mô tả */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <FileText size={16} /> 2. Đặc tính & Bài viết mô tả
            </div>
            <Textarea placeholder="Nhập mô tả chi tiết sản phẩm..." className="min-h-[100px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus-visible:ring-emerald-500/20" />
          </div>

          {/* Box 3: Biến thể - ENTERPRISE GRID DESIGN */}
          <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-[15px] py-[10px] border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                  <Layers size={16} className="text-emerald-600" /> 3. Phân loại biến thể (SKUs)
                </h3>
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Kích hoạt:</span>
                  <Switch checked={isVariantEnabled} onCheckedChange={setIsVariantEnabled} className="data-[state=checked]:bg-emerald-600 h-5 w-9 shadow-none" />
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                disabled={!isVariantEnabled}
                onClick={addVariantRow} 
                className="h-[26px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white px-3 rounded-[3px] hover:bg-emerald-50 shadow-sm"
              >
                <Plus size={14} className="mr-1" /> THÊM DÒNG MỚI
              </Button>
            </div>

            {isVariantEnabled ? (
              <div className="overflow-x-auto">
                <Table className="table-custom border-collapse">
                  <TableHeader>
                    <TableRow className="bg-[#f0f0f0] border-b border-[#ccc] hover:bg-[#f0f0f0]">
                      <TableHead className="w-[40px] text-center p-[10px] font-bold text-[#555] text-[10px] uppercase">#</TableHead>
                      <TableHead className="w-[60px] text-center font-bold text-[#555] text-[10px] uppercase">Ảnh</TableHead>
                      <TableHead className="w-[180px] font-bold text-[#555] text-[10px] uppercase">Dạng bào chế</TableHead>
                      <TableHead className="w-[180px] font-bold text-[#555] text-[10px] uppercase">Quy cách</TableHead>
                      <TableHead className="w-[150px] font-bold text-[#555] text-[10px] uppercase text-right">Trọng lượng</TableHead>
                      <TableHead className="w-[180px] font-bold text-[#555] text-[10px] uppercase text-right">Giá bán (₫)</TableHead>
                      <TableHead className="w-[150px] font-bold text-[#555] text-[10px] uppercase">Mã vạch</TableHead>
                      <TableHead className="w-[80px] text-center font-bold text-[#555] text-[10px] uppercase">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((v, idx) => {
                      const isExpanded = expandedVariants.includes(v.id);
                      return (
                        <React.Fragment key={v.id}>
                          <TableRow className={cn("border-b border-[#eee] hover:bg-[#f0f8ff] transition-colors", isExpanded && "bg-[#f0f9f6]")}>
                            <TableCell className="text-center text-slate-400 text-[11px] font-bold">{idx + 1}</TableCell>
                            <TableCell className="p-2">
                              <div 
                                onClick={() => document.getElementById(`v-img-${v.id}`)?.click()}
                                className="w-10 h-10 border border-[#ddd] rounded-[3px] bg-white flex items-center justify-center cursor-pointer shadow-sm group hover:border-emerald-500 transition-all"
                              >
                                {v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <Camera size={14} className="text-slate-300" />}
                                <input type="file" id={`v-img-${v.id}`} hidden onChange={(e) => handleVariantImageChange(v.id, e)} accept="image/*" />
                              </div>
                            </TableCell>
                            <TableCell className="p-1 px-2">
                              <Input placeholder="Lỏng, bột..." className="h-[30px] border-transparent hover:border-[#ccc] focus:border-emerald-500 focus:ring-0 text-[13px] bg-transparent shadow-none" />
                            </TableCell>
                            <TableCell className="p-1 px-2">
                              <Input placeholder="Chai, gói..." className="h-[30px] border-transparent hover:border-[#ccc] focus:border-emerald-500 focus:ring-0 text-[13px] bg-transparent shadow-none" />
                            </TableCell>
                            <TableCell className="p-1 px-2">
                              <div className="flex items-center justify-end gap-1">
                                <Input type="number" placeholder="0" className="h-[30px] w-20 border-transparent hover:border-[#ccc] focus:border-emerald-500 focus:ring-0 text-[13px] bg-transparent shadow-none text-right font-medium" />
                                <Select defaultValue="ml">
                                  <SelectTrigger className="h-[30px] w-[60px] border-none shadow-none text-[12px] font-bold bg-transparent focus:ring-0"><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="ml">ml</SelectItem><SelectItem value="l">lít</SelectItem><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="p-1 px-2">
                              <div className="relative">
                                <Input type="number" defaultValue={0} className="h-[30px] border-transparent hover:border-[#ccc] focus:border-emerald-500 focus:ring-0 text-[13px] bg-transparent shadow-none text-right font-black text-emerald-700" />
                                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">₫</span>
                              </div>
                            </TableCell>
                            <TableCell className="p-1 px-2">
                              <Input placeholder="Barcode" className="h-[30px] border-transparent hover:border-[#ccc] focus:border-emerald-500 focus:ring-0 text-[12px] bg-transparent shadow-none font-mono" />
                            </TableCell>
                            <TableCell className="p-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => toggleVariantExpand(v.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                                  {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                </button>
                                <button onClick={() => removeVariantRow(v.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Dòng mở rộng cho thông số kỹ thuật riêng */}
                          {isExpanded && (
                            <TableRow className="bg-[#fdfdfd] hover:bg-[#fdfdfd]">
                              <TableCell colSpan={8} className="p-0">
                                <div className="pl-[100px] pr-8 py-3 border-b border-[#eee]">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                      <Settings2 size={12} /> Thông số kỹ thuật đặc thù cho mẫu này
                                    </span>
                                    <button onClick={() => addCustomSpec(v.id)} className="text-[10px] font-black text-emerald-600 hover:underline">+ THÊM THÔNG SỐ</button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {v.customSpecs.map((spec: any) => (
                                      <div key={spec.id} className="flex items-center gap-1 animate-in slide-in-from-bottom-1">
                                        <Input placeholder="Tên thông số" className="h-7 text-[11px] font-bold bg-white border-[#eee] w-1/3 rounded-[2px]" />
                                        <Input placeholder="Giá trị" className="h-7 text-[11px] border-[#eee] w-2/3 rounded-[2px]" />
                                        <button onClick={() => removeCustomSpec(v.id, spec.id)} className="text-slate-300 hover:text-rose-500"><X size={12} /></button>
                                      </div>
                                    ))}
                                    {v.customSpecs.length === 0 && <p className="text-[11px] text-slate-300 italic">Chưa có thông số riêng...</p>}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50/50">
                <p className="text-[12px] text-slate-400 font-medium italic">Sản phẩm này hiện đang được bán theo mặc định, không phân loại mẫu mã.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 text-center tracking-widest">Album hình ảnh</Label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {mainImages.map((src, i) => (
                <div key={i} className="relative aspect-square border border-[#eee] rounded-[3px] overflow-hidden group shadow-sm"><img src={src} className="w-full h-full object-cover" /><button onClick={() => setMainImages(mainImages.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button></div>
              ))}
              <div onClick={() => mainImagesRef.current?.click()} className="aspect-square border-2 border-dashed border-[#ddd] rounded-[4px] flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 transition-all cursor-pointer shadow-inner"><Upload size={20} className="text-slate-300 mb-1" /><span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tải ảnh</span></div>
            </div>
            <input type="file" ref={mainImagesRef} multiple hidden onChange={handleMainImagesChange} accept="image/*" />
          </div>

          <div className="bg-white border border-[#dcdcdc] p-[15px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">Trạng thái phát hành</Label>
            <Select defaultValue="active"><SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">ĐANG KINH DOANH</SelectItem><SelectItem value="inactive">TẠM NGỪNG BÁN</SelectItem></SelectContent></Select>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button variant="outline" className="min-w-[100px] h-[34px] text-[12px] font-bold border-[#ccc] bg-white rounded-[3px] shadow-sm" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button variant="outline" className="min-w-[120px] h-[34px] text-[12px] font-black border-emerald-500 text-emerald-600 bg-white rounded-[3px] hover:bg-emerald-50 shadow-sm" onClick={onSaveAndAdd}>CẤT & THÊM MỚI</Button>
        <Button className="min-w-[120px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md shadow-emerald-100" onClick={onSave}><Save size={16} className="mr-2" />LƯU DỮ LIỆU</Button>
      </div>
    </div>
  );
}