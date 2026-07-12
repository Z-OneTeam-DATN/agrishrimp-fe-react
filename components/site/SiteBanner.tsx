import { BannerDTO } from "@/app/services/banner.service";
import SiteBannerCarousel from "@/components/site/SiteBannerCarousel";

const BANNER_HEIGHT_CLASS = "h-[240px] sm:h-[320px] md:h-[400px] lg:h-[500px]";

interface SiteBannerProps {
  banners: BannerDTO[];
}

export default function SiteBanner({ banners }: SiteBannerProps) {
  const now = Date.now();

  const visibleBanners = [...banners]
    .filter((banner) => {
      const startAt = banner.startDate ? new Date(banner.startDate).getTime() : null;
      const endAt = banner.endDate ? new Date(banner.endDate).getTime() : null;
      const validStart = startAt === null || Number.isNaN(startAt) || startAt <= now;
      const validEnd = endAt === null || Number.isNaN(endAt) || endAt >= now;

      return validStart && validEnd;
    })
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (visibleBanners.length === 0) {
    return (
      <div className="w-full">
        <div
          className={`flex ${BANNER_HEIGHT_CLASS} items-center justify-center bg-slate-50 text-sm text-slate-400`}
        >
          Chưa có banner
        </div>
      </div>
    );
  }

  return <SiteBannerCarousel banners={visibleBanners} />;
}
