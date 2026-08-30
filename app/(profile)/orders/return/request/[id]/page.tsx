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
import { cn, formatCurrency } from "@/lib/utils";

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
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
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

        const [draftResponse, requests] = await Promise.all([
          returnService.getReturnDraft(id),
          returnService.getMyReturnRequests(),
        ]);

        if (!active) {
          return;
        }

        const existingRequest = requests.find(
          (request) => String(request.orderId) === String(id),
        );

        if (existingRequest) {
          toast.info(
            `Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng ${existingRequest.orderCode} Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³ phiĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿u ${existingRequest.code}.`,
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
            "KhÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£i thÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng tin trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng. Vui lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â²ng thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­ lĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡i sau.",
          ),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [id, router]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    setForm((current) => ({
      ...current,
      fullName:
        current.fullName ||
        draft.customerName ||
        user?.fullName ||
        user?.displayName ||
        "",
      phoneNumber:
        current.phoneNumber ||
        draft.customerPhone ||
        user?.phoneNumber ||
        "",
      email: current.email || user?.email || "",
      bankAccountName:
        current.bankAccountName ||
        user?.fullName ||
        user?.displayName ||
        draft.customerName ||
        "",
    }));
  }, [draft, user]);

  useEffect(() => {
    if (form.issueType !== "MISSING_ITEM") {
      return;
    }

    setForm((current) =>
      current.handlingOption === "REFUND_ONLY"
        ? current
        : { ...current, handlingOption: "REFUND_ONLY" },
    );
  }, [form.issueType]);

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
    if (!draft) {
      return [];
    }

    return draft.items
      .filter((item) => selectedItems[getDraftItemKey(item)])
      .map((item) => ({
        ...item,
        selectedQuantity: selectedItems[getDraftItemKey(item)].quantity,
      }));
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

  const branchConflict = selectedBranchIds.length > 1;
  const handlingOptionLocked = form.issueType === "MISSING_ITEM";
  const refundPreview = selectedDraftItems.reduce(
    (total, item) => total + item.unitPrice * item.selectedQuantity,
    0,
  );
  const totalSelectedQuantity = selectedDraftItems.reduce(
    (total, item) => total + item.selectedQuantity,
    0,
  );
  const buildRequiredFieldErrors = (values = form): FieldErrors => {
    const nextErrors: FieldErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ tên người nhận hoàn tiền.";
    }
    if (!values.phoneNumber.trim()) {
      nextErrors.phoneNumber = "Vui lòng nhập số điện thoại liên hệ.";
    }
    if (!values.bankAccountName.trim()) {
      nextErrors.bankAccountName = "Vui lòng nhập tên chủ tài khoản.";
    }
    if (!values.bankAccountNumber.trim()) {
      nextErrors.bankAccountNumber = "Vui lòng nhập số tài khoản.";
    }
    if (!values.bankName.trim()) {
      nextErrors.bankName = "Vui lòng nhập tên ngân hàng.";
    }
    if (!values.reason.trim()) {
      nextErrors.reason = "Vui lòng nhập lý do trả hàng.";
    }
    if (!values.description.trim()) {
      nextErrors.description = "Vui lòng mô tả chi tiết lỗi của đơn hàng.";
    }

    return nextErrors;
  };

  useEffect(() => {
    if (!REQUIRED_FIELD_KEYS.some((field) => touchedFields[field])) {
      return;
    }

    const nextErrors = buildRequiredFieldErrors(form);

    setFieldErrors((current) => {
      const updated = { ...current };

      for (const field of REQUIRED_FIELD_KEYS) {
        if (!touchedFields[field]) {
          continue;
        }

        if (nextErrors[field]) {
          updated[field] = nextErrors[field];
        } else {
          delete updated[field];
        }
      }

      return updated;
    });
  }, [form, touchedFields]);

  const handleRequiredFieldBlur = (field: RequiredFieldKey) => {
    setTouchedFields((current) =>
      current[field] ? current : { ...current, [field]: true },
    );
  };

  const showAllRequiredFieldErrors = () => {
    const nextErrors = buildRequiredFieldErrors(form);

    setTouchedFields((current) => {
      const nextTouchedFields = { ...current };

      for (const field of REQUIRED_FIELD_KEYS) {
        nextTouchedFields[field] = true;
      }

      return nextTouchedFields;
    });
    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length > 0;
  };

  const getFieldInputClass = (field: RequiredFieldKey) =>
    cn(
      flatFieldClass,
      fieldErrors[field] && "border-rose-500 focus-visible:ring-rose-500",
    );

  const renderFieldError = (field: RequiredFieldKey) => (
    <p
      className={cn(
        fieldErrorClass,
        fieldErrors[field] ? "text-rose-500" : "text-transparent",
      )}
    >
      {fieldErrors[field] ?? "\u00A0"}
    </p>
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
        toast.error(
          "CÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡c sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân hiĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¡n chĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°a thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i chung trong mĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¢t yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u. Vui lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â²ng tÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡ch thÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â nh yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u riÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªng.",
        );
        return;
      }

      setSelectedItems((current) => ({
        ...current,
        [itemKey]: {
          quantity: Math.min(
            current[itemKey]?.quantity ?? 1,
            item.maxReturnQuantity,
          ),
        },
      }));
      return;
    }

    setSelectedItems((current) => {
      const next = { ...current };
      delete next[itemKey];
      return next;
    });
  };

  const handleQuantityChange = (item: ReturnDraftItem, value: string) => {
    const nextQuantity = Math.max(
      1,
      Math.min(item.maxReturnQuantity, normalizeNumberInput(value)),
    );

    setSelectedItems((current) => ({
      ...current,
      [getDraftItemKey(item)]: {
        quantity: nextQuantity,
      },
    }));
  };

  const uploadEvidenceFiles = async (
    fileList: FileList | null,
    mediaType: ReturnEvidenceType,
  ) => {
    if (!fileList?.length) {
      return;
    }

    const files = Array.from(fileList);
    const maxSize =
      mediaType === "IMAGE" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(
          mediaType === "IMAGE"
            ? "Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¢nh vĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£t quÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡ giĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Âºi hĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡n 10MB."
            : "Video vĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£t quÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡ giĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Âºi hĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡n 50MB.",
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
        setImageEvidences((current) => [...current, ...uploaded]);
      } else {
        setVideoEvidences((current) => [...current, ...uploaded]);
      }

      toast.success(
        mediaType === "IMAGE"
          ? "Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£i lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªn hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¬nh Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi."
          : "Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£i lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªn video lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi.",
      );
    } catch (err: any) {
      toast.error(
        extractErrorMessage(err, "KhÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£i lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªn tĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¡p Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­nh kÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¨m lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âºc nÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â y."),
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
      setImageEvidences((current) =>
        current.filter((evidence) => evidence.id !== item.id),
      );
      return;
    }

    setVideoEvidences((current) =>
      current.filter((evidence) => evidence.id !== item.id),
    );
  };

  const validateBeforeSubmit = () => {
    if (!draft) {
      return "KhÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³ dĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â¯ liĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¡u Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡o yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u.";
    }
    if (!selectedDraftItems.length) {
      return "Vui lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â²ng chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­t nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¥t mĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¢t sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§n trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng.";
    }
    if (branchConflict || selectedBranchIds.length !== 1) {
      return "CÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡c sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân hiĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¡n chĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°a thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i chung trong mĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¢t yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u. Vui lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â²ng tÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡ch thÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â nh yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u riÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªng.";
    }
    if (imageEvidences.length === 0) {
      return "CĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§n cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³ Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­t nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¥t 1 hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¬nh Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi.";
    }
    if (videoEvidences.length === 0) {
      return "CĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§n cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³ Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­t nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¥t 1 video lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi.";
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
        bankAccountName: form.bankAccountName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        bankName: form.bankName.trim(),
        bankBranch: form.bankBranch.trim() || null,
        issueType: form.issueType,
        handlingOption: form.handlingOption,
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
        `Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng ${createdRequest.code}. ChÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âºng tÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´i sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â½ cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â­p nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â­t kĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿t quĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ xĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­ lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½ sĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Âºm nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¥t.`,
      );
      setConfirmOpen(false);
      router.replace("/orders/list?status=RETURNED");
    } catch (err: any) {
      toast.error(
        extractErrorMessage(err, "KhÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âºc nÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â y."),
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
                KhÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡o yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {error ??
                  "Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng nÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â y chĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°a sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Âµn sÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng cho luĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă…â€œng trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â§ cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng."}
              </p>
            </div>
            <Link
              href="/orders/list?status=COMPLETED"
              className="inline-flex h-10 items-center bg-[#1965a2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#145486]"
            >
              Quay lĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡i Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ giao
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
                Quay lĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡i Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ giao
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-[#12385b]">
                  TĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡o yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng{" "}
                  <span className="font-semibold text-[#12385b]">
                    {draft.orderCode}
                  </span>{" "}
                  sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â½ Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£c tiĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿p nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â­n vÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â  xĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­ lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½ theo yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u bĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡n gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i.
                </p>
              </div>
            </div>

            <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-[#12385b]">
                  SĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‹Å“ sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân:
                </span>{" "}
                {selectedDraftItems.length}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-[#12385b]">
                  SĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‹Å“ lĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£ng trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£:
                </span>{" "}
                {totalSelectedQuantity}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-[#12385b]">
                  TĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡m tÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­nh hoÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â n:
                </span>{" "}
                {formatCurrency(refundPreview)}
              </p>
            </div>
          </div>
        </section>

        {draft.message ? (
          <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
            {draft.message}
          </div>
        ) : null}

        {!draft.singleBranchOnly ? (
          <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
            Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng nÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â y cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³ nhiĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Âu sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§n tÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡ch thÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â nh cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡c yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u riÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªng. Vui
            lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â²ng chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡c sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m tĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡ng thÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­ch Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i trong cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¹ng mĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¢t yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u.
          </div>
        ) : null}

        {form.issueType === "MISSING_ITEM" ? (
          <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
            TrĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Âng hĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£p thiĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿u hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â½ Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£c xĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­ lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½ theo phĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡ng Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡n hoÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â n tiĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân trĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â±c tiĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿p.
            BĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡n khÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§n gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i lĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡i hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng vĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â­t lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½ nhĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°ng vĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â«n bĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¯t buĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¢c cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¬nh Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh vÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â 
            video mÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi cĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â§a Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng.
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="border border-[#d8e6f5] bg-white px-5 py-5">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#1965a2]" />
                <h2 className="text-lg font-semibold text-[#12385b]">
                  1. ChĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§n trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£
                </h2>
              </div>

              <div className="space-y-3">
                {draft.items.map((item) => {
                  const itemKey = getDraftItemKey(item);
                  const isSelected = Boolean(selectedItems[itemKey]);
                  const activeBranchId = selectedDraftItems[0]?.branchId;
                  const disabledByBranch =
                    !isSelected &&
                    activeBranchId !== null &&
                    activeBranchId !== undefined &&
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
                                {item.variantName || item.sku || "SĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m thuĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¢c Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                              <span className="border border-[#d8e6f5] bg-[#fbfdff] px-2 py-1">
                                Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ mua: {item.orderedQuantity}
                              </span>
                              <span className="border border-[#d8e6f5] bg-[#fbfdff] px-2 py-1">
                                TĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‹Å“i Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“a trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£: {item.maxReturnQuantity}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-auto flex w-full flex-col gap-3 lg:w-[220px]">
                          <div className="text-right text-sm font-semibold text-[#12385b]">
                            {formatCurrency(item.unitPrice)}
                          </div>

                          <label className="space-y-2 text-sm text-slate-600">
                            <span>SĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‹Å“ lĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£ng trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£</span>
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
                              SĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m nÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â y hiĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¡n chĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°a thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i chung trong yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u nÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â y.
                              Vui lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â²ng tÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡ch thÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â nh yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u riÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªng nĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿u cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§n xĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­ lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½ thÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªm.
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
                  2. ThÄ‚Â´ng tin hoÄ‚Â n tiĂ¡Â»Ân
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  CĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t thÄ‚Â´ng tin liÄ‚Âªn hĂ¡Â»â€¡ vÄ‚Â  tÄ‚Â i khoĂ¡ÂºÂ£n nhĂ¡ÂºÂ­n hoÄ‚Â n tiĂ¡Â»Ân Ă„â€˜Ă¡Â»Æ’ chÄ‚Âºng tÄ‚Â´i Ă„â€˜Ă¡Â»â€˜i soÄ‚Â¡t yÄ‚Âªu cĂ¡ÂºÂ§u nhanh hĂ†Â¡n.
                </p>
              </div>

              <div className="mb-4 space-y-3 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-[#12385b]">
                    LĂ¡Â»Â±a chĂ¡Â»Ân phĂ†Â°Ă†Â¡ng Ä‚Â¡n xĂ¡Â»Â­ lÄ‚Â½
                  </span>
                  <p className="text-xs text-slate-500">
                    ChĂ¡Â»Ân cÄ‚Â¡ch yÄ‚Âªu cĂ¡ÂºÂ§u hoÄ‚Â n tiĂ¡Â»Ân cĂ¡Â»Â§a Ă„â€˜Ă†Â¡n nÄ‚Â y sĂ¡ÂºÂ½ Ă„â€˜Ă†Â°Ă¡Â»Â£c xĂ¡Â»Â­ lÄ‚Â½.
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
                              Ă„ÂĂ†Â¡n thiĂ¡ÂºÂ¿u hÄ‚Â ng chĂ¡Â»â€° hĂ¡Â»â€” trĂ¡Â»Â£ phĂ†Â°Ă†Â¡ng Ä‚Â¡n chĂ¡Â»â€° hoÄ‚Â n tiĂ¡Â»Ân.
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
                    HĂ¡Â»Â tÄ‚Âªn ngĂ†Â°Ă¡Â»Âi nhĂ¡ÂºÂ­n hoÄ‚Â n tiĂ¡Â»Ân
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
                    placeholder="NguyĂ¡Â»â€¦n VĂ„Æ’n A"
                    className={getFieldInputClass("fullName")}
                  />
                  {renderFieldError("fullName")}
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    SĂ¡Â»â€˜ Ă„â€˜iĂ¡Â»â€¡n thoĂ¡ÂºÂ¡i
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
                    PhĂ†Â°Ă†Â¡ng thĂ¡Â»Â©c hoÄ‚Â n tiĂ¡Â»Ân
                  </span>
                  <Input
                    value="ChuyĂ¡Â»Æ’n khoĂ¡ÂºÂ£n"
                    readOnly
                    className={flatFieldClass}
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    TÄ‚Âªn chĂ¡Â»Â§ tÄ‚Â i khoĂ¡ÂºÂ£n
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
                    SĂ¡Â»â€˜ tÄ‚Â i khoĂ¡ÂºÂ£n
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
                    TÄ‚Âªn ngÄ‚Â¢n hÄ‚Â ng
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
                    Chi nhÄ‚Â¡nh ngÄ‚Â¢n hÄ‚Â ng
                  </span>
                  <Input
                    value={form.bankBranch}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bankBranch: event.target.value,
                      }))
                    }
                    placeholder="Chi nhÄ‚Â¡nh CĂ¡ÂºÂ§n ThĂ†Â¡"
                    className={flatFieldClass}
                  />
                </label>
              </div>
            </section>

            <section className="border border-[#d8e6f5] bg-white px-5 py-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#12385b]">
                  3. LÄ‚Â½ do vÄ‚Â  mÄ‚Â´ tĂ¡ÂºÂ£ lĂ¡Â»â€”i
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  MÄ‚Â´ tĂ¡ÂºÂ£ rÄ‚Âµ tÄ‚Â¬nh trĂ¡ÂºÂ¡ng lĂ¡Â»â€”i, thiĂ¡ÂºÂ¿u hÄ‚Â ng hoĂ¡ÂºÂ·c giao sai Ă„â€˜Ă¡Â»Æ’ yÄ‚Âªu cĂ¡ÂºÂ§u Ă„â€˜Ă†Â°Ă¡Â»Â£c xÄ‚Â¡c minh nhanh hĂ†Â¡n.
                </p>
              </div>

              <div className="space-y-4">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    LoĂ¡ÂºÂ¡i sĂ¡Â»Â± cĂ¡Â»â€˜
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
                    LÄ‚Â½ do ngĂ¡ÂºÂ¯n gĂ¡Â»Ân
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
                    placeholder="VÄ‚Â­ dĂ¡Â»Â¥: Giao sai sĂ¡ÂºÂ£n phĂ¡ÂºÂ©m, thiĂ¡ÂºÂ¿u 1 mÄ‚Â³n, bao bÄ‚Â¬ rÄ‚Â¡ch..."
                    className={getFieldInputClass("reason")}
                  />
                  {renderFieldError("reason")}
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-[#12385b]">
                    MÄ‚Â´ tĂ¡ÂºÂ£ chi tiĂ¡ÂºÂ¿t
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
                    placeholder="MÄ‚Â´ tĂ¡ÂºÂ£ thĂ¡Â»Âi Ă„â€˜iĂ¡Â»Æ’m nhĂ¡ÂºÂ­n hÄ‚Â ng, lĂ¡Â»â€”i gĂ¡ÂºÂ·p phĂ¡ÂºÂ£i, sĂ¡Â»â€˜ lĂ†Â°Ă¡Â»Â£ng bĂ¡Â»â€¹ Ă¡ÂºÂ£nh hĂ†Â°Ă¡Â»Å¸ng vÄ‚Â  thÄ‚Â´ng tin cĂ¡ÂºÂ§n kiĂ¡Â»Æ’m tra thÄ‚Âªm."
                    className={getFieldInputClass("description")}
                  />
                  {renderFieldError("description")}
                </label>
              </div>
            </section>

            <section className="border border-[#d8e6f5] bg-white px-5 py-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#12385b]">
                  4. HÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¬nh Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh vÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â  video bĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â±ng chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â©ng
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  BĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¯t buĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¢c cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³ Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­t nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¥t 1 hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¬nh Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh vÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â  1 video lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£c
                  xÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡c minh nhanh hĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="border border-dashed border-[#cfe0f2] px-4 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ImagePlus size={18} className="text-[#1965a2]" />
                    <span className="font-medium text-[#12385b]">
                      HÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¬nh Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi
                    </span>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center bg-[#f8fbff] px-4 py-8 text-center transition-colors hover:bg-[#eef6ff]">
                    <Upload size={20} className="mb-2 text-[#1965a2]" />
                    <span className="text-sm font-medium text-[#12385b]">
                      TĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£i Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh bĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â±ng chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â©ng
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      JPG, PNG, WEBP. TĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‹Å“i Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“a 10MB mĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi tĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¡p.
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
                      Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚Âang tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£i hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¬nh Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh...
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
                            {item.fileName ?? "HÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¬nh Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£nh"}
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
                    <span className="font-medium text-[#12385b]">Video lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi</span>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center bg-[#f8fbff] px-4 py-8 text-center transition-colors hover:bg-[#eef6ff]">
                    <Upload size={20} className="mb-2 text-[#1965a2]" />
                    <span className="text-sm font-medium text-[#12385b]">
                      TĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£i video bĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â±ng chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â©ng
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      MP4, MOV, WEBM. TĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‹Å“i Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“a 50MB mĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi tĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¡p.
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
                      Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚Âang tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£i video...
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
                            {item.fileName ?? "Video lĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă¢â‚¬Âi"}
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
                  5. XÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡c nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â­n gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">MÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n</span>
                  <span className="text-right font-semibold text-[#12385b]">
                    {draft.orderCode}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">LoĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡i sĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â± cĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‹Å“</span>
                  <span className="text-right font-semibold text-[#12385b]">
                    {
                      RETURN_ISSUE_OPTIONS.find(
                        (option) => option.value === form.issueType,
                      )?.label
                    }
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">PhĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡ng Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡n xĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­ lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½</span>
                  <span className="text-right font-semibold text-[#12385b]">
                    {getReturnHandlingLabel(form.handlingOption)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">TĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡m tÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­nh hoÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â n</span>
                  <span className="text-right text-lg font-semibold text-[#1965a2]">
                    {formatCurrency(refundPreview)}
                  </span>
                </div>
              </div>

              <div className="mt-4 border border-[#d8e6f5] bg-[#f8fbff] px-4 py-3 text-xs leading-6 text-slate-600">
                Báº¯t buá»™c:
                <br />
                - Há» tĂªn, sá»‘ Ä‘iá»‡n thoáº¡i, lĂ½ do vĂ  mĂ´ táº£ chi tiáº¿t
                <br />
                - TĂªn chá»§ tĂ i khoáº£n, sá»‘ tĂ i khoáº£n vĂ  tĂªn ngĂ¢n hĂ ng
                <br />
                - Ăt nháº¥t 1 hĂ¬nh áº£nh vĂ  1 video lá»—i
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
                {submitting ? "Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚Âang gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i..." : "GĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng"}
              </Button>

              <p className="mt-3 text-xs text-slate-500">
                Sau khi gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i, phiĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿u sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â½ hiĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢n thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¹ ngay trong tab{" "}
                <span className="font-medium text-[#1965a2]">TrĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng</span> Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢
                bĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡n theo dÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âµi tiĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿n Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¢ xĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­ lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>XÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡c nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â­n gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u trĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng</AlertDialogTitle>
            <AlertDialogDescription>
              YÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u sĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â½ Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â£c tiĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿p nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â­n Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€ Ă¢â‚¬â„¢ xĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­ lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½. HÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£y chĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¯c rĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â±ng thÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng tin liÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªn hĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‚Â¡,
              phĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â°Ă„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡ng thĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â©c hoÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â n tiĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân, lÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½ do vÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â  bĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â±ng chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â©ng Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§y Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ă„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â§.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="border border-[#d8e6f5] bg-[#f8fbff] px-4 py-4 text-sm text-slate-600">
            <div className="flex justify-between gap-4">
              <span>Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂĂ„â€Ă¢â‚¬Â Ä‚â€Ă‚Â¡n hÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â ng</span>
              <span className="font-semibold text-[#12385b]">
                {draft.orderCode}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>SĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£n phĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â©m Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â£ chĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Ân</span>
              <span className="font-semibold text-[#12385b]">
                {selectedDraftItems.length}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>TĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¡m tÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â­nh hoÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â n</span>
              <span className="font-semibold text-[#1965a2]">
                {formatCurrency(refundPreview)}
              </span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting} className="rounded-none">
              HĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â§y
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              className="rounded-none bg-[#1965a2] text-white hover:bg-[#145486]"
              disabled={submitting}
            >
              {submitting ? "Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚Âang gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i..." : "Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă…â€œng Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â½ gĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â­i yÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Âªu cĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â§u"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
