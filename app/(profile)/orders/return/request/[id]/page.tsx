"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { RETURN_ISSUE_OPTIONS, RETURN_REFUND_OPTIONS } from "@/lib/return-request";
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
            "Khong the tai thong tin tra hang. Vui long thu lai sau.",
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
        toast.error("Moi yeu cau chi duoc chon san pham thuoc cung mot chi nhanh.");
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
            ? "Anh vuot qua gioi han 10MB."
            : "Video vuot qua gioi han 50MB.",
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
          ? "Da tai len hinh anh loi."
          : "Da tai len video loi.",
      );
    } catch (err: any) {
      toast.error(
        extractErrorMessage(err, "Khong the tai len tep dinh kem luc nay."),
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
    if (!draft) return "Khong co du lieu don hang de tao yeu cau.";
    if (!selectedDraftItems.length) return "Vui long chon it nhat mot san pham can tra hang.";
    if (branchConflict || selectedBranchIds.length !== 1) {
      return "Moi yeu cau tra hang chi duoc xu ly cho mot chi nhanh phuc vu.";
    }
    if (!form.fullName.trim()) return "Vui long nhap ho ten nguoi nhan hoan tien.";
    if (!form.phoneNumber.trim()) return "Vui long nhap so dien thoai lien he.";
    if (!form.bankAccountName.trim()) return "Vui long nhap ten chu tai khoan.";
    if (!form.bankAccountNumber.trim()) return "Vui long nhap so tai khoan.";
    if (!form.bankName.trim()) return "Vui long nhap ten ngan hang.";
    if (!form.reason.trim()) return "Vui long nhap ly do tra hang.";
    if (!form.description.trim()) return "Vui long mo ta chi tiet loi cua don hang.";
    if (imageEvidences.length === 0) return "Can co it nhat 1 hinh anh loi.";
    if (videoEvidences.length === 0) return "Can co it nhat 1 video loi.";
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
        refundMethod: form.refundMethod,
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
        `Da gui yeu cau tra hang ${createdRequest.code}. Chi nhanh phuc vu se xu ly tiep theo.`,
      );
      setConfirmOpen(false);
      router.push("/orders/return/list");
    } catch (err: any) {
      toast.error(
        extractErrorMessage(err, "Khong the gui yeu cau tra hang luc nay."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-rose-500" size={20} />
          <div className="space-y-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Khong the tao yeu cau tra hang
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {error ?? "Don hang nay chua san sang cho luong tra hang thu cong."}
              </p>
            </div>
            <Link
              href="/orders/list?status=COMPLETED"
              className="inline-flex h-10 items-center rounded-md bg-[#1965a2] px-4 text-sm font-semibold text-white hover:bg-[#145486]"
            >
              Quay lai don da giao
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Link
                href="/orders/list?status=COMPLETED"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#1965a2]"
              >
                <ArrowLeft size={16} />
                Quay lai don da giao
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Tao yeu cau tra hang
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Don hang <span className="font-semibold text-slate-700">{draft.orderCode}</span> se
                  duoc chuyen den chi nhanh phuc vu de xu ly thu cong.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-900">So san pham da chon:</span>{" "}
                {selectedDraftItems.length}
              </div>
              <div>
                <span className="font-semibold text-slate-900">So luong tra:</span>{" "}
                {totalSelectedQuantity}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Tam tinh hoan:</span>{" "}
                {formatCurrency(refundPreview)}
              </div>
            </div>
          </div>
        </div>

        {!draft.singleBranchOnly && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Don hang nay co san pham do nhieu chi nhanh phuc vu. Moi lan gui yeu cau,
            ban chi nen chon san pham thuoc cung mot chi nhanh de chi nhanh do xu ly.
          </div>
        )}

        {form.issueType === "MISSING_ITEM" && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
            Truong hop thieu hang se do chi nhanh phuc vu xu ly hoan tien truc tiep. Khach
            hang khong can gui tra lai hang vat ly, nhung van bat buoc dinh kem hinh anh va
            video mo ta loi don hang.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-[#1965a2]" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">
                  1. Chon san pham can tra
                </h2>
              </div>

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
                      className={`rounded-2xl border p-4 transition-colors ${
                        isSelected
                          ? "border-[#1965a2] bg-[#1965a2]/5"
                          : "border-slate-200 bg-white"
                      } ${disabledByBranch ? "opacity-60" : ""}`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleToggleItem(item, checked === true)
                            }
                            disabled={disabledByBranch}
                            className="mt-1"
                          />

                          <img
                            src={resolveImageUrl(item.image, "/placeholder.png")}
                            alt={item.productName}
                            className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                          />

                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {item.productName}
                            </h3>
                            <div className="text-sm text-slate-500">
                              {item.variantName || item.sku || "San pham thuoc don hang"}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1 text-xs">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                Da mua: {item.orderedQuantity}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                Toi da tra: {item.maxReturnQuantity}
                              </span>
                              {item.branchName && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                  Chi nhanh: {item.branchName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-auto flex w-full flex-col gap-3 md:w-[210px]">
                          <div className="text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(item.unitPrice)}
                          </div>
                          <label className="space-y-1 text-sm text-slate-500">
                            <span>So luong tra</span>
                            <Input
                              type="number"
                              min={1}
                              max={item.maxReturnQuantity}
                              value={selectedItems[itemKey]?.quantity ?? 1}
                              disabled={!isSelected}
                              onChange={(event) =>
                                handleQuantityChange(item, event.target.value)
                              }
                            />
                          </label>
                          {disabledByBranch && (
                            <p className="text-xs text-amber-600">
                              Ban dang chon san pham cua chi nhanh khac. Hay gui yeu cau rieng.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  2. Thong tin khach hang va hoan tien
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ho ten, so dien thoai, thong tin ngan hang va ly do deu bat buoc de chi
                  nhanh xu ly thu cong nhanh hon.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Ho ten nguoi nhan hoan tien</span>
                  <Input
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    placeholder="Nguyen Van A"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">So dien thoai</span>
                  <Input
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                    }
                    placeholder="09xxxxxxxx"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Email</span>
                  <Input
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="email@example.com"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Phuong thuc hoan tien</span>
                  <select
                    value={form.refundMethod}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        refundMethod: event.target.value as CreateReturnRequestPayload["refundMethod"],
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {RETURN_REFUND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Ten chu tai khoan</span>
                  <Input
                    value={form.bankAccountName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        bankAccountName: event.target.value,
                      }))
                    }
                    placeholder="NGUYEN VAN A"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">So tai khoan</span>
                  <Input
                    value={form.bankAccountNumber}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        bankAccountNumber: event.target.value,
                      }))
                    }
                    placeholder="0123456789"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Ten ngan hang</span>
                  <Input
                    value={form.bankName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, bankName: event.target.value }))
                    }
                    placeholder="Vietcombank"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Chi nhanh ngan hang</span>
                  <Input
                    value={form.bankBranch}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, bankBranch: event.target.value }))
                    }
                    placeholder="Chi nhanh TP.HCM"
                  />
                </label>
              </div>

              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                Luu y: thong tin ngan hang van bat buoc ngay ca khi ban chon hoan tien mat,
                de admin va chi nhanh doi soat trong buoi demo va luu vet xu ly.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  3. Ly do va mo ta loi
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mo ta ro tinh trang loi, thieu hang hoac giao sai de chi nhanh phuc vu
                  xac minh nhanh hon.
                </p>
              </div>

              <div className="space-y-4">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Loai su co</span>
                  <select
                    value={form.issueType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        issueType: event.target.value as ReturnIssueType,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {RETURN_ISSUE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Ly do ngan gon</span>
                  <Input
                    value={form.reason}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, reason: event.target.value }))
                    }
                    placeholder="Vi du: Don giao thieu 1 san pham, vo bao bi bi rach..."
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Mo ta chi tiet</span>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Mo ta ro van de, thoi diem nhan hang, tinh trang loi, so luong bi anh huong..."
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  4. Hinh anh va video bang chung
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bat buoc co it nhat 1 hinh anh va 1 video loi. Anh va video giup chi nhanh
                  phuc vu quyet dinh thu cong nhanh va de demo ro hon.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-slate-300 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ImagePlus size={18} className="text-[#1965a2]" />
                    <span className="font-medium text-slate-800">Hinh anh loi</span>
                  </div>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-slate-50 px-4 py-8 text-center hover:bg-slate-100">
                    <Upload size={20} className="mb-2 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Tai anh bang chung
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      JPG, PNG, WEBP. Toi da 10MB moi tep.
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

                  {uploadingType === "IMAGE" && (
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 size={16} className="animate-spin" />
                      Dang tai hinh anh...
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {imageEvidences.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.fileName ?? "evidence-image"}
                          className="h-32 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 p-2">
                          <p className="truncate text-xs text-slate-500">
                            {item.fileName ?? "Hinh anh"}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeEvidence(item)}
                            className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Video size={18} className="text-[#1965a2]" />
                    <span className="font-medium text-slate-800">Video loi</span>
                  </div>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-slate-50 px-4 py-8 text-center hover:bg-slate-100">
                    <Upload size={20} className="mb-2 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Tai video bang chung
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      MP4, MOV, WEBM. Toi da 50MB moi tep.
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

                  {uploadingType === "VIDEO" && (
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 size={16} className="animate-spin" />
                      Dang tai video...
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {videoEvidences.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <video
                          src={item.previewUrl}
                          controls
                          className="h-40 w-full bg-slate-950 object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 p-2">
                          <p className="truncate text-xs text-slate-500">
                            {item.fileName ?? "Video loi"}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeEvidence(item)}
                            className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
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
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Xac nhan truoc khi gui
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Ma don</span>
                  <span className="text-right font-semibold text-slate-900">
                    {draft.orderCode}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Chi nhanh xu ly</span>
                  <span className="text-right font-semibold text-slate-900">
                    {selectedBranchName || "Se xac dinh theo san pham da chon"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Loai su co</span>
                  <span className="text-right font-semibold text-slate-900">
                    {
                      RETURN_ISSUE_OPTIONS.find(
                        (option) => option.value === form.issueType,
                      )?.label
                    }
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Tam tinh hoan</span>
                  <span className="text-right text-lg font-semibold text-rose-600">
                    {formatCurrency(refundPreview)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                Bat buoc:
                <br />
                - Ho ten, so dien thoai, tai khoan, ten ngan hang
                <br />
                - Ma don, ly do, mo ta chi tiet
                <br />
                - It nhat 1 hinh anh va 1 video loi
              </div>

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
                className="mt-5 h-11 w-full bg-[#1965a2] text-white hover:bg-[#145486]"
                disabled={submitting}
              >
                {submitting ? "Dang gui..." : "Gui yeu cau tra hang"}
              </Button>

              <p className="mt-3 text-xs text-slate-500">
                Sau khi gui, yeu cau se hien thi tai trang{" "}
                <Link
                  href="/admin/orders/return"
                  className="font-medium text-[#1965a2] hover:underline"
                >
                  /admin/orders/return
                </Link>{" "}
                de admin va nguoi quan ly chi nhanh xu ly thu cong.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xac nhan gui yeu cau tra hang</AlertDialogTitle>
            <AlertDialogDescription>
              Yeu cau se duoc chuyen den chi nhanh phuc vu cua don hang nay. Hay chac
              rang thong tin khach hang, ngan hang, ly do va bang chung da day du.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex justify-between gap-4">
              <span>Don hang</span>
              <span className="font-semibold text-slate-900">{draft.orderCode}</span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>Chi nhanh</span>
              <span className="text-right font-semibold text-slate-900">
                {selectedBranchName}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>San pham da chon</span>
              <span className="font-semibold text-slate-900">
                {selectedDraftItems.length}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>Tam tinh hoan</span>
              <span className="font-semibold text-rose-600">
                {formatCurrency(refundPreview)}
              </span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              className="bg-[#1965a2] text-white hover:bg-[#145486]"
              disabled={submitting}
            >
              {submitting ? "Dang gui..." : "Dong y gui yeu cau"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
