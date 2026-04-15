import { z } from "zod";

export const ConversionUnitSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Tên đơn vị không được để trống")
    .max(50, "Tên đơn vị quá dài"),
  value: z.coerce
    .number({
      invalid_type_error: "Giá trị quy đổi phải là số",
      required_error: "Vui lòng nhập giá trị quy đổi",
    })
    .min(0.000001, "Giá trị quy đổi phải lớn hơn 0"),
  operator: z.enum(["*", "/"]).default("*"),
  price: z.coerce
    .number({
      invalid_type_error: "Giá bán phải là số",
      required_error: "Vui lòng nhập giá bán",
    })
    .min(0, "Giá bán không được âm"),
  barcode: z.string().max(50, "Mã vạch quá dài").optional(),
});

export type ConversionUnit = z.infer<typeof ConversionUnitSchema>;

export const ProductSchema = z
  .object({
    code: z
      .string()
      .min(1, "Mã hàng không được để trống")
      .max(50, "Mã hàng quá dài")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Mã hàng chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới",
      ),
    name: z
      .string()
      .min(2, "Tên hàng hóa phải có ít nhất 2 ký tự")
      .max(200, "Tên hàng hóa quá dài"),
    type: z.string().default("Hàng hóa"),
    group: z.string().min(1, "Vui lòng chọn nhóm VTHH"),
    unit: z.string().min(1, "Vui lòng chọn đơn vị tính"),
    warranty: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce
        .number({
          invalid_type_error: "Bảo hành phải là số",
        })
        .min(0, "Bảo hành không được âm")
        .optional(),
    ),
    tax: z.preprocess(
      (val) => (val === "" ? 0 : val),
      z.coerce
        .number({
          invalid_type_error: "Thuế phải là số",
        })
        .min(0, "Thuế không được âm")
        .max(100, "Thuế tối đa 100%")
        .default(8),
    ),
    minStock: z.preprocess(
      (val) => (val === "" ? NaN : val),
      z.coerce
        .number({
          invalid_type_error: "Vui lòng nhập số lượng tồn tối thiểu",
          required_error: "Vui lòng nhập tồn tối thiểu",
        })
        .min(0, "Tồn tối thiểu không được âm"),
    ),
    maxStock: z.preprocess(
      (val) => (val === "" ? NaN : val),
      z.coerce
        .number({
          invalid_type_error: "Vui lòng nhập số lượng tồn tối đa",
          required_error: "Vui lòng nhập tồn tối đa",
        })
        .min(0, "Tồn tối đa không được âm"),
    ),
    origin: z
      .string()
      .min(1, "Nguồn gốc không được để trống")
      .max(100, "Nguồn gốc quá dài"),
    description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional(),
    status: z
      .enum(["Đang kinh doanh", "Ngừng kinh doanh"])
      .default("Đang kinh doanh"),
    stock: z.coerce.number().default(0),
    conversionUnits: z.array(ConversionUnitSchema).optional().default([]),
    manageByLot: z.boolean().default(false),
  })
  .refine((data) => data.maxStock >= data.minStock, {
    message: "Tồn tối đa phải lớn hơn hoặc bằng tồn tối thiểu",
    path: ["maxStock"],
  })
  .refine(
    (data) => {
      if (!data.conversionUnits || data.conversionUnits.length === 0)
        return true;
      const names = data.conversionUnits
        .map((u) => u.name.trim().toLowerCase())
        .filter((n) => n !== "");
      return new Set(names).size === names.length;
    },
    {
      message: "Tên các đơn vị chuyển đổi không được trùng nhau",
      path: ["conversionUnits"],
    },
  )
  .refine(
    (data) => {
      if (!data.conversionUnits) return true;
      const mainUnit = data.unit.trim().toLowerCase();
      return !data.conversionUnits.some(
        (u) => u.name.trim().toLowerCase() === mainUnit,
      );
    },
    {
      message: "Tên đơn vị chuyển đổi không được trùng với đơn vị tính chính",
      path: ["conversionUnits"],
    },
  );

export type Product = z.infer<typeof ProductSchema>;

export const ReceiptItemSchema = z.object({
  productCode: z.string().min(1, "Vui lòng chọn hàng hóa"),
  productName: z.string(),
  imageUrl: z.string().optional(),
  plannedQuantity: z.coerce.number().min(0, "Số lượng không được âm"),
  requestedQuantity: z.number().optional(),
  deliveredQuantity: z.number().optional(),
  remainingQuantity: z.number().optional(),
  quantityReal: z.coerce.number().min(0).default(0),
  quantityAccepted: z.coerce.number().min(0).default(0),
  quantityRejected: z.coerce.number().min(0).default(0),
  // Thêm maxQuantity để lưu tồn kho hiện tại, phục vụ validate
  maxQuantity: z.number().optional(),
  lotNumber: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  importPrice: z.preprocess((val) => (val === "" || val === null || val === undefined ? 0 : val), z.coerce.number().min(0, "Giá nhập không được âm")),
  newSellingPrice: z.preprocess((val) => (val === "" || val === null || val === undefined ? 0 : val), z.coerce.number().min(0, "Giá bán mới không được âm").optional().default(0)),
  note: z.string().nullable().optional(),
});

export const ReceiptSchema = z.object({
  receiptType: z.string().default("NHAP_MUA"),
  purchaseRequestId: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : Number(val),
    z.number().int().positive().optional(),
  ),
  purchaseRequestCode: z.string().optional().default(""),
  supplierCode: z.string().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  importType: z.enum(["SUPPLIER", "INTERNAL"]).default("SUPPLIER"),
  sourceBranchId: z.string().nullable().optional(),
  receiptCode: z.string().nullable().optional(),
  warehouseId: z.string().default("HH"),
  branchName: z.string().min(1, "Vui lòng chọn chi nhánh"),
  importStatus: z.enum(["IMPORTED", "PO"]).default("IMPORTED"),
  deliverer: z.string().min(1, "Vui lòng nhập người giao"),
  entryDate: z.string().min(1, "Vui lòng chọn ngày nhập"),
  referenceCode: z.string().optional().default(""),
  description: z.string().optional().default(""),
  status: z.enum(["PENDING", "APPROVED", "COMPLETED", "CANCELLED", "REJECTED"]).default("PENDING"),
  items: z.array(ReceiptItemSchema).min(1, "Cần ít nhất một mặt hàng"),
  paymentAmount: z.coerce
      .number({
        invalid_type_error: "Số tiền thanh toán phải là số",
      })
      .min(0, "Số tiền thanh toán không được nhỏ hơn 0")
      .optional()
      .default(0),
  creator: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
}).superRefine((data, ctx) => {
  const hasPositiveItem = data.items.some((item) => item.plannedQuantity > 0);
  if (!hasPositiveItem) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cần nhập số lượng cho ít nhất một mặt hàng trong đợt nhập này",
      path: ["items"],
    });
  }

  // Validate điều kiện Chọn nguồn
  if (data.importType === "SUPPLIER") {
    if (!data.supplierCode || !data.supplierName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng chọn nhà cung cấp",
        path: ["supplierCode"],
      });
    }
  } else if (data.importType === "INTERNAL") {
    if (!data.sourceBranchId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng chọn kho xuất hàng đi",
        path: ["sourceBranchId"],
      });
    }

    // BẮT LỖI SỐ LƯỢNG VƯỢT QUÁ TỒN KHO XUẤT
    data.items.forEach((item, index) => {
      if (
        item.plannedQuantity > 0 &&
        item.maxQuantity !== undefined &&
        item.plannedQuantity > item.maxQuantity
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Vượt quá tồn kho (Tối đa: ${item.maxQuantity})`,
          path: ["items", index, "plannedQuantity"], // Trỏ đúng vào ô quantity bị lỗi
        });
      }
    });
  }

  if (data.purchaseRequestId) {
    data.items.forEach((item, index) => {
      if (
        item.plannedQuantity > 0 &&
        item.remainingQuantity !== undefined &&
        item.plannedQuantity > item.remainingQuantity
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Vượt quá số lượng còn thiếu của yêu cầu mua (Tối đa: ${item.remainingQuantity})`,
          path: ["items", index, "plannedQuantity"],
        });
      }
    });
  }
});

export type Receipt = z.infer<typeof ReceiptSchema>;

// Warehouse Export Schema (Xuất kho)
export const ExportItemSchema = z.object({
  productCode: z.string().min(1, "Vui lòng chọn hàng hóa"),
  productName: z.string(),
  unit: z.string(),
  quantity: z.coerce.number({ invalid_type_error: "Vui lòng nhập số" })
      .min(0.001, "Số lượng xuất phải lớn hơn 0"),
  lotNumber: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type ExportItem = z.infer<typeof ExportItemSchema>;

export const ExportSchema = z.object({
  exportType: z.enum(["RETURN_SUPPLIER", "DISPOSAL", "OTHER"]).default("OTHER"),
  supplierCode: z.string().optional(), // Dùng khi xuất trả NCC
  exportCode: z.string().optional(),
  branchName: z.string().min(1, "Vui lòng chọn chi nhánh xuất"),
  receiver: z.string().min(1, "Vui lòng nhập người nhận/đối tác"),
  exportDate: z.string().min(1, "Vui lòng chọn ngày xuất"),
  referenceCode: z.string().optional(),
  description: z.string().optional().default(""),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("PENDING"),
  items: z.array(ExportItemSchema).min(1, "Cần ít nhất một mặt hàng"),
  note: z.string().optional(),
});

export type Export = z.infer<typeof ExportSchema>;

// Stock Transfer Schema (Điều chuyển)
export const TransferItemSchema = z.object({
  variantId: z.number().optional(),
  productCode: z.string().min(1, "Vui lòng chọn hàng hóa"),
  productName: z.string().min(1, "Tên hàng không được để trống"),
  unit: z.string().min(1, "ĐVT không được để trống"),
  quantity: z.coerce
    .number({ invalid_type_error: "Số lượng phải là số" })
    .min(0.001, "Số lượng phải lớn hơn 0"),
  availableQuantity: z.number().optional(), // Tồn kho khả dụng
  receivedQuantity: z.coerce.number().min(0).default(0), // Thực nhận (chỉ đọc ở form tạo)
  itemNote: z.string().optional(),
  imageUrl: z.string().optional(),
  // Đơn giá điều chuyển nội bộ (chỉ bắt buộc khi INTERNAL_SALE)
  unitTransferPrice: z.coerce.number().min(0).optional(),
});

export type TransferItem = z.infer<typeof TransferItemSchema>;

export const TransferSchema = z.object({
    transferCode: z.string().optional(),
    // Form lưu branch ID vào các field này (dùng toString() của branch.id)
    sourceBranch: z.string().min(1, "Vui lòng chọn chi nhánh xuất hàng"),
    destBranch: z.string().min(1, "Vui lòng chọn chi nhánh nhận hàng"),
    sourceWarehouse: z.string().optional(),
    destWarehouse: z.string().optional(),
    sourceAddress: z.string().optional(),
    destAddress: z.string().optional(),
    transferDate: z.string().min(1, "Vui lòng chọn ngày điều chuyển"),
    status: z.enum(["DRAFT", "PENDING", "APPROVED", "SHIPPING", "TRANSIT", "COMPLETED", "CANCELLED", "REJECTED"]).default("DRAFT"),
    importStatus: z.string().optional(),
    transferType: z.enum(["BETWEEN_WAREHOUSES", "INTERNAL"]).default("BETWEEN_WAREHOUSES"),
    // Loại nghiệp vụ: STOCK_TRANSFER = thuần kho, INTERNAL_SALE = bán nội bộ có hạch toán
    transferBusinessType: z.enum(["STOCK_TRANSFER", "INTERNAL_SALE"]).default("STOCK_TRANSFER"),
    referenceCode: z.string().optional().default(""),
    description: z.string().min(1, "Vui lòng nhập lý do điều chuyển"),
    dispatchOrder: z.string().optional(),
    vehicle: z.string().optional(),
    note: z.string().optional(),
    // transporter: bắt buộc khi BETWEEN_WAREHOUSES, tuỳ chọn khi INTERNAL
    transporter: z.string().optional(),
    items: z.array(TransferItemSchema).min(1, "Cần ít nhất một mặt hàng"),
  })
  .superRefine((data, ctx) => {
    // Chi nhánh xuất và nhận không được trùng
    if (data.sourceBranch && data.destBranch && data.sourceBranch === data.destBranch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Chi nhánh nhận phải khác chi nhánh xuất",
        path: ["destBranch"],
      });
    }
    // Bắt buộc nhập tài xế khi điều chuyển liên kho
    if (data.transferType === "BETWEEN_WAREHOUSES" && (!data.transporter || data.transporter.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập tên tài xế",
        path: ["transporter"],
      });
    }
    // Validate số lượng chuyển không vượt quá tồn kho khả dụng
    data.items.forEach((item, index) => {
      if (item.availableQuantity !== undefined && item.quantity > item.availableQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Vượt quá tồn kho (Tối đa: ${item.availableQuantity})`,
          path: ["items", index, "quantity"],
        });
      }
      // INTERNAL_SALE: mỗi dòng bắt buộc có đơn giá nội bộ > 0
      if (data.transferBusinessType === "INTERNAL_SALE") {
        if (!item.unitTransferPrice || item.unitTransferPrice <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Vui lòng nhập đơn giá điều chuyển nội bộ (> 0)",
            path: ["items", index, "unitTransferPrice"],
          });
        }
      }
    });
  });

export type Transfer = z.infer<typeof TransferSchema>;

// Warehouse Inventory Audit Schema
export const InventoryMemberSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên thành viên"),
  role: z.string().min(1, "Vui lòng nhập chức vụ/vai trò"),
});

export const InventoryItemSchema = z.object({
  productCode: z.string().min(1, "Vui lòng chọn hàng hóa"),
  productName: z.string(),
  unit: z.string(),
  status: z.string().default("Chưa kiểm kê"),
  bookQty: z.coerce.number().default(0),
  actualQty: z.coerce.number().min(0, "Số lượng thực tế không được âm"),
  diffQty: z.coerce.number().default(0),
  qualityGood: z.coerce.number().min(0).default(0),
  qualityBad: z.coerce.number().min(0).default(0),
});

export const InventorySchema = z.object({
  inventoryCode: z.string().optional(),
  inventoryDate: z.string().min(1, "Vui lòng chọn ngày kiểm kê"),
  cutOffDate: z.string().min(1, "Vui lòng chọn ngày chốt số liệu"),
  branch: z.string().min(1, "Vui lòng chọn chi nhánh"),
  warehouse: z.string().min(1, "Vui lòng chọn kho kiểm kê"),
  warehouseKeeper: z.string().min(1, "Vui lòng nhập tên thủ kho"),
  auditType: z.enum(["PERIODIC", "UNEXPECTED", "YEAR_END"]).default("PERIODIC"),
  description: z.string().min(1, "Vui lòng nhập mục đích/diễn giải").max(1000),
  scope: z.enum(["all", "group"]).default("all"),
  selectedGroups: z.array(z.string()).optional().default([]),
  status: z.string().default("Chưa thực hiện"),
  isBlindAudit: z.boolean().default(false),
  includeZeroStock: z.boolean().default(true),
  items: z.array(InventoryItemSchema).optional().default([]),
  members: z
    .array(InventoryMemberSchema)
    .min(1, "Cần ít nhất một thành viên ban kiểm kê"),
  conclusion: z.string().optional(),
});

export type InventoryMember = z.infer<typeof InventoryMemberSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryAudit = z.infer<typeof InventorySchema>;
