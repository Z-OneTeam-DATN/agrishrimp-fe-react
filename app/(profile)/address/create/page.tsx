"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AddressForm from "@/components/profile/AddressForm";
import { AddressFormValues } from "@/app/types/address.schema";

export default function CreateAddressPage() {
  const router = useRouter();

  const handleCreate = (data: AddressFormValues) => {
    // Gọi API thêm mới ở đây
    console.log("New Address:", data);
    toast.success("Thêm địa chỉ thành công!");
    router.push("/address"); // Quay về danh sách
  };

  return <AddressForm title="Thêm địa chỉ mới" onSubmit={handleCreate} />;
}
