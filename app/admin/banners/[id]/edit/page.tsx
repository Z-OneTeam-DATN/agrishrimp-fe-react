"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import BannerForm from "@/components/admin/banner/BannerForm";
import { BannerDTO, adminGetBanners } from "@/app/services/banner.service";

export default function EditBannerPage() {
  const { id } = useParams<{ id: string }>();
  const [banner, setBanner] = useState<BannerDTO | null>(null);
  const [bannerCount, setBannerCount] = useState(0);
  const [allBanners, setAllBanners] = useState<BannerDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetBanners()
      .then((banners) => {
        setBannerCount(banners.length);
        setAllBanners(banners);
        setBanner(banners.find((item) => item.id === Number(id)) ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="py-16 text-center font-medium text-slate-400">
        Không tìm thấy banner.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800">
          Chỉnh sửa banner
        </h1>
      </div>

      <BannerForm
        initialData={banner}
        bannerCount={bannerCount}
        existingBanners={allBanners}
      />
    </div>
  );
}
