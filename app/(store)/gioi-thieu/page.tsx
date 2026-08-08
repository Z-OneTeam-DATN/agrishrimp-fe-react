import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronRight, ShieldCheck, Users } from "lucide-react";

import JsonLd from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  createSeoMetadata,
  organizationJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = createSeoMetadata({
  title: "Giới Thiệu AgriShrimp | AI Doctor & Vật Tư Thủy Sản",
  description:
    "AgriShrimp đồng hành cùng người nuôi tôm bằng nền tảng AI Doctor, kho tri thức bệnh tôm và catalog vật tư thủy sản.",
  path: "/gioi-thieu",
});

const features = [
  {
    icon: BadgeCheck,
    title: "Hàng hóa có nguồn gốc",
    body: "Catalog sản phẩm được quản lý theo danh mục, thương hiệu và trạng thái công khai trong hệ thống.",
  },
  {
    icon: Users,
    title: "Hỗ trợ người nuôi tôm",
    body: "AgriShrimp tập trung vào trải nghiệm tra cứu vật tư, kiến thức và công cụ AI Doctor cho bà con.",
  },
  {
    icon: ShieldCheck,
    title: "Tư vấn có giới hạn rõ ràng",
    body: "Các nội dung bệnh tôm và AI chỉ mang tính hỗ trợ tham khảo, không thay thế xét nghiệm hoặc đánh giá kỹ thuật tại ao.",
  },
];

export default function AboutAgriShrimpPage() {
  return (
    <main className="bg-slate-50">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Giới thiệu AgriShrimp", path: "/gioi-thieu" },
        ])}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <nav className="mb-6 flex items-center text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">
            Trang chủ
          </Link>
          <ChevronRight size={16} className="mx-2" />
          <span className="font-semibold text-slate-800">Giới thiệu</span>
        </nav>

        <section className="grid gap-8 rounded-md border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[0.8fr_1.2fr] md:p-8">
          <div className="relative min-h-[220px] overflow-hidden rounded-md bg-slate-50">
            <Image
              src="/images/logo_arishrimp.jpg"
              alt="Logo AgriShrimp"
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-contain p-8"
              priority
            />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase text-blue-700">
              AgriShrimp
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 md:text-5xl">
              Giới Thiệu AgriShrimp
            </h1>
            <p className="mt-5 text-sm leading-8 text-slate-700 md:text-base">
              AgriShrimp được xây dựng để đồng hành cùng người nuôi tôm trong
              việc tra cứu vật tư thủy sản, tham khảo kiến thức nuôi tôm và sử
              dụng AI Doctor như một công cụ hỗ trợ sàng lọc dấu hiệu bệnh tôm.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/vat-tu-thuy-san"
                className="rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
              >
                Vật tư thủy sản
              </Link>
              <Link
                href="/chan-doan-benh-tom-bang-ai"
                className="rounded-md border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 hover:border-blue-500 hover:text-blue-700"
              >
                AI chẩn đoán bệnh tôm
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-md border border-slate-200 bg-white p-5">
                <Icon className="h-7 w-7 text-blue-700" />
                <h2 className="mt-4 text-lg font-black text-slate-950">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {feature.body}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
