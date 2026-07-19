"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";

import { BannerDTO } from "@/app/services/banner.service";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const BANNER_HEIGHT_CLASS = "h-[210px] min-[420px]:h-[250px] sm:h-[320px] md:h-[400px] lg:h-[500px]";
const BANNER_IMAGE_CLASS =
  "h-full w-full bg-white object-cover object-center md:object-contain";

interface SiteBannerCarouselProps {
  banners: BannerDTO[];
}

export default function SiteBannerCarousel({
  banners,
}: SiteBannerCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 2200, stopOnInteraction: false }),
  );

  return (
    <div className="group relative w-full">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{ loop: banners.length > 1, align: "start" }}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {banners.map((banner) => (
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
                        loading="eager"
                        className={BANNER_IMAGE_CLASS}
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
                      loading="eager"
                      className={BANNER_IMAGE_CLASS}
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
