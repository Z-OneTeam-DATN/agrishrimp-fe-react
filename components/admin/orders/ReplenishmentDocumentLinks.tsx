"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { getReplenishmentDocumentLinks } from "@/app/services/order.service";
import type { OrderReplenishmentDocument } from "@/app/types/order.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReplenishmentDocumentLinksProps = {
  documents?: OrderReplenishmentDocument[] | null;
  className?: string;
  compact?: boolean;
};

export function ReplenishmentDocumentLinks({
  documents,
  className,
  compact = false,
}: ReplenishmentDocumentLinksProps) {
  const links = getReplenishmentDocumentLinks(documents);

  if (!links.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[4px] border border-emerald-200 bg-emerald-50/70 p-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-emerald-800">
        <ClipboardList size={15} />
        <span>Phiếu xử lý thiếu hàng</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-emerald-700">
          {links.length} phiếu
        </span>
      </div>

      <div className={cn("mt-3 flex flex-wrap gap-2", compact && "gap-1.5")}>
        {links.map((link) => (
          <Button
            key={`${link.documentType}:${link.documentId}`}
            asChild
            size="sm"
            variant="outline"
            className={cn(
              "h-auto min-h-8 justify-start whitespace-normal rounded-[4px] bg-white px-3 py-1.5 text-left text-[12px] font-semibold shadow-none",
              link.documentType === "TRANSFER"
                ? "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800",
            )}
          >
            <Link href={link.documentPath}>{link.documentLabel}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
