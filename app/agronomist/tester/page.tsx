"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Loader2, Send, X } from "lucide-react";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  AgronomistPageHeader,
  AgronomistPanel,
  agronomistOutlineButtonClassName,
  agronomistPrimaryButtonClassName,
  agronomistTextareaClassName,
} from "@/components/agronomist/agronomist-ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { P } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { AiKnowledgeStatus } from "@/app/types/ai-knowledge.types";
import type { AiDoctorChatResponse, AiDoctorDiagnosisResponse } from "@/app/types/ai-doctor.types";

type ScopeMode = "approved" | "preview";
type PreviewStatusTabId = "IN_REVIEW" | "APPROVED" | "DRAFT" | "DISABLED";

const PREVIEW_STATUS_TABS: { id: PreviewStatusTabId; label: string; statuses: AiKnowledgeStatus[] }[] = [
  { id: "IN_REVIEW", label: "Chờ duyệt", statuses: ["IN_REVIEW"] },
  { id: "APPROVED", label: "Đã duyệt", statuses: ["APPROVED"] },
  { id: "DRAFT", label: "Nháp / Bị từ chối", statuses: ["DRAFT"] },
  { id: "DISABLED", label: "Đã tắt", statuses: ["DISABLED", "ARCHIVED"] },
];

function isDiagnosisResult(
  data: AiDoctorChatResponse | AiDoctorDiagnosisResponse,
): data is AiDoctorDiagnosisResponse {
  return "diagnosisId" in data;
}

export default function AgronomistTesterPage() {
  return (
    <PermissionGuard permission={P.AI_KNOWLEDGE_APPROVE}>
      <AgronomistTesterContent />
    </PermissionGuard>
  );
}

function AgronomistTesterContent() {
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<ScopeMode>("approved");
  const [previewStatusTab, setPreviewStatusTab] = useState<PreviewStatusTabId>("IN_REVIEW");
  const [previewDiseaseCode, setPreviewDiseaseCode] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const diseasesQuery = useQuery({
    queryKey: ["ai-knowledge", "diseases"],
    queryFn: () => aiKnowledgeService.getDiseases(),
    enabled: scope === "preview",
  });

  const filteredDiseases = useMemo(() => {
    const activeTab = PREVIEW_STATUS_TABS.find((tab) => tab.id === previewStatusTab);
    if (!activeTab) return [];
    return (diseasesQuery.data ?? []).filter((item) => activeTab.statuses.includes(item.status));
  }, [diseasesQuery.data, previewStatusTab]);

  const testMutation = useMutation<AiDoctorChatResponse | AiDoctorDiagnosisResponse>({
    mutationFn: () => {
      const previewCode = scope === "preview" ? previewDiseaseCode : undefined;
      return image
        ? aiKnowledgeService.testDiagnose(image, message || undefined, previewCode)
        : aiKnowledgeService.testChat(message, previewCode);
    },
  });

  const canSubmit =
    (message.trim().length > 0 || image !== null) &&
    !testMutation.isPending &&
    (scope !== "preview" || previewDiseaseCode !== "");

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImage(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleScopeChange = (nextScope: ScopeMode) => {
    setScope(nextScope);
    if (nextScope === "approved") setPreviewDiseaseCode("");
  };

  const handlePreviewTabChange = (tab: PreviewStatusTabId) => {
    setPreviewStatusTab(tab);
    setPreviewDiseaseCode("");
  };

  const result = testMutation.data;
  const diagnosisResult = result && isDiagnosisResult(result) ? result : null;
  const chatResult = result && !isDiagnosisResult(result) ? result : null;

  return (
    <div className="space-y-5">
      <AgronomistPageHeader
        title="Chat thử nghiệm"
        actions={
          <button
            type="button"
            onClick={() => testMutation.mutate()}
            disabled={!canSubmit}
            className={agronomistPrimaryButtonClassName}
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Chạy thử
          </button>
        }
      />

      <AgronomistPanel className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleScopeChange("approved")}
            className={cn(
              "h-9 rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
              scope === "approved"
                ? "border-[#252896] bg-[#eef0ff] text-[#252896]"
                : "border-[#d5d8e5] bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            Tất cả đang vận hành
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange("preview")}
            className={cn(
              "h-9 rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
              scope === "preview"
                ? "border-[#252896] bg-[#eef0ff] text-[#252896]"
                : "border-[#d5d8e5] bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            Chọn phác đồ
          </button>
        </div>

        {scope === "preview" && (
          <div className="mt-3 space-y-2 border-t border-[#e8ebf1] pt-3">
            <div className="flex flex-wrap gap-1.5">
              {PREVIEW_STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handlePreviewTabChange(tab.id)}
                  className={cn(
                    "h-7 rounded-[4px] border px-2.5 text-[11px] font-medium transition-colors",
                    previewStatusTab === tab.id
                      ? "border-[#252896] bg-[#eef0ff] text-[#252896]"
                      : "border-[#d5d8e5] bg-white text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Select value={previewDiseaseCode || undefined} onValueChange={setPreviewDiseaseCode}>
              <SelectTrigger className="h-9 w-full max-w-[420px] text-[12px]">
                <SelectValue placeholder={diseasesQuery.isLoading ? "Đang tải..." : "Chọn phác đồ cần test"} />
              </SelectTrigger>
              <SelectContent>
                {filteredDiseases.length > 0 ? (
                  filteredDiseases.map((disease) => (
                    <SelectItem key={disease.code} value={disease.code} className="text-[12px]">
                      {disease.nameVi} ({disease.code})
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-[12px] text-slate-400">
                    Không có phác đồ nào ở trạng thái này
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </AgronomistPanel>

      <section className="grid gap-4 xl:grid-cols-[0.86fr,1.14fr]">
        <AgronomistPanel className="p-4">
          <label className="mb-2 block text-[12px] font-semibold text-[#232323]">
            Câu hỏi
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={cn(
              agronomistTextareaClassName,
              "min-h-[170px] w-full resize-y px-3 py-3",
            )}
            placeholder="Nhập câu hỏi người nuôi..."
          />

          <div className="mt-3 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={agronomistOutlineButtonClassName}
            >
              <ImageIcon className="h-4 w-4" />
              {image ? "Đổi ảnh" : "Đính kèm ảnh"}
            </button>
            {imagePreviewUrl && (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[4px] border border-[#d5d8e5]">
                <img src={imagePreviewUrl} alt="Ảnh test" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white"
                  aria-label="Xóa ảnh"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[12px] text-slate-400">
            <span>{message.trim().length} ký tự{image ? " · có kèm ảnh" : ""}</span>
            {testMutation.isError ? (
              <span className="font-medium text-rose-500">
                Chạy thử thất bại
              </span>
            ) : null}
          </div>
        </AgronomistPanel>

        <AgronomistPanel>
          <div className="flex items-center justify-between border-b border-[#e8ebf1] bg-[#f0f1f3] px-4 py-3">
            <h2 className="text-[13px] font-semibold uppercase text-[#232323]">
              Kết quả
            </h2>
            <span className="text-[11px] font-medium text-slate-400">
              {testMutation.data ? "Đã có phản hồi" : "Chưa chạy"}
            </span>
          </div>

          <div className="min-h-[260px] p-4">
            {testMutation.isPending ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#252896]" />
              </div>
            ) : chatResult ? (
              <div
                className="prose prose-sm max-w-none break-words text-[13px] leading-6 prose-p:my-2 prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:my-2 prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: chatResult.reply }}
              />
            ) : diagnosisResult ? (
              <DiagnosisResultCard result={diagnosisResult} />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[4px] border border-dashed border-[#d5d8e5] bg-[#f7f8fa] text-[13px] font-medium text-slate-400">
                Kết quả sẽ hiển thị tại đây.
              </div>
            )}
          </div>
        </AgronomistPanel>
      </section>
    </div>
  );
}

function DiagnosisResultCard({ result }: { result: AiDoctorDiagnosisResponse }) {
  return (
    <div className="space-y-3 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="rounded-[4px] bg-[#eef0ff] px-2 py-1 text-[11px] font-semibold text-[#252896]">
          {result.status ?? "—"}
        </span>
        {result.needsClarification && (
          <span className="rounded-[4px] bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
            Cần hỏi thêm
          </span>
        )}
      </div>

      {result.imageUrl && (
        <img
          src={result.imageUrl}
          alt="Ảnh chẩn đoán"
          className="max-h-[220px] rounded-[4px] border border-[#e1e4ec] object-contain"
        />
      )}

      {result.disease && (
        <div>
          <p className="font-semibold text-slate-900">
            {result.disease.nameVi}
            {result.disease.nameEn ? ` (${result.disease.nameEn})` : ""}
          </p>
          {typeof result.disease.confidencePercent === "number" && (
            <p className="text-[12px] text-slate-500">Độ tin cậy: {result.disease.confidencePercent}%</p>
          )}
        </div>
      )}

      {result.signsSummary && (
        <div>
          <p className="font-semibold text-slate-700">Dấu hiệu</p>
          <p className="text-slate-600">{result.signsSummary}</p>
        </div>
      )}

      {result.causes && result.causes.length > 0 && (
        <div>
          <p className="font-semibold text-slate-700">Nguyên nhân</p>
          <ul className="list-disc space-y-0.5 pl-5 text-slate-600">
            {result.causes.map((cause, index) => (
              <li key={index}>{cause}</li>
            ))}
          </ul>
        </div>
      )}

      {result.treatmentStages && result.treatmentStages.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-slate-700">Phác đồ điều trị</p>
          {result.treatmentStages.map((stage, index) => (
            <div key={index} className="rounded-[4px] border border-[#e1e4ec] p-2.5">
              <p className="font-medium text-slate-800">{stage.stageTitle}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-600">
                {stage.instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {result.aiDescription && (
        <div
          className="prose prose-sm max-w-none break-words border-t border-[#e8ebf1] pt-3 text-[13px] leading-6 prose-p:my-2 prose-strong:text-slate-900"
          dangerouslySetInnerHTML={{ __html: result.aiDescription }}
        />
      )}
    </div>
  );
}
