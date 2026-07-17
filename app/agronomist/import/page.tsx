"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type { AiKnowledgeImportPreview } from "@/app/types/ai-knowledge.types";

export default function AgronomistImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"OVERWRITE" | "UPSERT_NEW">("OVERWRITE");
  const [preview, setPreview] = useState<AiKnowledgeImportPreview | null>(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Vui lòng chọn file Excel trước.");
      }
      return aiKnowledgeService.previewImport(file, mode);
    },
    onSuccess: (data) => {
      setPreview(data);
      toast.success("Đã đọc file và tạo preview.");
    },
    onError: (error: any) => toast.error(error?.message || "Không thể preview file."),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!preview) {
        throw new Error("Chưa có preview để áp dụng.");
      }
      return aiKnowledgeService.applyImport(preview);
    },
    onSuccess: (data) => {
      setPreview(data);
      toast.success("Đã nạp tri thức vào hàng chờ duyệt.");
    },
    onError: (error: any) => toast.error(error?.message || "Không thể áp dụng import."),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">Excel Knowledge Import</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Nạp tri thức hàng loạt bằng Excel</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              File mới sẽ vào trạng thái <strong>IN_REVIEW</strong>, không tự publish. Bạn có thể import theo chế độ
              ghi đè hoặc chỉ bổ sung bản ghi chưa tồn tại.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[4px] border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-900">Chọn file Excel</p>
            <p className="mt-1 text-sm text-slate-500">Một sheet `knowledge` với các cột theo file mẫu.</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-4 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            {file ? (
              <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                {file.name}
              </div>
            ) : null}
          </div>

          <div className="rounded-[4px] border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-slate-900">Chế độ import</p>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as "OVERWRITE" | "UPSERT_NEW")}
              className="mt-4 h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none"
            >
              <option value="OVERWRITE">Ghi đè theo mã duy nhất</option>
              <option value="UPSERT_NEW">Chỉ bổ sung nếu chưa tồn tại</option>
            </select>

            <div className="mt-5 grid gap-3">
              <button onClick={() => previewMutation.mutate()} className={primaryButtonClassName}>
                {previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Preview file
              </button>
              <button
                onClick={() => applyMutation.mutate()}
                disabled={!preview}
                className={secondaryButtonClassName}
              >
                {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Áp dụng import
              </button>
              <a
                href={aiKnowledgeService.getTemplateDownloadUrl()}
                className={downloadButtonClassName}
              >
                <Download className="h-4 w-4" />
                Tải file mẫu
              </a>
            </div>
          </div>
        </div>
      </section>

      {preview ? (
        <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Tổng dòng" value={preview.totalRows} />
            <Stat label="Hợp lệ" value={preview.validRows} />
            <Stat label="Lỗi" value={preview.invalidRows} />
            <Stat label="Mode" value={preview.mode} />
          </div>

          <div className="mt-6 overflow-hidden rounded-[4px] border border-slate-200">
            <div className="grid grid-cols-[100px,120px,180px,1fr,1fr] bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <div>Dòng</div>
              <div>Loại</div>
              <div>Mã</div>
              <div>Tên</div>
              <div>Trạng thái</div>
            </div>
            {preview.rows.map((row) => (
              <div
                key={`${row.rowNumber}-${row.code}`}
                className="grid grid-cols-[100px,120px,180px,1fr,1fr] items-start gap-3 border-t border-slate-200 px-4 py-4 text-sm"
              >
                <div className="font-semibold text-slate-700">#{row.rowNumber}</div>
                <div>{row.type}</div>
                <div>{row.code}</div>
                <div>
                  <p className="font-semibold text-slate-900">{row.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.categoryName}</p>
                </div>
                <div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${row.valid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {row.valid ? "VALID" : "ERROR"}
                  </span>
                  {row.errors.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-rose-600">
                      {row.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  ) : null}
                  {row.warnings.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-amber-600">
                      {row.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-[22px] font-bold text-slate-900">{value}</p>
    </div>
  );
}

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700";
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
const downloadButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100";
