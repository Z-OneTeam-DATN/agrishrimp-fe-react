"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, FileText, Loader2, MessageSquarePlus, NotebookText } from "lucide-react";
import { aiDoctorService } from "@/app/services/aiDoctor.service";
import { useAuthStore } from "@/stores/useAuthStore";

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
  // Component nay chi mount khi isAuthenticated da true (page.tsx), nhung accessToken co the chua
  // kip co trong store (nhanh cachedUser luc hydrate) — gate them accessToken de tranh 401 mo côi
  // (retry:0 -> khong bao gio thu lai cho lan mount do).
  const accessToken = useAuthStore((state) => state.accessToken);
  const datesQuery = useQuery({
    queryKey: ["ai-doctor-daily-record-dates"],
    queryFn: () => aiDoctorService.getDailyRecordDates(),
    enabled: Boolean(accessToken),
  });
  // Hom nay da co nut rieng "Kham hom nay" o tren — loai khoi list de tranh hien trung lap.
  const pastDates = (datesQuery.data?.dates ?? []).filter((date) => date !== todayDate);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2.5 px-4 pb-1 pt-4">
        <Link href="/" aria-label="Về trang chủ" className="text-white transition-opacity hover:opacity-80">
          <ChevronLeft size={22} />
        </Link>
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white">
          <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" />
        </div>
        <span className="truncate text-sm font-black tracking-tight text-white">Bác sĩ Tôm AgriShrimp</span>
      </div>

      <div className="shrink-0 p-3">
        <button
          type="button"
          onClick={onSelectToday}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
            activeDate === null
              ? "bg-white text-[#1965A2] shadow-sm"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <MessageSquarePlus size={18} />
          Khám hôm nay
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <h3 className="mb-2 px-1 text-[11px] font-bold uppercase text-white/60">Sổ khám</h3>
        {datesQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        ) : pastDates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-white/60">
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
                    ? "bg-white text-[#1965A2] shadow-sm"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <span className="text-sm font-semibold">{formatDateLabel(date)}</span>
                <FileText size={16} className={activeDate === date ? "text-[#1965A2]" : "text-white/70"} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
