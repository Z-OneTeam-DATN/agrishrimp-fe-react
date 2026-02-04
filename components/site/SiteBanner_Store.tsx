'use client';

import { Search, Phone, MessageCircle } from 'lucide-react';

export default function StoreBanner() {
  return (
    <div 
      className="relative w-full mx-auto mb-8 py-12 px-5 text-white rounded-lg overflow-hidden shadow-lg bg-[#2d9f8d] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(45, 159, 141, 0.8) 0%, rgba(0, 121, 107, 0.85) 100%),
          url('https://cempartner.com/FileUpload/Images/xungdanhtinhkhibatdaucuocgoi.jpg')
        `
      }}
    >
      {/* .banner-wrapper */}
      <div className="flex flex-col items-center justify-center w-full">
        
        {/* .slogan-text */}
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 text-center drop-shadow-md">
          Xin chào! AgriShrimp có thể giúp gì cho bà con?
        </h2>

        {/* .search-bar-wrap */}
        <div className="w-full max-w-[600px] relative mb-6">
          <form className="relative w-full" onSubmit={(e) => e.preventDefault()}>
            {/* .search-input-pill */}
            <input 
              type="text" 
              placeholder="Nhập từ khóa tìm kiếm... Ví dụ: Kháng sinh, thức ăn..." 
              className="w-full h-[45px] rounded-full border-none pl-5 pr-[50px] text-sm outline-none shadow-[0_4px_8px_rgba(0,0,0,0.15)] text-gray-700 placeholder:text-gray-400"
            />
            
            {/* .search-btn-icon */}
            <button 
              type="submit"
              className="absolute right-[10px] top-1/2 -translate-y-1/2 bg-transparent border-none text-[#329965] p-0 w-[35px] h-[35px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* .contact-row */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          
          {/* .contact-box 1 (Hotline) */}
          <a href="tel:18006324" className="flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 group">
            {/* .icon-circle-white */}
            <div className="w-[35px] h-[35px] bg-white rounded-full flex items-center justify-center text-[#329965] shadow-sm mr-2 flex-shrink-0">
              <Phone size={18} fill="currentColor" />
            </div>
            {/* .text-content */}
            <div className="flex items-baseline text-white">
              <span className="text-lg font-bold mr-1">1800 6324</span>
              <span className="text-[13px] font-normal opacity-90">(Miễn phí)</span>
            </div>
          </a>

          {/* .contact-box 2 (Chat) */}
          <div className="flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 group">
            {/* .icon-circle-white */}
            <div className="w-[35px] h-[35px] bg-white rounded-full flex items-center justify-center text-[#329965] shadow-sm mr-2 flex-shrink-0">
              <MessageCircle size={18} fill="currentColor" />
            </div>
            {/* .text-content */}
            <div className="flex items-baseline text-white">
              <span className="text-lg font-bold">Chat ngay</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}