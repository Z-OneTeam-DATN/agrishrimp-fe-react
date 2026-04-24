"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useQuery } from "@tanstack/react-query";
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
      <div className="w-full">
        <div className="h-[220px] w-full animate-pulse bg-slate-100 md:h-[300px] lg:h-[380px]" />
      </div>
    );
  }

  if (visibleBanners.length === 0) {
    return (
      <div className="w-full">
        <div className="flex h-[220px] items-center justify-center bg-slate-50 text-sm text-slate-400 md:h-[300px] lg:h-[380px]">
          Chưa có banner
        </div>
      </div>
    );
  }

  return (
    <div className="group relative w-full">
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
              <div className="relative flex h-[220px] w-full items-center justify-center bg-transparent md:h-[300px] lg:h-[380px]">
                {banner.linkUrl ? (
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full w-full items-center justify-center"
                  >
                    <img
                      src={banner.imageUrl ?? ""}
                      alt={banner.title ?? ""}
                      className="h-full w-full object-contain"
                    />
                  </a>
                ) : (
                  <img
                    src={banner.imageUrl ?? ""}
                    alt={banner.title ?? ""}
                    className="h-full w-full object-contain"
                  />
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent p-4 md:p-5">
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
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 h-10 w-10 border-none bg-white/80 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100" />
        <CarouselNext className="right-4 h-10 w-10 border-none bg-white/80 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100" />
      </Carousel>
    </div>
  );
}
