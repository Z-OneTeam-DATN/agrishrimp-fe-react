'use client';

import { useState } from 'react';
import EditProfileForm from '@/components/profile/EditProfileForm'; // Đã bỏ dấu ngoặc nhọn {} nếu export default
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { Phone, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function EditProfilePage() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Dữ liệu giả lập
  const userData = {
    fullname: 'Võ Thị Mỹ Thanh',
    email: 'thanhthenhwifi@gmail.com',
    phone: '0909 *** 888',
    gender: 'female' as 'female' | 'male' | 'other',
    birthday: new Date('1995-05-20'),
    avatarUrl: 'https://hinhcute.net/wp-content/uploads/2025/06/httpswww.didongmy.comvnt_uploadnews05_2024anh-26-meme-dang-yeu-didongmy.jpg'
  };

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h5 className="font-bold text-gray-800 text-lg mb-6 pb-3 border-b border-gray-100">Thông tin tài khoản</h5>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* --- PHẦN 1: FORM CHỈNH SỬA --- */}
          <div className="md:col-span-7 md:border-r border-gray-100 md:pr-8">
            <EditProfileForm initialValues={userData} />
          </div>

          {/* --- PHẦN 2: SIDE INFO --- */}
          <div className="md:col-span-5">
            
            {/* Thông tin liên lạc */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <div className="font-bold mb-4 text-sm text-gray-700 uppercase tracking-wide">Thông tin liên lạc</div>
              <div className="space-y-6"> {/* Changed from space-y-4 to space-y-6 */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <Phone size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{userData.phone}</div>
                      <small className="text-gray-400 text-xs">Số điện thoại</small>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <Mail size={16} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{userData.email}</div>
                      <small className="text-gray-400 text-xs">Email liên hệ</small>
                    </div>
                </div>
              </div>
            </div>

            {/* Bảo mật */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <div className="font-bold mb-4 text-sm text-gray-700 uppercase tracking-wide">Bảo mật</div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Đổi mật khẩu</span>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="h-12 px-4 text-sm font-bold text-gray-700 border border-gray-300 bg-white rounded hover:border-[#329965] hover:text-[#329965] transition-colors"
                >
                  Cập nhật
                </button>
              </div>
            </div>

            {/* Liên kết */}
            <div>
              <div className="font-bold mb-4 text-sm text-gray-700 uppercase tracking-wide">Liên kết mạng xã hội</div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
                <div className="flex items-center gap-2 font-medium text-sm text-gray-700">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/><path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.44 6.0166 24.0008 9.11388 24.0008H12.2401Z" fill="#34A853"/><path d="M5.50705 14.3003C5.24451 13.5133 5.10906 12.6732 5.10906 11.8106C5.10906 10.948 5.24451 10.1079 5.50705 9.32092V6.23004H1.5166C0.710729 7.89966 0.25415 9.80007 0.25415 11.8106C0.25415 13.8211 0.710729 15.7215 1.5166 17.3912L5.50705 14.3003Z" fill="#FBBC05"/><path d="M12.2445 4.36952C14.004 4.36952 15.5804 4.97507 16.8226 6.16007L20.2796 2.70308C18.2059 0.767969 15.4766 -0.379913 12.2445 -0.379913C9.11388 -0.379913 6.0166 2.18088 3.55371 6.23004L5.50705 9.32092C6.45946 6.48128 9.11388 4.36952 12.2445 4.36952Z" fill="#EA4335"/></svg>
                  Google
                </div>
                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded flex items-center font-bold">
                  <CheckCircle2 size={12} className="mr-1" /> Đã liên kết
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- MODAL ĐỔI MẬT KHẨU --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b">
              <h5 className="font-bold text-lg text-gray-800">Đổi mật khẩu</h5>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
            </div>
            <div className="p-5">
              <ChangePasswordForm 
                onCancel={() => setShowPasswordModal(false)} 
                onSuccess={() => setShowPasswordModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}