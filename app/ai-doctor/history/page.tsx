'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { 
  Search, 
  ChevronRight, 
  Activity, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';

// --- TYPE DEFINITION ---
type SeverityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'HEALTHY';

interface DiagnosisRecord {
  id: string;
  date: string;
  time: string;
  imageUrl: string;
  diagnosis: string;
  confidence: number;
  severity: SeverityLevel;
  note?: string;
}

// --- MOCK DATA ---
const MOCK_HISTORY: DiagnosisRecord[] = [
  {
    id: 'AI-20260205-001',
    date: '05/02/2026',
    time: '09:30',
    imageUrl: 'https://nguoinuoitom.vn/wp-content/uploads/2024/03/tom-benh-dom-trang_1703128806.jpg', 
    diagnosis: 'Hội chứng đốm trắng (WSSV)',
    confidence: 95,
    severity: 'HIGH',
    note: 'Cần xử lý gấp, nguy cơ lây lan cao.'
  },
  {
    id: 'AI-20260204-012',
    date: '04/02/2026',
    time: '14:15',
    imageUrl: 'https://thuysan247.com/wp-content/uploads/2020/03/benh-hoai-tu-gan-tuy-cap-tren-tom.jpg',
    diagnosis: 'Hoại tử gan tụy cấp (AHPND)',
    confidence: 88,
    severity: 'HIGH',
  },
  {
    id: 'AI-20260201-008',
    date: '01/02/2026',
    time: '08:00',
    imageUrl: 'https://tepbac.com/upload/news/ge_image/2019/07/tom-the-chan-trang-khoe-manh-1.jpg',
    diagnosis: 'Tôm khỏe mạnh',
    confidence: 98,
    severity: 'HEALTHY',
    note: 'Tôm phát triển tốt, màu sắc đẹp.'
  },
  {
    id: 'AI-20260128-005',
    date: '28/01/2026',
    time: '16:45',
    imageUrl: 'https://khoahocphattrien.vn/Images/Uploaded/Share/2016/09/20/tom-the.jpg',
    diagnosis: 'Nhiễm vi bào tử trùng (EHP)',
    confidence: 75,
    severity: 'MEDIUM',
    note: 'Tôm chậm lớn, cần theo dõi thêm.'
  }
];

export default function AiHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Logic lọc dữ liệu
  const filteredHistory = MOCK_HISTORY.filter(record => {
    const matchesSearch = record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSeverity === 'ALL' || record.severity === filterSeverity;
    return matchesSearch && matchesFilter;
  });

  // Helper render badge trạng thái
  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'HIGH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><AlertTriangle size={12}/> Nguy hiểm</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200"><Activity size={12}/> Cảnh báo</span>;
      case 'HEALTHY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 size={12}/> Khỏe mạnh</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Không xác định</span>;
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans text-gray-800">
      <div className="container mx-auto px-4 py-6">
        
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500 flex items-center">
            <Link href="/" className="hover:text-[#329965] hover:underline">Trang chủ</Link> 
            <ChevronRight size={14} className="mx-2" />
            <Link href="/profile" className="hover:text-[#329965] hover:underline">Tài khoản</Link>
            <ChevronRight size={14} className="mx-2" />
            <span className="font-bold text-gray-800">Lịch sử chẩn đoán AI</span>
        </nav>

        {/* Layout Grid giống AddressListPage (3-9) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CỘT TRÁI: Sidebar */}
            <div className="lg:col-span-3 hidden lg:block">
                <ProfileSidebar />
            </div>

            {/* CỘT PHẢI: Nội dung chính */}
            <div className="lg:col-span-9">
                
                {/* CARD TRẮNG CHÍNH */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[600px]">
                    
                    {/* Header Card */}
                    <div className="flex justify-between items-center p-5 border-b border-gray-100">
                        <h5 className="font-bold text-gray-800 text-lg uppercase">Hồ sơ bệnh án</h5>
                        <Link href="/ai-doctor">
                            <button className="bg-[#329965] hover:bg-[#268050] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                                <Activity size={18} /> Chẩn đoán mới
                            </button>
                        </Link>
                    </div>

                    {/* Body Card */}
                    <div className="p-5">
                        
                        {/* --- FILTERS (Gọn gàng hơn) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                            {/* Search */}
                            <div className="md:col-span-5 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Search size={16} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Tìm tên bệnh, mã..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#329965] transition-all"
                                />
                            </div>

                            {/* Date */}
                            <div className="md:col-span-3 relative">
                                <input 
                                    type="date" 
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 focus:outline-none focus:border-[#329965]"
                                />
                            </div>

                            {/* Select */}
                            <div className="md:col-span-4 relative">
                                <select 
                                    value={filterSeverity}
                                    onChange={(e) => setFilterSeverity(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:border-[#329965] cursor-pointer"
                                >
                                    <option value="ALL">Tất cả trạng thái</option>
                                    <option value="HIGH">Nguy hiểm</option>
                                    <option value="MEDIUM">Cảnh báo</option>
                                    <option value="HEALTHY">Khỏe mạnh</option>
                                </select>
                            </div>
                        </div>

                        {/* --- LIST ITEM --- */}
                        <div className="space-y-4">
                            {filteredHistory.length > 0 ? (
                                filteredHistory.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start hover:border-[#329965] transition-colors bg-white group">
                                    
                                    {/* Image */}
                                    <div className="relative w-full md:w-20 h-40 md:h-20 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                                        <Image 
                                            src={item.imageUrl} 
                                            alt={item.diagnosis} 
                                            fill 
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{item.id}</span>
                                            <span className="text-xs text-gray-400 mx-1">|</span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} /> {item.time}, {item.date}
                                            </span>
                                        </div>
                                        
                                        <h6 className="text-base font-bold text-gray-800 mb-1 truncate group-hover:text-[#329965] transition-colors">
                                            {item.diagnosis}
                                        </h6>
                                        
                                        <div className="text-xs text-gray-500 mb-2 line-clamp-1 italic">
                                            {item.note || 'Không có ghi chú.'}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getSeverityBadge(item.severity)}
                                            <span className="text-xs text-gray-400">
                                                Độ tin cậy: <span className="font-bold text-gray-600">{item.confidence}%</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="w-full md:w-auto mt-2 md:mt-0 flex flex-col justify-center h-full">
                                        <Link href={`/ai-doctor/result?id=${item.id}`}>
                                            <button className="w-full md:w-auto px-4 py-2 border border-[#329965] text-[#329965] hover:bg-[#eaf7f4] rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 whitespace-nowrap">
                                                <FileText size={14} /> Chi tiết
                                            </button>
                                        </Link>
                                    </div>

                                </div>
                                ))
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FileText size={32} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-gray-900 font-bold mb-1">Không tìm thấy dữ liệu</h3>
                                    <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}