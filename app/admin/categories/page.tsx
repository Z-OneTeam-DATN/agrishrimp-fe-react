"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import {
  getCategories,
  deleteCategory,
  createCategory,
  updateCategory,
  toggleCategoryStatus
} from "@/app/services/CategoryService";
import { toast } from "sonner";
import { Tag, ChevronDown, ChevronRight, Plus, Image as ImageIcon, Loader2, Save, Edit, Trash2, Eye, EyeOff } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useRouter } from "next/navigation";

export interface Category {
  id: number;
  name: string;
  status: string;
  imageUrl: string;
  parentId: number | null;
  productCount: number;
  children?: Category[];
}

export default function CategoryManagementPage() {
  const { hasPermission, isLoadingAuth } = usePermissions();
  const router = useRouter();

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
  const [nameError, setNameError] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "", parentId: "none", status: "ACTIVE", imageUrl: ""
  });

  useEffect(() => {
    if (!isLoadingAuth && !hasPermission(P.CATEGORY_VIEW)) {
      router.push("/admin/forbidden");
    }
  }, [isLoadingAuth, hasPermission, router]);

  const buildCategoryTree = (data: any[]): Category[] => {
    const map: Record<number, Category> = {};
    const roots: Category[] = [];

    data.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    data.forEach((item) => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children!.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  };

  const loadData = async (keyword = "", status = "all") => {
    try {
      const response = await getCategories(keyword, status);

      // SỬA LỖI Ở ĐÂY: Trích xuất đúng mảng dữ liệu từ API response
      let dataArray = [];
      if (Array.isArray(response)) {
        dataArray = response;
      } else if (response && typeof response === 'object') {
        // Kiểm tra các key phổ biến chứa mảng dữ liệu trả về từ backend
        dataArray = response.data || response.content || response.items || response.result || [];
      }

      setParentList(dataArray);
      const tree = buildCategoryTree(dataArray);
      setCategories(tree);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      toast.error("Không thể tải danh sách danh mục");
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && hasPermission(P.CATEGORY_VIEW)) {
      loadData();
    }
  }, [isLoadingAuth]);

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: "", parentId: "none", status: "ACTIVE", imageUrl: "" });
    setNameError("");
    setIsModalOpen(true);
  };

  const handleEdit = (id: number) => {
    const findInTree = (list: Category[]): Category | undefined => {
      for (const item of list) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findInTree(item.children);
          if (found) return found;
        }
      }
    };

    const cat = findInTree(categories);
    if (cat) {
      setEditingId(id);
      setFormData({
        name: cat.name,
        parentId: cat.parentId ? String(cat.parentId) : "none",
        status: cat.status === "Hiển thị" ? "ACTIVE" : "INACTIVE",
        imageUrl: cat.imageUrl || "",
      });
      setNameError("");
      setIsModalOpen(true);
    }
  };

  // Sửa lại đoạn gọi hàm trong page.tsx
  const handleToggleStatus = async () => {
    if (!statusModal) return;
    try {
      // Xác định trạng thái mới cần đổi
      const newStatus = statusModal.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      // LƯU Ý: Phải kiểm tra xem currentStatus của bạn đang lưu là 'ACTIVE' hay 'Hiển thị' để đảo ngược cho đúng.

      // Tùy thuộc vào hàm toggleCategoryStatus của bạn viết như thế nào
      await toggleCategoryStatus(statusModal.id, {
          name: statusModal.name, // Truyền kèm name để pass qua @NotBlank
          status: newStatus
      });

      toast.success(`Đã cập nhật trạng thái danh mục: ${statusModal.name}`);
      loadData(currentKeyword, currentStatus);
    } catch (error) {
      toast.error("Không thể thay đổi trạng thái danh mục");
    } finally {
      setStatusModal(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      toast.success("Xóa danh mục thành công");
      loadData(currentKeyword, currentStatus);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa danh mục này");
    } finally {
      setDeleteId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setNameError("Tên danh mục không được để trống!");
      return;
    }
    setNameError("");

    try {
      setIsSaving(true);
      const payload = {
        name: formData.name,
        parentId: formData.parentId === "none" ? null : Number(formData.parentId),
        status: formData.status,
        imageUrl: formData.imageUrl,
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await createCategory(payload);
        toast.success("Thêm danh mục mới thành công");
      }
      setIsModalOpen(false);
      loadData(currentKeyword, currentStatus);
    } catch (error: any) {
          console.error("Lỗi từ Server:", error.response?.data);

          const responseData = error.response?.data;
          let serverMsg = "Có lỗi xảy ra khi lưu danh mục"; // Giá trị mặc định

          // 1. TRÍCH XUẤT LỖI TỪ ĐÚNG CẤU TRÚC JSON CỦA BACKEND
          if (responseData?.detail) {
            serverMsg = responseData.detail; // Lấy dữ liệu từ biến 'detail' theo log của bạn
          } else if (responseData?.message) {
            serverMsg = responseData.message; // Đề phòng trường hợp API khác trả về 'message'
          } else if (typeof responseData === 'string') {
            serverMsg = responseData;
          }

          // 2. KIỂM TRA MÃ TRẠNG THÁI TỪ HEADER VÀ TỪ BODY
          const httpStatus = error.response?.status; // Mã trên mạng (vd: 400)
          const bodyStatus = responseData?.statusCode; // Mã trong nội dung (vd: '409 CONFLICT')

          // 3. KIỂM TRA ĐIỀU KIỆN TRÙNG LẶP
          const isDuplicate =
              httpStatus === 409 ||
              (typeof bodyStatus === 'string' && bodyStatus.includes('409')) ||
              serverMsg.toLowerCase().includes("tồn tại") ||
              serverMsg.toLowerCase().includes("already exists");

          if (isDuplicate) {
            setNameError(serverMsg); // Hiện dòng đỏ dưới ô nhập với câu chữ chính xác từ server
          } else {
            toast.error(serverMsg); // Hiện Toast cho các lỗi khác
          }
        } finally {
          setIsSaving(false);
        }
  };

  const handleSearch = (val: string) => {
    setCurrentKeyword(val);
    loadData(val, currentStatus);
  };

  const canAction = hasPermission(P.CATEGORY_UPDATE) || hasPermission(P.CATEGORY_DELETE);

  const renderCategoryRow = (category: Category, level = 0) => {
    const isExpanded = expandedRows[category.id];
    const hasChildren = category.children && category.children.length > 0;

    return (
      <React.Fragment key={category.id}>
        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td className="p-3 pl-5 text-sm text-slate-500 font-bold font-mono">#{category.id}</td>
          <td className="p-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <button onClick={() => toggleExpand(category.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                  {isExpanded ? <ChevronDown size={14} className="text-blue-600" /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <div className="w-8 h-8 rounded border border-slate-200 bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                {category.imageUrl ? (
                   <Image src={category.imageUrl} alt={category.name} width={32} height={32} className="object-contain p-0.5" />
                ) : (
                   <Tag size={14} className="text-slate-300" />
                )}
              </div>
              <span className={cn("text-[13px] uppercase tracking-tight", level === 0 ? "font-black text-slate-800" : "font-bold text-slate-600")}>
                {category.name}
              </span>
            </div>
          </td>
          <td className="p-3 text-center">
            <span className="text-[12px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{category.productCount}</span>
          </td>
          <td className="p-3 text-center">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide", category.status === "Hiển thị" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200")}>{category.status}</span>
          </td>
          {canAction && (
            <td className="p-3 text-right">
              <div className="flex justify-end gap-2">
                {hasPermission(P.CATEGORY_UPDATE) && (
                  <Button variant="ghost" size="icon" title="Ẩn/Hiện" className={cn("h-8 w-8", category.status === "Hiển thị" ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50")} onClick={() => setStatusModal({ id: category.id, name: category.name, currentStatus: category.status })}>
                    {category.status === "Hiển thị" ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                )}
                {hasPermission(P.CATEGORY_UPDATE) && (
                  <Button variant="ghost" size="icon" title="Chỉnh sửa" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(category.id)}><Edit size={15} /></Button>
                )}
                {hasPermission(P.CATEGORY_DELETE) && (
                  <Button variant="ghost" size="icon" title="Xóa" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(category.id)}><Trash2 size={15} /></Button>
                )}
              </div>
            </td>
          )}
        </tr>
        {isExpanded && hasChildren && category.children!.map((child) => renderCategoryRow(child, level + 1))}
      </React.Fragment>
    );
  };

  // SỬA LỖI BẢO VỆ Ở ĐÂY: Đảm bảo renderParentList luôn là mảng để tránh lỗi .filter is not a function
  const renderParentList = Array.isArray(parentList) ? parentList : [];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quản lý danh mục hàng hóa</h1>
         {hasPermission(P.CATEGORY_CREATE) && (
           <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Plus className="mr-2" size={18} /> THÊM DANH MỤC
           </Button>
         )}
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter placeholder="Tìm tên danh mục..." onSearch={handleSearch} onRefresh={loadData} />

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                <th className="p-3 w-[80px] pl-5">ID</th>
                <th className="p-3">Tên Danh Mục</th>
                <th className="p-3 text-center">Sản phẩm</th>
                <th className="p-3 text-center">Trạng thái</th>
                {canAction && <th className="p-3 text-right pr-5">Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((cat) => renderCategoryRow(cat))
              ) : (
                <tr><td colSpan={canAction ? 5 : 4} className="p-8 text-center text-slate-400 italic font-bold">Chưa có danh mục nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 border-b bg-slate-50">
            <DialogTitle className="text-xl font-black uppercase text-slate-800 flex items-center gap-2">
              <Tag className="text-emerald-600" />
              {editingId ? "Cập nhật danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden bg-slate-50 group">
                {formData.imageUrl ? (
                  <>
                    <Image src={formData.imageUrl} alt="Preview" fill className="object-contain p-1" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="text-white h-6 w-6" />
                    </div>
                  </>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center text-slate-400 hover:text-emerald-600 transition-colors">
                    <ImageIcon size={24} />
                    <span className="text-[10px] font-bold mt-1 uppercase">Tải ảnh</span>
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Tên danh mục *</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setNameError(""); // Tự động xóa lỗi khi người dùng bắt đầu gõ lại
                }}
                placeholder="VD: Thuốc thú y, Thức ăn..."
                className={cn("h-10 text-sm font-bold", nameError && "border-red-500 focus-visible:ring-red-200")}
              />
              {/* Hiển thị lỗi đỏ ngay dưới ô Input */}
              {nameError && <p className="text-[11px] text-red-500 font-bold animate-in fade-in slide-in-from-top-1">{nameError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Danh mục cha</Label>
              <Select value={formData.parentId} onValueChange={(val) => setFormData({ ...formData, parentId: val })}>
                <SelectTrigger className="h-10 text-sm font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-bold">DANH MỤC GỐC</SelectItem>
                  {/* SỬ DỤNG BIẾN ĐÃ ĐƯỢC BẢO VỆ Ở ĐÂY */}
                  {renderParentList.filter(p => p.id !== editingId).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Trạng thái</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger className="h-10 font-black text-emerald-600 uppercase"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="font-bold text-emerald-600">ĐANG HIỂN THỊ</SelectItem>
                  <SelectItem value="INACTIVE" className="font-bold text-amber-600">TẠM ẨN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 border-t flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-10 px-6 text-xs font-bold uppercase tracking-widest">Hủy</Button>
              <Button type="submit" disabled={isSaving} className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={16} />}
                {editingId ? "Cập nhật ngay" : "Thêm danh mục"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL XÓA */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 uppercase font-black tracking-tight">Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">Bạn có chắc chắn muốn xóa danh mục này không? Các danh mục con sẽ bị ảnh hưởng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase h-9 text-xs">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs uppercase">Đồng ý xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL TRẠNG THÁI */}
      <AlertDialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 uppercase font-black tracking-tight">Thay đổi trạng thái hiển thị</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">Bạn muốn {statusModal?.currentStatus === "Hiển thị" ? "ẨN" : "HIỂN THỊ"} danh mục <strong>{statusModal?.name}</strong> trên cửa hàng?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase h-9 text-xs">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-9 text-xs uppercase">Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}