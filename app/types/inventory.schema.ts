import { z } from "zod";

export const ConversionUnitSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, "Tên đơn vị không được để trống")
    .max(50, "Tên đơn vị quá dài"),
  value: z.coerce.number({ 
    invalid_type_error: "Giá trị quy đổi phải là số",
    required_error: "Vui lòng nhập giá trị quy đổi"
  }).min(0.000001, "Giá trị quy đổi phải lớn hơn 0"),
  operator: z.enum(["*", "/"]).default("*"),
  price: z.coerce.number({ 
    invalid_type_error: "Giá bán phải là số",
    required_error: "Vui lòng nhập giá bán"
  }).min(0, "Giá bán không được âm"),
  barcode: z.string().max(50, "Mã vạch quá dài").optional(),
});

export type ConversionUnit = z.infer<typeof ConversionUnitSchema>;

export const ProductSchema = z.object({
  code: z.string()
    .min(1, "Mã hàng không được để trống")
    .max(50, "Mã hàng quá dài")
    .regex(/^[a-zA-Z0-9_-]+$/, "Mã hàng chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới"),
  name: z.string()
    .min(2, "Tên hàng hóa phải có ít nhất 2 ký tự")
    .max(200, "Tên hàng hóa quá dài"),
  type: z.string().default("Hàng hóa"),
  group: z.string().min(1, "Vui lòng chọn nhóm VTHH"),
  unit: z.string().min(1, "Vui lòng chọn đơn vị tính"),
  warranty: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ 
    invalid_type_error: "Bảo hành phải là số" 
  }).min(0, "Bảo hành không được âm").optional()),
  tax: z.preprocess((val) => (val === "" ? 0 : val), z.coerce.number({ 
    invalid_type_error: "Thuế phải là số" 
  }).min(0, "Thuế không được âm").max(100, "Thuế tối đa 100%").default(8)),
  minStock: z.preprocess((val) => (val === "" ? NaN : val), z.coerce.number({ 
    invalid_type_error: "Vui lòng nhập số lượng tồn tối thiểu",
    required_error: "Vui lòng nhập tồn tối thiểu"
  }).min(0, "Tồn tối thiểu không được âm")),
  maxStock: z.preprocess((val) => (val === "" ? NaN : val), z.coerce.number({ 
    invalid_type_error: "Vui lòng nhập số lượng tồn tối đa",
    required_error: "Vui lòng nhập tồn tối đa"
  }).min(0, "Tồn tối đa không được âm")),
  origin: z.string().min(1, "Nguồn gốc không được để trống").max(100, "Nguồn gốc quá dài"),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional(),
  status: z.enum(["Đang kinh doanh", "Ngừng kinh doanh"]).default("Đang kinh doanh"),
  stock: z.coerce.number().default(0),
  conversionUnits: z.array(ConversionUnitSchema).optional().default([]),
  manageByLot: z.boolean().default(false),
}).refine((data) => data.maxStock >= data.minStock, {
  message: "Tồn tối đa phải lớn hơn hoặc bằng tồn tối thiểu",
  path: ["maxStock"],
}).refine((data) => {
  if (!data.conversionUnits || data.conversionUnits.length === 0) return true;
  const names = data.conversionUnits.map(u => u.name.trim().toLowerCase()).filter(n => n !== "");
  return new Set(names).size === names.length;
}, {
  message: "Tên các đơn vị chuyển đổi không được trùng nhau",
  path: ["conversionUnits"],
}).refine((data) => {
  if (!data.conversionUnits) return true;
  const mainUnit = data.unit.trim().toLowerCase();
  return !data.conversionUnits.some(u => u.name.trim().toLowerCase() === mainUnit);
}, {
  message: "Tên đơn vị chuyển đổi không được trùng với đơn vị tính chính",
  path: ["conversionUnits"],
});

export type Product = z.infer<typeof ProductSchema>;



// Warehouse Receipt Schema



export const ReceiptItemSchema = z.object({



  productCode: z.string().min(1, "Vui lòng chọn hàng hóa"),



  productName: z.string(),



  unit: z.string(),



  plannedQuantity: z.coerce.number().min(0.001, "Số lượng kế hoạch phải lớn hơn 0"),



  actualQuantity: z.coerce.number().min(0).optional().default(0),



  damagedQuantity: z.coerce.number().min(0).optional().default(0),



  lotNumber: z.string().optional(),



});







export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;







export const ReceiptSchema = z.object({



  receiptType: z.string().min(1, "Vui lòng chọn loại phiếu"),



  supplierCode: z.string().min(1, "Vui lòng chọn nhà cung cấp"),



  supplierName: z.string().min(1, "Tên nhà cung cấp không được để trống"),



  receiptCode: z.string().optional(),



  warehouseId: z.string().min(1, "Vui lòng chọn kho nhập"),



  branchName: z.string().min(1, "Vui lòng chọn chi nhánh"),



  deliverer: z.string().min(1, "Vui lòng nhập người giao"),



  entryDate: z.string().min(1, "Vui lòng chọn ngày nhập"),



  referenceCode: z.string().min(1, "Vui lòng nhập tham chiếu"),



  description: z.string().min(1, "Vui lòng nhập diễn giải"),



  status: z.enum(["PENDING", "VERIFYING", "COMPLETED", "CANCELLED"]).default("PENDING"),



  items: z.array(ReceiptItemSchema).min(1, "Cần ít nhất một mặt hàng"),



  note: z.string().optional(),



});







export type Receipt = z.infer<typeof ReceiptSchema>;

// Warehouse Export Schema
export const ExportItemSchema = z.object({
  productCode: z.string().min(1, "Vui lòng chọn hàng hóa"),
  productName: z.string(),
  unit: z.string(),
  quantity: z.coerce.number().min(0.001, "Số lượng phải lớn hơn 0"),
  lotNumber: z.string().optional(),
});

export type ExportItem = z.infer<typeof ExportItemSchema>;

export const ExportSchema = z.object({
  exportType: z.string().min(1, "Vui lòng chọn loại phiếu"),
  customerId: z.string().min(1, "Vui lòng chọn khách hàng"),
  customerName: z.string().min(1, "Tên khách hàng không được để trống"),
  exportCode: z.string().optional(), // Auto-generated
  warehouseId: z.string().min(1, "Vui lòng chọn kho xuất"),
  branchName: z.string().min(1, "Vui lòng chọn chi nhánh"),
  receiver: z.string().min(1, "Vui lòng nhập người nhận"),
  deliveryAddress: z.string().min(1, "Vui lòng nhập địa chỉ giao hàng"),
  exportDate: z.string().min(1, "Vui lòng chọn ngày xuất"),
  referenceCode: z.string().optional(),
  description: z.string().min(1, "Vui lòng nhập diễn giải"),
  items: z.array(ExportItemSchema).min(1, "Cần ít nhất một mặt hàng"),
  note: z.string().optional(),
});

export type Export = z.infer<typeof ExportSchema>;

// Stock Transfer Schema
export const TransferItemSchema = z.object({
  productCode: z.string().min(1, "Vui lòng chọn hàng hóa"),
  productName: z.string().min(1, "Tên hàng không được để trống"),
  unit: z.string().min(1, "ĐVT không được để trống"),
  quantity: z.coerce.number({ invalid_type_error: "Số lượng phải là số" }).min(0.001, "Số lượng phải lớn hơn 0"),
  receivedQuantity: z.coerce.number({ invalid_type_error: "Số lượng phải là số" }).min(0, "Số lượng nhận không được âm").optional().default(0),
});

export type TransferItem = z.infer<typeof TransferItemSchema>;

export const TransferSchema = z.object({
  transferType: z.enum(["BETWEEN_WAREHOUSES", "INTERNAL"]).default("INTERNAL"),
  description: z.string().min(1, "Vui lòng nhập lý do điều chuyển").max(500, "Lý do quá dài"),
  transporter: z.string().min(1, "Vui lòng nhập người vận chuyển").max(100, "Tên người vận chuyển quá dài"),
  transferCode: z.string().optional(),
  sourceBranch: z.string().min(1, "Vui lòng chọn chi nhánh xuất"),
  sourceWarehouse: z.string().min(1, "Vui lòng chọn kho xuất"),
  sourceAddress: z.string().min(1, "Vui lòng nhập địa chỉ kho xuất"),
  transferDate: z.string().min(1, "Vui lòng chọn ngày điều chuyển"),
  destBranch: z.string().min(1, "Vui lòng chọn chi nhánh nhận"),
  destWarehouse: z.string().min(1, "Vui lòng chọn kho nhập"),
  destAddress: z.string().min(1, "Vui lòng nhập địa chỉ kho nhập"),
  status: z.string().default("Chờ xử lý"),
  referenceCode: z.string().min(1, "Vui lòng nhập tham chiếu").max(50, "Mã tham chiếu quá dài"),
  items: z.array(TransferItemSchema).min(1, "Cần ít nhất một mặt hàng"),
  note: z.string().optional(),
}).refine((data) => {
  // Nếu là điều chuyển giữa các kho trong cùng chi nhánh hoặc khác chi nhánh
  // thì kho xuất và kho nhập phải khác nhau
  return data.sourceWarehouse !== data.destWarehouse;
}, {
  message: "Kho nhập phải khác kho xuất",
  path: ["destWarehouse"],
}).refine((data) => {
  if (data.transferType === "INTERNAL") {
    return data.sourceBranch === data.destBranch;
  }
  return true;
}, {
  message: "Điều chuyển nội bộ phải cùng một chi nhánh",
  path: ["destBranch"],
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
  members: z.array(InventoryMemberSchema).min(1, "Cần ít nhất một thành viên ban kiểm kê"),
  conclusion: z.string().optional(),
});

export type InventoryMember = z.infer<typeof InventoryMemberSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryAudit = z.infer<typeof InventorySchema>;
