'use client';

import { useState } from 'react';
import Link from 'next/link';
import StoreBanner from '@/components/site/SiteBanner_Store';
import StoreSidebar from '@/components/shop/StoreSidebar';
import { MapPin, List, ChevronRight } from 'lucide-react';

// 1. Dữ liệu giả lập (Mock Data)
type Store = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hasLab: boolean;
  hasEngineer: boolean;
};

const STORES: Store[] = [
  {
    id: 1,
    name: "CN 1: AgriShrimp Cần Thơ (Trụ sở)",
    address: "Đường 3/2, Q. Ninh Kiều, TP. Cần Thơ",
    lat: 10.029933,
    lng: 105.770615,
    hasLab: true,
    hasEngineer: false
  },
  {
    id: 2,
    name: "CN 2: AgriShrimp Bạc Liêu",
    address: "Số 55 Trần Phú, P.7, TP. Bạc Liêu",
    lat: 9.294116,
    lng: 105.727715,
    hasLab: false,
    hasEngineer: true
  },
  {
    id: 3,
    name: "CN 3: AgriShrimp Cà Mau",
    address: "Số 78 Ngô Quyền, P.9, TP. Cà Mau",
    lat: 9.176985,
    lng: 105.152420,
    hasLab: true,
    hasEngineer: false
  },
  {
    id: 4,
    name: "CN 4: AgriShrimp Sóc Trăng",
    address: "Số 12 Lê Lợi, P.6, TP. Sóc Trăng",
    lat: 9.605306,
    lng: 105.972350,
    hasLab: false,
    hasEngineer: false
  }
];

const PROVINCES = [
  { value: 'CT', label: 'Cần Thơ' },
  { value: 'BL', label: 'Bạc Liêu' },
  { value: 'CM', label: 'Cà Mau' },
  { value: 'ST', label: 'Sóc Trăng' },
];

const DISTRICTS: Record<string, { value: string; label: string }[]> = {
  CT: [{ value: 'NK', label: 'Q. Ninh Kiều' }, { value: 'CR', label: 'Q. Cái Răng' }],
  BL: [{ value: 'TPBL', label: 'TP. Bạc Liêu' }, { value: 'HB', label: 'H. Hòa Bình' }],
  CM: [{ value: 'TPCM', label: 'TP. Cà Mau' }, { value: 'UM', label: 'H. U Minh' }],
  ST: [{ value: 'TPST', label: 'TP. Sóc Trăng' }, { value: 'TX', label: 'TX. Vĩnh Châu' }],
};

export default function StoreLocatorPage() {
  // 2. State Management
  const [activeStoreId, setActiveStoreId] = useState<number>(1);
  const [selectedProvince, setSelectedProvince] = useState<string>('0');
  const [mapSrc, setMapSrc] = useState<string>("https://maps.google.com/maps?q=10.029933,105.770615&hl=vi&z=14&output=embed");

  // Xử lý khi chọn Tỉnh
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvince(e.target.value);
  };

  // Xử lý khi click vào cửa hàng
  const handleStoreClick = (store: Store) => {
    setActiveStoreId(store.id);
    // Cập nhật iframe Google Map (Dùng embed link đơn giản)
    setMapSrc(`https://maps.google.com/maps?q=${store.lat},${store.lng}&hl=vi&z=14&output=embed`);
    console.log(`Di chuyển bản đồ tới: ${store.lat}, ${store.lng}`);
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-12">
      <div className="container mx-auto px-4">
        
        {/* Banner */}
        <StoreBanner />

        {/* Breadcrumb */}
        <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#329965] transition-colors">Trang chủ</Link>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-[#329965] font-bold">Hệ thống cửa hàng</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI: Sidebar */}
          <div className="lg:col-span-3 hidden lg:block">
            <StoreSidebar />
          </div>

          {/* CỘT PHẢI: Nội dung chính */}
          <div className="lg:col-span-9">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 border-gray-100">
                <h3 className="text-xl font-bold text-[#329965] uppercase flex items-center mb-2 md:mb-0">
                  <MapPin className="mr-2" />
                  Tìm Cửa hàng & Phòng Lab gần bạn
                </h3>
                <span className="bg-green-100 text-[#329965] text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                  Toàn quốc: {STORES.length} Cửa hàng
                </span>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tỉnh / Thành phố</label>
                  <select 
                    // Đã thêm text-gray-900
                    className="w-full p-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#329965] focus:border-transparent outline-none text-sm transition-all"
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                  >
                    <option value="0">Tất cả Tỉnh/Thành</option>
                    {PROVINCES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Quận / Huyện</label>
                  <select 
                    // Đã thêm text-gray-900
                    className="w-full p-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#329965] outline-none text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    disabled={selectedProvince === '0'}
                  >
                    <option value="0">Chọn Quận/Huyện</option>
                    {selectedProvince !== '0' && DISTRICTS[selectedProvince]?.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Loại hình dịch vụ</label>
                  <select 
                    // Đã thêm text-gray-900
                    className="w-full p-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#329965] outline-none text-sm"
                  >
                    <option value="0">Tất cả chi nhánh</option>
                    <option value="1">Có Phòng Lab xét nghiệm</option>
                    <option value="2">Có Kỹ sư tư vấn tại chỗ</option>
                  </select>
                </div>
              </div>

              {/* Store List & Map Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-gray-200 rounded-lg overflow-hidden h-[500px]">
                
                {/* Store List (Left Side) */}
                <div className="lg:col-span-5 flex flex-col h-full border-r border-gray-200 bg-gray-50">
                  <div className="bg-[#329965] text-white p-3 font-bold text-sm flex items-center shadow-sm z-10">
                    <List size={18} className="mr-2" /> Danh sách cửa hàng
                  </div>
                  <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {STORES.map((store) => (
                      <div 
                        key={store.id}
                        onClick={() => handleStoreClick(store)}
                        className={`
                          p-4 border-b border-gray-200 cursor-pointer transition-all hover:bg-green-50
                          ${activeStoreId === store.id ? 'bg-white border-l-4 border-l-[#329965] shadow-inner' : 'bg-transparent border-l-4 border-l-transparent'}
                        `}
                      >
                        <h6 className={`font-bold text-sm mb-1 ${activeStoreId === store.id ? 'text-[#329965]' : 'text-gray-800'}`}>
                          {store.name}
                        </h6>
                        <p className="text-xs text-gray-500 mb-2">{store.address}</p>
                        <div className="flex gap-1 flex-wrap">
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-medium">
                            Vật tư
                          </span>
                          {store.hasLab && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-medium">
                              Phòng Lab
                            </span>
                          )}
                          {store.hasEngineer && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200 font-medium">
                              Kỹ sư tư vấn
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Google Map (Right Side) */}
                <div className="lg:col-span-7 h-full bg-gray-200 relative">
                  <iframe 
                    title="Google Map Store Locator"
                    src={mapSrc}
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}