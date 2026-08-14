"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDownToLine,
  Ban,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  DollarSign,
  Edit,
  Package,
  Plus,
  Printer,
  Truck,
} from "lucide-react";

import { transferService } from "@/app/services/transfer.service";
import { branchService } from "@/app/services/branchService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/dateUtils";
import { getErrorMessage } from "@/lib/axios";
import { P } from "@/lib/permissions";
import { markAdminOrdersRefreshNeeded } from "@/lib/order-refresh";
import { getTransferStatusLabel } from "@/lib/transfer-status";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

type InspectItem = {
  variantId: number;
  productName: string;
  quantityRequested: number;
  quantityReal: number;
  quantityAccepted: number;
  quantityRejected: number;
  note: string;
};

type AuditLog = {
  time: string;
  user: string;
  action: string;
  detail: string;
};

const DONE_STATUSES = ["COMPLETED"];
const CANCELLABLE_STATUSES = ["PENDING", "SOURCE_CONFIRMED", "APPROVED"];

function fmtPrintQty(value: unknown) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
}

function fmtPrintDateTime(value?: string | null) {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })} ngày ${date.toLocaleDateString("vi-VN")}`;
}

function getTransferBusinessLabel(value?: string) {
  return String(value || "").toUpperCase() === "INTERNAL_SALE"
    ? "Bán nội bộ có hạch toán"
    : "Điều chuyển kho thuần";
}

function TransferPrintView({
  transfer,
  statusLabel,
}: {
  transfer: any;
  statusLabel: string;
}) {
  const items = transfer.items || [];
  const code = transfer.transferCode || transfer.code || `PDC-${transfer.id || ""}`;
  const status = String(transfer.status || "").toUpperCase();
  const hasShipped = Boolean(transfer.shippedAt) || ["SHIPPING", "INSPECTING", "COMPLETED"].includes(status);
  const hasReceived = Boolean(transfer.receivedAt) || status === "COMPLETED";
  const totalRequested =
    Number(transfer.totalQuantity || 0) ||
    items.reduce(
      (sum: number, item: any) => sum + Number(item.quantityRequested || 0),
      0,
    );
  const today = new Date();
  const sourceSigner =
    transfer.sourceConfirmedByName ||
    transfer.shippedByName ||
    transfer.fromBranchName ||
    "------------";
  const receiverSigner =
    transfer.receivedByName || transfer.inspectionStartedByName || "------------";
  const transferPerson = transfer.transporter || "------------";
  const approver = transfer.approvedByName || "------------";

  return (
    <div className="transfer-print">
      <style jsx global>{`
        .transfer-print {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          body * {
            visibility: hidden !important;
          }

          .transfer-print,
          .transfer-print * {
            visibility: visible !important;
          }

          .transfer-print {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            background: #fff;
            color: #000;
            font-family: "Times New Roman", Times, serif;
            font-size: 11px;
            line-height: 1.18;
          }

          .transfer-print-page {
            min-height: 277mm;
            position: relative;
            padding-bottom: 18mm;
          }

          .transfer-print-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20mm;
            text-align: center;
            font-weight: 700;
          }

          .transfer-print-title {
            margin-top: 8mm;
            text-align: center;
            color: #173f73;
            font-weight: 700;
            text-transform: uppercase;
          }

          .transfer-print-title h1 {
            margin: 0;
            font-size: 18px;
            line-height: 1.08;
          }

          .transfer-print-title h2 {
            margin: 0;
            font-size: 13px;
            line-height: 1.1;
          }

          .transfer-print-section-title {
            margin: 4mm 0 1.5mm;
            border-bottom: 1px solid #17476f;
            color: #173f73;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .transfer-print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .transfer-print-table th {
            background: #17476f;
            color: #fff;
            font-weight: 700;
            text-align: center;
          }

          .transfer-print-table th,
          .transfer-print-table td {
            border: 1px solid #9aa9b6;
            padding: 4px 5px;
            vertical-align: middle;
          }

          .transfer-print-meta td {
            color: #183d63;
            font-weight: 600;
          }

          .transfer-print-meta span,
          .transfer-print-note span {
            color: #000;
            font-weight: 400;
          }

          .transfer-print-sku {
            font-family: Arial, sans-serif;
            font-size: 10px;
          }

          .transfer-print-total-row td {
            background: #dbe6f1;
            color: #173f73;
            font-weight: 700;
          }

          .transfer-print-note {
            margin: 2mm 0;
          }

          .transfer-print-dotted {
            border-bottom: 1px dotted #777;
            display: inline-block;
            min-width: 48mm;
            min-height: 12px;
          }

          .transfer-print-signatures {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6mm;
            margin-top: 5mm;
            text-align: center;
            font-weight: 700;
          }

          .transfer-print-signatures em {
            display: block;
            margin-top: 1mm;
            font-size: 10px;
            font-weight: 400;
          }

          .transfer-print-signer {
            margin-top: 17mm;
          }

          .transfer-print-approver {
            margin-top: 5mm;
            text-align: center;
            font-weight: 700;
          }

          .transfer-print-footer {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #9aa9b6;
            padding-top: 2mm;
            color: #4b5563;
            font-size: 9px;
          }
        }
      `}</style>

      <div className="transfer-print-page">
        <div className="transfer-print-header">
          <div>
            <div>HỆ THỐNG AGRISHRIMP</div>
            <div>Số: {code}</div>
          </div>
          <div>
            <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div>Độc lập - Tự do - Hạnh phúc</div>
            <div>_______________</div>
          </div>
        </div>

        <div className="transfer-print-title">
          <h1>PHIẾU ĐIỀU CHUYỂN HÀNG HÓA</h1>
          <h2>NỘI BỘ GIỮA CÁC CHI NHÁNH</h2>
        </div>

        <table className="transfer-print-table transfer-print-meta">
          <tbody>
            <tr>
              <td>
                Mã phiếu điều chuyển: <span>{code}</span>
              </td>
              <td>
                Trạng thái: <span>{statusLabel}</span>
              </td>
            </tr>
            <tr>
              <td>
                Loại nghiệp vụ:{" "}
                <span>{getTransferBusinessLabel(transfer.transferBusinessType)}</span>
              </td>
              <td>
                Thời gian điều chuyển:{" "}
                <span>{fmtPrintDateTime(transfer.transferDate || transfer.deadline)}</span>
              </td>
            </tr>
            <tr>
              <td>
                Chi nhánh xuất hàng: <span>{transfer.fromBranchName || "---"}</span>
              </td>
              <td>
                Chi nhánh nhận hàng: <span>{transfer.toBranchName || "---"}</span>
              </td>
            </tr>
            <tr>
              <td>
                Chứng từ tham chiếu: <span>{transfer.referenceCode || "---"}</span>
              </td>
              <td>
                Người tạo phiếu: <span>{transfer.createdByName || "---"}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="transfer-print-section-title">
          I. MỤC ĐÍCH VÀ THÔNG TIN VẬN CHUYỂN
        </div>
        <div className="transfer-print-note">
          <strong>Lý do điều chuyển:</strong>{" "}
          <span>{transfer.description || "---"}</span>
        </div>
        <table className="transfer-print-table transfer-print-meta">
          <tbody>
            <tr>
              <td>
                Người vận chuyển: <span>{transfer.transporter || ""}</span>
              </td>
              <td>
                Phương tiện / Biển số: <span>{transfer.vehicle || ""}</span>
              </td>
            </tr>
            <tr>
              <td>
                Lệnh điều phối: <span>{transfer.dispatchOrder || ""}</span>
              </td>
              <td>
                Thời gian giao dự kiến:{" "}
                <span>{fmtPrintDateTime(transfer.deadline || transfer.transferDate)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="transfer-print-section-title">
          II. DANH SÁCH VẬT TƯ ĐIỀU CHUYỂN
        </div>
        <table className="transfer-print-table">
          <thead>
            <tr>
              <th style={{ width: "6%" }}>STT</th>
              <th style={{ width: "31%" }}>Sản phẩm / SKU</th>
              <th style={{ width: "8%" }}>ĐVT</th>
              <th style={{ width: "9%" }}>Yêu cầu</th>
              <th style={{ width: "10%" }}>Thực giao</th>
              <th style={{ width: "10%" }}>Thực nhận</th>
              <th style={{ width: "8%" }}>Đạt</th>
              <th style={{ width: "10%" }}>Lỗi/thiếu</th>
              <th style={{ width: "18%" }}>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item: any, index: number) => {
                const requested = Number(item.quantityRequested || 0);
                const received = Number(item.quantityReal || 0);
                const accepted = Number(item.quantityAccepted || 0);
                const rejected = Number(item.quantityRejected || 0);

                return (
                  <tr key={item.variantId || item.sku || index}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td>
                      <div>{item.productName || "---"}</div>
                      <div className="transfer-print-sku">
                        SKU: {item.sku || item.variantSku || "---"}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>{item.unit || "Cái"}</td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>
                      {fmtPrintQty(requested)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {hasShipped ? fmtPrintQty(requested) : "---"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {hasReceived ? fmtPrintQty(received) : "---"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {hasReceived ? fmtPrintQty(accepted) : "---"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {hasReceived ? fmtPrintQty(rejected) : "---"}
                    </td>
                    <td>{item.itemNote || item.note || transfer.referenceCode || ""}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: "center" }}>
                  Không có vật tư điều chuyển
                </td>
              </tr>
            )}
            <tr className="transfer-print-total-row">
              <td colSpan={8} style={{ textAlign: "right" }}>
                TỔNG SỐ LƯỢNG YÊU CẦU ĐIỀU CHUYỂN
              </td>
              <td style={{ textAlign: "right" }}>{fmtPrintQty(totalRequested)}</td>
            </tr>
          </tbody>
        </table>

        <div className="transfer-print-section-title">
          III. KẾT QUẢ GIAO NHẬN VÀ XÁC NHẬN
        </div>
        <table className="transfer-print-table">
          <thead>
            <tr>
              <th>Nội dung đối chiếu</th>
              <th>Bên xuất xác nhận</th>
              <th>Bên nhận xác nhận</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 700 }}>Số lượng / Quy cách</td>
              <td style={{ textAlign: "center" }}>
                {hasShipped ? fmtPrintQty(totalRequested) : "------------"}
              </td>
              <td style={{ textAlign: "center" }}>
                {hasReceived
                  ? fmtPrintQty(
                      items.reduce(
                        (sum: number, item: any) =>
                          sum + Number(item.quantityReal || 0),
                        0,
                      ),
                    )
                  : "------------"}
              </td>
              <td style={{ textAlign: "center" }}>
                {hasReceived ? statusLabel : "------------"}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>Tình trạng hàng hóa</td>
              <td style={{ textAlign: "center" }}>
                {hasShipped ? "Đã bàn giao" : "------------"}
              </td>
              <td style={{ textAlign: "center" }}>
                {hasReceived ? "Đã kiểm nhận" : "------------"}
              </td>
              <td style={{ textAlign: "center" }}>
                {hasReceived ? "Hoàn tất đối chiếu" : "------------"}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="transfer-print-note">
          <strong>Ghi chú giao nhận:</strong>{" "}
          <span className="transfer-print-dotted"></span>
        </div>

        <div style={{ marginTop: "4mm", textAlign: "right", fontStyle: "italic" }}>
          Cần Thơ, ngày ..... tháng ..... năm {today.getFullYear()}
        </div>
        <div className="transfer-print-signatures">
          <div>
            NGƯỜI LẬP PHIẾU
            <em>(Ký, ghi rõ họ tên)</em>
            <div className="transfer-print-signer">
              {transfer.createdByName || ""}
            </div>
          </div>
          <div>
            ĐẠI DIỆN BÊN XUẤT
            <em>(Ký, ghi rõ họ tên)</em>
            <div className="transfer-print-signer">{sourceSigner}</div>
          </div>
          <div>
            NGƯỜI VẬN CHUYỂN
            <em>(Ký, ghi rõ họ tên)</em>
            <div className="transfer-print-signer">{transferPerson}</div>
          </div>
          <div>
            ĐẠI DIỆN BÊN NHẬN
            <em>(Ký, ghi rõ họ tên)</em>
            <div className="transfer-print-signer">{receiverSigner}</div>
          </div>
        </div>

        <div className="transfer-print-approver">
          NGƯỜI PHÊ DUYỆT
          <em style={{ display: "block", fontWeight: 400 }}>(Ký, ghi rõ họ tên)</em>
          <div className="transfer-print-signer">{approver}</div>
        </div>

        <div className="transfer-print-footer">
          <span>Biểu mẫu: Phiếu điều chuyển hàng hóa nội bộ</span>
          <span>Trang 1</span>
        </div>
      </div>
    </div>
  );
}

export default function TransferDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [transfer, setTransfer] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChangeBranchModal, setShowChangeBranchModal] = useState(false);
  const [newBranchId, setNewBranchId] = useState("");
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectItems, setInspectItems] = useState<InspectItem[]>([]);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState("");

  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const warehouseId = useAuthStore((state) => state.warehouseId);

  const canApproveTransfer = hasPermission(P.TRANSFER_APPROVE);
  const canCreateTransfer = hasPermission(P.TRANSFER_CREATE);
  const canUpdateTransfer = hasPermission(P.TRANSFER_UPDATE);
  const canCancelTransfer = hasPermission(P.TRANSFER_CANCEL);
  const currentUserBranchId =
    currentUser?.branch?.id ??
    (currentUser as any)?.branchId ??
    warehouseId ??
    null;
  const transferSourceBranchId =
    transfer?.sourceBranchId ??
    transfer?.fromBranchId ??
    transfer?.sourceBranch?.id ??
    null;

  // Chỉ user thuộc chi nhánh nguồn mới được xác nhận nguồn
  const isSourceBranchUser =
    currentUserBranchId != null &&
    transferSourceBranchId != null &&
    String(currentUserBranchId) === String(transferSourceBranchId);

  useEffect(() => {
    void fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [transferData, branchData] = await Promise.all([
        transferService.getById(id as string),
        branchService.getAll(),
      ]);
      setTransfer(transferData);
      setBranches(branchData || []);
    } catch {
      toast.error("Lỗi tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleApiCall = async (
    action: () => Promise<unknown>,
    successMessage: string,
    afterSuccess?: () => void,
  ) => {
    setIsProcessing(true);
    try {
      await action();
      markAdminOrdersRefreshNeeded();
      toast.success(successMessage);
      afterSuccess?.();
      await fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Đã xảy ra lỗi hệ thống");
    } finally {
      setIsProcessing(false);
    }
  };

  const openInspectModal = () => {
    const items = (transfer?.items || []).map((item: any) => ({
      variantId: item.variantId,
      productName: item.productName,
      quantityRequested: Number(item.quantityRequested || 0),
      quantityReal: Number(item.quantityRequested || 0),
      quantityAccepted: Number(item.quantityRequested || 0),
      quantityRejected: 0,
      note: "",
    }));
    setInspectItems(items);
    setShowInspectModal(true);
  };

  const updateInspectItem = (
    index: number,
    field: "quantityAccepted" | "quantityRejected" | "note",
    value: string,
  ) => {
    setInspectItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };

      if (field === "note") {
        item.note = value;
      } else {
        const numericValue = Math.max(0, Number(value || 0));
        item[field] = numericValue;
        item.quantityReal =
          Number(item.quantityAccepted || 0) +
          Number(item.quantityRejected || 0);
      }

      next[index] = item;
      return next;
    });
  };

  const submitInspect = async () => {
    for (const item of inspectItems) {
      const requested = Number(item.quantityRequested || 0);
      const accepted = Number(item.quantityAccepted || 0);
      const rejected = Number(item.quantityRejected || 0);
      const real = accepted + rejected;

      if (real > requested) {
        toast.error(
          `Sản phẩm ${item.productName} có số lượng kiểm nhận vượt quá số lượng điều chuyển.`,
        );
        return;
      }
      if ((rejected > 0 || real < requested) && !item.note.trim()) {
        toast.error(
          `Vui lòng nhập ghi chú cho sản phẩm ${item.productName} khi có hàng lỗi hoặc thiếu.`,
        );
        return;
      }
    }

    const payload = inspectItems.map((item) => ({
      variantId: item.variantId,
      quantityReal:
        Number(item.quantityAccepted || 0) + Number(item.quantityRejected || 0),
      quantityAccepted: Number(item.quantityAccepted || 0),
      quantityRejected: Number(item.quantityRejected || 0),
      note: item.note.trim(),
    }));

    await handleApiCall(
      () => transferService.receive(id as string, payload),
      "Đã kiểm đếm và nhập kho thành công!",
      () => setShowInspectModal(false),
    );
  };

  const submitSettlement = async () => {
    const amount = Number(settlementAmount || 0);
    if (!amount || amount <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán hợp lệ.");
      return;
    }
    if (amount > outstandingAmount) {
      toast.error("Số tiền thanh toán vượt quá công nợ còn lại.");
      return;
    }

    await handleApiCall(
      () => transferService.settlePayment(id as string, amount),
      "Đã ghi nhận thanh toán nội bộ thành công!",
      () => {
        setShowSettlementModal(false);
        setSettlementAmount("");
      },
    );
  };

  if (loading) {
    return (
      <div className="p-10 text-center italic text-slate-400">
        Đang tải dữ liệu...
      </div>
    );
  }
  if (!transfer) {
    return (
      <div className="p-10 text-center font-bold text-rose-500">
        LỖI: PHIẾU KHÔNG TỒN TẠI
      </div>
    );
  }

  const status = String(transfer.status || "").toUpperCase();
  const isInternalSale =
    String(transfer.transferBusinessType || "").toUpperCase() ===
    "INTERNAL_SALE";
  const sourceConfirmationRequired = Boolean(
    transfer.sourceConfirmationRequired,
  );
  const statusLabel = getTransferStatusLabel(
    status,
    transfer.transferBusinessType,
    sourceConfirmationRequired,
  );

  const canSourceConfirm =
    sourceConfirmationRequired &&
    status === "PENDING" &&
    canCreateTransfer &&
    isSourceBranchUser;
  const canEdit =
    canUpdateTransfer && ["PENDING", "SOURCE_CONFIRMED"].includes(status);
  const canApprove =
    canApproveTransfer &&
    ((!sourceConfirmationRequired && status === "PENDING") ||
      (sourceConfirmationRequired && status === "SOURCE_CONFIRMED"));
  const canShip = canApproveTransfer && status === "APPROVED";
  const canStartInspection = canCreateTransfer && status === "SHIPPING";
  const canReceive = canCreateTransfer && status === "INSPECTING";
  const canCancel = canCancelTransfer && CANCELLABLE_STATUSES.includes(status);
  const canChangeDestination =
    canUpdateTransfer &&
    ["PENDING", "SOURCE_CONFIRMED"].includes(status);
  const outstandingAmount = Number(transfer.outstandingAmount || 0);
  const paidAmount = Number(transfer.paidAmount || 0);
  const canSettlePayment =
    isInternalSale &&
    status === "COMPLETED" &&
    canUpdateTransfer &&
    outstandingAmount > 0;

  const steps = [
    {
      label: "Khởi tạo",
      status: "completed",
      icon: Plus,
    },
    {
      label: isInternalSale ? "Chờ xác nhận nguồn" : "Chờ duyệt",
      status:
        status === "PENDING" || status === "SOURCE_CONFIRMED"
          ? "active"
          : DONE_STATUSES.includes(status) ||
              ["APPROVED", "SHIPPING", "INSPECTING"].includes(status)
            ? "completed"
            : "upcoming",
      icon: AlertCircle,
    },
    {
      label: "Đã duyệt",
      status:
        status === "APPROVED"
          ? "active"
          : DONE_STATUSES.includes(status) ||
              ["SHIPPING", "INSPECTING"].includes(status)
            ? "completed"
            : "upcoming",
      icon: CheckCircle2,
    },
    {
      label: "Đang vận chuyển",
      status: ["SHIPPING", "INSPECTING"].includes(status)
        ? "active"
        : DONE_STATUSES.includes(status)
          ? "completed"
          : "upcoming",
      icon: Truck,
    },
    {
      label: status === "CANCELLED" ? "Đã hủy" : "Hoàn tất",
      status:
        status === "COMPLETED" || status === "CANCELLED"
          ? "active"
          : "upcoming",
      icon: status === "CANCELLED" ? Ban : ArrowDownToLine,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      time: transfer.createdAt,
      user: transfer.createdByName || "Hệ thống",
      action: "Khởi tạo phiếu",
      detail: transfer.createdByBranchName
        ? `Chi nhánh tạo phiếu: ${transfer.createdByBranchName}.`
        : "Phiếu điều chuyển đã được khởi tạo và chờ xử lý.",
    },
    transfer.sourceConfirmedAt
      ? {
          time: transfer.sourceConfirmedAt,
          user:
            transfer.sourceConfirmedByName ||
            transfer.fromBranchName ||
            "Chi nhánh nguồn",
          action: "Chi nhánh nguồn đồng ý điều chuyển",
          detail: `Đã xác nhận xuất từ ${transfer.fromBranchName || "chi nhánh nguồn"} sang ${transfer.toBranchName || "chi nhánh nhận"}.`,
        }
      : null,
    transfer.approvedAt
      ? {
          time: transfer.approvedAt,
          user: transfer.approvedByName || "Người duyệt",
          action: "Duyệt phiếu",
          detail: "Phiếu đã đủ thông tin và được phép điều chuyển.",
        }
      : null,
    transfer.shippedAt
      ? {
          time: transfer.shippedAt,
          user:
            transfer.shippedByName ||
            transfer.fromBranchName ||
            "Chi nhánh xuất",
          action: "Xuất kho vận chuyển",
          detail: "Hàng đã rời kho nguồn và chuyển sang trạng thái vận chuyển.",
        }
      : null,
    transfer.inspectionStartedAt
      ? {
          time: transfer.inspectionStartedAt,
          user:
            transfer.inspectionStartedByName ||
            transfer.toBranchName ||
            "Chi nhánh nhận",
          action: "Bắt đầu kiểm hàng",
          detail: "Chi nhánh nhận bắt đầu kiểm đếm và đối soát hàng thực nhận.",
        }
      : null,
    transfer.receivedAt
      ? {
          time: transfer.receivedAt,
          user:
            transfer.receivedByName ||
            transfer.toBranchName ||
            "Chi nhánh nhận",
          action: "Hoàn tất kiểm nhận",
          detail: "Đã nhập hàng đạt và chuyển hàng lỗi hoặc thiếu sang kho rủi ro.",
        }
      : null,
    transfer.settledAt
      ? {
          time: transfer.settledAt,
          user: transfer.settledByName || "Kế toán nội bộ",
          action: "Ghi nhận thanh toán",
          detail: `Đã ghi nhận thanh toán ${paidAmount.toLocaleString("vi-VN")}đ cho phiếu điều chuyển nội bộ.`,
        }
      : null,
  ]
    .filter((log): log is AuditLog => Boolean(log))
    .sort(
      (a: any, b: any) =>
        new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const selectTriggerClass =
    "h-[38px] text-[13px] font-normal text-slate-800 data-[placeholder]:text-slate-400";
  const readOnlyInputClass = cn(
    fieldControlClass,
    "border-slate-200 bg-slate-50 text-slate-600",
  );
  const sectionCardClass = "border border-slate-200 bg-white p-6 shadow-sm";
  const sectionTitleClass = "text-[11px] font-bold text-slate-800";
  const formatAuditLogTime = (value?: string) => {
    if (!value) return "---";
    const formatted = formatDate(value, "dd/MM/yyyy HH:mm:ss");
    return formatted === "N/A" ? value : formatted;
  };
  const getAuditLogActionLabel = (log: AuditLog) => {
    if (log.time === transfer.createdAt) return "Tạo phiếu";
    if (log.time === transfer.sourceConfirmedAt) return "Xác nhận nguồn";
    if (log.time === transfer.approvedAt) return "Duyệt phiếu";
    if (log.time === transfer.shippedAt) return "Xuất hàng";
    if (log.time === transfer.inspectionStartedAt) return "Bắt đầu kiểm hàng";
    if (log.time === transfer.receivedAt) return "Nhập hàng";
    if (log.time === transfer.settledAt) return "Ghi nhận thanh toán";
    return log.action;
  };
  const getAuditLogBranch = (log: AuditLog) => {
    if (log.time === transfer.createdAt) {
      return transfer.createdByBranchName || transfer.fromBranchName || "---";
    }
    if (log.time === transfer.sourceConfirmedAt || log.time === transfer.shippedAt) {
      return transfer.fromBranchName || "---";
    }
    if (
      log.time === transfer.inspectionStartedAt ||
      log.time === transfer.receivedAt ||
      log.time === transfer.settledAt
    ) {
      return transfer.toBranchName || transfer.fromBranchName || "---";
    }
    if (log.time === transfer.approvedAt) {
      return (
        transfer.createdByBranchName ||
        transfer.fromBranchName ||
        transfer.toBranchName ||
        "---"
      );
    }
    return "---";
  };
  const formatDateTimeLocal = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  };
  const findBranchIdByName = (name?: string) =>
    branches.find((branch) => branch.name === name)?.id;
  const sourceBranchValue = String(
    transfer.sourceBranchId ||
      transfer.fromBranchId ||
      findBranchIdByName(transfer.fromBranchName) ||
      "",
  );
  const destinationBranchValue = String(
    transfer.destinationBranchId ||
      transfer.toBranchId ||
      transfer.destBranchId ||
      findBranchIdByName(transfer.toBranchName) ||
      "",
  );

  return (
    <div className="space-y-3 pb-[100px] text-slate-800">
      <TransferPrintView transfer={transfer} statusLabel={statusLabel} />

      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 rounded-[4px] text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeft size={18} />
          </Button>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Chi tiết phiếu điều chuyển hàng hóa
          </h1>
        </div>
      </div>

      <div className="border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          {steps.map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className="relative z-10 flex min-w-0 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] transition-colors",
                    step.status === "completed"
                      ? "border-blue-200 bg-blue-50 text-blue-600"
                      : step.status === "active"
                        ? status === "CANCELLED"
                          ? "border-rose-200 bg-rose-50 text-rose-600"
                          : "border-sky-200 bg-sky-50 text-sky-600"
                        : "border-slate-200 bg-slate-50 text-slate-300",
                  )}
                >
                  <step.icon size={15} />
                </div>
                <span
                  className={cn(
                    "text-center text-[10px] font-medium",
                    step.status === "active"
                      ? status === "CANCELLED"
                        ? "text-rose-600"
                        : "text-sky-600"
                      : "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="relative -mt-5 h-px flex-1 bg-slate-200">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-500",
                      steps[idx].status === "completed"
                        ? "w-full bg-blue-300"
                        : "w-0 bg-transparent",
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-1">
        <div className={sectionCardClass}>
          <div className="border-b border-slate-200 pb-3">
            <span className={sectionTitleClass}>
              1. Thông tin lệnh điều chuyển hàng hóa
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Loại nghiệp vụ điều chuyển *
                </Label>
                <Select value={transfer.transferBusinessType || "STOCK_TRANSFER"} disabled>
                  <SelectTrigger className={cn(selectTriggerClass, "border-slate-200 bg-slate-50")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK_TRANSFER">
                      Điều chuyển kho thuần
                    </SelectItem>
                    <SelectItem value="INTERNAL_SALE">
                      Bán nội bộ (có hạch toán)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Chi nhánh xuất hàng *</Label>
                <Select value={sourceBranchValue || undefined} disabled>
                  <SelectTrigger className={cn(selectTriggerClass, "border-slate-200 bg-slate-50")}>
                    <SelectValue placeholder={transfer.fromBranchName || "---"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Chi nhánh nhận hàng *</Label>
                <div className="flex gap-2">
                  <Select value={destinationBranchValue || undefined} disabled>
                    <SelectTrigger className={cn(selectTriggerClass, "border-slate-200 bg-slate-50")}>
                      <SelectValue placeholder={transfer.toBranchName || "---"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canChangeDestination && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowChangeBranchModal(true)}
                      className="h-[38px] shrink-0 rounded-[4px] border-slate-200 px-3 text-[12px] text-slate-500"
                      title="Thay đổi chi nhánh nhận"
                    >
                      <Edit size={13} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Lý do điều chuyển / Diễn giải *
                </Label>
                <Input
                  value={transfer.description || ""}
                  readOnly
                  className={readOnlyInputClass}
                  placeholder="Nhập lý do điều chuyển..."
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Mã phiếu hệ thống</Label>
                <Input
                  value={transfer.transferCode || transfer.code || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Ngày điều chuyển (24H) *</Label>
                <Input
                  type="datetime-local"
                  value={formatDateTimeLocal(transfer.transferDate || transfer.deadline || transfer.createdAt)}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>


              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Tham chiếu chứng từ *</Label>
                <Input
                  value={transfer.referenceCode || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Người vận chuyển</Label>
                <Input
                  value={transfer.transporter || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Phương tiện</Label>
                <Input
                  value={transfer.vehicle || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Lệnh điều phối</Label>
                <Input
                  value={transfer.dispatchOrder || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Trạng thái phiếu</Label>
                <Input
                  value={statusLabel}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={sectionCardClass}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className={sectionTitleClass}>2. Nhật ký xử lý</span>
          </div>
          <div className="mt-4 space-y-1.5">
            {auditLogs.map((log, idx) => (
              <p
                key={`${log.action}-${idx}`}
                className="border-b border-slate-100 py-2 text-[12px] text-slate-700 last:border-b-0"
              >
                {formatAuditLogTime(log.time)} - {log.user} - {getAuditLogActionLabel(log)} -{" "}
                {getAuditLogBranch(log)}
              </p>
            ))}
          </div>
        </div>

        <div className={sectionCardClass}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className={sectionTitleClass}>3. Danh sách vật tư điều chuyển</span>
            <span className="text-[11px] font-semibold text-slate-500">
              Tổng số lượng: {transfer.totalQuantity || 0}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                  <th className="w-[52px] px-3 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    STT
                  </th>
                  <th className="px-3 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    Sản phẩm / SKU
                  </th>
                  <th className="w-[96px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Yêu cầu
                  </th>
                  <th className="w-[96px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Thực nhận
                  </th>
                  <th className="w-[96px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Đạt
                  </th>
                  <th className="w-[96px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Lỗi/thiếu
                  </th>
                  {isInternalSale && (
                    <th className="w-[130px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                      Đơn giá
                    </th>
                  )}
                  <th className="w-[180px] px-3 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody>
                {(transfer.items || []).length > 0 ? (
                  (transfer.items || []).map((item: any, index: number) => (
                    <tr
                      key={item.variantId || item.sku || index}
                      className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                    >
                      <td className="px-3 py-3 text-[11px] font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[11px] font-semibold text-slate-800">
                          {item.productName}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          {item.sku || item.variantSku || "---"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Input
                          value={item.quantityRequested || 0}
                          readOnly
                          className="ml-auto h-8 w-20 rounded-[4px] border-slate-200 bg-slate-50 text-right text-[12px] shadow-none"
                        />
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] font-semibold text-blue-600">
                        {item.quantityReal || 0}
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] font-semibold text-blue-600">
                        {item.quantityAccepted || 0}
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] font-semibold text-rose-600">
                        {item.quantityRejected || 0}
                      </td>
                      {isInternalSale && (
                        <td className="px-3 py-3 text-right text-[11px] font-semibold text-slate-600">
                          {Number(item.unitTransferPrice || 0).toLocaleString("vi-VN")}đ
                        </td>
                      )}
                      <td className="px-3 py-3 text-[11px] text-slate-500">
                        {item.itemNote || item.note || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isInternalSale ? 8 : 7}
                      className="h-[160px] text-center text-[12px] font-medium text-slate-400"
                    >
                      Không có vật tư điều chuyển.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isInternalSale && (
          <div className={sectionCardClass}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className={sectionTitleClass}>4. Thanh toán nội bộ</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold text-slate-400">Tổng giá trị hàng đạt</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">
                  {Number(transfer.transferAmount || 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold text-slate-400">Đã thanh toán</p>
                <p className="mt-2 text-[16px] font-semibold text-emerald-700">
                  {paidAmount.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold text-slate-400">Còn phải thanh toán</p>
                <p className="mt-2 text-[16px] font-semibold text-amber-700">
                  {outstandingAmount.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Biên lợi nhuận tối thiểu áp dụng:{" "}
              <span className="font-semibold text-slate-700">
                Nhap tay theo thoa thuan
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            <Printer size={15} className="mr-2" />
            In phiếu
          </Button>
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/transfers/new?editId=${id}`)}
              className="h-10 min-w-[130px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              <Edit size={15} className="mr-2" />
              Sửa phiếu
            </Button>
          )}
          {canSourceConfirm && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.sourceConfirm(id as string),
                  "Đã xác nhận chi nhánh nguồn sẵn sàng điều chuyển.",
                )
              }
              disabled={isProcessing}
              className="h-10 min-w-[150px] rounded-md bg-amber-600 px-6 text-[13px] font-semibold text-white hover:bg-amber-700"
            >
              Xác nhận nguồn
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.approve(id as string),
                  "Đã duyệt phiếu điều chuyển.",
                )
              }
              disabled={isProcessing}
              className="h-10 min-w-[130px] rounded-md bg-blue-600 px-6 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              Duyệt phiếu
            </Button>
          )}
          {canShip && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.ship(id as string),
                  "Đã xuất kho và chuyển sang trạng thái vận chuyển.",
                )
              }
              disabled={isProcessing}
              className="h-10 min-w-[130px] rounded-md bg-indigo-600 px-6 text-[13px] font-semibold text-white hover:bg-indigo-700"
            >
              Xuất kho
            </Button>
          )}
          {canStartInspection && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.startInspection(id as string),
                  "Đã bắt đầu kiểm hàng.",
                )
              }
              disabled={isProcessing}
              className="h-10 min-w-[160px] rounded-md bg-amber-500 px-6 text-[13px] font-semibold text-white hover:bg-amber-600"
            >
              Bắt đầu kiểm hàng
            </Button>
          )}
          {canReceive && (
            <>
              <Button
                onClick={() =>
                  void handleApiCall(
                    () =>
                      transferService.receive(
                        id as string,
                        (transfer.items || []).map((item: any) => ({
                          variantId: item.variantId,
                          quantityReal: Number(item.quantityRequested || 0),
                          quantityAccepted: Number(item.quantityRequested || 0),
                          quantityRejected: 0,
                          note: "",
                        })),
                      ),
                    "Đã hoàn tất kiểm hàng và nhập kho nhận.",
                  )
                }
                disabled={isProcessing}
                className="h-10 min-w-[120px] rounded-md bg-blue-600 px-6 text-[13px] font-semibold text-white hover:bg-blue-700"
              >
                <CheckSquare size={15} className="mr-2" />
                Nhận đủ
              </Button>
              <Button
                onClick={openInspectModal}
                disabled={isProcessing}
                className="h-10 min-w-[160px] rounded-md bg-orange-500 px-6 text-[13px] font-semibold text-white hover:bg-orange-600"
              >
                <Package size={15} className="mr-2" />
                Kiểm đếm chi tiết
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.cancel(id as string),
                  "Đã hủy phiếu thành công!",
                )
              }
              disabled={isProcessing}
              variant="outline"
              className="h-10 min-w-[120px] rounded-md border-rose-200 px-6 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"
            >
              <Ban size={15} className="mr-2" />
              Hủy phiếu
            </Button>
          )}
          {canSettlePayment && (
            <Button
              type="button"
              onClick={() => setShowSettlementModal(true)}
              disabled={isProcessing}
              className="h-10 min-w-[170px] rounded-md bg-emerald-600 px-6 text-[13px] font-semibold text-white hover:bg-emerald-700"
            >
              <DollarSign size={15} className="mr-2" />
              Ghi nhận thanh toán
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Đóng
          </Button>
        </div>
      </div>

      {showChangeBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-none bg-white p-6 shadow-2xl">
            <h3 className="border-b pb-2 text-[14px] font-black uppercase">
              Thay đổi chi nhánh nhận
            </h3>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500">
                Chọn chi nhánh mới:
              </Label>
              <Select
                value={newBranchId || undefined}
                onValueChange={setNewBranchId}
              >
                <SelectTrigger className="rounded-none border-slate-300 font-bold">
                  <SelectValue placeholder="Chọn chi nhánh..." />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {branches.map((branch) => (
                    <SelectItem
                      key={branch.id}
                      value={String(branch.id)}
                      disabled={branch.name === transfer.fromBranchName}
                    >
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowChangeBranchModal(false)}
                className="rounded-none text-[11px] font-bold"
              >
                HỦY
              </Button>
              <Button
                onClick={() =>
                  void handleApiCall(
                    () =>
                      transferService.changeDestination(
                        id as string,
                        newBranchId,
                      ),
                    "Đã đổi chi nhánh nhận thành công!",
                    () => setShowChangeBranchModal(false),
                  )
                }
                disabled={isProcessing || !newBranchId}
                className="rounded-none bg-blue-600 text-[11px] font-black text-white hover:bg-blue-700"
              >
                XÁC NHẬN ĐỔI
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-none bg-white p-6 shadow-2xl">
            <h3 className="border-b pb-2 text-[14px] font-black uppercase">
              Ghi nhận thanh toán nội bộ
            </h3>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500">
                Số tiền thanh toán:
              </Label>
              <Input
                type="number"
                min={0}
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                placeholder={`Tối đa ${outstandingAmount.toLocaleString("vi-VN")}đ`}
                className="rounded-none border-slate-300"
              />
              <p className="text-[11px] text-slate-400">
                Còn phải thanh toán: {outstandingAmount.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSettlementModal(false)}
                className="rounded-none text-[11px] font-bold"
              >
                HỦY
              </Button>
              <Button
                onClick={() => void submitSettlement()}
                disabled={isProcessing}
                className="rounded-none bg-emerald-600 text-[11px] font-black text-white hover:bg-emerald-700"
              >
                XÁC NHẬN THANH TOÁN
              </Button>
            </div>
          </div>
        </div>
      )}

      {showInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-none bg-white p-6 shadow-2xl">
            <h3 className="mb-4 flex items-center gap-2 border-b pb-3 text-[15px] font-black uppercase">
              <Package size={18} className="text-amber-600" />
              Phiếu kiểm đếm và nhận hàng
            </h3>
            <div className="mb-4 rounded-none border border-blue-100 bg-blue-50 p-3 text-[12px] text-blue-800">
              Kho nhận phải nhập riêng số lượng đạt và số lượng lỗi/thiếu. Hệ
              thống sẽ tự tính tổng thực nhận cho từng dòng.
            </div>
            <div className="flex-1 overflow-y-auto border border-slate-200">
              <table className="w-full text-left text-[12px]">
                <thead className="sticky top-0 border-b bg-slate-50">
                  <tr className="text-[10px] uppercase text-slate-500">
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3 text-center">Yêu cầu</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-700">
                      Đạt
                    </th>
                    <th className="p-3 text-center bg-rose-50 text-rose-700">
                      Lỗi/thiếu
                    </th>
                    <th className="p-3 text-center bg-blue-50 text-blue-700">
                      Thực nhận
                    </th>
                    <th className="p-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectItems.map((item, idx) => (
                    <tr
                      key={item.variantId}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-3 font-bold text-slate-700">
                        {item.productName}
                      </td>
                      <td className="p-3 text-center font-black">
                        {item.quantityRequested}
                      </td>
                      <td className="bg-blue-50/30 p-3">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantityAccepted}
                          onChange={(e) =>
                            updateInspectItem(
                              idx,
                              "quantityAccepted",
                              e.target.value,
                            )
                          }
                          className="mx-auto h-8 w-24 rounded-none border-blue-300 text-center font-black text-blue-600"
                        />
                      </td>
                      <td className="bg-rose-50/30 p-3">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantityRejected}
                          onChange={(e) =>
                            updateInspectItem(
                              idx,
                              "quantityRejected",
                              e.target.value,
                            )
                          }
                          className="mx-auto h-8 w-24 rounded-none border-rose-300 text-center font-black text-rose-600"
                        />
                      </td>
                      <td className="bg-blue-50/30 p-3 text-center font-black text-blue-600">
                        {item.quantityReal}
                      </td>
                      <td className="p-3">
                        <Input
                          value={item.note}
                          onChange={(e) =>
                            updateInspectItem(idx, "note", e.target.value)
                          }
                          placeholder="Lý do thiếu hoặc hư hỏng..."
                          className="h-8 rounded-none border-slate-200 text-[11px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto flex justify-end gap-3 pt-5">
              <Button
                variant="outline"
                onClick={() => setShowInspectModal(false)}
                className="rounded-none text-[12px] font-bold"
              >
                HỦY BỎ
              </Button>
              <Button
                onClick={() => void submitInspect()}
                disabled={isProcessing}
                className="rounded-none bg-blue-600 text-[12px] font-black text-white hover:bg-blue-700"
              >
                <CheckSquare size={16} className="mr-2" />
                LƯU KIỂM ĐẾM VÀ NHẬP KHO
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
