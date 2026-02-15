"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  X,
  ChevronLeft,
  Search,
  Clock,
  AlertCircle,
  Calculator,
  CheckCircle,
  ScanLine,
  FileDown,
  Settings,
  RotateCw,
  FileSpreadsheet,
  Info,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// INITIAL DATA - ActualQty defaults to null
const INITIAL_ITEMS = [
  {
    id: "1",
    code: "TH-001",
    name: "Thức ăn hỗn hợp T604",
    unit: "Bao",
    position: "Z-A R01",
    systemQty: 450,
    actualQty: null as number | null,
    price: 25000,
    approved: false,
  },
  {
    id: "2",
    code: "TH-002",
    name: "Thức ăn tăng trọng S500",
    unit: "Bao",
    position: "Z-A R02",
    systemQty: 120,
    actualQty: null as number | null,
    price: 45000,
    approved: false,
  },
  {
    id: "3",
    code: "HC-005",
    name: "Vi sinh xử lý SuperClean",
    unit: "Gói",
    position: "Z-B R05",
    systemQty: 85,
    actualQty: null as number | null,
    price: 150000,
    approved: false,
  },
  {
    id: "4",
    code: "HC-012",
    name: "Khoáng đa lượng tôm thẻ",
    unit: "Bao",
    position: "Z-B R08",
    systemQty: 200,
    actualQty: null as number | null,
    price: 35000,
    approved: false,
  },
  {
    id: "5",
    code: "DC-001",
    name: "Máy đo pH Hana",
    unit: "Cái",
    position: "Z-C B12",
    systemQty: 15,
    actualQty: null as number | null,
    price: 1200000,
    approved: false,
  },
];

type InventoryStatus =
  | "PENDING"
  | "AUDITING"
  | "WAITING_APPROVAL"
  | "COMPLETED";

export default function ExecuteInventoryAuditPage() {
  const router = useRouter();
  const params = useParams();
  const auditCode = params.code;
  const scannerRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [role, setRole] = useState<"NV" | "TK">("TK");
  const [status, setStatus] = useState<InventoryStatus>("PENDING");
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [scanValue, setScanValue] = useState("");
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const stats = useMemo(() => {
    const totalSku = items.length;
    const checkedSku = items.filter((i) => i.actualQty !== null).length;
    const approvedSku = items.filter((i) => i.approved).length;

    // Progress calculation
    const inputtedProgress = totalSku > 0 ? (checkedSku / totalSku) * 100 : 0;
    const approvedProgress = totalSku > 0 ? (approvedSku / totalSku) * 100 : 0;

    let netDiffValue = 0;
    let totalDiffSku = 0;
    let totalExcess = 0;
    let totalShortage = 0;

    items.forEach((item) => {
      if (item.actualQty !== null) {
        const diff = item.actualQty - item.systemQty;
        if (diff !== 0) {
          totalDiffSku++;
          const val = diff * item.price;
          netDiffValue += val;
          if (diff > 0) totalExcess += val;
          else totalShortage += Math.abs(val);
        }
      }
    });

    const diffPercentage = totalSku > 0 ? (totalDiffSku / totalSku) * 100 : 0;

    return {
      totalSku,
      checkedSku,
      approvedSku,
      inputtedProgress,
      approvedProgress,
      netDiffValue,
      totalDiffSku,
      totalExcess,
      totalShortage,
      diffPercentage,
    };
  }, [items]);

  const handleQtyChange = (id: string, value: string) => {
    // Only allow editing if status is AUDITING or WAITING_APPROVAL (if rejected)
    if (status !== "AUDITING" && status !== "WAITING_APPROVAL") return;

    setItems((prev) =>
      prev.map((item) => {
        // Cannot edit if approved (locked)
        if (item.id === id && !item.approved) {
          // Treat empty string as null (not counted), otherwise number
          const val = value === "" ? null : parseFloat(value);
          return { ...item, actualQty: isNaN(val as number) ? null : val };
        }
        return item;
      }),
    );
  };

  const toggleApprove = (id: string) => {
    if (role !== "TK") return;
    // Allow approval in AUDITING or WAITING_APPROVAL
    if (status !== "AUDITING" && status !== "WAITING_APPROVAL") return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.actualQty === null) {
            toast.warning("Vui lòng nhập số lượng thực tế trước khi duyệt.");
            return item;
          }
          return { ...item, approved: !item.approved };
        }
        return item;
      }),
    );
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "PENDING" || status === "COMPLETED") {
      toast.warning("Phiếu không ở trạng thái có thể quét.");
      return;
    }

    const item = items.find(
      (i) => i.code === scanValue || i.name.includes(scanValue),
    );
    if (item) {
      itemRefs.current[item.id]?.focus();
      itemRefs.current[item.id]?.select();
      toast.success(`Đã tìm thấy: ${item.name}`);
    } else {
      toast.error("Không tìm thấy sản phẩm.");
    }
    setScanValue("");
  };

  const startInventory = () => {
    setStatus("AUDITING");
    toast.info("Đã bắt đầu kiểm kê. Vui lòng nhập số liệu.");
  };

  const resetStock = () => {
    // Dangerous action
    setItems((prev) =>
      prev.map((i) => ({ ...i, actualQty: i.systemQty, approved: false })),
    );
    toast.success("Đã lấy số tồn hệ thống cho tất cả dòng.");
    setShowConfirmReset(false);
  };

  const sendToApproval = () => {
    // Staff action
    if (stats.checkedSku < stats.totalSku) {
      toast.warning(
        `Chưa nhập đủ 100% số lượng (Mới nhập ${stats.checkedSku}/${stats.totalSku}).`,
      );
      return;
    }
    setStatus("WAITING_APPROVAL");
    toast.success("Đã chuyển sang trạng thái CHỜ DUYỆT.");
  };

  const completeInventory = () => {
    // Storekeeper action
    setStatus("COMPLETED");
    toast.success("Đã hoàn tất phiếu kiểm kê.");
    setShowConfirmComplete(false);
  };

  const getStatusLabel = (s: InventoryStatus) => {
    switch (s) {
      case "PENDING":
        return "CHƯA THỰC HIỆN";
      case "AUDITING":
        return "ĐANG KIỂM KÊ";
      case "WAITING_APPROVAL":
        return "CHỜ DUYỆT";
      case "COMPLETED":
        return "HOÀN TẤT";
      default:
        return s;
    }
  };

  const getStatusColor = (s: InventoryStatus) => {
    switch (s) {
      case "PENDING":
        return "bg-gray-500";
      case "AUDITING":
        return "bg-blue-600 animate-pulse";
      case "WAITING_APPROVAL":
        return "bg-orange-500";
      case "COMPLETED":
        return "bg-green-600";
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border border-[#dcdcdc] rounded-[4px] shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 text-slate-400"
            >
              <ChevronLeft size={20} />
            </Button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-800">
                  Phiếu kiểm kê{" "}
                  <span className="text-blue-600">{auditCode}</span>
                </h1>
                <Badge
                  className={cn(
                    "text-[10px] py-0 border-none text-white",
                    getStatusColor(status),
                  )}
                >
                  {getStatusLabel(status)}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-bold uppercase flex gap-3">
                <span>Kho: Tổng HN</span>
                <span className="text-blue-600">Ngày: 12/02/2026</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
              <button
                onClick={() => setRole("NV")}
                className={cn(
                  "px-3 py-1 text-[11px] font-bold rounded transition-all",
                  role === "NV"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500",
                )}
              >
                NHÂN VIÊN
              </button>
              <button
                onClick={() => setRole("TK")}
                className={cn(
                  "px-3 py-1 text-[11px] font-bold rounded transition-all",
                  role === "TK"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500",
                )}
              >
                THỦ KHO
              </button>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Settings
                size={20}
                className="cursor-pointer hover:text-gray-600"
              />
              <X
                size={20}
                className="cursor-pointer hover:text-gray-600"
                onClick={() => router.back()}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9 space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 border border-[#dcdcdc] rounded-[4px] shadow-sm space-y-2">
                <div className="flex justify-between items-end">
                  <Label className="text-[11px] font-bold text-blue-600 uppercase">
                    Tiến độ nhập
                  </Label>
                  <span className="text-[11px] font-bold">
                    {stats.checkedSku}/{stats.totalSku} SKU
                  </span>
                </div>
                <Progress
                  value={stats.inputtedProgress}
                  className="h-1.5 bg-blue-50"
                />
              </div>
              <div className="bg-white p-4 border border-[#dcdcdc] rounded-[4px] shadow-sm space-y-2">
                <div className="flex justify-between items-end">
                  <Label className="text-[11px] font-bold text-purple-600 uppercase">
                    Tiến độ duyệt (TK)
                  </Label>
                  <span className="text-[11px] font-bold">
                    {stats.approvedSku}/{stats.totalSku} SKU
                  </span>
                </div>
                <Progress
                  value={stats.approvedProgress}
                  className="h-1.5 bg-purple-50"
                />
              </div>
              <div className="bg-white p-4 border border-[#dcdcdc] rounded-[4px] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    Chất lượng tồn kho
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-black text-orange-600">
                      {stats.diffPercentage.toFixed(0)}%
                    </p>
                    <span className="text-[10px] text-gray-500 font-bold">
                      ({stats.totalDiffSku} SKU lệch)
                    </span>
                  </div>
                </div>
                <AlertCircle className="text-orange-200" size={32} />
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border border-[#dcdcdc] p-2 flex flex-wrap items-center gap-3 shadow-sm rounded-[4px]">
              <form
                onSubmit={handleScan}
                className="relative w-full md:w-[280px]"
              >
                <ScanLine
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"
                  size={16}
                />
                <Input
                  placeholder="Quét mã vạch (Enter)..."
                  disabled={status === "PENDING" || status === "COMPLETED"}
                  className="pl-9 h-9 text-[12px] border-blue-200 bg-blue-50/10 focus:ring-1 focus:ring-blue-500 font-bold"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                />
              </form>
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <Input
                  placeholder="Tìm tên hàng hóa..."
                  className="pl-9 h-9 text-[12px] border-slate-200"
                />
              </div>
              <div className="flex items-center gap-2 px-2">
                <AlertDialog
                  open={showConfirmReset}
                  onOpenChange={setShowConfirmReset}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={status !== "PENDING"} // Only allow reset in PENDING, per request I.VI logic adjustment
                      className="h-9 text-[11px] font-bold text-slate-600"
                    >
                      <RotateCw size={14} className="mr-2" /> Lấy tồn HT
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận lấy số liệu?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hệ thống sẽ sao chép "Tồn HT" sang cột "Thực tế" cho tất
                        cả các dòng. Dữ liệu nhập trước đó sẽ bị ghi đè. Bạn có
                        chắc chắn không?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={resetStock}>
                        Đồng ý
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-[11px] font-bold"
                >
                  <FileSpreadsheet size={14} className="mr-2 text-green-600" />{" "}
                  Xuất Excel
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-[#ccc] hover:bg-slate-50">
                    <TableHead className="w-[40px] text-center p-2 text-[10px] font-bold uppercase">
                      STT
                    </TableHead>
                    <TableHead className="p-2 text-[10px] font-bold uppercase">
                      Hàng hóa & Vị trí
                    </TableHead>
                    <TableHead className="w-[80px] text-center p-2 text-[10px] font-bold uppercase">
                      ĐVT
                    </TableHead>
                    <TableHead className="w-[90px] text-right p-2 text-[10px] font-bold uppercase text-blue-700">
                      Tồn HT
                    </TableHead>
                    <TableHead className="w-[120px] text-right p-2 text-[10px] font-bold uppercase bg-blue-50/30">
                      Thực tế
                    </TableHead>
                    <TableHead className="w-[90px] text-right p-2 text-[10px] font-bold uppercase">
                      Lệch
                    </TableHead>
                    <TableHead className="w-[80px] text-center p-2 text-[10px] font-bold uppercase">
                      Trạng thái
                    </TableHead>
                    <TableHead className="w-[60px] text-center p-2 text-[10px] font-bold uppercase">
                      Duyệt
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const diff =
                      item.actualQty !== null
                        ? item.actualQty - item.systemQty
                        : 0;
                    const isDiff = item.actualQty !== null && diff !== 0;
                    const isEntered = item.actualQty !== null;

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "border-b border-slate-100 transition-colors",
                          item.approved
                            ? "bg-purple-50/30"
                            : "hover:bg-blue-50/10",
                          isDiff && !item.approved ? "bg-orange-50/20" : "",
                        )}
                      >
                        <TableCell className="text-center text-slate-400 font-bold text-[11px]">
                          {index + 1}
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-700 truncate">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="font-mono text-slate-400">
                                {item.code}
                              </span>
                              <span className="text-blue-500 font-bold">
                                [{item.position}]
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-[12px] text-slate-500">
                          {item.unit}
                        </TableCell>
                        <TableCell className="p-2 text-right font-bold text-slate-900 text-[12px]">
                          {item.systemQty.toLocaleString()}
                        </TableCell>
                        <TableCell className="p-2 bg-blue-50/20">
                          <Input
                            ref={(el) => (itemRefs.current[item.id] = el)}
                            type="number"
                            disabled={
                              (status !== "AUDITING" &&
                                status !== "WAITING_APPROVAL") ||
                              item.approved
                            }
                            className={cn(
                              "h-8 text-right font-black text-[13px] border-slate-200 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-300",
                              item.approved &&
                                "bg-gray-100 border-transparent text-purple-700 cursor-not-allowed",
                            )}
                            value={item.actualQty ?? ""}
                            onChange={(e) =>
                              handleQtyChange(item.id, e.target.value)
                            }
                            placeholder="Chưa kiểm"
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right font-bold text-[12px]">
                          {isEntered ? (
                            <span
                              className={cn(
                                diff < 0
                                  ? "text-rose-600"
                                  : diff > 0
                                    ? "text-emerald-600"
                                    : "text-slate-400",
                              )}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          ) : (
                            <span className="text-slate-200">--</span>
                          )}
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          {item.approved ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[9px] py-0 px-1.5 border-purple-200">
                              ĐÃ DUYỆT
                            </Badge>
                          ) : isEntered ? (
                            <Badge
                              className={cn(
                                "text-[9px] py-0 px-1.5",
                                isDiff
                                  ? "bg-orange-100 text-orange-700 border-orange-200"
                                  : "bg-blue-100 text-blue-700 border-blue-200",
                              )}
                            >
                              {isDiff ? "CÓ LỆCH" : "ĐÃ NHẬP"}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-400 text-[9px] py-0 px-1.5 border-gray-200">
                              CHƯA NHẬP
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={item.approved}
                                    onCheckedChange={() =>
                                      toggleApprove(item.id)
                                    }
                                    disabled={
                                      role !== "TK" ||
                                      (status !== "AUDITING" &&
                                        status !== "WAITING_APPROVAL") ||
                                      !isEntered
                                    }
                                    className={cn(
                                      "h-5 w-5 rounded-full transition-all",
                                      item.approved
                                        ? "bg-purple-600 border-purple-600"
                                        : "border-gray-300",
                                    )}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {role !== "TK"
                                  ? "Chỉ Thủ kho mới được duyệt"
                                  : !isEntered
                                    ? "Chưa nhập thực tế"
                                    : item.approved
                                      ? "Bỏ duyệt để sửa"
                                      : "Duyệt dòng này"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div
              className={cn(
                "p-4 rounded-[4px] shadow-sm space-y-4 border-t-4",
                role === "TK"
                  ? "bg-slate-900 border-purple-500"
                  : "bg-white border-blue-600",
              )}
            >
              <div
                className={cn(
                  "border-b pb-2 flex items-center gap-2",
                  role === "TK" ? "border-white/10" : "border-slate-100",
                )}
              >
                <Calculator
                  size={14}
                  className={
                    role === "TK" ? "text-purple-400" : "text-blue-600"
                  }
                />
                <h3
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    role === "TK" ? "text-purple-400" : "text-blue-600",
                  )}
                >
                  Tổng hợp lệch
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      role === "TK" ? "text-slate-400" : "text-gray-500",
                    )}
                  >
                    Giá trị lệch thuần
                  </p>
                  <p
                    className={cn(
                      "text-xl font-black tracking-tighter",
                      role !== "TK"
                        ? "text-slate-300"
                        : stats.netDiffValue < 0
                          ? "text-rose-400"
                          : "text-emerald-400",
                    )}
                  >
                    {role === "TK"
                      ? `${stats.netDiffValue > 0 ? "+" : ""}${formatNumber(stats.netDiffValue)} ₫`
                      : "---"}
                  </p>
                </div>

                {role === "TK" && (
                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-slate-400">Tổng thừa (+):</span>
                      <span className="font-bold text-emerald-400">
                        +{formatNumber(stats.totalExcess)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-slate-400">Tổng thiếu (-):</span>
                      <span className="font-bold text-rose-400">
                        -{formatNumber(stats.totalShortage)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-slate-400">Tỷ lệ lệch:</span>
                      <span className="font-bold text-orange-400">
                        {stats.diffPercentage.toFixed(1)}% ({stats.totalDiffSku}{" "}
                        SKU)
                      </span>
                    </div>
                  </div>
                )}

                {role !== "TK" && (
                  <div className="bg-blue-50 p-2 rounded border border-blue-100 flex gap-2 items-start">
                    <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 font-medium">
                      Bạn đang ở chế độ Nhân viên. Chỉ Thủ kho mới có thể xem
                      giá trị tiền lệch và thực hiện duyệt.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#dcdcdc] p-4 rounded-[4px] shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Clock size={14} className="text-gray-400" />
                <Label className="text-[11px] font-bold text-slate-700 uppercase">
                  Thông tin bổ sung
                </Label>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">
                  Ghi chú kiểm kê
                </Label>
                <Textarea
                  placeholder="Nhập ghi chú..."
                  className="min-h-[100px] text-[12px] border-slate-200 focus:ring-1 focus:ring-blue-500"
                  readOnly={status === "COMPLETED"}
                />
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2 text-amber-600 text-[11px] font-bold">
                  <AlertTriangle size={14} /> Cảnh báo quan trọng
                </div>
                <p className="text-[10px] text-gray-500 mt-1 italic">
                  Dữ liệu tồn sẽ được cập nhật ngay khi bấm "Hoàn tất". Hãy kiểm
                  tra kỹ các dòng chênh lệch lớn.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-[#ddd] p-3 flex items-center justify-between z-[999] shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  getStatusColor(status),
                )}
              />
              Trạng thái: {getStatusLabel(status)}
            </div>
            {status !== "PENDING" && (
              <div className="hidden md:flex items-center gap-2 border-l pl-4">
                <span className="text-[11px] font-bold text-purple-600 uppercase">
                  Đã duyệt: {stats.approvedSku}/{stats.totalSku}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-9 px-6 text-[12px] font-bold border-[#ccc]"
              onClick={() => router.back()}
            >
              Thoát
            </Button>

            {status === "PENDING" && (
              <Button
                onClick={startInventory}
                className="h-9 px-8 text-[12px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md uppercase"
              >
                Bắt đầu kiểm kê
              </Button>
            )}

            {(status === "AUDITING" || status === "WAITING_APPROVAL") && (
              <>
                <Button
                  variant="outline"
                  className="h-9 px-6 text-[12px] font-bold border-[#ccc]"
                >
                  Lưu nháp
                </Button>

                {role === "NV" && status === "AUDITING" && (
                  <Button
                    onClick={sendToApproval}
                    className="h-9 px-6 text-[12px] font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md uppercase"
                  >
                    Gửi duyệt
                  </Button>
                )}

                {role === "TK" && (
                  <AlertDialog
                    open={showConfirmComplete}
                    onOpenChange={setShowConfirmComplete}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={stats.approvedSku < stats.totalSku}
                        className={cn(
                          "h-9 px-8 text-[12px] font-bold text-white shadow-md uppercase transition-all",
                          stats.approvedSku === stats.totalSku
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 cursor-not-allowed",
                        )}
                      >
                        Hoàn tất & Chốt tồn
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[400px]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                          <AlertTriangle size={20} /> Xác nhận hoàn tất?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                          <div>
                            Hệ thống sẽ cập nhật tồn kho theo số liệu "Thực tế".
                          </div>
                          <div className="bg-slate-50 p-3 rounded border border-slate-100 text-[13px]">
                            <div className="flex justify-between">
                              <span>Số mã lệch:</span>{" "}
                              <b className="text-orange-600">
                                {stats.totalDiffSku} SKU
                              </b>
                            </div>
                            <div className="flex justify-between">
                              <span>Tổng giá trị lệch:</span>{" "}
                              <b
                                className={
                                  stats.netDiffValue < 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {formatNumber(stats.netDiffValue)} ₫
                              </b>
                            </div>
                          </div>
                          <div className="text-[12px] italic text-gray-500">
                            * Hành động này không thể hoàn tác.
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Xem lại</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={completeInventory}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Xác nhận chốt
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}

            {status === "COMPLETED" && (
              <div className="flex items-center gap-2 px-4 py-1 bg-green-50 border border-green-200 rounded text-green-700 font-bold text-[12px]">
                <CheckCircle size={16} /> ĐÃ CHỐT TỒN: 12/02 16:30 - BỞI: ADMIN
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
