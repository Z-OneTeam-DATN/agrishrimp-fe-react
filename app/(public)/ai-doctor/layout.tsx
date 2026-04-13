import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bác sĩ AI - AgriShrimp",
  description:
    "Tải ảnh tôm bệnh để AgriShrimp AI nhận diện dấu hiệu bằng YOLOv8, đối chiếu triệu chứng, sau đó dùng Gemini tạo phác đồ điều trị theo từng giai đoạn và gợi ý sản phẩm phù hợp ngay trên web.",
};

export default function AiDoctorLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
