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

const BANNER_HEIGHT_CLASS = "h-[320px] sm:h-[380px] md:h-[480px] lg:h-[560px]";

export default function Banner() {
  const plugin = React.useRef(
    Autoplay({ delay: 2200, stopOnInteraction: false })
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
        <div className={`${BANNER_HEIGHT_CLASS} w-full animate-pulse bg-slate-100`} />
      </div>
    );
  }

  if (visibleBanners.length === 0) {
    return (
      <div className="w-full">
        <div className={`flex ${BANNER_HEIGHT_CLASS} items-center justify-center bg-slate-50 text-sm text-slate-400`}>
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
              <div
                className={`relative ${BANNER_HEIGHT_CLASS} w-full overflow-hidden bg-slate-100`}
              >
                {banner.linkUrl ? (
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block h-full w-full"
                  >
                    <picture className="block h-full w-full">
                      <source
                        media="(max-width: 767px)"
                        srcSet={banner.mobileImageUrl ?? banner.imageUrl ?? ""}
                      />
                      <img
                        src={banner.imageUrl ?? banner.mobileImageUrl ?? ""}
                        alt={banner.title ?? ""}
                        className="h-full w-full object-cover object-center"
                      />
                    </picture>
                  </a>
                ) : (
                  <picture className="block h-full w-full">
                    <source
                      media="(max-width: 767px)"
                      srcSet={banner.mobileImageUrl ?? banner.imageUrl ?? ""}
                    />
                    <img
                      src={banner.imageUrl ?? banner.mobileImageUrl ?? ""}
                      alt={banner.title ?? ""}
                      className="h-full w-full object-cover object-center"
                    />
                  </picture>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-5 h-11 w-11 border-none bg-white/88 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100" />
        <CarouselNext className="right-5 h-11 w-11 border-none bg-white/88 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100" />
      </Carousel>
    </div>
  );
}
