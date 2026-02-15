import Link from "next/link";
import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { CATEGORIES } from "@/lib/Constant";

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
          <Link
            key={cat.id}
            href={cat.href}
            className="group flex flex-col items-center text-center p-3 rounded-lg hover:bg-green-50/50 transition-colors border border-transparent hover:border-green-100"
          >
            <div className="w-20 h-20 relative mb-3 rounded-full border-2 border-gray-100 group-hover:border-green-500 transition-all shadow-sm group-hover:shadow-md bg-white overflow-hidden">
              <Image
                src={cat.img}
                alt={cat.name}
                fill
                className="object-cover"
              />
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
