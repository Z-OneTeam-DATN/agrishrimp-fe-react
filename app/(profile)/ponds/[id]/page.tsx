"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PondForm from "@/components/ponds/PondForm";
import { PondFormValues } from "@/app/types/pond.schema";

// Mock function lấy data (Thực tế sẽ gọi API bằng ID)
const getPondById = (id: string) => {
  console.log("Lấy dữ liệu ao với ID:", id);
  // Ví dụ dữ liệu giả
  return {
    name: "Ao Số 01 - Khu A",
    area: 2500,
    depth: 1.5,
    species: "Tôm thẻ chân trắng",
    status: "ACTIVE" as const,
  };
};

export default function EditPondPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pondData = getPondById(params.id); // Lấy dữ liệu ao cần sửa

  const handleUpdate = (data: PondFormValues) => {
    // Gọi API cập nhật tại đây
    console.log("Updating pond:", params.id, data);

    toast.success("Cập nhật thông tin thành công!");
    router.push("/ponds");
  };

  return (
    <PondForm
      title="Cập nhật thông tin ao"
      initialData={pondData}
      onSubmit={handleUpdate}
    />
  );
}
