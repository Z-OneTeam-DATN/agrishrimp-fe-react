import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/seo/JsonLd";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  createSeoMetadata,
  stripHtml,
  truncateText,
} from "@/lib/seo";
import {
  getPublicAiDiseaseBySlug,
  getPublicAiDiseases,
} from "@/app/services/publicAiDisease.service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const disease = await getPublicAiDiseaseBySlug(slug);

  if (!disease) {
    return createSeoMetadata({
      title: "Bệnh tôm | AgriShrimp",
      description: "Thông tin bệnh tôm trong kho tri thức AgriShrimp.",
      path: `/benh-tom/${slug}`,
      robots: "noindex",
    });
  }

  const description =
    truncateText(disease.signsSummary, 155) ||
    `Thông tin tham khảo về ${disease.nameVi} trong kho tri thức bệnh tôm AgriShrimp.`;

  return createSeoMetadata({
    title: `${disease.nameVi} | Kho Bệnh Tôm AgriShrimp`,
    description,
    path: `/benh-tom/${disease.slug}`,
    image: disease.imageUrls?.[0],
    type: "article",
  });
}

export async function generateStaticParams() {
  const diseases = await getPublicAiDiseases();
  return diseases.map((disease) => ({ slug: disease.slug }));
}

export default async function DiseaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const disease = await getPublicAiDiseaseBySlug(slug);

  if (!disease) {
    notFound();
  }

  const description =
    truncateText(disease.signsSummary, 250) ||
    `Thông tin tham khảo về ${disease.nameVi}.`;

  return (
    <main className="bg-slate-50">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Bệnh tôm", path: "/benh-tom" },
          { name: disease.nameVi, path: `/benh-tom/${disease.slug}` },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          title: disease.nameVi,
          description,
          path: `/benh-tom/${disease.slug}`,
          image: disease.imageUrls?.[0],
          datePublished: disease.createdAt,
          dateModified: disease.updatedAt,
          authorName: "AgriShrimp",
        })}
      />

      <article className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:py-14">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/benh-tom" className="hover:text-blue-700">
            Bệnh tôm
          </Link>
        </nav>

        <header className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase text-blue-700">{disease.code}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 md:text-5xl">
            {disease.nameVi}
          </h1>
          {disease.nameEn && (
            <p className="mt-2 text-base font-semibold text-slate-500">
              {disease.nameEn}
            </p>
          )}
          {disease.categoryName && (
            <p className="mt-4 text-sm text-slate-500">
              Nhóm tri thức:{" "}
              <span className="font-semibold text-slate-800">
                {disease.categoryName}
              </span>
            </p>
          )}
        </header>

        {disease.imageUrls && disease.imageUrls.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {disease.imageUrls.slice(0, 4).map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-white"
              >
                <Image
                  src={image}
                  alt={`${disease.nameVi} - ảnh minh họa ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        )}

        <section className="mt-6 rounded-md border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-black text-slate-950">Dấu hiệu ghi nhận</h2>
          {disease.signsSummary ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
              {stripHtml(disease.signsSummary)}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Dữ liệu đã duyệt chưa có phần dấu hiệu chi tiết.
            </p>
          )}
        </section>

        {disease.causes.length > 0 && (
          <section className="mt-6 rounded-md border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black text-slate-950">Nguyên nhân</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
              {disease.causes.map((cause) => (
                <li key={cause} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {disease.treatmentStages.length > 0 && (
          <section className="mt-6 rounded-md border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black text-slate-950">
              Hướng xử lý từ dữ liệu đã duyệt
            </h2>
            <div className="mt-4 space-y-5">
              {disease.treatmentStages.map((stage, index) => (
                <div key={`${stage.stageTitle}-${index}`} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                  <h3 className="text-lg font-bold text-slate-900">
                    {stage.stageTitle || `Giai đoạn ${index + 1}`}
                  </h3>
                  {stage.instructions.length > 0 && (
                    <ul className="mt-2 space-y-2 text-sm leading-7 text-slate-700">
                      {stage.instructions.map((instruction) => (
                        <li key={instruction} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {stage.products.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {stage.products.map((product) => (
                        <Link
                          key={product.id}
                          href={product.webUrl || "/san-pham"}
                          className="rounded-md border border-blue-100 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                        >
                          {product.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  {stage.extraProductNames.length > 0 && (
                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      Sản phẩm/vật tư khác: {stage.extraProductNames.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-md border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-xl font-black text-slate-950">
            Cần đối chiếu ca bệnh thực tế?
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            AI Doctor có thể hỏi thêm triệu chứng hoặc đối chiếu ảnh con tôm với
            kho tri thức hiện có. Kết quả chỉ mang tính tham khảo.
          </p>
          <Link
            href="/ai-doctor"
            className="mt-4 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
          >
            Mở AI Doctor
          </Link>
        </section>
      </article>
    </main>
  );
}
