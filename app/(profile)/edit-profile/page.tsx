"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { Loader2 } from "lucide-react";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/stores/useAuthStore";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await AuthService.me();
      console.log("Dữ liệu trả về từ API /me:", currentUser);
      setUser(currentUser);
      setAuthUser(currentUser);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn!");
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, setAuthUser]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (!authUser) return;

    setUser((prev: any) => ({
      ...prev,
      ...authUser,
      fullName: authUser.fullName ?? prev?.fullName,
      displayName: authUser.displayName ?? prev?.displayName,
      avatar: authUser.avatar ?? prev?.avatar,
      avatarUrl: (authUser as any).avatarUrl ?? authUser.avatar?.imageUrl ?? prev?.avatarUrl,
    }));
  }, [authUser]);

  if (isLoading) return (
    <div className="flex justify-center items-center h-[500px]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
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
    avatarUrl:
      user?.avatar?.imageUrl ||
      user?.avatarUrl ||
      "https://hinhcute.net/wp-content/uploads/2025/06/anh-26-meme-dang-yeu.jpg",
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <h5 className="mb-6 border-b border-gray-100 pb-3 text-lg font-bold text-gray-800">
        Thiết lập tài khoản
      </h5>

      <div className="space-y-8">
        <EditProfileForm
          initialValues={userData}
          isGoogleAuth={isGoogleAuth}
          onUpdateSuccess={(newPayload) => {
            setUser((prev: any) => {
              const updatedUser = {
                ...prev,
                fullName: newPayload.fullName,
                displayName: newPayload.fullName,
                phoneNumber: newPayload.phoneNumber,
                gender: newPayload.gender,
                dateOfBirth: newPayload.dateOfBirth,
                avatarUrl: newPayload.avatarUrl,
                avatar: newPayload.avatarUrl
                  ? {
                      ...(prev?.avatar || {}),
                      imageUrl: newPayload.avatarUrl,
                    }
                  : prev?.avatar,
              };

              setAuthUser(updatedUser);
              return updatedUser;
            });
          }}
        />
      </div>
    </div>
  );
}
