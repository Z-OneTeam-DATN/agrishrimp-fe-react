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

  if (isLoading) {
    return (
      <div className="w-full rounded-lg overflow-hidden shadow-sm bg-gray-100 animate-pulse h-[220px] md:h-[300px] lg:h-[380px]" />
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full rounded-lg overflow-hidden shadow-sm bg-gray-100 h-[220px] md:h-[300px] lg:h-[380px] flex items-center justify-center text-gray-400 text-sm">
        Chưa có banner
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-sm relative group">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{ loop: true, align: "start" }}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative w-full h-[220px] md:h-[300px] lg:h-[380px]">
                {banner.linkUrl ? (
                  <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img src={banner.imageUrl ?? ""} alt={banner.title ?? ""} className="w-full h-full object-cover" />
                  </a>
                ) : (
                  <img src={banner.imageUrl ?? ""} alt={banner.title ?? ""} className="w-full h-full object-cover" />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/40 hover:bg-white border-none h-9 w-9" />
        <CarouselNext className="right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/40 hover:bg-white border-none h-9 w-9" />
      </Carousel>
    </div>
  );
}
