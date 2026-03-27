"use client";

import { useParams, useSearchParams } from "next/navigation";
import InventoryUpsert from "@/components/admin/inventory/upsert-check";

export default function InventoryAuditDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const isEdit = searchParams.get("edit") === "true";
  
  return <InventoryUpsert mode={isEdit ? "edit" : "view"} code={code} />;
}
