import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";

export default function AdminLoading() {
  return (
    <AdminDataSyncLoader
      className="min-h-[calc(100vh-140px)] rounded-[20px] border border-slate-200/70 shadow-sm"
      message="ĐANG CHUẨN BỊ TRANG..."
    />
  );
}
