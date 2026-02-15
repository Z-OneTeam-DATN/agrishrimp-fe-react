"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { getCategories, deleteCategory } from "@/app/services/CategoryService";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  ImageIcon
} from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Định nghĩa Interface chuẩn cho Category
export interface Category {
  id: number;
  name: string;
  description: string;
  status: string;
  image: string;
  parentId: number | null;
  children?: Category[];
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const router = useRouter();

  // Hàm xây dựng cấu trúc cây từ mảng phẳng (Flat Array to Tree)
  const buildCategoryTree = (data: any[]): Category[] => {
    if (!Array.isArray(data)) return [];

    const categoryMap: Record<number, Category> = {};
    const tree: Category[] = [];

    // Bước 1: Khởi tạo Map
    data.forEach((item) => {
      categoryMap[item.id] = {
        id: item.id,
        name: item.name,
        description: item.description || "Chưa có mô tả",
        status: item.status === "ACTIVE" ? "Hiển thị" : "Đang ẩn",
        image: item.imageUrl || "",
        parentId: item.parentId || null,
        children: [],
      };
    });

    // Bước 2: Gắn con vào cha
    data.forEach((item) => {
      if (item.parentId && categoryMap[item.parentId]) {
        categoryMap[item.parentId].children?.push(categoryMap[item.id]);
      } else if (!item.parentId) {
        tree.push(categoryMap[item.id]);
      }
    });

    return tree;
  };

  const loadData = async () => {
    try {
      const data = await getCategories();
      const treeData = buildCategoryTree(data);
      setCategories(treeData);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      toast.error("Không thể tải danh sách danh mục");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (id: number) => {
    router.push(`/admin/categories/add?id=${id}`);
  };

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      toast.success("Đã xóa danh mục thành công!");
      loadData();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa danh mục!");
    } finally {
      setDeleteId(null);
    }
  };

  // Hàm render đệ quy từng dòng của bảng
  const renderCategoryRow = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedRows[category.id];
    const paddingLeft = level * 30 + 10;

    return (
      <React.Fragment key={category.id}>
        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
          <td className="p-3 text-sm text-slate-500 text-center font-bold font-mono">
            #{category.id}
          </td>

          <td className="p-3 text-sm text-slate-700 font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${paddingLeft}px` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <span className="w-6 h-6 inline-block" />
              )}

              {hasChildren ? (
                isExpanded ? <FolderOpen size={18} className="text-teal-600 shrink-0" /> : <Folder size={18} className="text-teal-600 shrink-0" />
              ) : (
                <span className="w-[18px] h-[18px] rounded-full bg-slate-200 block shrink-0" />
              )}

              <div className="relative w-9 h-9 rounded border border-slate-200 overflow-hidden shrink-0 ml-2 bg-white">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <ImageIcon size={14} />
                  </div>
                )}
              </div>

              <span className={cn("truncate ml-2", level === 0 ? "font-bold text-slate-800" : "font-normal text-slate-600")}>
                {category.name}
              </span>
            </div>
          </td>

          <td className="p-3 text-sm text-slate-500 truncate max-w-[200px]">{category.description}</td>
          <td className="p-3">
            <span className={cn(
              "text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide",
              category.status === "Hiển thị"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-slate-100 text-slate-500 border-slate-200"
            )}>
              {category.status}
            </span>
          </td>
          <td className="p-3 text-right">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                onClick={() => handleEdit(category.id)}
              >
                <Edit size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:bg-red-50"
                onClick={() => setDeleteId(category.id)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </td>
        </tr>

        {isExpanded && hasChildren && category.children!.map((child) =>
          renderCategoryRow(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Quản lý danh mục hàng hóa"
        addBtnLabel="Thêm danh mục"
        addBtnHref="/admin/categories/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên danh mục..."
          onRefresh={loadData}
        />

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                <th className="p-3 w-[80px] text-center">ID</th>
                <th className="p-3 min-w-[350px]">Tên danh mục</th>
                <th className="p-3">Mô tả</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((cat) => renderCategoryRow(cat))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                    Chưa có danh mục nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white rounded-[6px] border border-slate-200 shadow-xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold text-[16px] uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={20} /> Xác nhận xóa dữ liệu
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Bạn có chắc chắn muốn xóa danh mục này không? <br />
              Nếu xóa danh mục cha, các danh mục con có thể bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[32px] text-[12px] font-bold border-slate-300">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white h-[32px] text-[12px] font-bold"
            >
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}