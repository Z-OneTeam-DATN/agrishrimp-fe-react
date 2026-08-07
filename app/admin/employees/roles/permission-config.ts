import {
  Building2,
  LayoutDashboard,
  LucideIcon,
  MessageSquareText,
  Package,
  Microscope,
  Settings,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { P } from "@/lib/permissions";

export type PermissionActionItem = {
  id: string;
  label: string;
};

export type PermissionModuleItem = {
  id: string;
  label: string;
  advanced: PermissionActionItem[];
};

export type PermissionGroupItem = {
  group: string;
  icon: LucideIcon;
  screens: PermissionModuleItem[];
};

export const ROLE_PERMISSION_STRUCTURE: PermissionGroupItem[] = [
  {
    group: "Hệ thống",
    icon: LayoutDashboard,
    screens: [
      { id: P.DASHBOARD_VIEW, label: "Bảng điều khiển trung tâm", advanced: [] },
      { id: P.ACTIVITY_LOG_VIEW, label: "Nhật ký hoạt động", advanced: [] },
    ],
  },
  {
    group: "Quản trị",
    icon: Building2,
    screens: [
      {
        id: P.STAFF_VIEW,
        label: "Nhân viên",
        advanced: [
          { id: P.STAFF_CREATE, label: "Thêm nhân viên" },
          { id: P.STAFF_UPDATE, label: "Sửa nhân viên" },
          { id: P.STAFF_DELETE, label: "Xóa nhân viên" },
        ],
      },
      {
        id: P.BRANCH_VIEW,
        label: "Chi nhánh",
        advanced: [
          { id: P.BRANCH_CREATE, label: "Thêm chi nhánh" },
          { id: P.BRANCH_UPDATE, label: "Sửa chi nhánh" },
          { id: P.BRANCH_DELETE, label: "Xóa chi nhánh" },
        ],
      },
      {
        id: P.ROLE_VIEW,
        label: "Vai trò",
        advanced: [
          { id: P.ROLE_CREATE, label: "Tạo vai trò" },
          { id: P.ROLE_UPDATE, label: "Sửa vai trò" },
          { id: P.ROLE_DELETE, label: "Xóa vai trò" },
        ],
      },
    ],
  },
  {
    group: "Kinh doanh",
    icon: ShoppingCart,
    screens: [
      {
        id: P.ORDER_VIEW,
        label: "Đơn hàng",
        advanced: [
          { id: P.ORDER_CREATE, label: "Tạo đơn hàng" },
          { id: P.ORDER_UPDATE, label: "Cập nhật đơn hàng" },
          { id: P.ORDER_CONFIRM, label: "Xác nhận đơn hàng" },
          { id: P.ORDER_SHIP, label: "Giao hàng" },
          { id: P.ORDER_CANCEL, label: "Hủy đơn hàng" },
          { id: P.ORDER_COMPLETE, label: "Hoàn tất đơn hàng" },
          { id: P.ORDER_EXPORT, label: "Xuất danh sách đơn hàng" },
          { id: P.ORDER_REFUND, label: "Hoàn tiền đơn hàng" },
          { id: P.ORDER_DELETE, label: "Xóa đơn hàng" },
        ],
      },
      {
        id: P.CUSTOMER_VIEW,
        label: "Khách hàng",
        advanced: [
          { id: P.CUSTOMER_CREATE, label: "Thêm khách hàng" },
          { id: P.CUSTOMER_UPDATE, label: "Sửa khách hàng" },
          { id: P.CUSTOMER_DELETE, label: "Xóa khách hàng" },
        ],
      },
      {
        id: P.VOUCHER_VIEW,
        label: "Voucher",
        advanced: [
          { id: P.VOUCHER_CREATE, label: "Thêm voucher" },
          { id: P.VOUCHER_UPDATE, label: "Sửa voucher" },
          { id: P.VOUCHER_DELETE, label: "Xóa voucher" },
        ],
      },
    ],
  },
  {
    group: "Hàng hóa",
    icon: Package,
    screens: [
      {
        id: P.PRODUCT_VIEW,
        label: "Sản phẩm",
        advanced: [
          { id: P.PRODUCT_CREATE, label: "Thêm sản phẩm" },
          { id: P.PRODUCT_UPDATE, label: "Sửa sản phẩm" },
          { id: P.PRODUCT_DELETE, label: "Xóa sản phẩm" },
        ],
      },
      {
        id: P.CATEGORY_VIEW,
        label: "Danh mục",
        advanced: [
          { id: P.CATEGORY_CREATE, label: "Thêm danh mục" },
          { id: P.CATEGORY_UPDATE, label: "Sửa danh mục" },
          { id: P.CATEGORY_DELETE, label: "Xóa danh mục" },
        ],
      },
      {
        id: P.ATTRIBUTE_VIEW,
        label: "Thuộc tính",
        advanced: [
          { id: P.ATTRIBUTE_CREATE, label: "Thêm thuộc tính" },
          { id: P.ATTRIBUTE_UPDATE, label: "Sửa thuộc tính" },
          { id: P.ATTRIBUTE_DELETE, label: "Xóa thuộc tính" },
        ],
      },
    ],
  },
  {
    group: "Kho vận",
    icon: Warehouse,
    screens: [
      {
        id: P.SUPPLIER_VIEW,
        label: "Nhà cung cấp",
        advanced: [
          { id: P.SUPPLIER_CREATE, label: "Thêm nhà cung cấp" },
          { id: P.SUPPLIER_UPDATE, label: "Sửa nhà cung cấp" },
          { id: P.SUPPLIER_DELETE, label: "Xóa nhà cung cấp" },
        ],
      },
      {
        id: P.PURCHASE_REQUEST_VIEW,
        label: "Yêu cầu nhập NCC",
        advanced: [
          { id: P.PURCHASE_REQUEST_CREATE, label: "Tạo yêu cầu nhập NCC" },
          { id: P.PURCHASE_REQUEST_UPDATE, label: "Sửa yêu cầu nhập NCC" },
          { id: P.PURCHASE_REQUEST_APPROVE, label: "Duyệt yêu cầu nhập NCC" },
          { id: P.PURCHASE_REQUEST_DELETE, label: "Xóa yêu cầu nhập NCC" },
        ],
      },
      {
        id: P.IMPORT_VIEW,
        label: "Nhập hàng",
        advanced: [
          { id: P.IMPORT_CREATE, label: "Tạo phiếu nhập" },
          { id: P.IMPORT_UPDATE, label: "Sửa phiếu nhập" },
          { id: P.IMPORT_APPROVE, label: "Duyệt phiếu nhập" },
          { id: P.IMPORT_CANCEL, label: "Hủy phiếu nhập" },
          { id: P.IMPORT_DELETE, label: "Xóa phiếu nhập" },
        ],
      },
      {
        id: P.EXPORT_VIEW,
        label: "Xuất hàng",
        advanced: [
          { id: P.EXPORT_CREATE, label: "Tạo phiếu xuất" },
          { id: P.EXPORT_UPDATE, label: "Sửa phiếu xuất" },
          { id: P.EXPORT_APPROVE, label: "Duyệt phiếu xuất" },
          { id: P.EXPORT_CANCEL, label: "Hủy phiếu xuất" },
          { id: P.EXPORT_DELETE, label: "Xóa phiếu xuất" },
        ],
      },
      {
        id: P.TRANSFER_VIEW,
        label: "Điều chuyển",
        advanced: [
          { id: P.TRANSFER_CREATE, label: "Tạo phiếu điều chuyển" },
          { id: P.TRANSFER_UPDATE, label: "Sửa phiếu điều chuyển" },
          { id: P.TRANSFER_APPROVE, label: "Duyệt điều chuyển" },
          { id: P.TRANSFER_CANCEL, label: "Hủy điều chuyển" },
          { id: P.TRANSFER_DELETE, label: "Xóa điều chuyển" },
        ],
      },
      {
        id: P.INVENTORY_CHECK_VIEW,
        label: "Kiểm kê kho",
        advanced: [
          { id: P.INVENTORY_CHECK_CREATE, label: "Tạo phiếu kiểm kê" },
          { id: P.INVENTORY_CHECK_UPDATE, label: "Sửa phiếu kiểm kê" },
          { id: P.INVENTORY_CHECK_APPROVE, label: "Duyệt phiếu kiểm kê" },
          { id: P.INVENTORY_CHECK_CANCEL, label: "Hủy phiếu kiểm kê" },
          { id: P.INVENTORY_CHECK_DELETE, label: "Xóa phiếu kiểm kê" },
        ],
      },
    ],
  },
  {
    group: "Báo cáo",
    icon: TrendingUp,
    screens: [
      { id: P.REPORT_REVENUE_VIEW, label: "Báo cáo doanh thu", advanced: [] },
      {
        id: P.REPORT_INVENTORY_VIEW,
        label: "Báo cáo tồn kho",
        advanced: [
          {
            id: P.REPORT_INVENTORY_VIEW_ALL_BRANCHES,
            label: "Xem báo cáo tồn kho mọi chi nhánh",
          },
        ],
      },
      {
        id: P.REPORT_FINANCE_VIEW,
        label: "Báo cáo tài chính",
        advanced: [
          {
            id: P.REPORT_FINANCE_VIEW_ALL_BRANCHES,
            label: "Xem báo cáo tài chính mọi chi nhánh",
          },
        ],
      },
    ],
  },
  {
    group: "Cài đặt",
    icon: Settings,
    screens: [
      {
        id: P.SETTING_VIEW,
        label: "Cài đặt hệ thống",
        advanced: [{ id: P.SETTING_UPDATE, label: "Cập nhật cài đặt" }],
      },
      {
        id: P.DRIVER_VIEW,
        label: "Quản lý tài xế",
        advanced: [
          { id: P.DRIVER_CREATE, label: "Thêm tài xế" },
          { id: P.DRIVER_UPDATE, label: "Sửa tài xế" },
          { id: P.DRIVER_DELETE, label: "Xóa tài xế" },
        ],
      },
      {
        id: P.BANNER_VIEW,
        label: "Banner",
        advanced: [
          { id: P.BANNER_CREATE, label: "Tạo banner" },
          { id: P.BANNER_EDIT, label: "Sửa banner" },
          { id: P.BANNER_DELETE, label: "Xóa banner" },
        ],
      },
      {
        id: P.BLOG_VIEW,
        label: "Blog",
        advanced: [
          { id: P.BLOG_CREATE, label: "Tạo bài viết" },
          { id: P.BLOG_EDIT, label: "Sửa nội dung blog" },
          { id: P.BLOG_DELETE, label: "Xóa nội dung blog" },
        ],
      },
    ],
  },
  {
    group: "Tư vấn khách hàng",
    icon: MessageSquareText,
    screens: [
      {
        id: P.CUSTOMER_ADVISOR_USE,
        label: "Workspace tư vấn khách hàng",
        advanced: [
          { id: P.CHAT_VIEW, label: "Xem danh sách hội thoại" },
          { id: P.CHAT_MANAGE, label: "Phân công và ghim sản phẩm" },
        ],
      },
    ],
  },
  {
    group: "AI Doctor",
    icon: Microscope,
    screens: [
      {
        id: P.AGRONOMIST_WORKSPACE_USE,
        label: "Workspace kỹ sư nông nghiệp",
        advanced: [
          { id: P.AI_KNOWLEDGE_VIEW, label: "Xem tri thức AI" },
          { id: P.AI_KNOWLEDGE_CREATE, label: "Tạo tri thức AI" },
          { id: P.AI_KNOWLEDGE_UPDATE, label: "Cập nhật tri thức AI" },
          { id: P.AI_KNOWLEDGE_APPROVE, label: "Duyệt tri thức AI" },
          { id: P.AI_IMPORT_KNOWLEDGE, label: "Import tri thức AI" },
          { id: P.AI_CASE_REVIEW, label: "Xử lý case AI" },
        ],
      },
    ],
  },
];

export const ALL_ROLE_MODULE_IDS = ROLE_PERMISSION_STRUCTURE.flatMap((group) =>
  group.screens.map((screen) => screen.id)
);

export const ALL_ROLE_ACTION_IDS = ROLE_PERMISSION_STRUCTURE.flatMap((group) =>
  group.screens.flatMap((screen) => screen.advanced.map((action) => action.id))
);
