"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

import { aiDoctorService } from "@/app/services/aiDoctor.service";
import type {
  AiDoctorDiseaseInfo,
  AiDoctorHistoryItem,
} from "@/app/types/ai-doctor.types";

const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có thời gian";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getSeverityBadge = (disease?: AiDoctorDiseaseInfo) => {
  const confidence = Number(disease?.confidencePercent || 0);
  const label = disease?.nameVi?.toLowerCase() || "";

  if (!disease?.nameVi) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
        Chưa có kết quả
      </span>
    );
  }

  if (label.includes("khỏe")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
        <CheckCircle2 size={12} />
        Khỏe mạnh
      </span>
    );
  }

  if (confidence >= 80) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
        <AlertTriangle size={12} />
        Nguy cơ cao
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
      <Activity size={12} />
      Cần theo dõi
    </span>
  );
};

export default function AiHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const historyQuery = useQuery({
    queryKey: ["ai-doctor-history"],
    queryFn: () => aiDoctorService.getHistory(),
  });

  const filteredHistory = useMemo(() => {
    const items = historyQuery.data?.items ?? [];
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((record: AiDoctorHistoryItem) => {
      const diseaseName = record.disease?.nameVi?.toLowerCase() || "";
      const diagnosisId = record.diagnosisId?.toLowerCase() || "";
      return diseaseName.includes(keyword) || diagnosisId.includes(keyword);
    });
  }, [historyQuery.data?.items, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10 font-sans text-gray-800">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-4 shadow-sm lg:hidden">
        <Link
          href="/ai-doctor"
          className="p-1 text-gray-600 transition-colors hover:text-gray-800"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="flex-1 truncate text-center text-lg font-bold text-gray-800">
          Sổ khám bệnh
        </h1>
        <div className="w-8" />
      </div>

      <div className="w-full px-4 py-4 lg:px-6 lg:py-6 2xl:px-10">
        <nav className="mb-6 hidden items-center text-sm text-gray-500 lg:flex">
          <Link href="/" className="hover:text-[#329965] hover:underline">
            Trang chủ
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href="/profile" className="hover:text-[#329965] hover:underline">
            Tài khoản
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-bold text-gray-800">Sổ khám bệnh</span>
        </nav>

        <div className="min-h-[560px] rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h5 className="text-lg font-bold uppercase text-gray-800">Lịch sử khám bệnh</h5>
              <p className="mt-1 text-sm text-gray-500">
                Bà con có thể xem lại các lần khám trước và cách điều trị ở đây.
              </p>
            </div>

            <Link
              href="/ai-doctor"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#329965] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#268050]"
            >
              <Activity size={18} />
              Hỏi bác sĩ ca mới
            </Link>
          </div>

          <div className="p-5">
            <div className="relative mb-6">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Tìm theo tên bệnh hoặc mã số..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm transition-all focus:border-[#329965] focus:outline-none"
              />
            </div>

            {historyQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 size={28} className="mb-3 animate-spin text-[#329965]" />
                Đang tìm sổ khám bệnh...
              </div>
            ) : historyQuery.isError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
                <p className="font-semibold text-red-600">Lỗi không mở được sổ khám bệnh.</p>
                <p className="mt-2 text-sm text-red-500">
                  Bà con hãy kiểm tra mạng hoặc thử lại sau nhé.
                </p>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="space-y-4">
                {filteredHistory.map((item) => (
                  <div
                    key={item.diagnosisId}
                    className="group flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[#329965] md:flex-row md:items-start"
                  >
                    <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-100 md:w-20">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.disease?.nameVi || "Ảnh khám bệnh"}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          <FileText size={28} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                          Mã số: #{item.diagnosisId}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          Ngày khám: {formatDateTime(item.createdAt)}
                        </span>
                      </div>

                      <h6 className="mb-2 truncate text-base font-bold text-gray-800 transition-colors group-hover:text-[#329965]">
                        {item.disease?.nameVi || "Đang chờ bác sĩ kết luận..."}
                      </h6>

                      <div className="mb-2 flex items-center gap-3">
                        {getSeverityBadge(item.disease)}
                        <span className="text-xs text-gray-400">
                          Độ tin cậy:{" "}
                          <span className="font-bold text-gray-600">
                            {item.disease?.confidencePercent != null
                              ? `${Number(item.disease.confidencePercent).toFixed(0)}%`
                              : "Chưa có"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex w-full flex-col justify-center md:mt-0 md:w-auto">
                      <Link
                        href={`/ai-doctor/result?id=${item.diagnosisId}`}
                        className="flex h-12 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-[#329965] px-4 text-xs font-bold text-[#329965] transition-colors hover:bg-[#eaf7f4]"
                      >
                        <FileText size={14} />
                        Xem kết quả
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                  <FileText size={32} className="text-gray-300" />
                </div>
                <h3 className="mb-1 font-bold text-gray-900">Chưa có lịch sử khám bệnh</h3>
                <p className="text-sm text-gray-500">
                  Bà con hãy thực hiện lần khám đầu tiên để lưu vào sổ nhé.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
