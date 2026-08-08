import { notFound } from "next/navigation";
import Link from "next/link";

import { getPublicCategories } from "@/app/services/CategoryService";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { PublicProductDetail } from "@/app/types/product.schema";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { stripHtml, truncateText } from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function formatServerPrice(product: PublicProductDetail) {
  const prices = (product.variants ?? [])
    .map((variant) => variant.price)
    .filter((price): price is number => typeof price === "number" && price > 0);

  if (prices.length === 0) {
    return null;
  }

  return `${Math.min(...prices).toLocaleString("vi-VN")} đ`;
}

function ProductSeoOverview({ product }: { product: PublicProductDetail }) {
  const categoryHref = product.category?.slug
    ? `/danh-muc/${product.category.slug}`
    : "/vat-tu-thuy-san";
  const description = truncateText(stripHtml(product.shortDesc || product.description), 220);
  const image = resolveImageUrl(product.imageUrls?.[0], "/placeholder.svg");
  const price = formatServerPrice(product);

  return (
    <section className="bg-[#f5f6f8] pt-4">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="grid gap-4 border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:p-5">
          <div className="flex aspect-square items-center justify-center overflow-hidden border border-slate-100 bg-sky-50">
            <img
              src={image}
              alt={product.name}
              width={240}
              height={240}
              className="h-full w-full object-contain p-2"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {product.brandName && <span>{product.brandName}</span>}
              {product.category?.name && (
                <Link href={categoryHref} className="text-blue-800 hover:underline">
                  {product.category.name}
                </Link>
              )}
            </div>
            <h1 className="mt-2 text-xl font-black leading-tight text-slate-950 sm:text-2xl">
              {product.name}
            </h1>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              {price && <span>Giá từ: {price}</span>}
              <Link href="/vat-tu-thuy-san" className="text-blue-800 hover:underline">
                Vật tư thủy sản AgriShrimp
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [product, categories] = await Promise.all([
    PublicProductService.getBySlug(slug).catch(() => null),
    getPublicCategories().catch(() => []),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductSeoOverview product={product} />
      <ProductDetailClient
        slug={slug}
        initialProduct={product}
        initialCategories={categories}
      />
    </>
  );
}
