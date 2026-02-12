import { 
  Home, Flame, Zap, Droplet, Ruler, Phone, MapPin, 
  CreditCard, ShieldCheck, Truck, RotateCcw, LucideIcon 
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon | null;
  highlight?: boolean;
};

export type FooterBenefit = {
  title: string;
  sub: string;
  icon: LucideIcon;
};

export const SITE_CONFIG = {
  name: "AgriShrimp",
  description: "Giải pháp nuôi tôm thông minh",
  phone: "1800 6324",
  address: "Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh",
};

export const MAIN_NAV: NavItem[] = [
  { label: 'Hàng mới về', href: '/products?sort=new', icon: Zap, highlight: true },
  { label: 'Bán chạy', href: '/products?sort=best-sell', icon: Flame, highlight: true },
  { label: 'Thương hiệu', href: '/brands', icon: null },
  { label: 'Thuốc thủy sản', href: '/user/category/medicine', icon: Droplet },
  { label: 'Dụng cụ đo', href: '/user/category/tools', icon: Ruler },
];

export const FOOTER_BENEFITS: FooterBenefit[] = [
  { title: "Thanh toán khi nhận hàng", sub: "(COD) - Kiểm tra hàng trước", icon: CreditCard },
  { title: "Giao hàng thần tốc 2H", sub: "Miễn phí đơn từ 299K", icon: Truck },
  { title: "14 ngày đổi trả miễn phí", sub: "Thủ tục đơn giản", icon: RotateCcw },
  { title: "Thương hiệu uy tín", sub: "Sản phẩm chính hãng 100%", icon: ShieldCheck },
];


export const FOOTER_LINKS = [
  {
    title: "Hỗ trợ khách hàng",
    items: [
      { label: "Các câu hỏi thường gặp", href: "/faq" },
      { label: "Gửi yêu cầu hỗ trợ", href: "/support" },
      { label: "Hướng dẫn đặt hàng", href: "/guide" },
    ]
  },
  {
    title: "Về AgriShrimp",
    items: [
      { label: "Giới thiệu công ty", href: "/about" },
      { label: "Tuyển dụng", href: "/careers" },
      { label: "Chính sách bảo mật", href: "/privacy" },
    ]
  }
];

export const BANNER_SLIDERS = [
  {
    id: 1,
    url: "https://tomgiongrangdong.com/wp-content/uploads/2022/10/banner-tom-giong2-2.png",
    alt: "Tôm giống Rạng Đông"
  },
  {
    id: 2,
    url: "https://nammientrung.com/wp-content/uploads/2023/09/6-%C4%91i%E1%BB%81u-n%C3%AAn-l%C3%A0m-tr%C6%B0%E1%BB%9Bc-khi-th%E1%BA%A3-t%C3%B4m-gi%E1%BB%91ng.jpg",
    alt: "Kỹ thuật thả tôm"
  },
  {
    id: 3,
    url: "https://antamphat.vn/storage/01JQB63MZA6V4ANCN7YNNRH24G.jpg",
    alt: "Banner An Tâm Phát"
  },
  {
    id: 4,
    url: "https://thuysanvietnam.com.vn/wp-content/uploads/2023/12/image004.jpg",
    alt: "Thủy sản Việt Nam"
  }
];

export const SUB_BANNERS = [
  {
    id: 1,
    url: "https://file.hstatic.net/1000332634/article/mo_hinh_nuoi_tom_su_quang_canh_cai_tien_thanh_cong_o_ca_mau_image_041fe1801c4941a591813c9022cb1835.webp",
    alt: "Mô hình nuôi tôm"
  },
  {
    id: 2,
    url: "https://haophuong.com/wp-content/uploads/2025/07/1-1.png",
    alt: "Giải pháp Hạo Phương"
  }
];

export const CATEGORIES = [
  {
    id: 1,
    name: "Thuốc &\nDược phẩm",
    img: "https://thuysantincay.com/wp-content/uploads/2022/05/logothuysannofonnewt.png",
    href: "/user/category/medicine"
  },
  {
    id: 2,
    name: "Thức ăn\nTăng trọng",
    img: "https://tepbac.com/upload/images/2022/06/cho-ca-an_1656057019.jpg",
    href: "/user/category/food"
  },
  {
    id: 3,
    name: "Chế phẩm\nVi sinh",
    img: "https://emzeo.com.vn/wp-content/uploads/2024/03/che-pham-em-goc-thuy-san-3-1.jpg",
    href: "/user/category/biotech"
  },
  {
    id: 4,
    name: "Dụng cụ\nĐo môi trường",
    img: "https://vietstock.org/wp-content/uploads/2023/09/bao-ve-moi-truong-trong-nuoi-trong-thuy-san-2.jpg",
    href: "/user/category/tools"
  },
  {
    id: 5,
    name: "Máy móc &\nThiết bị ao",
    img: "https://drive.gianhangvn.com/image/may-thoi-khi-con-so-cung-cap-oxy-cho-ca-tom-tao-oxy-2298793j1509x3.jpg",
    href: "/user/category/machines"
  },
  {
    id: 6,
    name: "Vật tư\nKhác",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcWdKFqsvAGanZ78kDOJUKdPbkwB3tCbJQkw&s",
    href: "/user/category/others"
  }
]