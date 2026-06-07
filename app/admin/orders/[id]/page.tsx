import { AdminOrderEditorModule } from "@/components/admin/orders/OrderAdminModule";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminOrderEditorModule mode="edit" orderId={id} />;
}
