"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { BANNER_SLIDERS } from "@/lib/Constant";

export default function Banner() {
  const plugin = React.useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false })
  );

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
          {BANNER_SLIDERS.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative w-full h-[220px] md:h-[300px] lg:h-[380px]">
                <img
                  src={banner.url}
                  alt={banner.alt}
                  className="w-full h-full object-cover"
                />
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
