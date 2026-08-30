"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { FileService } from "@/app/services/file.service";
import { returnService } from "@/app/services/return.service";
import {
  CreateReturnRequestPayload,
  ReturnDraftItem,
  ReturnEvidenceType,
  ReturnHandlingOption,
  ReturnIssueType,
  ReturnOrderDraft,
} from "@/app/types/return.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getReturnHandlingLabel,
  RETURN_HANDLING_OPTIONS,
  RETURN_ISSUE_OPTIONS,
} from "@/lib/return-request";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { cn, formatCurrency, repairVietnameseText } from "@/lib/utils";

type UploadEvidenceItem = {
  id: string;
  mediaType: ReturnEvidenceType;
  fileUrl: string;
  publicId?: string | null;
  fileName?: string | null;
  previewUrl: string;
};

type SelectedItemMap = Record<string, { quantity: number }>;
type RequiredFieldKey =
  | "fullName"
  | "phoneNumber"
  | "bankAccountName"
  | "bankAccountNumber"
  | "bankName"
  | "reason"
  | "description";
type FieldErrors = Partial<Record<RequiredFieldKey, string>>;
type TouchedFields = Partial<Record<RequiredFieldKey, boolean>>;

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const REQUIRED_FIELD_KEYS: RequiredFieldKey[] = [
  "fullName",
  "phoneNumber",
  "bankAccountName",
  "bankAccountNumber",
  "bankName",
  "reason",
  "description",
];

function getDraftItemKey(
  item: Pick<ReturnDraftItem, "sourceType" | "sourceItemId">,
) {
  return `${item.sourceType}:${item.sourceItemId}`;
}

function normalizeNumberInput(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

function extractErrorMessage(error: any, fallback: string) {
  return repairVietnameseText(
    error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      fallback,
  );
}

const flatFieldClass =
  "rounded-none border-[#cfe0f2] bg-white focus-visible:ring-[#1965a2]";
const flatSelectClass =
  "flex h-10 w-full rounded-none border border-[#cfe0f2] bg-white px-3 py-2 text-sm outline-none focus:border-[#1965a2]";
const fieldErrorClass = "min-h-4 text-[11px] font-medium";

export default function ReturnRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const [draft, setDraft] = useState<ReturnOrderDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploadingType, setUploadingType] =
    useState<ReturnEvidenceType | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItemMap>({});
  const [imageEvidences, setImageEvidences] = useState<UploadEvidenceItem[]>(
    [],
  );
  const [videoEvidences, setVideoEvidences] = useState<UploadEvidenceItem[]>(
    [],
  );
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    bankBranch: "",
    issueType: "DAMAGED" as ReturnIssueType,
    handlingOption: "RETURN_AND_REFUND" as ReturnHandlingOption,
    refundMethod: "BANK_TRANSFER" as CreateReturnRequestPayload["refundMethod"],
    reason: "",
    description: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const draftResponse = await returnService.getReturnDraft(id);
        if (!active) {
          return;
        }

        if (draftResponse.canCreateRequest === false) {
          toast.info(
            repairVietnameseText(
              draftResponse.message ||
                `Đơn hàng ${draftResponse.orderCode} đã có phiếu ${draftResponse.existingRequestCode ?? ""}.`,
            ).trim(),
          );
          router.replace("/orders/list?status=RETURNED");
          return;
        }

        setDraft(draftResponse);
      } catch (err: any) {
        if (!active) {
          return;
        }

        setError(
          extractErrorMessage(
            err,
            "Không thể tải thông tin trả hàng. Vui lòng thử lại sau.",
          ),
        );
      } finally {
        if (active) {
          setLoading(false);
          setUploadingType(null);
        }
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [id, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.fullName || "",
      phoneNumber: current.phoneNumber || user.phoneNumber || "",
      email: current.email || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    if (
      form.issueType === "MISSING_ITEM" &&
      form.handlingOption !== "REFUND_ONLY"
    ) {
      setForm((current) => ({
        ...current,
        handlingOption: "REFUND_ONLY",
      }));
    }
  }, [form.handlingOption, form.issueType]);

  const validateField = (field: RequiredFieldKey, value: string) => {
    const trimmed = value.trim();

    switch (field) {
      case "fullName":
        return trimmed ? null : "Vui lòng nhập họ tên người nhận hoàn tiền.";
      case "phoneNumber":
        if (!trimmed) {
          return "Vui lòng nhập số điện thoại.";
        }
        return /^[0-9]{9,11}$/.test(trimmed)
          ? null
          : "Số điện thoại phải gồm 9-11 chữ số.";
      case "bankAccountName":
        return trimmed ? null : "Vui lòng nhập tên chủ tài khoản.";
      case "bankAccountNumber":
        if (!trimmed) {
          return "Vui lòng nhập số tài khoản.";
        }
        return /^[0-9]{6,25}$/.test(trimmed)
          ? null
          : "Số tài khoản không hợp lệ.";
      case "bankName":
        return trimmed ? null : "Vui lòng nhập tên ngân hàng.";
      case "reason":
        return trimmed ? null : "Vui lòng nhập lý do ngắn gọn.";
      case "description":
        return trimmed ? null : "Vui lòng nhập mô tả chi tiết.";
      default:
        return null;
    }
  };

  useEffect(() => {
    setFieldErrors((current) => {
      let changed = false;
      const nextErrors: FieldErrors = { ...current };

      for (const field of REQUIRED_FIELD_KEYS) {
        if (!touchedFields[field] && !current[field]) {
          continue;
        }

        const nextError = validateField(field, String(form[field] ?? ""));
        if (nextError) {
          if (nextErrors[field] !== nextError) {
            nextErrors[field] = nextError;
            changed = true;
          }
          continue;
        }

        if (nextErrors[field]) {
          delete nextErrors[field];
          changed = true;
        }
      }

      return changed ? nextErrors : current;
    });
  }, [form, touchedFields]);

  const handleRequiredFieldBlur = (field: RequiredFieldKey) => {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const showAllRequiredFieldErrors = () => {
    const nextErrors: FieldErrors = {};
    for (const field of REQUIRED_FIELD_KEYS) {
      const nextError = validateField(field, String(form[field] ?? ""));
      if (nextError) {
        nextErrors[field] = nextError;
      }
    }

    setTouchedFields((current) => ({
      ...current,
      ...Object.fromEntries(
        REQUIRED_FIELD_KEYS.map((field) => [field, true]),
      ),
    }));
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length > 0;
  };

  const getFieldInputClass = (field: RequiredFieldKey) =>
    cn(
      flatFieldClass,
      touchedFields[field] &&
        fieldErrors[field] &&
        "border-rose-400 focus-visible:ring-rose-400",
    );

  const renderFieldError = (field: RequiredFieldKey) => (
    <p
      className={cn(
        fieldErrorClass,
        touchedFields[field] && fieldErrors[field]
          ? "text-rose-500"
          : "text-transparent",
      )}
    >
      {touchedFields[field] && fieldErrors[field] ? fieldErrors[field] : " "}
    </p>
  );

  const selectedDraftItems = useMemo(() => {
    if (!draft) {
      return [] as Array<ReturnDraftItem & { selectedQuantity: number }>;
    }

    return draft.items.reduce<Array<ReturnDraftItem & { selectedQuantity: number }>>(
      (result, item) => {
        const selected = selectedItems[getDraftItemKey(item)];
        if (!selected) {
          return result;
        }

        result.push({
          ...item,
          selectedQuantity: Math.min(
            Math.max(selected.quantity ?? 1, 1),
            item.maxReturnQuantity,
          ),
        });
        return result;
      },
      [],
    );
  }, [draft, selectedItems]);

  const selectedBranchIds = useMemo(
    () =>
      Array.from(
        new Set(
          selectedDraftItems
            .map((item) => item.branchId)
            .filter((branchId): branchId is number => branchId !== null),
        ),
      ),
    [selectedDraftItems],
  );

  const branchConflict =
    selectedDraftItems.length > 1 && selectedBranchIds.length !== 1;
  const totalSelectedQuantity = selectedDraftItems.reduce(
    (sum, item) => sum + item.selectedQuantity,
    0,
  );
  const refundPreview = selectedDraftItems.reduce(
    (sum, item) => sum + item.unitPrice * item.selectedQuantity,
    0,
  );
  const handlingOptionLocked = form.issueType === "MISSING_ITEM";
  const activeBranchId = selectedDraftItems[0]?.branchId ?? null;

  const removeEvidence = (item: UploadEvidenceItem) => {
    if (item.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }

    if (item.mediaType === "IMAGE") {
      setImageEvidences((current) =>
        current.filter((evidence) => evidence.id !== item.id),
      );
      return;
    }

    setVideoEvidences((current) =>
      current.filter((evidence) => evidence.id !== item.id),
    );
  };

  const handleToggleItem = (item: ReturnDraftItem, checked: boolean) => {
    const itemKey = getDraftItemKey(item);
    setSelectedItems((current) => {
      const next = { ...current };
      if (!checked) {
        delete next[itemKey];
        return next;
      }

      next[itemKey] = {
        quantity: Math.min(
          Math.max(current[itemKey]?.quantity ?? 1, 1),
          item.maxReturnQuantity,
        ),
      };
      return next;
    });
  };

  const handleQuantityChange = (item: ReturnDraftItem, value: string) => {
    const itemKey = getDraftItemKey(item);
    const normalized = Math.min(
      Math.max(normalizeNumberInput(value), 1),
      item.maxReturnQuantity,
    );

    setSelectedItems((current) => ({
      ...current,
      [itemKey]: { quantity: normalized },
    }));
  };

  const uploadEvidenceFiles = async (
    files: FileList | null,
    mediaType: ReturnEvidenceType,
  ) => {
    if (!files || files.length === 0) {
      return;
    }

    const maxSize =
      mediaType === "IMAGE" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
    const label = mediaType === "IMAGE" ? "hình ảnh" : "video";
    const uploads = Array.from(files);

    for (const file of uploads) {
      if (file.size > maxSize) {
        toast.error(
          `${repairVietnameseText(file.name)} vượt quá giới hạn ${
            mediaType === "IMAGE" ? "10MB" : "50MB"
          }.`,
        );
        return;
      }
    }

    const nextItems: UploadEvidenceItem[] = [];

    try {
      setUploadingType(mediaType);

      for (const file of uploads) {
        const formData = new FormData();
        formData.append("file", file);
        const uploaded = await FileService.tmpUpload(formData);

        nextItems.push({
          id: `${mediaType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          mediaType,
          fileUrl: uploaded.url,
          publicId: uploaded.publicId ?? null,
          fileName: repairVietnameseText(file.name),
          previewUrl: URL.createObjectURL(file),
        });
      }

      if (mediaType === "IMAGE") {
        setImageEvidences((current) => [...current, ...nextItems]);
      } else {
        setVideoEvidences((current) => [...current, ...nextItems]);
      }
    } catch (err: any) {
      nextItems.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      toast.error(
        extractErrorMessage(err, `Không thể tải ${label} lên lúc này.`),
      );
    } finally {
      setUploadingType(null);
    }
  };

  const validateBeforeSubmit = () => {
    if (!draft) {
      return "Không có dữ liệu đơn hàng để tạo yêu cầu.";
    }
    if (!selectedDraftItems.length) {
      return "Vui lòng chọn ít nhất một sản phẩm cần trả hàng.";
    }
    if (branchConflict || selectedBranchIds.length !== 1) {
      return "Các sản phẩm đã chọn hiện chưa thể gửi chung trong một yêu cầu. Vui lòng tách thành các yêu cầu riêng.";
    }
    if (imageEvidences.length === 0) {
      return "Cần có ít nhất 1 hình ảnh lỗi.";
    }
    if (videoEvidences.length === 0) {
      return "Cần có ít nhất 1 video lỗi.";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (showAllRequiredFieldErrors()) {
      setConfirmOpen(false);
      return;
    }

    const validationMessage = validateBeforeSubmit();
    if (validationMessage) {
      toast.error(validationMessage);
      setConfirmOpen(false);
      return;
    }

    if (!draft) {
      return;
    }

    try {
      setSubmitting(true);

      const payload: CreateReturnRequestPayload = {
        orderId: draft.orderId,
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || null,
        refundMethod: "BANK_TRANSFER",
        bankAccountName: form.bankAccountName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        bankName: form.bankName.trim(),
        bankBranch: form.bankBranch.trim() || null,
        issueType: form.issueType,
        handlingOption: form.handlingOption,
        reason: form.reason.trim(),
        description: form.description.trim(),
        items: selectedDraftItems.map((item) => ({
          sourceType: item.sourceType,
          sourceItemId: item.sourceItemId,
          quantity: item.selectedQuantity,
        })),
        evidences: [...imageEvidences, ...videoEvidences].map((item) => ({
          mediaType: item.mediaType,
          fileUrl: item.fileUrl,
          publicId: item.publicId ?? null,
          fileName: item.fileName ?? null,
        })),
      };

      const createdRequest = await returnService.createReturnRequest(payload);
      toast.success(
        `Đã gửi yêu cầu trả hàng ${createdRequest.code}. Chúng tôi sẽ cập nhật kết quả xử lý sớm nhất.`,
      );
      setConfirmOpen(false);
      router.replace("/orders/list?status=RETURNED");
    } catch (err: any) {
      toast.error(
        extractErrorMessage(err, "Không thể gửi yêu cầu trả hàng lúc này."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-none" />
        <Skeleton className="h-40 w-full rounded-none" />
        <Skeleton className="h-72 w-full rounded-none" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="border border-[#d8e6f5] bg-white px-6 py-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-rose-500" size={20} />
          <div className="space-y-3">
            <div>
              <h1 className="text-lg font-semibold text-[#12385b]">
                Không thể tạo yêu cầu trả hàng
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {error ??
                  "Đơn hàng này chưa sẵn sàng cho luồng trả hàng thủ công."}
              </p>
            </div>
            <Link
              href="/orders/list?status=COMPLETED"
              className="inline-flex h-10 items-center bg-[#1965a2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#145486]"
            >
              Quay lại đơn đã giao
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <section className="border border-[#d8e6f5] bg-white px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <Link
                href="/orders/list?status=COMPLETED"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#1965a2]"
              >
                <ArrowLeft size={16} />
                Quay lại đơn đã giao
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-[#12385b]">
                  Tạo yêu cầu trả hàng
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Đơn hàng{" "}
                  <span className="font-semibold text-[#12385b]">
                    {draft.orderCode}
                  </span>{" "}
                  sẽ được tiếp nhận và xử lý theo yêu cầu bạn gửi.
                </p>
              </div>
            </div>

            <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-[#12385b]">
                  Số sản phẩm đã chọn:
                </span>{" "}
                {selectedDraftItems.length}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-[#12385b]">
                  Số lượng trả:
                </span>{" "}
                {totalSelectedQuantity}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-[#12385b]">
                  Tạm tính hoàn:
                </span>{" "}
                {formatCurrency(refundPreview)}
              </p>
            </div>
          </div>
        </section>

        {draft.message ? (
          <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
            {repairVietnameseText(draft.message)}
          </div>
        ) : null}

        {!draft.singleBranchOnly ? (
          <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
            Các sản phẩm đã chọn hiện chưa thể gửi chung trong một yêu cầu. Vui lòng
            tách thành các yêu cầu riêng nếu cần.
          </div>
        ) : null}

        {form.issueType === "MISSING_ITEM" ? (
          <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
            Trường hợp thiếu hàng sẽ được xử lý theo phương án chỉ hoàn tiền trực
            tiếp. Bạn không cần gửi lại hàng vật lý nhưng vẫn bắt buộc có hình ảnh và
            video mô tả lỗi của đơn hàng.
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="border border-[#d8e6f5] bg-white px-5 py-5">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#1965a2]" />
                <h2 className="text-lg font-semibold text-[#12385b]">
                  1. Chọn sản phẩm cần trả
                </h2>
              </div>

              <div className="space-y-3">
                {draft.items.map((item) => {
                  const itemKey = getDraftItemKey(item);
                  const isSelected = Boolean(selectedItems[itemKey]);
                  const disabledByBranch =
                    !isSelected &&
                    activeBranchId !== null &&
                    item.branchId !== null &&
                    item.branchId !== activeBranchId;

                  return (
                    <div
                      key={itemKey}
                      className={`border px-4 py-4 ${
                        isSelected
                          ? "border-[#1965a2] bg-[#f8fbff]"
                          : "border-[#d8e6f5] bg-white"
                      } ${disabledByBranch ? "opacity-60" : ""}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleToggleItem(item, checked === true)
                            }
                            disabled={disabledByBranch}
                            className="mt-1 rounded-none"
                          />

                          <img
                            src={resolveImageUrl(item.image, "/placeholder.png")}
                            alt={item.productName}
                            className="h-20 w-20 border border-[#d8e6f5] object-cover"
                          />

                          <div className="space-y-2">
                            <div>
                              <h3 className="text-sm font-semibold text-[#12385b]">
                                {item.productName}
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                {item.variantName ||
                                  item.sku ||
                                  "Sản phẩm thuộc đơn hàng"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                              <span className="border border-[#d8e6f5] bg-[#fbfdff] px-2 py-1">
                                Đã mua: {item.orderedQuantity}
                              </span>
                              <span className="border border-[#d8e6f5] bg-[#fbfdff] px-2 py-1">
                                Tối đa trả: {item.maxReturnQuantity}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-auto flex w-full flex-col gap-3 lg:w-[220px]">
                          <div className="text-right text-sm font-semibold text-[#12385b]">
                            {formatCurrency(item.unitPrice)}
                          </div>

                          <label className="space-y-2 text-sm text-slate-600">
                            <span>Số lượng trả</span>
                            <Input
                              type="number"
                              min={1}
                              max={item.maxReturnQuantity}
                              value={selectedItems[itemKey]?.quantity ?? 1}
                              disabled={!isSelected}
                              onChange={(event) =>
                                handleQuantityChange(item, event.target.value)
                              }
                              className={flatFieldClass}
                            />
                          </label>

                          {disabledByBranch ? (
                            <p className="text-xs text-slate-500">
                              Sản phẩm này hiện chưa thể gửi chung trong yêu cầu này.
                              Vui lòng tách thành yêu cầu riêng nếu cần xử lý thêm.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="border border-[#d8e6f5] bg-white px-5 py-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#12385b]">
                  2. Thông tin hoàn tiền
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cập nhật thông tin liên hệ và tài khoản nhận hoàn tiền để chúng tôi
                  đối soát yêu cầu nhanh hơn.
                </p>
              </div>

              <div className="mb-4 space-y-3 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-[#12385b]">
                    Lựa chọn phương án xử lý
                  </span>
                  <p className="text-xs text-slate-500">
                    Chọn cách yêu cầu hoàn tiền của bạn sẽ được xử lý.
                  </p>
                </div>

                <div className="grid gap-3">
                  {RETURN_HANDLING_OPTIONS.map((option) => {
                    const disabled =
                      handlingOptionLocked &&
                      option.value === "RETURN_AND_REFUND";

                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors ${
                          form.handlingOption === option.value
                            ? "border-[#1965a2] bg-[#f8fbff]"
                            : "border-[#d8e6f5] bg-white"
                        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <input
                          type="radio"
                          name="handlingOption"
                          value={option.value}
                          checked={form.handlingOption === option.value}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              handlingOption:
                                event.target.value as ReturnHandlingOption,
                            }))
                          }
                          disabled={disabled}
                          className="mt-1 h-4 w-4 border-[#cfe0f2] text-[#1965a2] focus:ring-[#1965a2]"
                        />
                        <div>
                          <p className="font-medium text-[#12385b]">
                            {option.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {option.description}
                          </p>
                          {disabled ? (
                            <p className="mt-1 text-xs font-medium text-[#1965a2]">
                              Đơn thiếu hàng chỉ hỗ trợ phương án chỉ hoàn tiền.
                            </p>
                          ) : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Họ tên người nhận hoàn tiền
                  </span>
                  <Input
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    onBlur={() => handleRequiredFieldBlur("fullName")}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    placeholder="Nguyễn Văn A"
                    className={getFieldInputClass("fullName")}
                  />
                  {renderFieldError("fullName")}
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Số điện thoại
                  </span>
                  <Input
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phoneNumber: event.target.value,
                      }))
                    }
                    onBlur={() => handleRequiredFieldBlur("phoneNumber")}
                    aria-invalid={Boolean(fieldErrors.phoneNumber)}
                    placeholder="09xxxxxxxx"
                    className={getFieldInputClass("phoneNumber")}
                  />
                  {renderFieldError("phoneNumber")}
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">Email</span>
                  <Input
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="email@example.com"
                    className={flatFieldClass}
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Phương thức hoàn tiền
                  </span>
                  <Input
                    value="Chuyển khoản"
                    readOnly
                    className={flatFieldClass}
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Tên chủ tài khoản
                  </span>
                  <Input
                    value={form.bankAccountName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bankAccountName: event.target.value,
                      }))
                    }
                    onBlur={() => handleRequiredFieldBlur("bankAccountName")}
                    aria-invalid={Boolean(fieldErrors.bankAccountName)}
                    placeholder="NGUYEN VAN A"
                    className={getFieldInputClass("bankAccountName")}
                  />
                  {renderFieldError("bankAccountName")}
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Số tài khoản
                  </span>
                  <Input
                    value={form.bankAccountNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bankAccountNumber: event.target.value,
                      }))
                    }
                    onBlur={() => handleRequiredFieldBlur("bankAccountNumber")}
                    aria-invalid={Boolean(fieldErrors.bankAccountNumber)}
                    placeholder="0123456789"
                    className={getFieldInputClass("bankAccountNumber")}
                  />
                  {renderFieldError("bankAccountNumber")}
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Tên ngân hàng
                  </span>
                  <Input
                    value={form.bankName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bankName: event.target.value,
                      }))
                    }
                    onBlur={() => handleRequiredFieldBlur("bankName")}
                    aria-invalid={Boolean(fieldErrors.bankName)}
                    placeholder="Vietcombank"
                    className={getFieldInputClass("bankName")}
                  />
                  {renderFieldError("bankName")}
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Chi nhánh ngân hàng
                  </span>
                  <Input
                    value={form.bankBranch}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bankBranch: event.target.value,
                      }))
                    }
                    placeholder="Chi nhánh Cần Thơ"
                    className={flatFieldClass}
                  />
                </label>
              </div>
            </section>

            <section className="border border-[#d8e6f5] bg-white px-5 py-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#12385b]">
                  3. Lý do và mô tả lỗi
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mô tả rõ tình trạng lỗi, thiếu hàng hoặc giao sai để yêu cầu được xác
                  minh nhanh hơn.
                </p>
              </div>

              <div className="space-y-4">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Loại sự cố
                  </span>
                  <select
                    value={form.issueType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        issueType: event.target.value as ReturnIssueType,
                      }))
                    }
                    className={flatSelectClass}
                  >
                    {RETURN_ISSUE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Lý do ngắn gọn
                  </span>
                  <Input
                    value={form.reason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    onBlur={() => handleRequiredFieldBlur("reason")}
                    aria-invalid={Boolean(fieldErrors.reason)}
                    placeholder="Ví dụ: Giao sai sản phẩm, thiếu 1 món, bao bì rách..."
                    className={getFieldInputClass("reason")}
                  />
                  {renderFieldError("reason")}
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    Mô tả chi tiết
                  </span>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    onBlur={() => handleRequiredFieldBlur("description")}
                    aria-invalid={Boolean(fieldErrors.description)}
                    rows={5}
                    placeholder="Mô tả thời điểm nhận hàng, lỗi gặp phải, số lượng bị ảnh hưởng và thông tin cần kiểm tra thêm."
                    className={getFieldInputClass("description")}
                  />
                  {renderFieldError("description")}
                </label>
              </div>
            </section>

            <section className="border border-[#d8e6f5] bg-white px-5 py-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#12385b]">
                  4. Hình ảnh và video bằng chứng
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bắt buộc có ít nhất 1 hình ảnh và 1 video lỗi để yêu cầu được xác
                  minh nhanh hơn.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="border border-dashed border-[#cfe0f2] px-4 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ImagePlus size={18} className="text-[#1965a2]" />
                    <span className="font-medium text-[#12385b]">
                      Hình ảnh lỗi
                    </span>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center bg-[#f8fbff] px-4 py-8 text-center transition-colors hover:bg-[#eef6ff]">
                    <Upload size={20} className="mb-2 text-[#1965a2]" />
                    <span className="text-sm font-medium text-[#12385b]">
                      Tải ảnh bằng chứng
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      JPG, PNG, WEBP. Tối đa 10MB mỗi tệp.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        void uploadEvidenceFiles(event.target.files, "IMAGE");
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {uploadingType === "IMAGE" ? (
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 size={16} className="animate-spin" />
                      Đang tải hình ảnh...
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {imageEvidences.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden border border-[#d8e6f5] bg-white"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.fileName ?? "evidence-image"}
                          className="h-32 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 px-2 py-2">
                          <p className="truncate text-xs text-slate-500">
                            {repairVietnameseText(item.fileName ?? "Hình ảnh")}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeEvidence(item)}
                            className="p-1 text-rose-500 transition-colors hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-dashed border-[#cfe0f2] px-4 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Video size={18} className="text-[#1965a2]" />
                    <span className="font-medium text-[#12385b]">Video lỗi</span>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center bg-[#f8fbff] px-4 py-8 text-center transition-colors hover:bg-[#eef6ff]">
                    <Upload size={20} className="mb-2 text-[#1965a2]" />
                    <span className="text-sm font-medium text-[#12385b]">
                      Tải video bằng chứng
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      MP4, MOV, WEBM. Tối đa 50MB mỗi tệp.
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        void uploadEvidenceFiles(event.target.files, "VIDEO");
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {uploadingType === "VIDEO" ? (
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 size={16} className="animate-spin" />
                      Đang tải video...
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    {videoEvidences.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden border border-[#d8e6f5] bg-white"
                      >
                        <video
                          src={item.previewUrl}
                          controls
                          className="h-40 w-full bg-slate-950 object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 px-2 py-2">
                          <p className="truncate text-xs text-slate-500">
                            {repairVietnameseText(item.fileName ?? "Video lỗi")}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeEvidence(item)}
                            className="p-1 text-rose-500 transition-colors hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="sticky top-24 border border-[#d8e6f5] bg-white px-5 py-5">
              <h2 className="text-lg font-semibold text-[#12385b]">
                5. Xác nhận gửi
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Mã đơn</span>
                  <span className="text-right font-semibold text-[#12385b]">
                    {draft.orderCode}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Loại sự cố</span>
                  <span className="text-right font-semibold text-[#12385b]">
                    {
                      RETURN_ISSUE_OPTIONS.find(
                        (option) => option.value === form.issueType,
                      )?.label
                    }
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Phương án xử lý</span>
                  <span className="text-right font-semibold text-[#12385b]">
                    {getReturnHandlingLabel(form.handlingOption)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Tạm tính hoàn</span>
                  <span className="text-right text-lg font-semibold text-[#1965a2]">
                    {formatCurrency(refundPreview)}
                  </span>
                </div>
              </div>

              <div className="mt-4 border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-xs leading-6 text-slate-600">
                Bắt buộc:
                <br />
                - Họ tên, số điện thoại, lý do và mô tả chi tiết
                <br />
                - Tên chủ tài khoản, số tài khoản và tên ngân hàng
                <br />
                - Ít nhất 1 hình ảnh và 1 video lỗi
              </div>

              <Button
                type="button"
                onClick={() => {
                  if (showAllRequiredFieldErrors()) {
                    return;
                  }

                  const validationMessage = validateBeforeSubmit();
                  if (validationMessage) {
                    toast.error(validationMessage);
                    return;
                  }
                  setConfirmOpen(true);
                }}
                className="mt-5 h-11 w-full rounded-none bg-[#1965a2] text-white hover:bg-[#145486]"
                disabled={submitting}
              >
                {submitting ? "Đang gửi..." : "Gửi yêu cầu trả hàng"}
              </Button>

              <p className="mt-3 text-xs text-slate-500">
                Sau khi gửi, phiếu sẽ hiển thị ngay trong tab{" "}
                <span className="font-medium text-[#1965a2]">Trả hàng</span> để
                bạn theo dõi tiến độ xử lý.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận gửi yêu cầu trả hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Yêu cầu sẽ được tiếp nhận để xử lý. Hãy chắc rằng thông tin liên
              hệ, phương thức hoàn tiền, lý do và bằng chứng đều đã đầy đủ.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-4 text-sm text-slate-600">
            <div className="flex justify-between gap-4">
              <span>Đơn hàng</span>
              <span className="font-semibold text-[#12385b]">
                {draft.orderCode}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>Sản phẩm đã chọn</span>
              <span className="font-semibold text-[#12385b]">
                {selectedDraftItems.length}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>Tạm tính hoàn</span>
              <span className="font-semibold text-[#1965a2]">
                {formatCurrency(refundPreview)}
              </span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">
              Kiểm tra lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              className="rounded-none bg-[#1965a2] hover:bg-[#145486]"
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Xác nhận gửi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
