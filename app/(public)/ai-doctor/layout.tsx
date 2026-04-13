import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bác sĩ Tôm - Khám bệnh tôm trực tuyến",
  description:
    "Chụp ảnh tôm bị bệnh để Bác sĩ Tôm nhận diện và hướng dẫn cách chữa trị ngay lập tức. Hỗ trợ bà con nuôi tôm 24/7 hiệu quả và nhanh chóng.",
};

export default function AiDoctorLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
