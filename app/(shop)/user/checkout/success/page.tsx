"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight, Home } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} className="text-green-600 animate-bounce" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Cảm ơn bạn đã tin tưởng AgriShrimp. Đơn hàng của bạn đang được hệ thống xử lý và sẽ sớm được giao đến bạn.
        </p>

        <div className="space-y-3">
          <Link 
            href="/orders" 
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-md shadow-teal-100"
          >
            <ShoppingBag size={18} /> Xem đơn hàng của tôi
          </Link>
          
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            <Home size={18} /> Tiếp tục mua sắm
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Cần hỗ trợ? Liên hệ hotline <span className="text-teal-600 font-bold">1800 1234</span>
          </p>
        </div>
      </div>
    </div>
  );
}
