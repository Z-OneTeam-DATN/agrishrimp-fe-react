import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = createSeoMetadata({
  title: "Blog Kiến Thức Nuôi Tôm | AgriShrimp",
  description:
    "Bài viết kiến thức thủy sản, kỹ thuật nuôi tôm, bệnh tôm và kinh nghiệm ao nuôi từ AgriShrimp.",
  path: "/blog",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      {children}
    </>
  );
}
