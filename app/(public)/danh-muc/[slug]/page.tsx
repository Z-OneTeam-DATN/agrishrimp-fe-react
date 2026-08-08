import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/seo/JsonLd";
import ProductCard from "@/components/ui/product-card";
import { PublicProductService } from "@/app/services/publicProduct.service";
import {
  getPublicCategories,
  getPublicCategoryBySlug,
} from "@/app/services/CategoryService";
import { breadcrumbJsonLd, createSeoMetadata, truncateText } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const categoryDescription = (name: string, description?: string | null) =>
  truncateText(description, 155) ||
  `Sản phẩm thuộc danh mục ${name} tại AgriShrimp, phục vụ nhu cầu vật tư và giải pháp nuôi tôm.`;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    return createSeoMetadata({
      title: "Danh mục sản phẩm | AgriShrimp",
      description: "Danh mục sản phẩm vật tư thủy sản tại AgriShrimp.",
      path: `/danh-muc/${slug}`,
      robots: "noindex",
    });
  }

  return createSeoMetadata({
    title: `${category.name} | Danh Mục Vật Tư Thủy Sản AgriShrimp`,
    description: categoryDescription(category.name, category.description),
    path: `/danh-muc/${category.slug}`,
    image: category.imageUrl,
  });
}

export async function generateStaticParams() {
  const categories = await getPublicCategories();
  return categories
    .filter((category) => category.slug)
    .map((category) => ({ slug: category.slug as string }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const productPage = await PublicProductService.getList({
    categoryId: category.id,
    page: 0,
    size: 24,
  });
  const products = productPage.content ?? [];

  return (
    <main className="bg-slate-50">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Vật tư thủy sản", path: "/vat-tu-thuy-san" },
          { name: category.name, path: `/danh-muc/${category.slug}` },
        ])}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/vat-tu-thuy-san" className="hover:text-blue-700">
            Vật tư thủy sản
          </Link>
        </nav>

        <header className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase text-blue-700">
            Danh mục sản phẩm
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-5xl">
            {category.name}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700">
            {categoryDescription(category.name, category.description)}
          </p>
        </header>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Sản phẩm trong danh mục
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Hiển thị sản phẩm công khai đang còn khả dụng từ catalog.
              </p>
            </div>
            <Link
              href="/san-pham"
              className="hidden rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-700 md:inline-flex"
            >
              Tất cả sản phẩm
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600">
              Danh mục này hiện chưa có sản phẩm công khai để hiển thị.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
