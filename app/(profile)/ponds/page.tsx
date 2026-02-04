'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { Plus, Droplets, Maximize2, Ruler, Fish, Edit2, Trash2, BookOpen, Ban } from 'lucide-react';
import { toast } from 'sonner';

// Mock Data
const initialPonds = [
  { id: '1', name: 'Ao Số 01 - Khu A', area: 2500, depth: 1.5, species: 'Tôm thẻ chân trắng', status: 'ACTIVE', description: 'Đang hoạt động bình thường.' },
  { id: '2', name: 'Ao Đất - Bờ Tây', area: 3000, depth: 1.8, species: '(Chưa thả)', status: 'INACTIVE', description: 'Ao đang phơi đáy, chờ vụ mới.' }
];

export default function PondManagementPage() {
  const [ponds, setPonds] = useState(initialPonds);

  const handleDelete = (id: string) => {
    if(confirm('Bạn có chắc chắn muốn xóa ao này?')) {
        setPonds(ponds.filter(p => p.id !== id));
        toast.success('Đã xóa ao nuôi.');
    }
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans text-gray-800">
      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#2d9f8d]">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href="/profile" className="hover:text-[#2d9f8d]">Tài khoản</Link>
          <span className="mx-2">/</span>
          <span className="font-bold text-gray-800">Quản lý ao nuôi</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 hidden lg:block">
            <ProfileSidebar />
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-lg text-gray-800">Danh sách ao nuôi</h5>
                
                {/* NÚT THÊM MỚI: CHUYỂN TRANG */}
                <Link href="/ponds/create">
                  <button className="bg-[#2d9f8d] hover:bg-[#248273] text-white text-sm font-bold px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm">
                    <Plus size={18} /> Thêm ao mới
                  </button>
                </Link>
              </div>

              <div className="p-6 space-y-4">
                {ponds.map((pond) => (
                  <div key={pond.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 ${pond.status === 'ACTIVE' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400'}`}>
                        {pond.status === 'ACTIVE' ? <Droplets size={32} /> : <Ban size={32} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-gray-900 text-base">{pond.name}</h3>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded border ${
                            pond.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {pond.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng nuôi'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><Maximize2 size={14} /> {pond.area.toLocaleString()} m²</div>
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><Ruler size={14} /> Sâu {pond.depth}m</div>
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><Fish size={14} /> {pond.species}</div>
                        </div>
                        <div className="flex gap-3 pt-3 border-t border-dashed border-gray-100">
                          
                          {/* NÚT SỬA: CHUYỂN TRANG */}
                          <Link href={`/ponds/${pond.id}`} className="text-xs font-bold text-gray-600 hover:text-[#2d9f8d] flex items-center gap-1">
                            <Edit2 size={14} /> Sửa
                          </Link>

                          <button onClick={() => handleDelete(pond.id)} className="text-xs font-bold text-gray-600 hover:text-red-600 flex items-center gap-1">
                            <Trash2 size={14} /> Xóa
                          </button>
                          <button className="text-xs font-bold text-[#2d9f8d] hover:underline flex items-center gap-1">
                            <BookOpen size={14} /> Xem nhật ký
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}