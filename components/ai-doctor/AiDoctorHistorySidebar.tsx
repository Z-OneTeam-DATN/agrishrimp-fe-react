"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, MessageSquarePlus, NotebookText } from "lucide-react";
import { aiDoctorService } from "@/app/services/aiDoctor.service";

// Parse thu cong "yyyy-MM-dd" thay vi new Date(...) — new Date("yyyy-MM-dd") bi hieu la UTC
// midnight, de lech lui 1 ngay khi hien thi vao buoi toi gio VN.
function formatDateLabel(isoDate: string) {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day}/${month}`;
}

export default function AiDoctorHistorySidebar({
  activeDate,
  todayDate,
  onSelectToday,
  onSelectDate,
}: {
  activeDate: string | null;
  todayDate: string;
  onSelectToday: () => void;
  onSelectDate: (date: string) => void;
}) {
  const datesQuery = useQuery({
    queryKey: ["ai-doctor-daily-record-dates"],
    queryFn: () => aiDoctorService.getDailyRecordDates(),
  });
  // Hom nay da co nut rieng "Kham hom nay" o tren — loai khoi list de tranh hien trung lap.
  const pastDates = (datesQuery.data?.dates ?? []).filter((date) => date !== todayDate);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 p-3">
        <button
          type="button"
          onClick={onSelectToday}
          className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold shadow-sm transition-colors ${
            activeDate === null
              ? "border-[#1965A2] bg-[#eaf2fc] text-[#1965A2]"
              : "border-transparent bg-white text-slate-700 hover:bg-[#eaf2fc]"
          }`}
        >
          <MessageSquarePlus size={18} />
          Khám hôm nay
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <h3 className="mb-2 px-1 text-[11px] font-bold uppercase text-slate-400">Sổ khám</h3>
        {datesQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#1965A2]" size={24} />
          </div>
        ) : pastDates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
            <NotebookText size={32} className="opacity-40" />
            <p className="text-sm">Chưa có lượt khám nào</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {pastDates.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                  activeDate === date
                    ? "bg-[#eaf2fc] text-[#1965A2]"
                    : "bg-white text-slate-700 hover:bg-[#eaf2fc]"
                }`}
              >
                <span className="text-sm font-semibold">{formatDateLabel(date)}</span>
                <FileText size={16} className="text-[#1965A2]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
