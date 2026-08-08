import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createSeoMetadata } from "@/lib/seo";
import { getPublicAiDiseases } from "@/app/services/publicAiDisease.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createSeoMetadata({
  title: "Kho Tri Thức Bệnh Tôm | AgriShrimp",
  description:
    "Danh sách bệnh tôm và dấu hiệu tham khảo từ kho tri thức AI Doctor AgriShrimp đã được duyệt.",
  path: "/benh-tom",
});

export default async function DiseaseIndexPage() {
  const diseases = await getPublicAiDiseases();

  return (
    <main className="bg-slate-50">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Bệnh tôm", path: "/benh-tom" },
        ])}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-700">
            Kho tri thức AI Doctor
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-5xl">
            Kho Tri Thức Bệnh Tôm
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Các bệnh dưới đây được lấy từ dữ liệu đã duyệt trong hệ thống
            AgriShrimp. Nội dung có tính tham khảo và nên được đối chiếu với
            tình trạng ao nuôi, mẫu tôm và tư vấn kỹ thuật khi cần.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {diseases.length > 0 ? (
            diseases.map((disease) => (
              <Link
                key={disease.slug}
                href={`/benh-tom/${disease.slug}`}
                className="rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
              >
                <span className="text-xs font-bold uppercase text-slate-400">
                  {disease.code}
                </span>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  {disease.nameVi}
                </h2>
                {disease.signsSummary && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {disease.signsSummary}
                  </p>
                )}
              </Link>
            ))
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 md:col-span-2 xl:col-span-3">
              Chưa có bệnh tôm nào ở trạng thái công khai đã duyệt. Khi quản trị
              viên duyệt dữ liệu, trang này sẽ tự hiển thị.
            </div>
          )}
        </div>

        <div className="mt-10 rounded-md border border-blue-100 bg-white p-6">
          <h2 className="text-xl font-black text-slate-950">
            Cần kiểm tra một ca bệnh cụ thể?
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Bạn có thể gửi ảnh và mô tả triệu chứng qua AI Doctor để hệ thống
            hỏi thêm hoặc gợi ý bệnh liên quan khi dữ liệu đủ điều kiện.
          </p>
          <Link
            href="/chan-doan-benh-tom-bang-ai"
            className="mt-4 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
          >
            Chẩn đoán bệnh tôm bằng AI
          </Link>
        </div>
      </section>
    </main>
  );
}
