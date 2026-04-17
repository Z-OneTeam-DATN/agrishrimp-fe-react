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
  AiDoctorTreatmentStage,
} from "@/app/types/ai-doctor.types";
import { useCartStore } from "@/stores/useCartStore";

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
  products.reduce((sum, product) => sum + (product.price && product.price > 0 ? product.price : 0), 0);

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
      <div className="mb-2 text-[12px] font-bold text-red-600">{formatPrice(product.price)}</div>

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
            <ul className="space-y-2">
              {stage.instructions.map((instruction, instructionIndex) => (
                <li
                  key={`${index}-${instructionIndex}`}
                  className="flex items-start gap-2 text-sm leading-relaxed text-slate-700"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#376E60]" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
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
                {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Thêm thuốc bước này vào giỏ
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {stage.products.map((product) => (
                <ProductCard key={`${index}-${product.id}-${product.name}`} product={product} />
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-[#376E60]/25 bg-[#f4faf7] px-3 py-2 text-right text-sm font-semibold text-slate-700">
              Tiền thuốc bước này: <span className="text-[#376E60]">{formatPrice(subtotal)}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm italic text-slate-400">
            Bước này bác sĩ chưa có gợi ý sản phẩm cụ thể.
          </div>
        )}
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
  const [prescriptionState, setPrescriptionState] = useState<PrescriptionState>("idle");
  const [prescriptionData, setPrescriptionData] = useState<Partial<AiDoctorDiagnosisResponse> | null>(null);
  const variantIdCache = useRef<Map<number, number>>(new Map());
  const { fetchCartCount } = useCartStore();

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
    enabled: !!diagnosisId,
    initialData: cachedDiagnosis,
  });

  const diagnosis = diagnosisQuery.data;
  const diagnosisImageUrl = diagnosis?.imageUrl ?? diagnosis?.clientImageUrl;
  const causes = prescriptionData?.causes ?? diagnosis?.causes ?? [];
  const signsSummary = prescriptionData?.signsSummary ?? diagnosis?.signsSummary ?? null;
  const treatmentStages = prescriptionData?.treatmentStages ?? diagnosis?.treatmentStages ?? [];
  const hasPrescription = treatmentStages.length > 0;
  const secondaryPredictions = diagnosis?.topPredictions?.slice(1, 4) ?? [];
  const stageTotals = treatmentStages.map((stage) => getStageTotal(stage.products));
  const overallTotal = stageTotals.reduce((sum, total) => sum + total, 0);
  const overallProducts = treatmentStages.flatMap((stage) => stage.products ?? []);

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
      throw new Error(`Sản phẩm ${product.name} (ID: ${product.id}) không có biến thể nào.`);
    }

    // Ưu tiên biến thể đang ACTIVE và có hàng, sau đó là ACTIVE, cuối cùng là cái đầu tiên
    const preferredVariant =
      productDetail.variants.find((v) => v.status === "ACTIVE" && v.quantity > 0) ||
      productDetail.variants.find((v) => v.status === "ACTIVE") ||
      productDetail.variants[0];

    if (!preferredVariant?.id) {
      throw new Error(`Không tìm thấy biến thể hợp lệ cho sản phẩm ${product.name}.`);
    }

    console.log(`[AiDoctor] Resolved variant ID: ${preferredVariant.id} for product: ${product.name}`);
    variantIdCache.current.set(product.id, preferredVariant.id);
    return preferredVariant.id;
  };

  const addProductsToCart = async (products: AiDoctorSuggestedProduct[], key: string, label: string) => {
    if (!products.length) {
      toast.error("Giai đoạn này chưa có sản phẩm để thêm.");
      return;
    }

    setAddingKey(key);

    try {
      console.log(`[AiDoctor] Starting to add ${products.length} products to cart for ${label}`);
      
      for (const product of products) {
        try {
          const variantId = await resolveVariantId(product);
          await cartService.updateQuantity(variantId, 1);
          console.log(`[AiDoctor] Added product: ${product.name} (Variant: ${variantId})`);
        } catch (itemError) {
          console.error(`[AiDoctor] Error adding product ${product.name}:`, itemError);
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
        toast.error("Không thể thêm thuốc vào giỏ. Bà con hãy thử lại sau nhé.");
      }
    } finally {
      setAddingKey(null);
    }
  };

  if (!diagnosisId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7f9] px-4 text-center">
        <FileText size={40} className="mb-4 text-slate-300" />
        <h1 className="mb-2 text-xl font-bold text-slate-900">Chưa có dữ liệu khám bệnh</h1>
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
              <span className="rounded bg-slate-200 px-2 py-0.5">Mã số: #{diagnosisId}</span>
              <span>•</span>
              <span>Ngày khám: {formatDateTime(diagnosis?.createdAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/ai-doctor/history"
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
            <p className="text-lg font-bold text-red-600">Không tìm thấy kết quả khám này.</p>
            <p className="mt-2 text-sm text-red-500">
              Bà con hãy thử lại hoặc hỏi bác sĩ ca mới nhé.
            </p>
          </div>
        ) : diagnosis?.status === "HEALTHY" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-green-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-5xl shadow-inner">
              🦐
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-green-700">Tôm khỏe mạnh!</h2>
            <p className="mb-6 text-sm text-slate-500">
              Bác sĩ không thấy dấu hiệu bệnh gì lạ. Bà con cứ yên tâm chăm sóc ao nhé.
            </p>
            <Link
              href="/ai-doctor"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#376E60] px-6 text-sm font-bold text-white"
            >
              Khám tiếp ảnh khác
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
                      Độ tin cậy {Number(diagnosis.disease?.confidencePercent || 0).toFixed(0)}%
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
                            {Number(prediction.confidencePercent || 0).toFixed(0)}%
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
                          <span className="font-medium text-slate-600">Bước {index + 1}</span>
                          <span className="font-bold text-slate-800">{formatPrice(total)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl bg-[#376E60] px-4 py-3 text-white">
                      <div className="mb-1 text-xs uppercase tracking-wide text-white/80">
                        Tổng tiền thuốc (các bước)
                      </div>
                      <div className="text-2xl font-extrabold">{formatPrice(overallTotal)}</div>
                    </div>

                    <button
                      onClick={() =>
                        addProductsToCart(overallProducts, "all-stages", "toàn bộ phác đồ")
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
              <h2 className="mb-4 text-xl font-bold text-slate-800">CÁCH ĐIỀU TRỊ CHI TIẾT</h2>
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
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center text-gray-400">
                  <FlaskConical size={40} className="mb-3 text-slate-300" />
                  <p className="mb-2 text-sm font-medium text-slate-600">
                    Bác sĩ chưa lập phác đồ điều trị.
                  </p>
                  <p className="mb-6 text-xs text-slate-400">
                    Nhấn nút bên dưới để bác sĩ AI phân tích và đưa ra phác đồ thuốc phù hợp.
                  </p>
                  {prescriptionState === "error" && (
                    <p className="mb-3 text-xs text-red-500">
                      Có lỗi xảy ra. Bà con thử lại nhé.
                    </p>
                  )}
                  <button
                    onClick={handleGetPrescription}
                    disabled={prescriptionState === "loading"}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#376E60] px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#2f5c50] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prescriptionState === "loading" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Đang lập phác đồ...
                      </>
                    ) : (
                      <>
                        <FlaskConical size={16} />
                        Xem phác đồ điều trị
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
