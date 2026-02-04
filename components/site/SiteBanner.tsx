
'use client'

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { BANNER_SLIDERS, SUB_BANNERS } from "@/lib/Constant"
import Link from "next/link"

export default function Banner() {
  const plugin = React.useRef(
    Autoplay({ 
        delay: 3500, 
        stopOnInteraction: false 
    })
  )

  return (
    <section className="w-full py-2 bg-gray-50"> 
      <div className="w-full px-5"> 
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        
          <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-sm relative group">
            <Carousel
              plugins={[plugin.current]}
              className="w-full h-full"
              opts={{
                loop: true, 
                align: "start",
              }}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent>
                {BANNER_SLIDERS.map((banner) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px]">
                      <img
                        src={banner.url}
                        alt={banner.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/30 hover:bg-white border-none h-10 w-10" />
              <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/30 hover:bg-white border-none h-10 w-10" />
            </Carousel>
          </div>
          <div className="hidden lg:flex flex-col gap-2 h-[400px]">
            {SUB_BANNERS.map((sub, index) => (
              <Link 
                href="#" 
                key={sub.id} 
                className="flex-1 relative rounded-xl overflow-hidden shadow-sm group block h-[196px]"
              >
                <img
                  src={sub.url}
                  alt={sub.alt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}