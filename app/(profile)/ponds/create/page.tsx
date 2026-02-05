'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import PondForm from '@/components/ponds/PondForm';
import { PondFormValues } from '@/app/types/pond.schema';

export default function CreatePondPage() {
  const router = useRouter();

  const handleCreate = (data: PondFormValues) => {
    console.log('Creating pond:', data);
    
    toast.success('Thêm ao nuôi thành công!');
    router.push('/ponds');
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans text-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 hidden lg:block">
            <ProfileSidebar />
          </div>
          <div className="lg:col-span-9">
            <PondForm 
              title="Thêm ao nuôi mới" 
              onSubmit={handleCreate} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}