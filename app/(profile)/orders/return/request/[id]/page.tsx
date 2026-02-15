"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Camera,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function ReturnRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrapping params bằng React.use()
  const { id } = use(params);

  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);

  // Mock data sản phẩm cần trả
  const product = {
    name: "Florfenicol kết hợp Oxytetracycline",
    image:
      "https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png",
    variant: "500g/túi",
    quantity: 1,
    price: "250.000₫",
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file) => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <nav className="mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#2d9f8d]">
            Trang chủ
          </Link>{" "}
          <span className="mx-2">/</span>
          <Link
            href="/orders/list?status=COMPLETED"
            className="hover:text-[#2d9f8d]"
          >
            Đơn hàng
          </Link>{" "}
          <span className="mx-2">/</span>
          {/* ✅ SỬA Ở ĐÂY: Hiển thị ID lên breadcrumb để hết lỗi unused variable */}
          <span className="font-bold text-gray-800">
            Yêu cầu hoàn tiền #{id}
          </span>
        </nav>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Gửi yêu cầu thành công!");
            router.push("/orders/return");
          }}
          className="pb-20"
        >
          {" "}
          {/* Added pb-20 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                  <CheckCircle2 className="text-[#2d9f8d]" size={20} /> 1. Sản
                  phẩm hoàn trả
                </div>
                <div className="flex items-center p-4 bg-[#fcfdfe] border border-gray-100 rounded-lg">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className="w-5 h-5 accent-[#2d9f8d] mr-4 cursor-default"
                  />
                  <img
                    src={product.image}
                    className="w-16 h-16 rounded object-cover border border-gray-200 mr-4"
                    alt={product.name}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-sm">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Phân loại: {product.variant} | SL: {product.quantity}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">{product.price}</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                  <AlertCircle className="text-orange-500" size={20} /> 2. Chi
                  tiết lý do
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lý do hoàn trả <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#2d9f8d]">
                    {" "}
                    {/* Changed p-2.5 to h-12 px-4 */}
                    <option value="">Vui lòng chọn lý do phù hợp</option>
                    <option>Sản phẩm bị lỗi kỹ thuật / hỏng hóc</option>
                    <option>Giao sai sản phẩm / thiếu hàng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả tình trạng chi tiết
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#2d9f8d]"
                    placeholder="Mô tả cụ thể vấn đề..."
                  ></textarea>{" "}
                  {/* Changed p-3 to px-4 py-3, rows from 5 to 4 */}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                  <ImageIcon className="text-red-500" size={20} /> 3. Bằng chứng
                  hình ảnh
                </div>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-[#f0fdfa] transition-colors">
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 font-semibold">
                    Thêm hình ảnh lỗi
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {images.map((src, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={src}
                          className="w-full h-full object-cover rounded-md border"
                          alt="preview"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setImages(images.filter((_, i) => i !== index))
                          }
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Sticky Submit Button for mobile */}
                <div className="lg:static fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:p-0 lg:bg-transparent lg:shadow-none z-10 mt-4 lg:mt-0">
                  {" "}
                  {/* Added wrapper for sticky button */}
                  <button
                    type="submit"
                    className="w-full bg-[#2d9f8d] hover:bg-[#248273] text-white font-bold h-12 rounded-lg shadow-md transition-colors uppercase text-sm"
                  >
                    GỬI YÊU CẦU
                  </button>{" "}
                  {/* Changed py-3 to h-12 */}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
