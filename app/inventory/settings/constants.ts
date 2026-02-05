import { 
  Settings2, 
  Store, 
  Database, 
  GitFork, 
  Tag, 
  CreditCard, 
  Receipt, 
  Printer, 
  Truck, 
  Share2, 
  FileEdit, 
  Calculator, 
  Users,
  LucideIcon
} from "lucide-react";

export interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  category: "system" | "business" | "operation";
}

export const SETTINGS_MENU: SettingItem[] = [
  {
    id: "general",
    title: "Cấu hình chung",
    description: "Cài đặt các tham số hệ thống và tùy chọn mặc định.",
    icon: Settings2,
    href: "/inventory/settings/general",
    category: "system",
  },
  {
    id: "store-info",
    title: "Thông tin cửa hàng",
    description: "Địa chỉ, số điện thoại, logo và thông tin pháp lý.",
    icon: Store,
    href: "/inventory/settings/store-info",
    category: "business",
  },
  {
    id: "sources",
    title: "Nguồn",
    description: "Quản lý nguồn nhập hàng và kênh cung ứng.",
    icon: Database,
    href: "/inventory/settings/sources",
    category: "operation",
  },
  {
    id: "branches",
    title: "Quản lý chi nhánh",
    description: "Thiết lập danh sách và thông tin liên hệ các chi nhánh.",
    icon: GitFork,
    href: "/inventory/settings/branches",
    category: "business",
  },
  {
    id: "pricing",
    title: "Chính sách giá",
    description: "Cấu hình bảng giá, chiết khấu và quy tắc làm tròn.",
    icon: Tag,
    href: "/inventory/settings/pricing",
    category: "operation",
  },
  {
    id: "payments",
    title: "Thanh toán",
    description: "Phương thức thanh toán và kết nối cổng thanh toán.",
    icon: CreditCard,
    href: "/inventory/settings/payments",
    category: "system",
  },
  {
    id: "tax",
    title: "Thuế",
    description: "Cấu hình các loại thuế VAT, thuế nhập khẩu.",
    icon: Receipt,
    href: "/inventory/settings/tax",
    category: "system",
  },
  {
    id: "print-templates",
    title: "Mẫu in",
    description: "Tùy chỉnh hóa đơn, phiếu nhập/xuất và tem nhãn.",
    icon: Printer,
    href: "/inventory/settings/print-templates",
    category: "operation",
  },
  {
    id: "shipping",
    title: "Giao hàng",
    description: "Kết nối đơn vị vận chuyển và bảng phí giao hàng.",
    icon: Truck,
    href: "/inventory/settings/shipping",
    category: "operation",
  },
  {
    id: "sales-channels",
    title: "Kênh bán hàng",
    description: "Đồng bộ tồn kho lên Website, Shopee, Lazada.",
    icon: Share2,
    href: "/inventory/settings/sales-channels",
    category: "business",
  },
  {
    id: "order-processing",
    title: "Xử lý đơn hàng",
    description: "Quy trình xác nhận, đóng gói và trả hàng.",
    icon: FileEdit,
    href: "/inventory/settings/order-processing",
    category: "operation",
  },
  {
    id: "cogs-adjustment",
    title: "Điều chỉnh giá vốn",
    description: "Phương pháp tính giá vốn (FIFO, bình quân gia quyền).",
    icon: Calculator,
    href: "/inventory/settings/cogs-adjustment",
    category: "system",
  },
  {
    id: "employees",
    title: "Quản lý nhân viên",
    description: "Phân quyền truy cập và quản lý tài khoản nhân viên.",
    icon: Users,
    href: "/inventory/settings/employees",
    category: "system",
  },
];
