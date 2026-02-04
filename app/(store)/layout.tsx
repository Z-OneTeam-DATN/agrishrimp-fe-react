export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Chỉ giữ lại một thẻ div bao ngoài, không thêm Banner hay Sidebar ở đây nữa
    <div className="min-h-screen bg-[#f8f9fa]">
       {children}
    </div>
  );
}