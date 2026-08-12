import { Metadata } from "next";
import { PublicProductService } from "@/app/services/publicProduct.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await PublicProductService.getBySlug(slug);
    return {
      title: `${product.name} | AgriShrimp`,
      description: product.shortDesc || product.description.substring(0, 160),
      openGraph: {
        images: product.imageUrls?.[0] ? [product.imageUrls[0]] : [],
      },
    };
  } catch {
    return {
      title: "Sản phẩm | AgriShrimp",
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
