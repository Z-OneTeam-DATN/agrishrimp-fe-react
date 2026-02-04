'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { AddressForm } from '@/components/profile/AddressForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, Plus, CheckCircle2 } from 'lucide-react';

// Mock Data
const MOCK_ADDRESSES = [
  {
    id: 1,
    fullname: 'Võ Thị Mỹ Thanh',
    phone: '(+84) 909 123 456',
    address: '123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Thành phố Cần Thơ',
    isDefault: true,
    type: 'home'
  },
  {
    id: 2,
    fullname: 'Thanh Võ (Công ty)',
    phone: '0939 888 999',
    address: 'Tòa nhà FPT Polytechnic, Đường số 22, Quận Cái Răng, Thành phố Cần Thơ',
    isDefault: false,
    type: 'office'
  }
];

export default function AddressPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const handleEdit = (addr: any) => {
    setEditingAddress({
        fullName: addr.fullname,
        phone: addr.phone,
        specificAddress: addr.address,
        addressType: addr.type,
        isDefault: addr.isDefault
    });
    setIsModalOpen(true);
  };

  const handleAddStart = () => {
      setEditingAddress(null);
      setIsModalOpen(true);
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans">
      <div className="container mx-auto px-4 py-6">
        
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#329965] hover:underline">Trang chủ</Link> 
          <ChevronRight size={14} className="mx-2" />
          <Link href="/profile" className="hover:text-[#329965] hover:underline">Tài khoản</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-bold text-gray-800">Sổ địa chỉ</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 hidden lg:block">
            <ProfileSidebar />
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
                
                {/* Header Card */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h5 className="font-bold text-gray-800 text-lg">Địa chỉ của tôi</h5>
                    <button 
                        onClick={handleAddStart}
                        className="bg-[#329965] hover:bg-[#268050] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center transition-colors shadow-sm"
                    >
                        <Plus size={18} className="mr-1" /> Thêm địa chỉ mới
                    </button>
                </div>

                {/* Address List */}
                <div className="p-5 space-y-4">
                    {MOCK_ADDRESSES.map((addr) => (
                        <div key={addr.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start hover:border-[#329965] transition-colors bg-white">
                            
                            {/* Thông tin */}
                            <div className="flex-1 mb-3 md:mb-0">
                                <div className="flex items-center mb-1">
                                    <h6 className="font-bold text-gray-900 text-sm">{addr.fullname}</h6>
                                    <span className="text-gray-300 mx-2 font-light">|</span>
                                    <span className="text-gray-600 text-sm">{addr.phone}</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-2 leading-relaxed">
                                    {addr.address}
                                </div>
                                {addr.isDefault && (
                                    <span className="inline-flex items-center text-xs font-bold text-[#329965] border border-[#329965] px-2 py-0.5 rounded bg-green-50">
                                        <CheckCircle2 size={12} className="mr-1" /> Mặc định
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                <div className="flex items-center gap-3 text-sm">
                                    <button 
                                        onClick={() => handleEdit(addr)}
                                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                    >
                                        Cập nhật
                                    </button>
                                    {!addr.isDefault && (
                                        <button className="text-red-500 hover:text-red-700 font-medium hover:underline">
                                            Xóa
                                        </button>
                                    )}
                                </div>
                                <button 
                                    className={`text-xs border px-3 py-1.5 rounded transition-colors ${addr.isDefault 
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#329965] hover:text-[#329965]'}`}
                                    disabled={addr.isDefault}
                                >
                                    {addr.isDefault ? 'Đã là mặc định' : 'Thiết lập mặc định'}
                                </button>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL THÊM/SỬA ĐỊA CHỈ --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/* 👇 Thêm class 'bg-white' vào đây để sửa lỗi nền đen */}
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white text-gray-900 border border-gray-200">
            <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <DialogTitle className="font-bold text-lg text-gray-800">
                    {editingAddress ? 'Cập nhật địa chỉ' : 'Thông tin địa chỉ'}
                </DialogTitle>
            </DialogHeader>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
                <AddressForm 
                    initialValues={editingAddress}
                    onSuccess={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                />
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}