"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminVariantTable } from "@/components/admin/AdminVariantTable";
import {
  getAttributes,
  deleteAttribute,
} from "@/app/services/AttributeService";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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

export default function VariantsPage() {
  const [attributes, setAttributes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const data = await getAttributes();
      setAttributes(data);
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await deleteAttribute(deleteId);
      toast.success("Đã xóa thuộc tính thành công");
      fetchAttributes();
    } catch (error) {
      toast.error("Không thể xóa thuộc tính này!");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Thuộc tính & Biến thể"
        addBtnLabel="Tạo thuộc tính mới"
        addBtnHref="/admin/variants/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên thuộc tính hoặc mã định danh..."
          onRefresh={fetchAttributes}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              Đang tải dữ liệu...
            </span>
          </div>
        ) : (
          <AdminVariantTable
            attributes={attributes}
            onDelete={(id) => setDeleteId(id)}
          />
        )}
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="max-w-[400px] rounded-[8px]">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-2">
              <Trash2 className="text-rose-500" size={24} />
            </div>
            <AlertDialogTitle className="text-center text-[18px] font-black uppercase text-slate-800">
              Xác nhận xóa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] text-slate-500">
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa thuộc
              tính này khỏi hệ thống không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 border-[#ccc] text-[12px] font-bold h-9">
              HỦY BỎ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-black h-9"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "XÓA NGAY"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
