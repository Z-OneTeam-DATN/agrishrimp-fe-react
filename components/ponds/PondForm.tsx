'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ChevronLeft, Save } from 'lucide-react';
import { pondSchema, PondFormValues } from '@/app/types/pond.schema';

interface PondFormProps {
  initialData?: PondFormValues;
  onSubmit: (data: PondFormValues) => void;
  title: string;
  isSubmitting?: boolean;
}

export default function PondForm({ initialData, onSubmit, title, isSubmitting = false }: PondFormProps) {
  const form = useForm<PondFormValues>({
    resolver: zodResolver(pondSchema), // Kết nối Zod Schema vào Form
    defaultValues: initialData || {
      name: '',
      area: 0,
      depth: 0,
      species: '',
      status: 'ACTIVE',
    },
  });

  // Helper class để fix lỗi nền đen và xử lý viền đỏ
  const getInputClass = (hasError: boolean) => {
    return `w-full px-4 h-12 border rounded-lg text-sm outline-none transition-all 
            bg-white text-gray-900 placeholder:text-gray-400 
            ${hasError 
              ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-gray-300 focus:border-[#2d9f8d] focus:ring-2 focus:ring-[#2d9f8d]/20'
            }`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header Form */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
        <Link href="/ponds" className="text-gray-500 hover:text-[#2d9f8d] transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-bold text-gray-800 text-lg">{title}</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 pb-20"> {/* Added pb-20 */}
        
        {/* Tên ao */}
        <div className="space-y-2"> {/* Changed from space-y-1.5 to space-y-2 */}
          <label className="text-sm font-bold text-gray-700">Tên ao nuôi <span className="text-red-500">*</span></label>
          <input 
            {...form.register('name')}
            className={getInputClass(!!form.formState.errors.name)}
            placeholder="Ví dụ: Ao số 1, Ao đất A..."
          />
          {form.formState.errors.name && <p className="text-xs text-red-500 font-medium mt-1">{form.formState.errors.name.message}</p>}
        </div>

        {/* Diện tích & Độ sâu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed gap-6 to gap-4 */}
          <div className="space-y-2"> {/* Changed from space-y-1.5 to space-y-2 */}
            <label className="text-sm font-bold text-gray-700">Diện tích (m²) <span className="text-red-500">*</span></label>
            <input 
              type="number" step="0.1"
              {...form.register('area')}
              className={getInputClass(!!form.formState.errors.area)}
              placeholder="0.0"
            />
            {form.formState.errors.area && <p className="text-xs text-red-500 font-medium mt-1">{form.formState.errors.area.message}</p>}
          </div>
          <div className="space-y-2"> {/* Changed from space-y-1.5 to space-y-2 */}
            <label className="text-sm font-bold text-gray-700">Độ sâu (m) <span className="text-red-500">*</span></label>
            <input 
              type="number" step="0.1"
              {...form.register('depth')}
              className={getInputClass(!!form.formState.errors.depth)}
              placeholder="0.0"
            />
            {form.formState.errors.depth && <p className="text-xs text-red-500 font-medium mt-1">{form.formState.errors.depth.message}</p>}
          </div>
        </div>

        {/* Loài vật nuôi */}
        <div className="space-y-2"> {/* Changed from space-y-1.5 to space-y-2 */}
          <label className="text-sm font-bold text-gray-700">Loài vật nuôi (Vụ hiện tại) <span className="text-red-500">*</span></label>
          <input 
            {...form.register('species')}
            className={getInputClass(!!form.formState.errors.species)}
            placeholder="Ví dụ: Tôm thẻ chân trắng..."
          />
          {form.formState.errors.species && <p className="text-xs text-red-500 font-medium mt-1">{form.formState.errors.species.message}</p>}
          <p className="text-[11px] text-gray-400">Nhập tên loài đang thả nuôi hoặc dự kiến thả.</p>
        </div>

        {/* Trạng thái */}
        <div className="space-y-2"> {/* Changed from space-y-1.5 to space-y-2 */}
          <label className="text-sm font-bold text-gray-700">Trạng thái ao</label>
          <select 
            {...form.register('status')}
            className="w-full px-4 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d9f8d]/20 focus:border-[#2d9f8d] text-sm bg-white text-gray-900 cursor-pointer"
          >
            <option value="ACTIVE">Đang nuôi</option>
            <option value="INACTIVE">Ao trống / Ngưng nuôi</option>
          </select>
        </div>

        {/* Sticky Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:relative lg:p-0 lg:bg-transparent lg:shadow-none z-10">
          <div className="flex gap-3">
            <Link href="/ponds" className="flex-1">
              <button type="button" className="w-full h-12 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Hủy bỏ
              </button>
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 h-12 text-sm font-bold text-white bg-[#2d9f8d] hover:bg-[#248273] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Save size={18} /> {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}