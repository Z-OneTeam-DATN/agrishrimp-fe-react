
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import Banner from "@/components/site/SiteBanner";


export default function Home() {
  return (
    <div className="flex flex-col">
      
      {/* 1. HERO BANNER SECTION */}
      <Banner />

      {/* 2. DEMO DANH MỤC */}
      <section className="py-16 bg-white">
        <div className="container">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center uppercase tracking-wide">
                Danh mục nổi bật
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 hover:border-primary hover:text-primary transition-colors cursor-pointer group">
                    <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📦</span>
                    <span className="font-semibold">Sản phẩm {i}</span>
                </div>
            ))}
            </div>
        </div>
      </section>

    </div>
  );
}