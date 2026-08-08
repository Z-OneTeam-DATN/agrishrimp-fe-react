import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, CheckCircle2, ShieldAlert } from "lucide-react";

import JsonLd from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  createSeoMetadata,
  organizationJsonLd,
} from "@/lib/seo";
import { getPublicAiDiseases } from "@/app/services/publicAiDisease.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createSeoMetadata({
  title: "Chẩn Đoán Bệnh Tôm Bằng AI Qua Hình Ảnh | AgriShrimp",
  description:
    "AI Doctor AgriShrimp hỗ trợ người nuôi tôm tải ảnh, mô tả triệu chứng và tham khảo kho tri thức bệnh tôm đã được duyệt.",
  path: "/chan-doan-benh-tom-bang-ai",
});

export default async function AiDiagnosisLandingPage() {
  const diseases = await getPublicAiDiseases();
  const highlightedDiseases = diseases.slice(0, 6);

  return (
    <main className="bg-slate-50">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          {
            name: "Chẩn đoán bệnh tôm bằng AI",
            path: "/chan-doan-benh-tom-bang-ai",
          },
        ])}
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-6 lg:py-14">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-700">
            AI Doctor AgriShrimp
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-slate-950 md:text-5xl">
            Chẩn Đoán Bệnh Tôm Bằng AI
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 md:text-lg">
            AgriShrimp hỗ trợ bà con gửi ảnh con tôm, mô tả dấu hiệu bất thường
            và nhận gợi ý tham khảo từ hệ thống AI kết hợp kho tri thức bệnh tôm
            đã được quản trị viên duyệt.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/ai-doctor"
              className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              Mở AI Doctor <ArrowRight size={18} />
            </Link>
            <Link
              href="/benh-tom"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-500 hover:text-blue-700"
            >
              Xem kho bệnh tôm
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
          <Image
            src="/images/logo_arishrimp.jpg"
            alt="AgriShrimp AI Doctor hỗ trợ chẩn đoán bệnh tôm"
            fill
            sizes="(max-width: 768px) 100vw, 520px"
            className="object-contain p-10"
            priority
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:grid-cols-3 md:px-6">
          {[
            {
              icon: Camera,
              title: "Gửi ảnh và triệu chứng",
              body: "Ảnh nên rõ phần đầu-ngực, vỏ, mang, đường ruột hoặc vùng có dấu hiệu bất thường.",
            },
            {
              icon: CheckCircle2,
              title: "Đối chiếu tri thức đã duyệt",
              body: "Khi dữ liệu đủ điều kiện, hệ thống gợi ý bệnh liên quan và hướng xử lý tham khảo.",
            },
            {
              icon: ShieldAlert,
              title: "Không thay thế xét nghiệm",
              body: "AI chỉ hỗ trợ sàng lọc ban đầu; ca nặng nên kiểm tra mẫu, môi trường và tham khảo kỹ sư.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-md border border-slate-200 p-5">
                <Icon className="h-7 w-7 text-blue-700" />
                <h2 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              AI hỗ trợ nhận diện những gì?
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Hệ thống chỉ hiển thị và liên kết các bệnh đã có trong kho tri
              thức công khai. Nếu dữ liệu chưa đủ hoặc ảnh không rõ, AI Doctor
              có thể hỏi thêm triệu chứng thay vì khẳng định chẩn đoán.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {highlightedDiseases.length > 0 ? (
              highlightedDiseases.map((disease) => (
                <Link
                  key={disease.slug}
                  href={`/benh-tom/${disease.slug}`}
                  className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:text-blue-700"
                >
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    {disease.code}
                  </span>
                  <h3 className="mt-1 font-bold text-slate-900">{disease.nameVi}</h3>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 sm:col-span-2">
                Kho bệnh công khai chưa có dữ liệu đã duyệt để hiển thị. AI
                Doctor vẫn hoạt động theo dữ liệu nội bộ được cấu hình.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
