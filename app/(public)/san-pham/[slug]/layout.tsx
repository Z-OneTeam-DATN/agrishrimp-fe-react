import { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { PublicProductService } from "@/app/services/publicProduct.service";
import {
  breadcrumbJsonLd,
  createSeoMetadata,
  productJsonLd,
  truncateText,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await PublicProductService.getBySlug(slug);
    return createSeoMetadata({
      title:
        product.name.length <= 48
          ? `${product.name} – Vật Tư Nuôi Tôm | AgriShrimp`
          : `${product.name} | AgriShrimp`,
      description:
        truncateText(product.shortDesc || product.description, 155) ||
        `Thông tin sản phẩm ${product.name} tại AgriShrimp.`,
      path: `/san-pham/${product.slug}`,
      image: product.imageUrls?.[0],
    });
  } catch {
    return createSeoMetadata({
      title: "Sản phẩm | AgriShrimp",
      description: "Thông tin sản phẩm vật tư nuôi tôm tại AgriShrimp.",
      path: `/san-pham/${slug}`,
      robots: "noindex",
    });
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const product = await PublicProductService.getBySlug(slug);
    const prices =
      product.variants?.map((variant) => Number(variant.price)).filter(Boolean) ??
      [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    return (
      <>
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Trang chủ", path: "/" },
            { name: "Sản phẩm", path: "/san-pham" },
            ...(product.category?.slug
              ? [
                  {
                    name: product.category.name,
                    path: `/danh-muc/${product.category.slug}`,
                  },
                ]
              : []),
            { name: product.name, path: `/san-pham/${product.slug}` },
          ])}
        />
        <JsonLd
          data={productJsonLd({
            name: product.name,
            description: product.shortDesc || product.description,
            path: `/san-pham/${product.slug}`,
            images: product.imageUrls,
            sku: product.variants?.[0]?.sku || product.slug,
            brand: product.brandName,
            category: product.category?.name,
            price: minPrice,
            inStock: !product.isOutOfStock,
          })}
        />
        {children}
      </>
    );
  } catch {
    return <>{children}</>;
  }
}
