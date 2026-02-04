import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid } from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: "Thuốc & Dược phẩm", image: "https://thuysantincay.com/wp-content/uploads/2022/05/logothuysannofonnewt.png" },
  { id: 2, name: "Thức ăn Tăng trọng", image: "https://tepbac.com/upload/images/2022/06/cho-ca-an_1656057019.jpg" },
  { id: 3, name: "Chế phẩm Vi sinh", image: "https://emzeo.com.vn/wp-content/uploads/2024/03/che-pham-em-goc-thuy-san-3-1.jpg" },
  { id: 4, name: "Dụng cụ Đo môi trường", image: "https://vietstock.org/wp-content/uploads/2023/09/bao-ve-moi-truong-trong-nuoi-trong-thuy-san-2.jpg" },
  { id: 5, name: "Máy móc & Thiết bị ao", image: "https://drive.gianhangvn.com/image/may-thoi-khi-con-so-cung-cap-oxy-cho-ca-tom-tao-oxy-2298793j1509x3.jpg" },
  { id: 6, name: "Vật tư Khác", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcWdKFqsvAGanZ78kDOJUKdPbkwB3tCbJQkw&s" },
];

export default function HomeCategories() {
  return (
    <section className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6 border-b pb-2">
        <h5 className="font-bold text-lg uppercase text-[#1b5e20] flex items-center gap-2">
           <LayoutGrid size={24} className="text-[#1b5e20]" />
           Danh Mục Vật Tư
        </h5>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {CATEGORIES.map((cat) => (
          <Link key={cat.id} href="/category" className="group flex flex-col items-center text-center p-3 rounded-lg hover:bg-green-50/50 transition-colors border border-transparent hover:border-green-100">
             <div className="w-20 h-20 relative mb-3 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-green-500 transition-all shadow-sm group-hover:shadow-md bg-white">
                <Image src={cat.image} alt={cat.name} fill className="object-contain p-1" />
             </div>
             <span className="text-sm font-bold text-gray-700 group-hover:text-green-800 leading-tight">
                {cat.name}
             </span>
          </Link>
        ))}
      </div>
    </section>
  );
}