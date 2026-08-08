import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PackageSearch } from "lucide-react";

import JsonLd from "@/components/seo/JsonLd";
import ProductCard from "@/components/ui/product-card";
import { getPublicCategories } from "@/app/services/CategoryService";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { breadcrumbJsonLd, createSeoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createSeoMetadata({
  title: "Vật Tư Thủy Sản & Vật Tư Nuôi Tôm | AgriShrimp",
  description:
    "AgriShrimp cung cấp danh mục vật tư thủy sản cho nuôi tôm: vi sinh, khoáng, dinh dưỡng, xử lý môi trường và sản phẩm phục vụ ao nuôi.",
  path: "/vat-tu-thuy-san",
});

export default async function AquacultureSuppliesPage() {
  const [categories, productPage] = await Promise.all([
    getPublicCategories(),
    PublicProductService.getList({ page: 0, size: 10 }),
  ]);

  const parentCategories = categories.filter(
    (category) => !category.parentId || category.parentId === 0,
  );
  const products = productPage.content ?? [];

  return (
    <main className="bg-slate-50">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Vật tư thủy sản", path: "/vat-tu-thuy-san" },
        ])}
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1fr_0.8fr] md:px-6 lg:py-14">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-700">
            Catalog AgriShrimp
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-5xl">
            Vật Tư Thủy Sản Cho Nuôi Tôm
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
            AgriShrimp tập hợp sản phẩm công khai từ catalog hiện có để bà con
            tra cứu vật tư phục vụ ao nuôi, xử lý môi trường, dinh dưỡng và các
            giải pháp hỗ trợ quá trình nuôi tôm.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/san-pham"
              className="rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              Xem tất cả sản phẩm
            </Link>
            <Link
              href="/chan-doan-benh-tom-bang-ai"
              className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:border-blue-500 hover:text-blue-700"
            >
              Chẩn đoán bệnh tôm bằng AI
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] overflow-hidden rounded-md border border-blue-100 bg-white shadow-sm">
          <Image
            src="/images/logo_arishrimp.jpg"
            alt="AgriShrimp cung cấp vật tư thủy sản cho nuôi tôm"
            fill
            sizes="(max-width: 768px) 100vw, 520px"
            className="object-contain p-10"
            priority
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <h2 className="text-2xl font-black text-slate-950">
            Danh mục vật tư đang có
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {parentCategories.length > 0 ? (
              parentCategories.map((category) => (
                <Link
                  key={category.id}
                  href={category.slug ? `/danh-muc/${category.slug}` : "/san-pham"}
                  className="group rounded-md border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-sm"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-slate-50">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain p-3 transition group-hover:scale-105"
                      />
                    ) : (
                      <PackageSearch className="h-10 w-10 text-blue-200" />
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-black text-slate-950 group-hover:text-blue-700">
                    {category.name}
                  </h3>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-slate-200 p-5 text-sm text-slate-600 sm:col-span-2 lg:col-span-4">
                Chưa có danh mục công khai để hiển thị.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Sản phẩm nổi bật trong catalog
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Dữ liệu lấy trực tiếp từ danh sách sản phẩm công khai.
            </p>
          </div>
          <Link
            href="/san-pham"
            className="hidden rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-700 md:inline-flex"
          >
            Xem thêm
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600">
            Chưa có sản phẩm công khai để hiển thị.
          </div>
        )}
      </section>
    </main>
  );
}
