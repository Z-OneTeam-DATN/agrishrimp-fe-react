"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useQuery } from "@tanstack/react-query";
import { BadgeAlert } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getPublicBanners } from "@/app/services/banner.service";

export default function Banner() {
  const plugin = React.useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false })
  );

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["public", "banners"],
    queryFn: getPublicBanners,
    staleTime: 5 * 60 * 1000,
  });

  const visibleBanners = React.useMemo(() => {
    const now = Date.now();

    return [...banners]
      .filter((banner) => {
        const startAt = banner.startDate ? new Date(banner.startDate).getTime() : null;
        const endAt = banner.endDate ? new Date(banner.endDate).getTime() : null;
        const validStart = startAt === null || Number.isNaN(startAt) || startAt <= now;
        const validEnd = endAt === null || Number.isNaN(endAt) || endAt >= now;

        return validStart && validEnd;
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [banners]);

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="h-[220px] w-full animate-pulse rounded-xl bg-slate-100 md:h-[300px] lg:h-[380px]" />
      </div>
    );
  }

  if (visibleBanners.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 md:h-[300px] lg:h-[380px]">
          Chưa có banner
        </div>
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{ loop: true, align: "start" }}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {visibleBanners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[220px] w-full overflow-hidden rounded-xl bg-slate-100 md:h-[300px] lg:h-[380px]">
                {banner.linkUrl ? (
                  <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img src={banner.imageUrl ?? ""} alt={banner.title ?? ""} className="h-full w-full object-cover" />
                  </a>
                ) : (
                  <img src={banner.imageUrl ?? ""} alt={banner.title ?? ""} className="h-full w-full object-cover" />
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent p-4 md:p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      {banner.title ? (
                        <p className="line-clamp-2 text-sm font-semibold text-white md:text-lg">
                          {banner.title}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-white/85 md:text-base">
                          Banner nổi bật trên trang chủ
                        </p>
                      )}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                      <BadgeAlert size={12} />
                      Ưu tiên {banner.displayOrder}
                    </span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 h-10 w-10 border-none bg-white/70 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100" />
        <CarouselNext className="right-4 h-10 w-10 border-none bg-white/70 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100" />
      </Carousel>
    </div>
  );
}
