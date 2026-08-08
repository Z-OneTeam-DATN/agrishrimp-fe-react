import { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = createSeoMetadata({
  title: "Sản Phẩm Vật Tư Nuôi Tôm | AgriShrimp",
  description:
    "Danh sách sản phẩm vật tư nuôi tôm, vi sinh, khoáng, dinh dưỡng và giải pháp xử lý môi trường ao nuôi từ AgriShrimp.",
  path: "/san-pham",
});

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Sản phẩm", path: "/san-pham" },
        ])}
      />
      <section className="bg-[#f5f6f8] pt-4">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-blue-800">
              AgriShrimp Store
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              Sản Phẩm Vật Tư Nuôi Tôm
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Danh sách sản phẩm vật tư thủy sản, vi sinh, khoáng, dinh dưỡng và giải pháp xử lý môi trường ao nuôi từ dữ liệu catalog AgriShrimp.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/vat-tu-thuy-san" className="text-blue-800 hover:underline">
                Vật tư thủy sản
              </Link>
              <Link href="/chan-doan-benh-tom-bang-ai" className="text-blue-800 hover:underline">
                Chẩn đoán bệnh tôm bằng AI
              </Link>
            </div>
          </div>
        </div>
      </section>
      {children}
    </>
  );
}
