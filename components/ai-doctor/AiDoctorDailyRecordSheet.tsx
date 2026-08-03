"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, FileText, Loader2, NotebookText } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { aiDoctorService } from "@/app/services/aiDoctor.service";

// Parse thu cong "yyyy-MM-dd" thay vi new Date(...) — new Date("yyyy-MM-dd") bi hieu la UTC
// midnight, de lech lui 1 ngay khi hien thi vao buoi toi gio VN.
function formatDateLabel(isoDate: string) {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day}/${month}`;
}

export default function AiDoctorDailyRecordSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const datesQuery = useQuery({
    queryKey: ["ai-doctor-daily-record-dates"],
    queryFn: () => aiDoctorService.getDailyRecordDates(),
    enabled: open,
  });

  const detailQuery = useQuery({
    queryKey: ["ai-doctor-daily-record-detail", selectedDate],
    queryFn: () => aiDoctorService.getDailyRecordDetail(selectedDate as string),
    enabled: open && Boolean(selectedDate),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSelectedDate(null);
    onOpenChange(nextOpen);
  };

  const openReport = (diagnosisId?: string) => {
    if (!diagnosisId) return;
    handleOpenChange(false);
    router.push(`/ai-doctor/result?id=${diagnosisId}`);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="flex h-full w-full max-w-none flex-col border-r-0 bg-[#eef3f9] p-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Sổ khám</SheetTitle>

        <div className="flex shrink-0 items-center gap-3 bg-[#1965A2] px-4 py-3 text-white shadow-sm">
          {selectedDate ? (
            <button
              type="button"
              aria-label="Quay lại"
              onClick={() => setSelectedDate(null)}
              className="text-white transition-opacity hover:opacity-80"
            >
              <ChevronLeft size={24} />
            </button>
          ) : (
            <SheetClose asChild>
              <button type="button" aria-label="Đóng" className="text-white transition-opacity hover:opacity-80">
                <ChevronLeft size={24} />
              </button>
            </SheetClose>
          )}
          <h2 className="text-base font-bold">
            {selectedDate ? `Sổ khám ngày ${formatDateLabel(selectedDate)}` : "Sổ khám"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selectedDate ? (
            datesQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#1965A2]" size={24} />
              </div>
            ) : (datesQuery.data?.dates ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
                <NotebookText size={32} className="opacity-40" />
                <p className="text-sm">Chưa có lượt khám nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(datesQuery.data?.dates ?? []).map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#c8d7f1] bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-[#eaf2fc]"
                  >
                    <span className="text-sm font-semibold text-slate-800">{formatDateLabel(date)}</span>
                    <FileText size={16} className="text-[#1965A2]" />
                  </button>
                ))}
              </div>
            )
          ) : detailQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#1965A2]" size={24} />
            </div>
          ) : (
            <div className="space-y-4">
              <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase text-slate-500">
                  Triệu chứng đã mô tả
                </h3>
                {(detailQuery.data?.symptomsDescribed.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    {detailQuery.data?.symptomsDescribed.map((text, index) => (
                      <div key={index} className="rounded-xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                        {text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Chưa mô tả triệu chứng nào bằng chữ ngày này.</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase text-slate-500">Bệnh đã thảo luận</h3>
                {(detailQuery.data?.diseasesDiscussed.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detailQuery.data?.diseasesDiscussed.map((disease) => (
                      <span
                        key={disease.code}
                        className="rounded-full bg-[#eaf2fc] px-3 py-1.5 text-[12px] font-medium text-[#1965A2]"
                      >
                        {disease.nameVi}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Chưa xác định được bệnh cụ thể ngày này.</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase text-slate-500">Chẩn đoán qua ảnh</h3>
                {(detailQuery.data?.diagnoses.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    {detailQuery.data?.diagnoses.map((item) => (
                      <div key={item.diagnosisId} className="rounded-xl border border-[#c8d7f1] bg-white p-3 shadow-sm">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.disease?.nameVi || "Chưa xác định"}
                        </p>
                        {item.needsClarification && (
                          <p className="mt-0.5 text-[11px] text-amber-600">Đang chờ xác nhận thêm</p>
                        )}
                        <button
                          type="button"
                          onClick={() => openReport(item.diagnosisId)}
                          className="mt-2 rounded-lg bg-[#1965A2] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#15588D]"
                        >
                          Xem phác đồ
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Ngày này chưa gửi ảnh chẩn đoán nào.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
