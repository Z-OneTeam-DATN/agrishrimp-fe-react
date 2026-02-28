"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import {
  getCategories, deleteCategory, toggleCategoryStatus,
  createCategory, updateCategory, getCategoryById
} from "@/app/services/CategoryService";
import { toast } from "sonner";
import {
  AlertCircle, ChevronRight, ChevronDown, Edit, Trash2, Folder,
  FolderOpen, ImageIcon, Eye, EyeOff, AlertTriangle, Plus, Save, Camera, Loader2
} from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Category {
  id: number;
  name: string;
  status: string;
  image: string;
  parentId: number | null;
  productCount: number;
  children?: Category[];
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<{id: number, name: string, currentStatus: string} | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [parentList, setParentList] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentStatus, setCurrentStatus] = useState("all");

  // ✅ Thêm state để bắt lỗi riêng cho ô input tên danh mục
  const [nameError, setNameError] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "", parentId: "none", status: "ACTIVE", image: ""
  });

  const buildCategoryTree = (data: any[]): Category[] => {
    if (!Array.isArray(data)) return [];
    const categoryMap: Record<number, Category> = {};
    const tree: Category[] = [];

    data.forEach((item) => {
      categoryMap[item.id] = {
        id: item.id,
        name: item.name,
        status: item.status === "ACTIVE" ? "Hiển thị" : "Đang ẩn",
        image: item.imageUrl || "",
        parentId: item.parentId || null,
        productCount: item.productCount || 0,
        children: [],
      };
    });

    data.forEach((item) => {
      if (item.parentId && categoryMap[item.parentId]) {
        categoryMap[item.parentId].children?.push(categoryMap[item.id]);
      } else {
        tree.push(categoryMap[item.id]);
      }
    });

    return tree;
  };

  const loadData = async () => {
    try {
      const data = await getCategories("", undefined);
      setCategories(buildCategoryTree(data));

      const validParents = data.filter((cat: any) => !cat.parentId);
      setParentList(validParents);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: "", parentId: "none", status: "ACTIVE", image: "" });
    setNameError(""); // ✅ Reset lỗi khi mở form mới
    setIsModalOpen(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const data = await getCategoryById(id);
      setFormData({
        name: data.name,
        image: data.imageUrl || "",
        status: data.status,
        parentId: data.parentId ? String(data.parentId) : "none"
      });
      setEditingId(id);
      setNameError(""); // ✅ Reset lỗi khi mở form sửa
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Không tải được chi tiết danh mục!");
    }
  };

  const handleSaveForm = async () => {
    // ✅ Kiểm tra lỗi trống ở phía Frontend
    if(!formData.name.trim()) {
      setNameError("Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      setIsSaving(true);
      setNameError(""); // Xóa lỗi cũ trước khi gọi API

      const payload = {
        name: formData.name,
        imageUrl: formData.image,
        status: formData.status,
        parentId: formData.parentId === "none" ? null : Number(formData.parentId)
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await createCategory(payload);
        toast.success("Thêm mới danh mục thành công!");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail
                        || error.response?.data?.message
                        || error.response?.data?.error
                        || "Có lỗi xảy ra, vui lòng kiểm tra lại thông tin!";

      // ✅ Bắt lỗi từ Backend (ví dụ: Trùng tên) và nhét thẳng vào dưới ô Input
      setNameError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpand = (id: number) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      toast.success("Đã xóa danh mục thành công!");
      loadData();
    } catch (error: any) {
      const serverMessage = error.response?.data?.detail || error.response?.data?.message || "Không thể xóa danh mục này!";
      toast.error(serverMessage);
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusModal) return;
    try {
      await toggleCategoryStatus(statusModal.id, statusModal.currentStatus);
      toast.success(statusModal.currentStatus === "Hiển thị" ? "Đã ẩn danh mục và các cấp con!" : "Đã hiển thị lại danh mục!");
      loadData();
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái!");
    } finally {
      setStatusModal(null);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setFormData({...formData, image: event.target?.result as string});
      reader.readAsDataURL(file);
    }
  };

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedRows[category.id];
    const paddingLeft = level * 30 + 10;

    const matchKeyword = category.name.toLowerCase().includes(currentKeyword.toLowerCase());
    const targetStatusText = currentStatus === "ACTIVE" ? "Hiển thị" : currentStatus === "INACTIVE" ? "Đang ẩn" : "all";
    const matchStatus = currentStatus === "all" || category.status === targetStatusText;
    const anyChildMatches = category.children?.some(c => c.name.toLowerCase().includes(currentKeyword.toLowerCase()));

    if (!matchKeyword && !anyChildMatches && currentKeyword !== "") {
        return null;
    }

    return (
      <React.Fragment key={category.id}>
        <tr className={cn(
            "border-b border-slate-100 transition-colors group",
            !matchStatus ? "opacity-30 bg-slate-100" :
            category.status === "Đang ẩn" ? "bg-slate-50/50 opacity-75 hover:opacity-100" : "hover:bg-slate-50"
        )}>
          <td className="p-3 text-sm text-slate-500 text-center font-bold font-mono">#{category.id}</td>
          <td className="p-3 text-sm text-slate-700 font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${paddingLeft}px` }}>
              {hasChildren ? (
                <button onClick={() => toggleExpand(category.id)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : <span className="w-6 h-6 inline-block" />}

              {hasChildren ? (
                isExpanded ? <FolderOpen size={18} className="text-teal-600 shrink-0" /> : <Folder size={18} className="text-teal-600 shrink-0" />
              ) : <span className="w-[18px] h-[18px] rounded-full bg-slate-200 block shrink-0" />}

              <div className={cn("relative w-9 h-9 rounded border border-slate-200 overflow-hidden shrink-0 ml-2 bg-white", category.status === "Đang ẩn" && "grayscale")}>
                {category.image ? <Image src={category.image} alt={category.name} fill className="object-cover" sizes="36px" /> : <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><ImageIcon size={14} /></div>}
              </div>
              <span className={cn("truncate ml-2", level === 0 ? "font-bold text-slate-800" : "font-normal text-slate-600", category.status === "Đang ẩn" && "line-through text-slate-400")}>
                {category.name}
              </span>
            </div>
          </td>

          <td className="p-3 text-sm text-center font-bold text-slate-600">
            {category.productCount > 0 ? (
               <span className="bg-emerald-100 text-emerald-700 py-1 px-3 rounded-full text-xs">
                 {category.productCount} SP
               </span>
            ) : (
               <span className="text-slate-400 text-xs">0 SP</span>
            )}
          </td>

          <td className="p-3">
            <span className={cn("text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide", category.status === "Hiển thị" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200")}>
              {category.status}
            </span>
          </td>

          <td className="p-3 text-right">
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="icon" title="Ẩn/Hiện" className={cn("h-8 w-8", category.status === "Hiển thị" ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50")} onClick={() => setStatusModal({ id: category.id, name: category.name, currentStatus: category.status })}>
                {category.status === "Hiển thị" ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
              <Button variant="ghost" size="icon" title="Chỉnh sửa" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(category.id)}><Edit size={15} /></Button>
              <Button variant="ghost" size="icon" title="Xóa" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(category.id)}><Trash2 size={15} /></Button>
            </div>
          </td>
        </tr>
        {isExpanded && hasChildren && category.children!.map((child) => renderCategoryRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quản lý danh mục hàng hóa</h1>
         <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <Plus className="mr-2" size={18} /> THÊM DANH MỤC
         </Button>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên danh mục..."
          onSearch={(text) => setCurrentKeyword(text)}
          onRefresh={() => {
            setCurrentKeyword("");
            setCurrentStatus("all");
            loadData();
          }}
          filter2Options={[
            { label: "Tất cả trạng thái", value: "all" },
            { label: "Đang hiển thị", value: "ACTIVE" },
            { label: "Đang ẩn", value: "INACTIVE" }
          ]}
          onFilter2Change={(val) => setCurrentStatus(val)}
        />

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                <th className="p-3 w-[80px] text-center">ID</th>
                <th className="p-3 min-w-[400px]">Tên danh mục</th>
                <th className="p-3 text-center">Sản phẩm (Gồm cả con)</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((cat) => renderCategoryRow(cat))
              ) : (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Không tìm thấy dữ liệu phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG THÊM / SỬA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-emerald-700 border-b pb-3">
               {editingId ? "Cập nhật danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
            <DialogDescription className="hidden">
              Điền thông tin danh mục
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
             {/* Cột trái: Thông tin */}
             <div className="space-y-5">
                <div className="space-y-2">
                   {/* ✅ Label đổi sang màu đỏ nếu có lỗi */}
                   <Label className={cn("text-[11px] font-bold uppercase", nameError ? "text-red-500" : "text-slate-500")}>
                     Tên danh mục *
                   </Label>
                   <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      // ✅ Tự động ẩn thông báo lỗi khi người dùng bắt đầu gõ lại
                      if (nameError) setNameError("");
                    }}
                    placeholder="VD: Thuốc thú y, Thức ăn..."
                    // ✅ Khung input chuyển đỏ khi có lỗi
                    className={cn("focus-visible:ring-emerald-500 h-10 font-medium", nameError && "border-red-500 focus-visible:ring-red-500")}
                   />
                   {/* ✅ Hiển thị dòng chữ lỗi màu đỏ */}
                   {nameError && (
                     <p className="text-[12px] font-medium text-red-500 mt-1">{nameError}</p>
                   )}
                </div>

                <div className="space-y-2">
                   <Label className="text-[11px] font-bold text-slate-500 uppercase">Danh mục cấp cha</Label>
                   <Select value={formData.parentId} onValueChange={(val) => setFormData({...formData, parentId: val})}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Chọn danh mục cha" /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="none" className="font-bold text-slate-500">— Không có (Danh mục gốc) —</SelectItem>
                         {parentList.map((p) => (
                           <SelectItem key={p.id} value={String(p.id)} disabled={editingId === p.id}>{p.name}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <Label className="text-[11px] font-bold text-slate-500 uppercase">Trạng thái hiển thị</Label>
                   <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">CHO PHÉP HIỂN THỊ</SelectItem>
                         <SelectItem value="INACTIVE" className="text-amber-600 font-bold">ĐANG TẠM ẨN</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>

             {/* Cột phải: Hình ảnh */}
             <div className="space-y-3">
                <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Ảnh đại diện danh mục</Label>
                <div onClick={() => fileInputRef.current?.click()} className="relative border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg h-[180px] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group shadow-inner">
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera size={40} className="mx-auto mb-2 text-slate-300" />
                      <span className="text-[10px] font-bold uppercase text-slate-400">Tải ảnh lên</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleThumbnailChange} hidden accept="image/*" />
                </div>
             </div>
          </div>

          <DialogFooter className="border-t pt-5">
            <Button variant="outline" className="font-bold" onClick={() => setIsModalOpen(false)}>HỦY BỎ</Button>
            <Button onClick={handleSaveForm} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8">
               {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />}
               {editingId ? "CẬP NHẬT" : "LƯU DỮ LIỆU"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold flex items-center gap-2 uppercase">
              <AlertCircle size={20} /> Xác nhận xóa danh mục
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-sm">
              Bạn chỉ có thể xóa nếu danh mục này (và các con của nó) **không còn sản phẩm**. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Xóa vĩnh viễn</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL TRẠNG THÁI */}
      <AlertDialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <AlertDialogContent className="bg-white max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 font-bold flex items-center gap-2 uppercase">
              <AlertTriangle size={20} /> Thay đổi trạng thái
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-sm">
              {statusModal?.currentStatus === "Hiển thị" ? (
                <>Việc ẩn danh mục <strong>"{statusModal.name}"</strong> sẽ ẩn luôn các danh mục con và tất cả sản phẩm thuộc nhóm này.</>
              ) : (
                <>Hiển thị lại danh mục <strong>"{statusModal?.name}"</strong> lên cửa hàng?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus} className="bg-amber-500 hover:bg-amber-600 text-white">Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}