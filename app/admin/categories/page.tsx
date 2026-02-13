"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminCategoryTable, Category } from "@/components/admin/AdminCategoryTable";
import { getCategories, deleteCategory } from "@/app/services/CategoryService";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

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

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null); // State lưu ID đang cần xóa
  const router = useRouter();

  const loadData = async () => {
    try {
      const data = await getCategories();
      const formattedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || "Chưa có mô tả",
        status: item.status === "ACTIVE" ? "Hiển thị" : "Đang ẩn",
        image: item.imageUrl,
        productCount: 0
      }));
      setCategories(formattedData);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      toast.error("Không thể tải danh sách danh mục");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (category: Category) => {
    router.push(`/admin/categories/add?id=${category.id}`);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteCategory(deleteId);
      toast.success("Đã xóa danh mục thành công!");
      loadData();
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      toast.error("Có lỗi xảy ra khi xóa danh mục!");
    } finally {
      setDeleteId(null);
    }
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

        <AdminCategoryTable
          categories={categories}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white rounded-[6px] border border-slate-200 shadow-xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold text-[16px] uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={20} /> Xác nhận xóa dữ liệu
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Bạn có chắc chắn muốn xóa danh mục này không? <br />
              Hành động này không thể hoàn tác.
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