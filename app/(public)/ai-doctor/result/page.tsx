"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronLeft,
  ExternalLink,
  FileText,
  FlaskConical,
  Loader2,
  ShoppingBag,
  ShieldAlert,
} from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { aiDoctorService } from "@/app/services/aiDoctor.service";
import { cartService } from "@/app/services/cart.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import type {
  AiDoctorDiagnosisResponse,
  AiDoctorSuggestedProduct,
  AiDoctorTreatmentStageOption,
  AiDoctorTreatmentStage,
} from "@/app/types/ai-doctor.types";
import { useCartStore } from "@/stores/useCartStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const formatPrice = (price?: number) => {
  if (!price || price <= 0) return "Liên hệ";
  return `${price.toLocaleString("vi-VN")} đ`;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Vừa chẩn đoán";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getStageTotal = (products: AiDoctorSuggestedProduct[] = []) =>
  products.reduce(
    (sum, product) =>
      sum + (product.price && product.price > 0 ? product.price : 0),
    0,
  );

const getVisibleDiseaseImageUrls = (imageUrls?: string[]) =>
  (imageUrls ?? [])
    .map((imageUrl) => imageUrl.trim())
    .filter(Boolean)
    .slice(0, 3);

function DiseaseReferenceImageGrid({
  imageUrls,
  diseaseName,
}: {
  imageUrls?: string[];
  diseaseName?: string;
}) {
  const visibleImageUrls = getVisibleDiseaseImageUrls(imageUrls);

  if (visibleImageUrls.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {visibleImageUrls.map((imageUrl, index) => (
        <div
          key={`${imageUrl}-${index}`}
          className="relative h-24 overflow-hidden rounded-md border border-slate-100 bg-slate-50"
        >
          <Image
            src={imageUrl}
            alt={
              diseaseName
                ? `Ảnh minh họa ${diseaseName}`
                : "Ảnh minh họa bệnh tôm"
            }
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

function TreatmentInstructionList({
  instructions,
}: {
  instructions?: string[];
}) {
  const visibleInstructions = (instructions ?? []).filter((instruction) =>
    instruction.trim(),
  );

  if (visibleInstructions.length === 0) return null;

  const hasHtml = visibleInstructions.some((instruction) =>
    HTML_TAG_PATTERN.test(instruction),
  );

  if (hasHtml) {
    return (
      <div className="space-y-3">
        {visibleInstructions.map((instruction, instructionIndex) =>
          HTML_TAG_PATTERN.test(instruction) ? (
            <div
              key={instructionIndex}
              className="prose prose-sm max-w-none text-slate-700 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:text-slate-900"
              dangerouslySetInnerHTML={{ __html: instruction }}
            />
          ) : (
            <p
              key={instructionIndex}
              className="text-sm leading-relaxed text-slate-700"
            >
              {instruction}
            </p>
          ),
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {visibleInstructions.map((instruction, instructionIndex) => (
        <li
          key={instructionIndex}
          className="flex items-start gap-2 text-sm leading-relaxed text-slate-700"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#376E60]" />
          <span>{instruction}</span>
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product }: { product: AiDoctorSuggestedProduct }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#376E60]/40 hover:shadow-md">
      <div className="relative mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-slate-50">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-1.5"
            unoptimized
          />
        ) : (
          <ShoppingBag size={22} className="text-slate-300" />
        )}
      </div>

      <div className="mb-1 min-h-[2.4rem] line-clamp-2 text-[12px] font-semibold leading-5 text-slate-800">
        {product.name}
      </div>
      <div className="mb-2 text-[12px] font-bold text-red-600">
        {formatPrice(product.price)}
      </div>

      {product.webUrl && (
        <a
          href={product.webUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-[#376E60]/15 bg-[#edf6f3] px-2 text-[11px] font-bold text-[#376E60] transition-colors hover:bg-[#dcefe8]"
        >
          <ExternalLink size={12} />
          Xem hàng
        </a>
      )}
    </div>
  );
}

function StageSelectionCard({
  message,
  options,
  selectionType,
  selectingOptionKey,
  onSelect,
}: {
  message?: string;
  options: AiDoctorTreatmentStageOption[];
  selectionType?: "STAGE" | "SUB_STAGE";
  selectingOptionKey: string | null;
  onSelect: (option: AiDoctorTreatmentStageOption) => void;
}) {
  const title =
    selectionType === "SUB_STAGE" ? "Chọn giai đoạn con" : "Chọn giai đoạn";
  const getOptionKey = (option: AiDoctorTreatmentStageOption) =>
    selectionType === "SUB_STAGE"
      ? `${option.stageIndex}-${option.subStageIndex ?? ""}`
      : String(option.stageIndex);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#c8d7f1] bg-white shadow-sm">
      <div className="border-b border-[#c8d7f1] bg-[#eaf2fc] px-5 py-4">
        <h3 className="text-base font-extrabold text-[#12385a]">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {message ||
            "Bà con chọn đúng giai đoạn hiện tại để bác sĩ đưa phác đồ phù hợp."}
        </p>
      </div>

      <div className="divide-y divide-slate-100 p-3">
        {options.map((option) => {
          const optionKey = getOptionKey(option);
          const isSelecting = selectingOptionKey === optionKey;
          const optionNumber =
            selectionType === "SUB_STAGE"
              ? option.subStageNumber
              : option.stageNumber;
          const optionTitle =
            selectionType === "SUB_STAGE"
              ? option.subStageTitle || option.stageTitle
              : option.stageTitle;
          return (
            <button
              key={optionKey}
              type="button"
              onClick={() => onSelect(option)}
              disabled={selectingOptionKey !== null}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#f2f7fb] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-extrabold text-[#1965A2]">
                {optionNumber}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-slate-800">
                {optionTitle || `Giai đoạn ${optionNumber}`}
              </span>
              {isSelecting ? (
                <Loader2
                  size={18}
                  className="shrink-0 animate-spin text-[#1965A2]"
                />
              ) : (
                <ChevronLeft
                  size={18}
                  className="shrink-0 rotate-180 text-slate-400"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StageCard({
  stage,
  index,
  subtotal,
  isAdding,
  onAddStage,
}: {
  stage: AiDoctorTreatmentStage;
  index: number;
  subtotal: number;
  isAdding: boolean;
  onAddStage: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-900 px-2 py-1 text-xs font-extrabold text-white">
            BƯỚC {index + 1}
          </span>
          <span className="text-sm font-bold uppercase text-slate-800">
            {stage.stageTitle || `Bước ${index + 1}`}
          </span>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#376E60] shadow-sm">
          {formatPrice(subtotal)}
        </div>
      </div>

      <div className="p-4">
        {stage.instructions?.length > 0 ? (
          <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Hướng dẫn thực hiện
            </div>
            <TreatmentInstructionList instructions={stage.instructions} />
          </div>
        ) : null}

        {stage.products?.length > 0 ? (
          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Sản phẩm cần dùng
              </div>
              <button
                onClick={onAddStage}
                disabled={isAdding}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-[#376E60] px-3 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#2f5c50] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAdding ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Thêm thuốc bước này vào giỏ
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {stage.products.map((product) => (
                <ProductCard
                  key={`${index}-${product.id}-${product.name}`}
                  product={product}
                />
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-[#376E60]/25 bg-[#f4faf7] px-3 py-2 text-right text-sm font-semibold text-slate-700">
              Tiền thuốc bước này:{" "}
              <span className="text-[#376E60]">{formatPrice(subtotal)}</span>
            </div>
          </div>
        ) : !stage.extraProductNames?.length ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm italic text-slate-400">
            Bước này bác sĩ chưa có gợi ý sản phẩm cụ thể.
          </div>
        ) : null}

        {stage.extraProductNames?.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Sản phẩm khác được đề xuất
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {stage.extraProductNames.join(", ")} — chưa có trên cửa hàng, vui
              lòng liên hệ để được tư vấn thêm.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type PrescriptionState = "idle" | "loading" | "loaded" | "error";

export default function TreatmentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDiagnosisId = searchParams.get("id");
  const [diagnosisId, setDiagnosisId] = useState<string | null>(rawDiagnosisId);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [selectingOptionKey, setSelectingOptionKey] = useState<string | null>(
    null,
  );
  const [prescriptionState, setPrescriptionState] =
    useState<PrescriptionState>("idle");
  const [prescriptionData, setPrescriptionData] =
    useState<Partial<AiDoctorDiagnosisResponse> | null>(null);
  const variantIdCache = useRef<Map<number, number>>(new Map());
  const { fetchCartCount } = useCartStore();
  const { isAuthenticated } = useCurrentUser();

  useEffect(() => {
    setDiagnosisId(rawDiagnosisId || aiDoctorService.getLastDiagnosisId());
  }, [rawDiagnosisId]);

  const cachedDiagnosis = useMemo(() => {
    if (!diagnosisId) return undefined;
    return aiDoctorService.getCachedDiagnosis(diagnosisId) ?? undefined;
  }, [diagnosisId]);

  const diagnosisQuery = useQuery<AiDoctorDiagnosisResponse>({
    queryKey: ["ai-doctor-diagnosis", diagnosisId],
    queryFn: () => aiDoctorService.getDiagnosisDetail(diagnosisId!),
    enabled: !!diagnosisId && isAuthenticated,
    initialData: cachedDiagnosis,
  });

  const diagnosis = diagnosisQuery.data;
  const diagnosisImageUrl = diagnosis?.imageUrl ?? diagnosis?.clientImageUrl;
  const diseaseImageUrls = getVisibleDiseaseImageUrls(
    diagnosis?.disease?.imageUrls,
  );
  const causes = prescriptionData?.causes ?? diagnosis?.causes ?? [];
  const signsSummary =
    prescriptionData?.signsSummary ?? diagnosis?.signsSummary ?? null;
  const treatmentStages =
    prescriptionData?.treatmentStages ?? diagnosis?.treatmentStages ?? [];
  const stageSelection =
    prescriptionData?.stageSelection ?? diagnosis?.stageSelection ?? null;
  const hasPrescription = treatmentStages.length > 0;
  const secondaryPredictions = diagnosis?.topPredictions?.slice(1, 4) ?? [];
  const stageTotals = treatmentStages.map((stage) =>
    getStageTotal(stage.products),
  );
  const overallTotal = stageTotals.reduce((sum, total) => sum + total, 0);
  const overallProducts = treatmentStages.flatMap(
    (stage) => stage.products ?? [],
  );

  useEffect(() => {
    // Ca đang chờ AI hỏi làm rõ bệnh (chưa xác nhận) — không được tự tạo phác đồ cho bệnh
    // mới chỉ là dự đoán YOLO độ tin cậy thấp. BE cũng chặn ở generatePrescription(), đây
    // là chặn sớm ở FE để không tốn 1 request chắc chắn bị từ chối.
    if (
      diagnosis &&
      !diagnosis.needsClarification &&
      !hasPrescription &&
      !stageSelection &&
      prescriptionState === "idle" &&
      diagnosisId
    ) {
      handleGetPrescription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    diagnosis?.diagnosisId,
    diagnosis?.needsClarification,
    hasPrescription,
    stageSelection,
  ]);

  const handleGetPrescription = async () => {
    if (!diagnosisId || prescriptionState === "loading") return;
    setPrescriptionState("loading");
    try {
      const data = await aiDoctorService.generatePrescription(diagnosisId);
      setPrescriptionData(data);
      setPrescriptionState("loaded");
    } catch {
      setPrescriptionState("error");
      toast.error("Không thể lấy phác đồ điều trị. Bà con hãy thử lại nhé.");
    }
  };

  const handleSelectStageOption = async (
    option: AiDoctorTreatmentStageOption,
  ) => {
    if (!diagnosisId || selectingOptionKey !== null) return;
    const isSubStage = stageSelection?.selectionType === "SUB_STAGE";
    const optionKey = isSubStage
      ? `${option.stageIndex}-${option.subStageIndex ?? ""}`
      : String(option.stageIndex);
    setSelectingOptionKey(optionKey);
    try {
      const data =
        isSubStage && typeof option.subStageIndex === "number"
          ? await aiDoctorService.generatePrescriptionForSubStage(
              diagnosisId,
              option.stageIndex,
              option.subStageIndex,
            )
          : await aiDoctorService.generatePrescriptionForStage(
              diagnosisId,
              option.stageIndex,
            );
      setPrescriptionData(data);
      setPrescriptionState("loaded");
      if (!data.stageSelection?.options?.length) {
        toast.success("Đã chọn giai đoạn và lập phác đồ phù hợp.");
      }
    } catch {
      toast.error(
        "Không thể lấy phác đồ cho giai đoạn này. Bà con thử lại nhé.",
      );
    } finally {
      setSelectingOptionKey(null);
    }
  };

  const resolveVariantId = async (product: AiDoctorSuggestedProduct) => {
    // 1. Ưu tiên variantId từ backend trả về trong phác đồ (nếu có)
    if (product.variantId) return product.variantId;

    // 2. Kiểm tra cache theo productId
    const cached = variantIdCache.current.get(product.id);
    if (cached) return cached;

    // 3. Gọi API lấy chi tiết sản phẩm để tìm biến thể phù hợp
    console.log(`[AiDoctor] Resolving variant for product ID: ${product.id}`);
    const productDetail = await PublicProductService.getById(product.id);

    if (!productDetail?.variants || productDetail.variants.length === 0) {
      throw new Error(
        `Sản phẩm ${product.name} (ID: ${product.id}) không có biến thể nào.`,
      );
    }

    // Ưu tiên biến thể đang ACTIVE và có hàng, sau đó là ACTIVE, cuối cùng là cái đầu tiên
    const preferredVariant =
      productDetail.variants.find(
        (v) => v.status === "ACTIVE" && v.quantity > 0,
      ) ||
      productDetail.variants.find((v) => v.status === "ACTIVE") ||
      productDetail.variants[0];

    if (!preferredVariant?.id) {
      throw new Error(
        `Không tìm thấy biến thể hợp lệ cho sản phẩm ${product.name}.`,
      );
    }

    console.log(
      `[AiDoctor] Resolved variant ID: ${preferredVariant.id} for product: ${product.name}`,
    );
    variantIdCache.current.set(product.id, preferredVariant.id);
    return preferredVariant.id;
  };

  const addProductsToCart = async (
    products: AiDoctorSuggestedProduct[],
    key: string,
    label: string,
  ) => {
    if (!products.length) {
      toast.error("Giai đoạn này chưa có sản phẩm để thêm.");
      return;
    }

    setAddingKey(key);

    try {
      console.log(
        `[AiDoctor] Starting to add ${products.length} products to cart for ${label}`,
      );

      for (const product of products) {
        try {
          const variantId = await resolveVariantId(product);
          await cartService.updateQuantity(variantId, 1);
          console.log(
            `[AiDoctor] Added product: ${product.name} (Variant: ${variantId})`,
          );
        } catch (itemError) {
          console.error(
            `[AiDoctor] Error adding product ${product.name}:`,
            itemError,
          );
          // Tiếp tục thêm các sản phẩm khác nếu 1 cái bị lỗi
        }
      }

      await fetchCartCount();
      toast.success(`Đã thêm ${label} vào giỏ hàng.`);
    } catch (error) {
      console.error(`[AiDoctor] Global error adding ${label} to cart:`, error);
      const status = (error as AxiosError)?.response?.status;

      if (status === 401 || status === 403) {
        toast.error("Bà con hãy đăng nhập để mua thuốc nhé.");
        router.push("/login");
      } else {
        toast.error(
          "Không thể thêm thuốc vào giỏ. Bà con hãy thử lại sau nhé.",
        );
      }
    } finally {
      setAddingKey(null);
    }
  };

  if (!diagnosisId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7f9] px-4 text-center">
        <FileText size={40} className="mb-4 text-slate-300" />
        <h1 className="mb-2 text-xl font-bold text-slate-900">
          Chưa có dữ liệu khám bệnh
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Bà con hãy gửi ảnh cho bác sĩ để có kết quả khám nhé.
        </p>
        <Link
          href="/ai-doctor"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#376E60] px-5 text-sm font-bold text-white"
        >
          Hỏi bác sĩ ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9] py-6 font-sans text-slate-800">
      <div className="w-full px-4 lg:px-6 2xl:px-10">
        <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/ai-doctor"
              className="mb-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#376E60] shadow-sm"
            >
              <ChevronLeft size={14} />
              Quay lại nói chuyện với bác sĩ
            </Link>
            <h1 className="mb-1 text-2xl font-extrabold uppercase tracking-tight text-slate-900">
              Kết quả khám bệnh tôm
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
              <span className="rounded bg-slate-200 px-2 py-0.5">
                Mã số: #{diagnosisId}
              </span>
              <span>•</span>
              <span>Ngày khám: {formatDateTime(diagnosis?.createdAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/ai-doctor"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <Activity size={16} />
              Sổ khám bệnh
            </Link>
            {diagnosis?.purchaseUrl && (
              <a
                href={diagnosis.purchaseUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[#376E60] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#2f5c50]"
              >
                <ExternalLink size={16} />
                Mua thuốc theo đơn này
              </a>
            )}
          </div>
        </div>

        {diagnosisQuery.isLoading && !diagnosis ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 size={30} className="mb-3 animate-spin text-[#376E60]" />
            <p className="text-sm text-slate-500">Bác sĩ đang xem hồ sơ...</p>
          </div>
        ) : diagnosisQuery.isError && !diagnosis ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
            <p className="text-lg font-bold text-red-600">
              Không tìm thấy kết quả khám này.
            </p>
            <p className="mt-2 text-sm text-red-500">
              Bà con hãy thử lại hoặc hỏi bác sĩ ca mới nhé.
            </p>
          </div>
        ) : diagnosis?.status === "HEALTHY" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-blue-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-5xl shadow-inner">
              🦐
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-blue-700">
              Tôm khỏe mạnh!
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Bác sĩ không thấy dấu hiệu bệnh gì lạ. Bà con cứ yên tâm chăm sóc
              ao nhé.
            </p>
            <Link
              href="/ai-doctor"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#376E60] px-6 text-sm font-bold text-white"
            >
              Khám tiếp ảnh khác
            </Link>
          </div>
        ) : diagnosis?.needsClarification ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-5xl shadow-inner">
              🩺
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-amber-700">
              Chưa có kết luận cuối cùng
            </h2>
            <p className="mb-1 max-w-md text-sm text-slate-500">
              Bác sĩ AI vẫn đang hỏi thêm để xác nhận bệnh, chưa thể kết luận
              chỉ từ tấm ảnh này.
            </p>
            <p className="mb-6 max-w-md text-sm text-slate-500">
              Bà con hãy quay lại trò chuyện để trả lời nốt các câu hỏi nhé —
              kết quả sẽ chính xác hơn nhiều.
            </p>
            <Link
              href="/ai-doctor"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#376E60] px-6 text-sm font-bold text-white"
            >
              Tiếp tục trò chuyện với bác sĩ
            </Link>
          </div>
        ) : diagnosis ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-4">
              <div className="space-y-4 lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-lg border-2 border-red-500 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2.5">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase text-red-700">
                      <ShieldAlert size={16} />
                      Kết luận của bác sĩ
                    </span>
                    <span className="rounded-sm bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                      Độ tin cậy{" "}
                      {Number(
                        diagnosis.disease?.confidencePercent || 0,
                      ).toFixed(0)}
                      %
                    </span>
                  </div>

                  <div className="relative h-[220px] w-full bg-gray-100">
                    {diagnosisImageUrl ? (
                      <Image
                        src={diagnosisImageUrl}
                        alt={diagnosis.disease?.nameVi ?? "Ảnh khám bệnh"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <ShoppingBag size={42} />
                      </div>
                    )}
                  </div>

                  {diseaseImageUrls.length > 0 && (
                    <div className="border-b border-slate-100 p-3">
                      <div className="mb-2 text-[10px] font-bold uppercase text-slate-400">
                        Ảnh minh họa bệnh trong phác đồ
                      </div>
                      <DiseaseReferenceImageGrid
                        imageUrls={diseaseImageUrls}
                        diseaseName={diagnosis.disease?.nameVi}
                      />
                    </div>
                  )}

                  <div className="p-4">
                    <h2 className="mb-0.5 text-lg font-extrabold leading-tight text-red-700">
                      Bệnh: {diagnosis.disease?.nameVi}
                    </h2>
                    {diagnosis.disease?.nameEn && (
                      <div className="mb-4 text-xs italic text-slate-400">
                        ({diagnosis.disease.nameEn})
                      </div>
                    )}

                    <div className="mb-4 rounded-md border border-slate-100 bg-slate-50 p-3">
                      <div className="mb-2 text-[10px] font-bold uppercase text-slate-400">
                        Lời khuyên của bác sĩ
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {signsSummary || "Bác sĩ chưa có nhận xét cụ thể."}
                      </p>
                    </div>

                    <div>
                      <div className="mb-2 text-[11px] font-bold uppercase text-slate-500">
                        Tại sao tôm bị bệnh?
                      </div>
                      {causes.length > 0 ? (
                        <ul className="space-y-2 text-sm text-slate-600">
                          {causes.map((cause, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle
                                size={14}
                                className="mt-0.5 shrink-0 text-amber-500"
                              />
                              <span>{cause}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm italic text-slate-400">
                          Chưa có thông tin về nguyên nhân.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {secondaryPredictions.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 text-xs font-bold uppercase text-slate-500">
                      Cũng có thể là bệnh:
                    </div>
                    <div className="space-y-2">
                      {secondaryPredictions.map((prediction) => (
                        <div
                          key={`${prediction.diseaseCode}-${prediction.nameVi}`}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {prediction.nameVi}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {Number(prediction.confidencePercent || 0).toFixed(
                              0,
                            )}
                            %
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasPrescription && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 text-xs font-bold uppercase text-slate-500">
                      Tiền thuốc dự kiến
                    </div>
                    <div className="space-y-2">
                      {stageTotals.map((total, index) => (
                        <div
                          key={`stage-total-${index}`}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-600">
                            Bước {index + 1}
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatPrice(total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl bg-[#376E60] px-4 py-3 text-white">
                      <div className="mb-1 text-xs uppercase tracking-wide text-white/80">
                        Tổng tiền thuốc (các bước)
                      </div>
                      <div className="text-2xl font-extrabold">
                        {formatPrice(overallTotal)}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        addProductsToCart(
                          overallProducts,
                          "all-stages",
                          "toàn bộ phác đồ",
                        )
                      }
                      disabled={addingKey === "all-stages"}
                      className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingKey === "all-stages" ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShoppingBag size={16} />
                      )}
                      Thêm tất cả thuốc vào giỏ
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-8">
              <h2 className="mb-4 text-xl font-bold text-slate-800">
                CÁCH ĐIỀU TRỊ CHI TIẾT
              </h2>
              {hasPrescription ? (
                treatmentStages.map((stage, index) => (
                  <StageCard
                    key={`${index}-${stage.stageTitle}`}
                    stage={stage}
                    index={index}
                    subtotal={stageTotals[index] ?? 0}
                    isAdding={addingKey === `stage-${index}`}
                    onAddStage={() =>
                      addProductsToCart(
                        stage.products ?? [],
                        `stage-${index}`,
                        `giai đoạn ${index + 1}`,
                      )
                    }
                  />
                ))
              ) : stageSelection?.options?.length ? (
                <StageSelectionCard
                  message={stageSelection.message}
                  options={stageSelection.options}
                  selectionType={stageSelection.selectionType}
                  selectingOptionKey={selectingOptionKey}
                  onSelect={handleSelectStageOption}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center text-gray-400">
                  {prescriptionState === "error" ? (
                    <>
                      <FlaskConical size={40} className="mb-3 text-slate-300" />
                      <p className="mb-2 text-sm font-medium text-slate-600">
                        Không thể lập phác đồ lúc này.
                      </p>
                      <p className="mb-6 text-xs text-red-400">
                        Có lỗi xảy ra. Bà con thử lại nhé.
                      </p>
                      <button
                        onClick={handleGetPrescription}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#376E60] px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#2f5c50]"
                      >
                        <FlaskConical size={16} />
                        Thử lại
                      </button>
                    </>
                  ) : prescriptionState === "loaded" ? (
                    <>
                      <FlaskConical size={40} className="mb-3 text-slate-300" />
                      <p className="mb-2 text-sm font-medium text-slate-600">
                        Bệnh này chưa có phác đồ điều trị được duyệt.
                      </p>
                      <p className="text-xs text-slate-400">
                        Bà con vui lòng liên hệ kỹ sư để được tư vấn thêm.
                      </p>
                    </>
                  ) : (
                    <>
                      <Loader2
                        size={36}
                        className="mb-3 animate-spin text-[#376E60]"
                      />
                      <p className="text-sm font-medium text-slate-600">
                        Bác sĩ đang lập phác đồ điều trị...
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Quá trình này mất khoảng 10–30 giây, bà con đợi xíu nhé.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
