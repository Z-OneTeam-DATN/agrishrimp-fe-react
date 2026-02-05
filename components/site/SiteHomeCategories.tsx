import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid } from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: "Thuốc & Dược", image: "https://thuysantincay.com/wp-content/uploads/2022/05/logothuysannofonnewt.png" },
  { id: 2, name: "Thức ăn Tôm", image: "https://tepbac.com/upload/images/2022/06/cho-ca-an_1656057019.jpg" },
  { id: 3, name: "Vi sinh", image: "https://emzeo.com.vn/wp-content/uploads/2024/03/che-pham-em-goc-thuy-san-3-1.jpg" },
  { id: 4, name: "Đo môi trường", image: "https://vietstock.org/wp-content/uploads/2023/09/bao-ve-moi-truong-trong-nuoi-trong-thuy-san-2.jpg" },
  { id: 5, name: "Máy & Thiết bị", image: "https://drive.gianhangvn.com/image/may-thoi-khi-con-so-cung-cap-oxy-cho-ca-tom-tao-oxy-2298793j1509x3.jpg" },
  { id: 6, name: "Vật tư Khác", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcWdKFqsvAGanZ78kDOJUKdPbkwB3tCbJQkw&s" },
];

export default function HomeCategories() {
  return (
    <section className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm mb-4 md:mb-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h5 className="font-bold text-base md:text-lg uppercase text-[#1b5e20] flex items-center gap-2">
           <LayoutGrid size={20} className="text-[#1b5e20] md:w-6 md:h-6" />
           Danh Mục Vật Tư
        </h5>
      </div>

      {/* Mobile: 3 cột, Tablet: 3 cột, Desktop: 6 cột */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
        {CATEGORIES.map((cat) => (
         <Link key={cat.id} href="/user/category" className="group flex flex-col items-center text-center p-2 md:p-3 rounded-lg hover:bg-green-50/50 transition-colors border border-transparent hover:border-green-100">

             {/* Ảnh: Mobile nhỏ (w-12/14), Desktop lớn (w-20) */}
             <div className="w-12 h-12 md:w-20 md:h-20 relative mb-2 md:mb-3 rounded-full border border-gray-100 group-hover:border-green-500 transition-all shadow-sm group-hover:shadow-md bg-white overflow-hidden">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100px, 200px"
                />
             </div>

             <span className="text-[11px] md:text-sm font-bold text-gray-700 group-hover:text-green-800 leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center">
                {cat.name}
             </span>
          </Link>
        ))}
      </div>
    </section>
  );
}