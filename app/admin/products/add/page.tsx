"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  PlusCircle, Trash2, Bold, Italic, Underline, List,
  UploadCloud, ChevronRight, Info, Plus, Image as ImageIcon,
  DollarSign, Tag, Layers
} from "lucide-react";

const DEFAULT_OPTIONS = {
  product_form: ["Lỏng", "Bột", "Viên nén", "Dung dịch", "Hạt"],
  packaging: ["Chai", "Gói", "Can", "Hũ", "Bao", "Xô"],
  units: ["ml", "lít", "g", "kg", "tấn"]
};

export default function AddProductPage() {
  const [hasVariant, setHasVariant] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setThumbnailPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addFullVariant = () => {
    const newVariant = {
      id: Date.now(),
      productForm: "",
      packaging: "",
      netWeight: "",
      unit: "ml",
      price: ""
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id: number) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const EditableSelect = ({ label, options, placeholder, value, onChange }: any) => (
    <div className="w-full">
      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block tracking-wider">{label}</label>
      <input
        list={`list-${label}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/10 focus:border-[#139a7e] transition-all"
      />
      <datalist id={`list-${label}`}>
        {options.map((opt: string) => <option key={opt} value={opt} />)}
      </datalist>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Thêm sản phẩm mới</h1>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Link href="/admin/products" className="hover:text-[#139a7e] transition">Sản phẩm</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-400 font-medium">Thêm mới</span>
          </nav>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/products" className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition active:scale-95">Hủy bỏ</Link>
          <button className="px-6 py-2.5 rounded-xl bg-[#139a7e] text-white font-semibold hover:bg-[#0e715d] transition shadow-md active:scale-95">Lưu sản phẩm</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Thông tin chung */}
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <h5 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#139a7e] rounded-full inline-block"></span>
              Thông tin chung
            </h5>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên sản phẩm *</label>
                <input type="text" placeholder="Ví dụ: Kháng sinh Enrofloxacin..." className="w-full bg-gray-50 border-gray-100 border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20" />
              </div>


              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả sản phẩm</label>
                <div className="border border-gray-100 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#139a7e]/20 transition">
                  <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-100">
                    <button className="p-2 hover:bg-white rounded-lg text-gray-600 transition"><Bold size={16}/></button>
                    <button className="p-2 hover:bg-white rounded-lg text-gray-600 transition"><Italic size={16}/></button>
                    <button className="p-2 hover:bg-white rounded-lg text-gray-600 transition"><Underline size={16}/></button>
                    <div className="w-px h-4 bg-gray-300 mx-2"></div>
                    <button className="p-2 hover:bg-white rounded-lg text-gray-600 transition"><List size={16}/></button>
                  </div>
                  <textarea rows={5} placeholder="Nhập mô tả chi tiết sản phẩm..." className="w-full px-4 py-4 text-sm bg-white outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách biến thể */}
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Layers size={22} className="text-[#139a7e]" />
                <h5 className="text-lg font-bold text-gray-800 tracking-tight">Phân loại biến thể</h5>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase pl-2">Kích hoạt</span>
                <button
                  onClick={() => setHasVariant(!hasVariant)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${hasVariant ? 'bg-[#139a7e]' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-md ${hasVariant ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {hasVariant ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {variants.map((v, index) => (
                    <div key={v.id} className="relative bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm border-l-[6px] border-l-[#139a7e] animate-in slide-in-from-left-4 duration-300">
                      <div className="absolute -top-3.5 left-4 px-4 py-1 bg-gray-900 text-white rounded-full text-[10px] font-black tracking-widest border-2 border-white shadow-lg">
                        MẪU #{index + 1}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <EditableSelect
                          label="Dạng bào chế"
                          options={DEFAULT_OPTIONS.product_form}
                          placeholder="Chọn hoặc tự nhập"
                          value={v.productForm}
                          onChange={(val: string) => {
                            const newVariants = [...variants];
                            newVariants[index].productForm = val;
                            setVariants(newVariants);
                          }}
                        />

                        <EditableSelect
                          label="Quy cách đóng gói"
                          options={DEFAULT_OPTIONS.packaging}
                          placeholder="Chọn hoặc tự nhập"
                          value={v.packaging}
                          onChange={(val: string) => {
                            const newVariants = [...variants];
                            newVariants[index].packaging = val;
                            setVariants(newVariants);
                          }}
                        />

                        <div className="grid grid-cols-2 gap-4">
                           <div className="w-full">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Khối lượng tịnh</label>
                            <input
                              type="number"
                              placeholder="Nhập số"
                              value={v.netWeight}
                              onChange={(e) => {
                                const newVariants = [...variants];
                                newVariants[index].netWeight = e.target.value;
                                setVariants(newVariants);
                              }}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/10"
                            />
                          </div>
                          <div className="w-full">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Đơn vị tính</label>
                            <select
                              value={v.unit}
                              onChange={(e) => {
                                const newVariants = [...variants];
                                newVariants[index].unit = e.target.value;
                                setVariants(newVariants);
                              }}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
                            >
                              {DEFAULT_OPTIONS.units.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-end gap-4">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-[#139a7e] uppercase mb-1 block">Giá biến thể này (VNĐ)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₫</span>
                              <input
                                type="number"
                                placeholder="Nhập giá..."
                                value={v.price}
                                onChange={(e) => {
                                  const newVariants = [...variants];
                                  newVariants[index].price = e.target.value;
                                  setVariants(newVariants);
                                }}
                                className="w-full bg-[#139a7e]/5 border-[#139a7e]/20 border rounded-xl pl-8 pr-4 py-2.5 text-sm font-black text-[#139a7e] outline-none"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeVariant(v.id)}
                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mb-0.5"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addFullVariant}
                  className="w-full py-5 border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center gap-3 text-gray-400 hover:text-[#139a7e] hover:border-[#139a7e]/40 transition-all font-bold text-sm"
                >
                  <PlusCircle size={22} /> Thêm mẫu biến thể mới
                </button>
              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[32px] bg-gray-50/30">
                <Info size={32} className="text-gray-200 mx-auto mb-4" />
                <p className="text-sm text-gray-400 font-medium italic">Sản phẩm này hiện đang ở chế độ bán lẻ đơn lẻ.</p>
                <button onClick={() => setHasVariant(true)} className="mt-5 px-8 py-2.5 bg-[#139a7e] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg">Bật phân loại mẫu</button>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Định danh và Ảnh (Không còn sticky) */}
        <div className="space-y-6">
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <h5 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
               <Tag size={18} className="text-[#139a7e]" /> Định danh
            </h5>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục sản phẩm</label>
                <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none font-semibold text-gray-600 appearance-none">
                  <option value="">-- Chọn danh mục --</option>
                  <option>Thuốc & Chế phẩm</option>
                  <option>Thức ăn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mã SKU</label>
                <div className="w-full bg-gray-100 border border-gray-100 rounded-2xl px-4 py-3 text-gray-400 font-mono text-sm uppercase">AUTO-GENERATE</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <h5 className="text-lg font-bold text-gray-800 mb-4 text-center">Ảnh sản phẩm</h5>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-gray-100 rounded-[32px] h-64 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer overflow-hidden group shadow-inner"
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt="Preview" />
              ) : (
                <div className="text-center px-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <ImageIcon className="text-gray-300" size={28}/>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Nhấp để chọn ảnh</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleThumbnailChange} hidden accept="image/*" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}