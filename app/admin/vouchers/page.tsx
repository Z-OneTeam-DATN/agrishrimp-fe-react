"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Ticket, X, Loader2, AlertCircle, EyeOff } from "lucide-react";
import { voucherService, Voucher } from "@/app/services/voucher.service";

// Hàm hỗ trợ format số ra chuỗi có dấu phẩy (vd: 10000 -> "10,000")
const formatNumberString = (value: number | string) => {
  if (!value) return "";
  const numericValue = String(value).replace(/\D/g, "");
  return Number(numericValue).toLocaleString("en-US");
};

// Hàm loại bỏ dấu phẩy để lấy số thực về cập nhật state (vd: "10,000" -> 10000)
const parseNumberString = (value: string) => {
  const numericValue = value.replace(/\D/g, "");
  return numericValue ? Number(numericValue) : 0;
};

export default function AdminVoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteConfirmVoucher, setDeleteConfirmVoucher] = useState<Voucher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [dateError, setDateError] = useState<string>("");

  const [formData, setFormData] = useState<Voucher>({
    code: "",
    title: "",
    description: "",
    discountType: "FIXED",
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: "",
    endDate: "",
    quantity: 100,
    usageLimit: 1,
    status: "ACTIVE",
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherService.getAllAdmin();
      const voucherArray = res.data ? res.data : res;

      let arr = Array.isArray(voucherArray) ? voucherArray : [];
      arr = arr.sort((a, b) => (b.id || 0) - (a.id || 0));

      setVouchers(arr);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate).getTime();
      const end = new Date(formData.endDate).getTime();
      if (end <= start) {
        setDateError("Ngày kết thúc phải lớn hơn ngày bắt đầu");
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  }, [formData.startDate, formData.endDate]);

  const handleOpenModal = (voucher?: Voucher) => {
    setDateError("");
    if (voucher) {
      setEditingId(voucher.id!);
      setFormData({
        ...voucher,
        discountType: voucher.discountType || "FIXED",
        discountValue: voucher.discountValue !== undefined ? voucher.discountValue : ((voucher as any).value || 0),
        minOrderValue: Math.max(0, voucher.minOrderValue || 0),
        maxDiscount: Math.max(0, voucher.maxDiscount || 0),
        usageLimit: Math.max(1, (voucher as any).maxUsagePerUser !== undefined ? (voucher as any).maxUsagePerUser : (voucher.usageLimit || 1)),
        quantity: Math.max(1, voucher.quantity || 100),
        status: voucher.status || "ACTIVE",
        startDate: voucher.startDate ? voucher.startDate.substring(0, 16) : "",
        endDate: voucher.endDate ? voucher.endDate.substring(0, 16) : "",
      });
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const currentDateTime = now.toISOString().slice(0, 16);

      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextWeekDateTime = nextWeek.toISOString().slice(0, 16);

      const autoCode = "VC" + Math.random().toString(36).substring(2, 8).toUpperCase();

      setEditingId(null);
      setFormData({
        code: autoCode,
        title: "",
        description: "",
        discountType: "FIXED",
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        startDate: currentDateTime,
        endDate: nextWeekDateTime,
        quantity: 100,
        usageLimit: 1,
        status: "ACTIVE",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError) return;

    setIsSubmitting(true);
    try {
      // BƯỚC ĐÓNG GÓI DỮ LIỆU ĐỂ CHIỀU LÒNG BACKEND MỚI
      const dataToSubmit = {
        ...formData,
        value: formData.discountValue,          // Đẩy discountValue vào biến value cho Backend
        maxUsagePerUser: formData.usageLimit,   // Đẩy usageLimit vào biến maxUsagePerUser cho Backend
      } as any; // Ép kiểu thành any để vượt qua rào cản kiểm tra của TypeScript cho dataToSubmit

      if (dataToSubmit.discountType === "FIXED") {
         dataToSubmit.maxDiscount = 0;
      }

      if (editingId) {
        // --- LOGIC MỚI: BẮT LỖI VÀ HIỂN THỊ THÔNG BÁO RIÊNG KHI CHUYỂN THÀNH HẾT HẠN ---
        const originalVoucher = vouchers.find(v => v.id === editingId);
        await voucherService.update(editingId, dataToSubmit);

        const nowTime = new Date().getTime();
        // Kiểm tra xem lúc trước có phải CÒN HẠN không?
        const wasActive = originalVoucher && originalVoucher.status !== "EXPIRED" && new Date(originalVoucher.endDate).getTime() > nowTime;
        // Kiểm tra xem hiện tại có phải HẾT HẠN không?
        const isNowExpired = dataToSubmit.status === "EXPIRED" || new Date(dataToSubmit.endDate).getTime() <= nowTime;

        if (wasActive && isNowExpired) {
          toast.success("Voucher còn hạn sử dụng đã được chuyển thành Hết hạn!");
        } else {
          toast.success("Cập nhật voucher thành công");
        }
        // -------------------------------------------------------------------------------
      } else {
        await voucherService.create(dataToSubmit);
        toast.success("Tạo voucher thành công");
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmVoucher || !deleteConfirmVoucher.id) return;
    setIsDeleting(true);

    const isExpired = new Date(deleteConfirmVoucher.endDate).getTime() <= new Date().getTime() || deleteConfirmVoucher.status === "EXPIRED";

    try {
      if (isExpired) {
        await voucherService.delete(deleteConfirmVoucher.id);
        toast.success("Đã xóa voucher vĩnh viễn");
      } else {
        const payload: Voucher = {
          ...deleteConfirmVoucher,
          // Đẩy đúng biến value và maxUsagePerUser lên API update để không bị lỗi 400
          value: deleteConfirmVoucher.discountValue !== undefined ? deleteConfirmVoucher.discountValue : (deleteConfirmVoucher as any).value,
          maxUsagePerUser: deleteConfirmVoucher.usageLimit !== undefined ? deleteConfirmVoucher.usageLimit : (deleteConfirmVoucher as any).maxUsagePerUser,
          status: "INACTIVE"
        } as any; // Ép kiểu thành any
        await voucherService.update(deleteConfirmVoucher.id, payload);
        toast.success("Voucher còn thời hạn, đã chuyển sang trạng thái Tạm ẩn");
      }
      fetchVouchers();
    } catch (error) {
      toast.error("Lỗi khi xử lý voucher");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmVoucher(null);
    }
  };

  const getDiscountValue = (v: any) => v.discountValue !== undefined ? v.discountValue : (v.value || 0);

  const generateTitle = (type: string, val: number) => {
    if (type === "PERCENT") return `Giảm ${val}%`;
    return `Giảm ${val.toLocaleString("vi-VN")}đ`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="text-emerald-600" /> Quản lý Voucher
          </h1>
          <p className="text-gray-500 text-sm mt-1">Tạo và quản lý các chương trình khuyến mãi</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Thêm Voucher
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
              <th className="p-4 font-semibold">Mã Code</th>
              <th className="p-4 font-semibold">Chương trình</th>
              <th className="p-4 font-semibold">Mức giảm</th>
              <th className="p-4 font-semibold">Thời hạn</th>
              <th className="p-4 font-semibold">Số lượng</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-emerald-600" /></td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-500">Chưa có voucher nào.</td></tr>
            ) : (
              vouchers.map((v) => {
                const val = getDiscountValue(v);

                // ===== TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI HIỂN THỊ =====
                const isExpired = new Date(v.endDate).getTime() < new Date().getTime();
                const displayStatus = isExpired ? "EXPIRED" : v.status;
                // ================================================

                return (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-emerald-600 uppercase">{v.code}</td>
                    <td className="p-4">
                      <p className="font-medium text-gray-800">{generateTitle(v.discountType, val)}</p>
                      <p className="text-xs text-gray-400">Đơn tối thiểu: {v.minOrderValue?.toLocaleString('vi-VN') || 0}đ</p>
                    </td>
                    <td className="p-4">
                      {v.discountType === "FIXED"
                        ? `${val.toLocaleString('vi-VN')}đ`
                        : `${val}% ${v.maxDiscount ? `(Tối đa ${v.maxDiscount.toLocaleString('vi-VN')}đ)` : ''}`}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(v.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {v.quantity}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        displayStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        displayStatus === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(v)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                      <button onClick={() => setDeleteConfirmVoucher(v)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{editingId ? "Sửa Voucher" : "Thêm Voucher Mới"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-500 hover:text-gray-800" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher (Code)</label>
                  <input
                    readOnly
                    value={formData.code}
                    className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-emerald-700 font-bold cursor-not-allowed outline-none focus:ring-0 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500">
                    <option value="ACTIVE">Kích hoạt</option>
                    <option value="INACTIVE">Tạm ẩn</option>
                    <option value="EXPIRED">Đã hết hạn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình</label>
                <input
                  readOnly
                  value={generateTitle(formData.discountType, formData.discountValue)}
                  className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-gray-600 font-medium cursor-not-allowed outline-none"
                  title="Tên được tự động tạo dựa trên mức giảm giá vì hệ thống không lưu trường này"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value as any})} className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500">
                    <option value="FIXED">Giảm số tiền cố định (VNĐ)</option>
                    <option value="PERCENT">Giảm theo phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức giảm {formData.discountType === 'PERCENT' ? '(%)' : '(VNĐ)'}
                  </label>
                  {/* Bắt số định dạng phẩy cho tiền mặt hoặc ô nhập % thường */}
                  {formData.discountType === 'FIXED' ? (
                    <input
                      type="text"
                      required
                      value={formatNumberString(formData.discountValue)}
                      onChange={e => setFormData({...formData, discountValue: parseNumberString(e.target.value)})}
                      className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.discountValue}
                      onChange={e => setFormData({...formData, discountValue: Math.max(0, Number(e.target.value))})}
                      className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="text"
                    required
                    value={formatNumberString(formData.minOrderValue)}
                    onChange={e => setFormData({...formData, minOrderValue: parseNumberString(e.target.value)})}
                    className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500"
                  />
                </div>
                {formData.discountType === 'PERCENT' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (VNĐ)</label>
                    <input
                      type="text"
                      required
                      value={formatNumberString(formData.maxDiscount || 0)}
                      onChange={e => setFormData({...formData, maxDiscount: parseNumberString(e.target.value)})}
                      className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : <div />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số lượng phát hành</label>
                  <input type="text" required value={formatNumberString(formData.quantity)} onChange={e => setFormData({...formData, quantity: parseNumberString(e.target.value)})} className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lượt dùng tối đa / 1 người</label>
                  <input type="text" required value={formatNumberString(formData.usageLimit)} onChange={e => setFormData({...formData, usageLimit: Math.max(1, parseNumberString(e.target.value))})} className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border rounded-lg p-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className={`w-full border rounded-lg p-2 outline-none ${dateError ? 'border-red-500 focus:border-red-500 bg-red-50' : 'focus:border-emerald-500'}`}
                  />
                  {dateError && <p className="text-red-500 text-xs mt-1 font-medium">{dateError}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!dateError}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Lưu Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA / TẠM ẨN THÔNG MINH */}
      {deleteConfirmVoucher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center transform transition-all">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              (new Date(deleteConfirmVoucher.endDate).getTime() <= new Date().getTime() || deleteConfirmVoucher.status === "EXPIRED")
                ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              {(new Date(deleteConfirmVoucher.endDate).getTime() <= new Date().getTime() || deleteConfirmVoucher.status === "EXPIRED")
                ? <AlertCircle className="text-red-600" size={32} />
                : <EyeOff className="text-orange-500" size={32} />
              }
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {(new Date(deleteConfirmVoucher.endDate).getTime() <= new Date().getTime() || deleteConfirmVoucher.status === "EXPIRED")
                ? "Xác nhận xóa vĩnh viễn"
                : "Tạm ẩn Voucher"}
            </h3>

            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {(new Date(deleteConfirmVoucher.endDate).getTime() <= new Date().getTime() || deleteConfirmVoucher.status === "EXPIRED")
                ? "Bạn có chắc chắn muốn xóa vĩnh viễn voucher đã hết hạn này không? Hành động này không thể hoàn tác."
                : "Voucher này vẫn còn thời hạn. Hệ thống sẽ chuyển voucher sang trạng thái 'Tạm ẩn' để ngừng sử dụng thay vì xóa vĩnh viễn."}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmVoucher(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors w-full disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`px-5 py-2.5 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors w-full disabled:opacity-50 ${
                  (new Date(deleteConfirmVoucher.endDate).getTime() <= new Date().getTime() || deleteConfirmVoucher.status === "EXPIRED")
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : (
                  (new Date(deleteConfirmVoucher.endDate).getTime() <= new Date().getTime() || deleteConfirmVoucher.status === "EXPIRED")
                    ? "Xóa vĩnh viễn"
                    : "Tạm ẩn ngay"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}