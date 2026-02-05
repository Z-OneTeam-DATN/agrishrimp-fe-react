'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
    <PondForm 
      title="Thêm ao nuôi mới" 
      onSubmit={handleCreate} 
    />
  );
}