import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Danh mục sản phẩm | AgriShrimp",
  description: "Khám phá danh mục thuốc thú y thủy sản, thức ăn tôm và các giải pháp nuôi tôm thông minh từ AgriShrimp. Sản phẩm chất lượng cao, giá cả hợp lý.",
  keywords: "thuốc thú y thủy sản, thức ăn tôm, nuôi tôm thông minh, AgriShrimp, thiết bị nuôi tôm",
};

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
