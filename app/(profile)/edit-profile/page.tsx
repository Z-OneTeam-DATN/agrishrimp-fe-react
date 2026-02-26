"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { Phone, Lock, Loader2, MapPin, X } from "lucide-react";
import { AuthService } from "@/app/services/auth.service";
import { addressService } from "@/app/services/address.service";
import { Button } from "@/components/ui/button";

export default function EditProfilePage() {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [defaultAddress, setDefaultAddress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await AuthService.me();
      console.log("Dữ liệu trả về từ API /me:", currentUser);
      setUser(currentUser);

      try {
        const addresses = await addressService.getAll();
        if (Array.isArray(addresses) && addresses.length > 0) {
          const defAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
          setDefaultAddress(defAddr);
        }
      } catch (addrError) {
        console.warn("Lỗi API địa chỉ:", addrError);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn!");
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (isLoading) return (
    <div className="flex justify-center items-center h-[500px]">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
    </div>
  );

  const isGoogleAuth = user?.provider === "GOOGLE";

  const parseGender = (rawGender: any) => {
    if (rawGender === 0 || rawGender === "0" || rawGender === "MALE") return "MALE";
    if (rawGender === 1 || rawGender === "1" || rawGender === "FEMALE") return "FEMALE";
    if (rawGender === 2 || rawGender === "2" || rawGender === "OTHER") return "OTHER";
    return "OTHER";
  };

  const userData = {
    fullname: user?.fullName || user?.displayName || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    gender: parseGender(user?.gender),
    birthday: (user?.dateOfBirth || user?.birthday || user?.dob)
      ? new Date(user?.dateOfBirth || user?.birthday || user?.dob)
      : new Date("1995-05-20"),
    // ✅ Luôn ưu tiên lấy ảnh từ state 'user' để hiển thị ảnh mới nhất
    avatarUrl: user?.avatarUrl || "https://hinhcute.net/wp-content/uploads/2025/06/anh-26-meme-dang-yeu.jpg",
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <h5 className="font-bold text-gray-800 text-lg mb-6 pb-3 border-b border-gray-100 uppercase tracking-tight">Thiết lập tài khoản</h5>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 md:border-r border-gray-100 md:pr-8">
          <EditProfileForm
            initialValues={userData}
            isGoogleAuth={isGoogleAuth}
            onUpdateSuccess={(newPayload) => {
              // ✅ SỬA TẠI ĐÂY: Cập nhật toàn bộ payload (bao gồm cả avatarUrl) vào state user
              setUser((prev: any) => ({
                ...prev,
                fullName: newPayload.fullName,
                phoneNumber: newPayload.phoneNumber,
                gender: newPayload.gender,
                dateOfBirth: newPayload.dateOfBirth,
                avatarUrl: newPayload.avatarUrl // ⬅️ Dòng này cực kỳ quan trọng để giữ ảnh mới
              }));
            }}
          />
        </div>

        <div className="md:col-span-5 space-y-8">
          <div className="pb-6 border-b border-gray-100">
            <div className="font-bold mb-4 text-[11px] text-gray-400 uppercase tracking-widest">Thông tin liên lạc</div>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><Phone size={18} /></div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{userData.phone || "---"}</div>
                  <small className="text-gray-400 text-[10px] uppercase font-bold">Số điện thoại</small>
                </div>
              </div>
            </div>
          </div>

          {!isGoogleAuth && (
            <div className="pb-6 border-b border-gray-100">
              <div className="font-bold mb-4 text-[11px] text-gray-400 uppercase tracking-widest">Bảo mật</div>
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">Đổi mật khẩu</span>
                </div>
                <Button variant="outline" onClick={() => setShowPasswordModal(true)} className="h-9 px-4 text-xs font-bold bg-white border-gray-300 hover:border-emerald-600 transition-all">Cập nhật</Button>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-[11px] text-gray-400 uppercase tracking-widest">Địa chỉ mặc định</div>
              <Link href="/address" className="text-emerald-600 text-xs hover:underline font-bold">Quản lý</Link>
            </div>

            {defaultAddress ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 transition-all hover:border-emerald-500">
                <div className="font-bold text-gray-900 text-sm mb-1 flex items-center">
                  <MapPin size={14} className="text-emerald-500 mr-2" /> {defaultAddress.receiverName}
                  <span className="font-normal text-gray-400 ml-2 border-l pl-2 border-slate-300">{defaultAddress.receiverPhone}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mt-2">{defaultAddress.addressDetail}</p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-xs text-slate-400 mb-2">Bạn chưa thiết lập địa chỉ mặc định</p>
                <Link href="/profile/address" className="text-emerald-600 text-[11px] font-bold uppercase hover:underline">Thêm ngay</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h5 className="font-bold text-gray-800 text-lg">Cập nhật mật khẩu</h5>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <ChangePasswordForm onCancel={() => setShowPasswordModal(false)} onSuccess={() => setShowPasswordModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}