"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import { ChevronRight, Send, CheckCircle2, MapPin, Phone, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PublicBranchService } from "@/app/services/publicBranch.service";
import { BranchDTO } from "@/app/types/branch.type";

// --- IMPORT SCHEMA VỪA TẠO ---
import {
  StoreContactSchema,
  type StoreContactType,
} from "@/app/types/store_contact.schema";

export default function ContactPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await PublicBranchService.getAll();
        setBranches(data);
      } catch (error) {
        console.error("Error fetching branches:", error);
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  // Khởi tạo React Hook Form dùng Schema và Type đã import
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreContactType>({
    resolver: zodResolver(StoreContactSchema),
  });

  // Xử lý Submit Form
  const onSubmit = async (data: StoreContactType) => {
    // Giả lập gọi API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Form Data:", data);

    setIsSuccess(true);
    reset();

    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <>
      {/* Banner */}
      <StoreBanner />

      {/* Breadcrumb */}
      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
        <Link href="/" className="hover:text-[#1965a2] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#1965a2] font-bold">Liên hệ</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-[#1965a2] uppercase border-b border-gray-200 pb-4 mb-4">
          Chúng tôi trân trọng ý kiến của bà con
        </h3>

        <p className="text-gray-500 text-sm mb-8">
          Quý khách vui lòng gửi thắc mắc kỹ thuật, khiếu nại hoặc ý kiến đóng
          góp qua biểu mẫu bên dưới. Kỹ sư AgriShrimp sẽ phản hồi sớm nhất.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* FORM LIÊN HỆ */}
          <div>
            {isSuccess && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center text-blue-700 animate-fadeIn">
                <CheckCircle2 className="mr-2" size={20} />
                <span className="text-sm font-medium">
                  Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ sớm nhất.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Tiêu đề */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title")}
                  type="text"
                  placeholder="VD: Cần tư vấn thuốc trị gan tụy..."
                  className={`w-full p-2.5 bg-white text-gray-900 border rounded-md text-sm outline-none transition-all focus:ring-2 focus:ring-[#1965a2]/20 ${errors.title ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#1965a2]"}`}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Chi tiết */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("content")}
                  rows={4}
                  placeholder="Hãy mô tả chi tiết vấn đề ao nuôi của bà con..."
                  className={`w-full p-2.5 bg-white text-gray-900 border rounded-md text-sm outline-none transition-all focus:ring-2 focus:ring-[#1965a2]/20 ${errors.content ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#1965a2]"}`}
                ></textarea>
                {errors.content && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.content.message}
                  </p>
                )}
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("fullname")}
                  type="text"
                  placeholder="Nhập đầy đủ họ tên"
                  className={`w-full p-2.5 bg-white text-gray-900 border rounded-md text-sm outline-none transition-all focus:ring-2 focus:ring-[#1965a2]/20 ${errors.fullname ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#1965a2]"}`}
                />
                {errors.fullname && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fullname.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SĐT */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    placeholder="SĐT liên hệ"
                    className={`w-full p-2.5 bg-white text-gray-900 border rounded-md text-sm outline-none transition-all focus:ring-2 focus:ring-[#1965a2]/20 ${errors.phone ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#1965a2]"}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="Email liên hệ"
                    className={`w-full p-2.5 bg-white text-gray-900 border rounded-md text-sm outline-none transition-all focus:ring-2 focus:ring-[#1965a2]/20 ${errors.email ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#1965a2]"}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 px-6 py-2.5 bg-[#1965a2] text-white font-bold rounded-md hover:bg-[#268050] transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
              >
                {isSubmitting ? (
                  <span>Đang gửi...</span>
                ) : (
                  <>
                    <Send size={18} className="mr-2" /> Gửi yêu cầu
                  </>
                )}
              </button>
            </form>
          </div>

          {/* BẢN ĐỒ GOOGLE MAP */}
          <div className="h-full min-h-[300px] border border-gray-200 rounded-lg overflow-hidden relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.841518408643!2d105.76842661471186!3d10.02993369283063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0895a51d60719%3A0x9d76b0035f6d53d0!2zxJDhuqFpIGjhu41jIEPhuqduIFRoxqE!5e0!3m2!1svi!2s!4v1677891234567!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full"
            ></iframe>
          </div>
        </div>

        {/* HỆ THỐNG CHI NHÁNH */}
        <div className="border-t border-gray-100 pt-8">
          <h3 className="text-center text-xl font-bold text-[#1965a2] uppercase mb-8">
            Hệ thống Chi nhánh AgriShrimp
          </h3>

          {isLoadingBranches ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#1965a2] animate-spin mb-2" />
              <p className="text-gray-500 text-sm">Đang tải danh sách chi nhánh...</p>
            </div>
          ) : branches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-white p-6 flex items-center justify-center border-b border-gray-100 h-40">
                    <div className="text-[#1965a2] flex flex-col items-center opacity-50">
                      <MapPin size={48} strokeWidth={1} />
                      <span className="text-xs mt-2 uppercase tracking-widest text-center">
                        AgriShrimp<br/>{branch.branchType}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 text-center">
                    <h5 className="font-bold text-[#1965a2] mb-2">
                      {branch.name}
                    </h5>
                    <p className="text-xs text-gray-500 mb-3 min-h-[48px]">
                      {branch.addressDetail}, {branch.wardName}, {branch.districtName}, {branch.provinceName}
                    </p>
                    <div className="inline-flex items-center text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200">
                      <Phone size={14} className="mr-2 text-[#1965a2]" /> {branch.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Hiện chưa có thông tin chi nhánh.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

