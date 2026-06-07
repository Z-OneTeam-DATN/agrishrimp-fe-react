"use client";

import React, { useEffect, useState } from "react";
import BannerForm from "@/components/admin/banner/BannerForm";
import { adminGetBanners } from "@/app/services/banner.service";

export default function NewBannerPage() {
  const [bannerCount, setBannerCount] = useState(0);

  useEffect(() => {
    adminGetBanners()
      .then((banners) => setBannerCount(banners.length))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
          Thêm banner mới
        </h1>
      </div>
      <BannerForm bannerCount={bannerCount} />
    </div>
  );
}
