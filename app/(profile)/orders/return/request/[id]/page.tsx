"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { RETURN_ISSUE_OPTIONS } from "@/lib/return-request";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { formatCurrency } from "@/lib/utils";

type UploadEvidenceItem = {
  id: string;
  mediaType: ReturnEvidenceType;
  fileUrl: string;
  publicId?: string | null;
  fileName?: string | null;
  previewUrl: string;
};

type SelectedItemMap = Record<string, { quantity: number }>;

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const DEFAULT_OPEN_SECTIONS = [
  "summary",
  "products",
  "customer",
  "reason",
  "evidence",
];

function getDraftItemKey(item: Pick<ReturnDraftItem, "sourceType" | "sourceItemId">) {
  return `${item.sourceType}:${item.sourceItemId}`;
}

function normalizeNumberInput(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

function extractErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

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
  const [uploadingType, setUploadingType] = useState<ReturnEvidenceType | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItemMap>({});
  const [imageEvidences, setImageEvidences] = useState<UploadEvidenceItem[]>([]);
  const [videoEvidences, setVideoEvidences] = useState<UploadEvidenceItem[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    bankBranch: "",
    issueType: "DAMAGED" as ReturnIssueType,
    refundMethod: "BANK_TRANSFER" as CreateReturnRequestPayload["refundMethod"],
    reason: "",
    description: "",
  });

  useEffect(() => {
    let mounted = true;

    const fetchDraft = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await returnService.getReturnDraft(id);
        if (!mounted) return;
        setDraft(response);
      } catch (err: any) {
        if (!mounted) return;
        setError(
          extractErrorMessage(
            err,
            "Không thể tải thông tin trả hàng. Vui lòng thử lại sau.",
          ),
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchDraft();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!draft) return;

    setForm((prev) => ({
      ...prev,
      fullName:
        prev.fullName ||
        draft.customerName ||
        user?.fullName ||
        user?.displayName ||
        "",
      phoneNumber:
        prev.phoneNumber ||
        draft.customerPhone ||
        user?.phoneNumber ||
        "",
      email: prev.email || user?.email || "",
      bankAccountName:
        prev.bankAccountName ||
        user?.fullName ||
        user?.displayName ||
        draft.customerName ||
        "",
    }));
  }, [draft, user]);

  useEffect(() => {
    return () => {
      [...imageEvidences, ...videoEvidences].forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [imageEvidences, videoEvidences]);

  const selectedDraftItems = useMemo(() => {
    if (!draft) return [];

    return draft.items
      .filter((item) => selectedItems[getDraftItemKey(item)])
      .map((item) => ({
        ...item,
        selectedQuantity: selectedItems[getDraftItemKey(item)].quantity,
      }));
  }, [draft, selectedItems]);

  const selectedBranchIds = useMemo(() => {
    return Array.from(
      new Set(
        selectedDraftItems
          .map((item) => item.branchId)
          .filter((branchId): branchId is number => branchId !== null),
      ),
    );
  }, [selectedDraftItems]);

  const selectedBranchName = selectedDraftItems[0]?.branchName ?? null;
  const branchConflict = selectedBranchIds.length > 1;
  const refundPreview = selectedDraftItems.reduce(
    (total, item) => total + item.unitPrice * item.selectedQuantity,
    0,
  );
  const totalSelectedQuantity = selectedDraftItems.reduce(
    (total, item) => total + item.selectedQuantity,
    0,
  );
  const issueLabel =
    RETURN_ISSUE_OPTIONS.find((option) => option.value === form.issueType)?.label ??
    form.issueType;
  const totalEvidenceCount = imageEvidences.length + videoEvidences.length;

  const handleToggleItem = (item: ReturnDraftItem, checked: boolean) => {
    const itemKey = getDraftItemKey(item);

    if (checked) {
      const activeBranchId = selectedDraftItems[0]?.branchId;
      if (
        activeBranchId !== null &&
        activeBranchId !== undefined &&
        item.branchId !== null &&
        item.branchId !== activeBranchId
      ) {
        toast.error("Mỗi yêu cầu chỉ được chọn sản phẩm thuộc cùng một chi nhánh.");
        return;
      }

      setSelectedItems((prev) => ({
        ...prev,
        [itemKey]: {
          quantity: Math.min(prev[itemKey]?.quantity ?? 1, item.maxReturnQuantity),
        },
      }));
      return;
    }

    setSelectedItems((prev) => {
      const next = { ...prev };
      delete next[itemKey];
      return next;
    });
  };

  const handleQuantityChange = (item: ReturnDraftItem, value: string) => {
    const nextQuantity = Math.max(
      1,
      Math.min(item.maxReturnQuantity, normalizeNumberInput(value)),
    );

    setSelectedItems((prev) => ({
      ...prev,
      [getDraftItemKey(item)]: {
        quantity: nextQuantity,
      },
    }));
  };

  const uploadEvidenceFiles = async (
    fileList: FileList | null,
    mediaType: ReturnEvidenceType,
  ) => {
    if (!fileList?.length) return;

    const files = Array.from(fileList);
    const maxSize =
      mediaType === "IMAGE" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(
          mediaType === "IMAGE"
            ? "Ảnh vượt quá giới hạn 10MB."
            : "Video vượt quá giới hạn 50MB.",
        );
        return;
      }
    }

    setUploadingType(mediaType);

    try {
      const uploaded = await Promise.all(
        files.map(async (file, index) => {
          const formData = new FormData();
          formData.append("file", file);
          const response = await FileService.tmpUpload(formData);

          return {
            id: `${mediaType}-${Date.now()}-${index}`,
            mediaType,
            fileUrl: response.url,
            publicId: response.publicId ?? null,
            fileName: file.name,
            previewUrl: URL.createObjectURL(file),
          } satisfies UploadEvidenceItem;
        }),
      );

      if (mediaType === "IMAGE") {
        setImageEvidences((prev) => [...prev, ...uploaded]);
      } else {
        setVideoEvidences((prev) => [...prev, ...uploaded]);
      }

      toast.success(
        mediaType === "IMAGE"
          ? "Đã tải lên hình ảnh lỗi."
          : "Đã tải lên video lỗi.",
      );
    } catch (err: any) {
      toast.error(
        extractErrorMessage(err, "Không thể tải lên tệp đính kèm lúc này."),
      );
    } finally {
      setUploadingType(null);
    }
  };

  const removeEvidence = (item: UploadEvidenceItem) => {
    if (item.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }

    if (item.mediaType === "IMAGE") {
      setImageEvidences((prev) => prev.filter((evidence) => evidence.id !== item.id));
      return;
    }

    setVideoEvidences((prev) => prev.filter((evidence) => evidence.id !== item.id));
  };

  const validateBeforeSubmit = () => {
    if (!draft) return "Không có dữ liệu đơn hàng để tạo yêu cầu.";
    if (!selectedDraftItems.length) return "Vui lòng chọn ít nhất một sản phẩm cần trả hàng.";
    if (branchConflict || selectedBranchIds.length !== 1) {
      return "Mỗi yêu cầu trả hàng chỉ được xử lý cho một chi nhánh phục vụ.";
    }
    if (form.refundMethod !== "BANK_TRANSFER") {
      return "Luồng trả hàng chỉ hỗ trợ hoàn tiền qua chuyển khoản ngân hàng.";
    }
    if (!form.fullName.trim()) return "Vui lòng nhập họ tên người nhận hoàn tiền.";
    if (!form.phoneNumber.trim()) return "Vui lòng nhập số điện thoại liên hệ.";
    if (!form.bankAccountName.trim()) return "Vui lòng nhập tên chủ tài khoản.";
    if (!form.bankAccountNumber.trim()) return "Vui lòng nhập số tài khoản.";
    if (!form.bankName.trim()) return "Vui lòng nhập tên ngân hàng.";
    if (!form.reason.trim()) return "Vui lòng nhập lý do trả hàng.";
    if (!form.description.trim()) return "Vui lòng mô tả chi tiết lỗi của đơn hàng.";
    if (imageEvidences.length === 0) return "Cần có ít nhất 1 hình ảnh lỗi.";
    if (videoEvidences.length === 0) return "Cần có ít nhất 1 video lỗi.";
    return null;
  };

  const handleSubmit = async () => {
    const validationMessage = validateBeforeSubmit();
    if (validationMessage) {
      toast.error(validationMessage);
      setConfirmOpen(false);
      return;
    }

    if (!draft) return;

    try {
      setSubmitting(true);

      const payload: CreateReturnRequestPayload = {
        orderId: draft.orderId,
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || null,
        bankAccountName: form.bankAccountName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        bankName: form.bankName.trim(),
        bankBranch: form.bankBranch.trim() || null,
        issueType: form.issueType,
        refundMethod: "BANK_TRANSFER",
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
        `Đã gửi yêu cầu trả hàng ${createdRequest.code}. Chi nhánh phục vụ sẽ xử lý tiếp theo.`,
      );
      setConfirmOpen(false);
      router.push("/orders/return/list");
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
        <Skeleton className="h-10 w-48 rounded-none" />
        <Skeleton className="h-24 w-full rounded-none" />
        <Skeleton className="h-80 w-full rounded-none" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="border border-blue-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-blue-700" size={20} />
          <div className="space-y-3">
            <div>
              <h1 className="text-lg font-semibold text-blue-950">
                Không thể tạo yêu cầu trả hàng
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {error ?? "Đơn hàng này chưa sẵn sàng cho luồng trả hàng thủ công."}
              </p>
            </div>
            <Link
              href="/orders/list?status=COMPLETED"
              className="inline-flex h-10 items-center bg-blue-800 px-4 text-sm font-semibold text-white hover:bg-blue-900"
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
      <div className="space-y-4 text-blue-950">
        <div className="border border-blue-200 bg-white p-4">
          <Link
            href="/orders/list?status=COMPLETED"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            <ArrowLeft size={16} />
            Quay lại đơn đã giao
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-blue-950">
            Tạo yêu cầu trả hàng
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Đơn hàng <span className="font-semibold text-blue-950">{draft.orderCode}</span> sẽ
            được chuyển đến chi nhánh phục vụ để xử lý thủ công.
          </p>
        </div>

        {draft.message ? (
          <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
            {draft.message}
          </div>
        ) : null}

        {form.issueType === "MISSING_ITEM" ? (
          <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
            Trường hợp thiếu hàng sẽ do chi nhánh phục vụ xác minh và hoàn tiền trực tiếp. Khách hàng không cần gửi trả lại hàng vật lý nhưng vẫn phải cung cấp ảnh và video bằng chứng.
          </div>
        ) : null}

        <Accordion
          type="multiple"
          defaultValue={DEFAULT_OPEN_SECTIONS}
          className="border border-blue-200 bg-white"
        >
          <AccordionItem value="summary" className="border-b border-blue-200">
            <AccordionTrigger className="px-4 py-4 hover:no-underline">
              <div className="grid w-full gap-3 text-left md:grid-cols-[1.5fr_0.9fr_0.9fr] md:items-center">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Phiếu tổng
                  </p>
                  <p className="text-lg font-semibold text-blue-950">
                    Yêu cầu trả hàng {draft.orderCode}
                  </p>
                  <p className="text-sm text-slate-600">
                    Nhấn để xem nhanh toàn bộ thông tin đơn trả
                  </p>
                </div>
                <SummaryBlock
                  label="Sản phẩm đã chọn"
                  value={`${selectedDraftItems.length} / ${draft.items.length}`}
                />
                <SummaryBlock
                  label="Tạm tính hoàn"
                  value={formatCurrency(refundPreview)}
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-blue-200 bg-blue-50/40 px-4 pb-4 pt-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoTile label="Mã đơn hàng" value={draft.orderCode} />
                <InfoTile
                  label="Chi nhánh xử lý"
                  value={selectedBranchName || "Sẽ xác định theo sản phẩm đã chọn"}
                />
                <InfoTile label="Loại sự cố" value={issueLabel} />
                <InfoTile
                  label="Phương thức hoàn"
                  value="Chuyển khoản ngân hàng"
                />
                <InfoTile label="Số lượng trả" value={`${totalSelectedQuantity}`} />
                <InfoTile label="Bằng chứng đã tải" value={`${totalEvidenceCount}`} />
                <InfoTile
                  label="Hình ảnh"
                  value={`${imageEvidences.length} tệp`}
                />
                <InfoTile
                  label="Video"
                  value={`${videoEvidences.length} tệp`}
                />
              </div>

              <div className="mt-4 border border-blue-200 bg-white p-3 text-sm text-slate-600">
                <p className="font-semibold text-blue-900">Thông tin cần có trước khi gửi</p>
                <p className="mt-2">- Chọn sản phẩm cần trả thuộc cùng một chi nhánh phục vụ.</p>
                <p>- Điền đầy đủ thông tin nhận hoàn tiền qua ngân hàng.</p>
                <p>- Cung cấp lý do, mô tả và ít nhất 1 ảnh cùng 1 video lỗi.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="products" className="border-b border-blue-200">
            <AccordionTrigger className="px-4 py-4 hover:no-underline">
              <div className="space-y-1 text-left">
                <p className="text-base font-semibold text-blue-950">
                  Sản phẩm cần trả
                </p>
                <p className="text-sm text-slate-600">
                  {selectedDraftItems.length > 0
                    ? `Đã chọn ${selectedDraftItems.length} sản phẩm • ${totalSelectedQuantity} đơn vị`
                    : "Chưa chọn sản phẩm trả hàng"}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-blue-200 bg-blue-50/40 px-4 pb-4 pt-4">
              <div className="space-y-3">
                {draft.items.map((item) => {
                  const itemKey = getDraftItemKey(item);
                  const isSelected = Boolean(selectedItems[itemKey]);
                  const selectedBranchId = selectedDraftItems[0]?.branchId;
                  const disabledByBranch =
                    !isSelected &&
                    selectedBranchId !== null &&
                    selectedBranchId !== undefined &&
                    item.branchId !== null &&
                    item.branchId !== selectedBranchId;

                  return (
                    <div
                      key={itemKey}
                      className={`border p-4 ${
                        isSelected
                          ? "border-blue-700 bg-white"
                          : "border-blue-200 bg-white"
                      } ${disabledByBranch ? "opacity-50" : ""}`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleToggleItem(item, checked === true)
                            }
                            disabled={disabledByBranch}
                            className="mt-1 rounded-none border-blue-300"
                          />

                          <img
                            src={resolveImageUrl(item.image, "/placeholder.png")}
                            alt={item.productName}
                            className="h-20 w-20 border border-blue-200 object-cover"
                          />

                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-blue-950">
                              {item.productName}
                            </h3>
                            <div className="text-sm text-slate-600">
                              {item.variantName || item.sku || "Sản phẩm thuộc đơn hàng"}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-600">
                              <span className="border border-blue-200 bg-blue-50 px-2 py-1">
                                Đã mua: {item.orderedQuantity}
                              </span>
                              <span className="border border-blue-200 bg-blue-50 px-2 py-1">
                                Tối đa trả: {item.maxReturnQuantity}
                              </span>
                              {item.branchName ? (
                                <span className="border border-blue-200 bg-blue-50 px-2 py-1">
                                  Chi nhánh: {item.branchName}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="ml-auto flex w-full flex-col gap-3 md:w-[220px]">
                          <div className="text-right text-sm font-semibold text-blue-950">
                            {formatCurrency(item.unitPrice)}
                          </div>
                          <label className="space-y-1 text-sm text-slate-600">
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
                              className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                            />
                          </label>
                          {disabledByBranch ? (
                            <p className="text-xs text-blue-800">
                              Bạn đang chọn sản phẩm của chi nhánh khác. Hãy gửi một phiếu riêng cho chi nhánh này.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="customer" className="border-b border-blue-200">
            <AccordionTrigger className="px-4 py-4 hover:no-underline">
              <div className="space-y-1 text-left">
                <p className="text-base font-semibold text-blue-950">
                  Thông tin hoàn tiền
                </p>
                <p className="text-sm text-slate-600">
                  {form.fullName
                    ? `${form.fullName} • ${form.bankName || "Chưa nhập ngân hàng"}`
                    : "Chưa điền thông tin người nhận hoàn tiền"}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-blue-200 bg-blue-50/40 px-4 pb-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Họ tên người nhận hoàn tiền</span>
                  <Input
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    placeholder="Nguyễn Văn A"
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Số điện thoại</span>
                  <Input
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                    }
                    placeholder="09xxxxxxxx"
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Email</span>
                  <Input
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="email@example.com"
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Phương thức hoàn tiền</span>
                  <Input
                    value="Chuyển khoản ngân hàng"
                    readOnly
                    disabled
                    className="rounded-none border-blue-200 bg-blue-50 text-blue-950"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Tên chủ tài khoản</span>
                  <Input
                    value={form.bankAccountName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        bankAccountName: event.target.value,
                      }))
                    }
                    placeholder="NGUYEN VAN A"
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Số tài khoản</span>
                  <Input
                    value={form.bankAccountNumber}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        bankAccountNumber: event.target.value,
                      }))
                    }
                    placeholder="0123456789"
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Tên ngân hàng</span>
                  <Input
                    value={form.bankName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, bankName: event.target.value }))
                    }
                    placeholder="Vietcombank"
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Chi nhánh ngân hàng</span>
                  <Input
                    value={form.bankBranch}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, bankBranch: event.target.value }))
                    }
                    placeholder="Chi nhánh TP.HCM"
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="reason" className="border-b border-blue-200">
            <AccordionTrigger className="px-4 py-4 hover:no-underline">
              <div className="space-y-1 text-left">
                <p className="text-base font-semibold text-blue-950">
                  Lý do và mô tả lỗi
                </p>
                <p className="text-sm text-slate-600">
                  {form.reason || "Chưa nhập lý do trả hàng"}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-blue-200 bg-blue-50/40 px-4 pb-4 pt-4">
              <div className="space-y-4">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Loại sự cố</span>
                  <select
                    value={form.issueType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        issueType: event.target.value as ReturnIssueType,
                      }))
                    }
                    className="flex h-10 w-full rounded-none border border-blue-200 bg-white px-3 py-2 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {RETURN_ISSUE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Lý do ngắn gọn</span>
                  <Input
                    value={form.reason}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, reason: event.target.value }))
                    }
                    placeholder="Ví dụ: Đơn giao thiếu 1 sản phẩm, vỏ bao bì bị rách..."
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-blue-900">Mô tả chi tiết</span>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Mô tả rõ vấn đề, thời điểm nhận hàng, tình trạng lỗi, số lượng bị ảnh hưởng..."
                    className="rounded-none border-blue-200 focus-visible:ring-blue-500"
                  />
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="evidence" className="border-b-0">
            <AccordionTrigger className="px-4 py-4 hover:no-underline">
              <div className="space-y-1 text-left">
                <p className="text-base font-semibold text-blue-950">
                  Ảnh và video bằng chứng
                </p>
                <p className="text-sm text-slate-600">
                  {imageEvidences.length} ảnh • {videoEvidences.length} video
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-blue-200 bg-blue-50/40 px-4 pb-4 pt-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="border border-blue-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ImagePlus size={18} className="text-blue-700" />
                    <span className="font-medium text-blue-950">Hình ảnh lỗi</span>
                  </div>
                  <label className="flex cursor-pointer flex-col items-center justify-center border border-blue-200 bg-blue-50 px-4 py-8 text-center">
                    <Upload size={20} className="mb-2 text-blue-700" />
                    <span className="text-sm font-medium text-blue-950">
                      Tải ảnh bằng chứng
                    </span>
                    <span className="mt-1 text-xs text-slate-600">
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
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 size={16} className="animate-spin" />
                      Đang tải hình ảnh...
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {imageEvidences.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden border border-blue-200 bg-white"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.fileName ?? "evidence-image"}
                          className="h-32 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 p-2">
                          <p className="truncate text-xs text-slate-600">
                            {item.fileName ?? "Hình ảnh"}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeEvidence(item)}
                            className="p-1 text-blue-700 hover:bg-blue-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-blue-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Video size={18} className="text-blue-700" />
                    <span className="font-medium text-blue-950">Video lỗi</span>
                  </div>
                  <label className="flex cursor-pointer flex-col items-center justify-center border border-blue-200 bg-blue-50 px-4 py-8 text-center">
                    <Upload size={20} className="mb-2 text-blue-700" />
                    <span className="text-sm font-medium text-blue-950">
                      Tải video bằng chứng
                    </span>
                    <span className="mt-1 text-xs text-slate-600">
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
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 size={16} className="animate-spin" />
                      Đang tải video...
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    {videoEvidences.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden border border-blue-200 bg-white"
                      >
                        <video
                          src={item.previewUrl}
                          controls
                          className="h-40 w-full bg-slate-950 object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 p-2">
                          <p className="truncate text-xs text-slate-600">
                            {item.fileName ?? "Video lỗi"}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeEvidence(item)}
                            className="p-1 text-blue-700 hover:bg-blue-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="border border-blue-200 bg-white p-4">
          <p className="text-sm text-slate-600">
            Sau khi gửi, phiếu trả hàng sẽ xuất hiện trong danh sách trả hàng của bạn để theo dõi tiến trình xử lý.
          </p>
          <Button
            type="button"
            onClick={() => {
              const validationMessage = validateBeforeSubmit();
              if (validationMessage) {
                toast.error(validationMessage);
                return;
              }
              setConfirmOpen(true);
            }}
            className="mt-4 h-11 w-full rounded-none bg-blue-800 text-white hover:bg-blue-900"
            disabled={submitting}
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu trả hàng"}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận gửi yêu cầu trả hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Yêu cầu sẽ được chuyển đến chi nhánh phục vụ của đơn hàng này. Hãy chắc rằng thông tin hoàn tiền và bằng chứng đã đầy đủ trước khi gửi.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="border border-blue-200 bg-blue-50/40 p-4 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <span>Đơn hàng</span>
              <span className="font-semibold text-blue-950">{draft.orderCode}</span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>Chi nhánh</span>
              <span className="text-right font-semibold text-blue-950">
                {selectedBranchName || "Sẽ xác định khi chọn đủ sản phẩm"}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>Sản phẩm đã chọn</span>
              <span className="font-semibold text-blue-950">
                {selectedDraftItems.length}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>Tạm tính hoàn</span>
              <span className="font-semibold text-blue-950">
                {formatCurrency(refundPreview)}
              </span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              className="bg-blue-800 text-white hover:bg-blue-900"
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Đồng ý gửi yêu cầu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-blue-200 bg-blue-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-blue-950">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-blue-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {label}
      </p>
      <p className="mt-2 text-sm text-blue-950">{value}</p>
    </div>
  );
}
