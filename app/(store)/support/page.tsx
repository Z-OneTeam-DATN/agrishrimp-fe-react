"use client";

import { useState } from "react";
import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import {
  ChevronRight,
  Headphones,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

const TOPIC_OPTIONS = [
  "Hỏi về sản phẩm / Tư vấn kỹ thuật",
  "Tra cứu đơn hàng",
  "Đổi trả hàng",
  "Khiếu nại / Phản ánh",
  "Hợp tác kinh doanh",
  "Vấn đề khác",
];

export default function SupportPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    phone: "",
    email: "",
    topic: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullname.trim()) newErrors.fullname = "Vui lòng nhập họ tên.";
    if (!/^(84|0)(3|5|7|8|9)[0-9]{8}$/.test(form.phone))
      newErrors.phone = "Số điện thoại không hợp lệ.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Email không hợp lệ.";
    if (!form.topic) newErrors.topic = "Vui lòng chọn chủ đề.";
    if (form.message.trim().length < 10)
      newErrors.message = "Nội dung tối thiểu 10 ký tự.";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    setIsSuccess(true);
    setForm({ fullname: "", phone: "", email: "", topic: "", message: "" });
    setTimeout(() => setIsSuccess(false), 6000);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const inputClass = (field: string) =>
    `w-full p-2.5 bg-white text-gray-900 border rounded-md text-sm outline-none transition-all focus:ring-2 focus:ring-[#329965]/20 ${
      errors[field]
        ? "border-red-500 focus:border-red-500"
        : "border-gray-300 focus:border-[#329965]"
    }`;

  return (
    <>
      <StoreBanner />

      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center container mx-auto px-4">
        <Link href="/" className="hover:text-[#329965] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#329965] font-bold">Gửi yêu cầu hỗ trợ</span>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="border-b border-gray-200 pb-4 mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#329965] uppercase flex items-center">
              <Headphones className="mr-3" size={28} />
              Gửi yêu cầu hỗ trợ
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Điền thông tin bên dưới, đội ngũ AgriShrimp sẽ phản hồi trong
              vòng 24 giờ làm việc.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FORM */}
            <div className="lg:col-span-2">
              {isSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
                  <CheckCircle2 className="mr-2 shrink-0" size={20} />
                  <span className="text-sm font-medium">
                    Yêu cầu đã được gửi thành công! Chúng tôi sẽ liên hệ bạn
                    sớm nhất.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="fullname"
                      value={form.fullname}
                      onChange={handleChange}
                      placeholder="Nhập đầy đủ họ tên"
                      className={inputClass("fullname")}
                    />
                    {errors.fullname && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.fullname}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="SĐT liên hệ"
                      className={inputClass("phone")}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email để nhận phản hồi"
                    className={inputClass("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Chủ đề <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="topic"
                    value={form.topic}
                    onChange={handleChange}
                    className={inputClass("topic")}
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    {TOPIC_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.topic && (
                    <p className="text-red-500 text-xs mt-1">{errors.topic}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Mô tả chi tiết vấn đề của bạn..."
                    className={inputClass("message")}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#329965] text-white font-bold rounded-md hover:bg-[#268050] transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Đang gửi...</span>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" /> Gửi yêu cầu
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h4 className="font-bold text-[#329965] mb-3 text-sm uppercase">
                  Liên hệ trực tiếp
                </h4>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Phone size={16} className="text-[#329965] shrink-0" />
                    <span>
                      Hotline:{" "}
                      <a
                        href="tel:18006324"
                        className="font-bold text-[#329965]"
                      >
                        1800 6324
                      </a>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail size={16} className="text-[#329965] shrink-0" />
                    <span>support@agrishrimp.vn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock size={16} className="text-[#329965] shrink-0" />
                    <span>08:00 – 22:00 (T2 – CN)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 text-sm text-gray-700">
                <h4 className="font-bold text-orange-600 mb-2 uppercase text-xs">
                  Thời gian phản hồi
                </h4>
                <ul className="space-y-1 text-xs">
                  <li>• Yêu cầu kỹ thuật: trong 4 giờ</li>
                  <li>• Đổi trả hàng: trong 24 giờ</li>
                  <li>• Khiếu nại: trong 48 giờ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
