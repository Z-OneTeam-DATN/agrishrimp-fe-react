"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { returnService } from "@/app/services/return.service";
import { ReturnRequest } from "@/app/types/return.types";
import {
  filterUserReturnRequests,
  UserReturnRequestAccordionList,
} from "@/components/orders/UserReturnRequestAccordionList";
import { Skeleton } from "@/components/ui/skeleton";

function extractErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function ReturnListPage() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await returnService.getMyReturnRequests();
        if (!mounted) {
          return;
        }

        setRequests(data);
      } catch (err: any) {
        if (!mounted) {
          return;
        }

        setError(
          extractErrorMessage(
            err,
            "Không thể tải danh sách yêu cầu trả hàng lúc này.",
          ),
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadRequests();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleRequests = useMemo(
    () => filterUserReturnRequests(requests, searchKeyword),
    [requests, searchKeyword],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-none" />
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="h-48 w-full rounded-none" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="border border-[#d8e6f5] bg-white px-5 py-5">
        <div className="space-y-2">
          <Link
            href="/orders/list?status=COMPLETED"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#1965a2]"
          >
            <ArrowLeft size={16} />
            Quay lại đơn đã giao
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#12385b]">
                Yêu cầu trả hàng của tôi
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi các phiếu trả hàng thủ công mà bạn đã gửi cho chi nhánh xử lý.
              </p>
            </div>

            <Link
              href="/orders/list?status=COMPLETED"
              className="inline-flex h-10 items-center justify-center bg-[#1965a2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#145486]"
            >
              Đơn đã giao
            </Link>
          </div>
        </div>
      </div>

      <div className="border border-[#d8e6f5] bg-white px-4 py-3">
        <label className="flex min-h-[46px] w-full items-center gap-3 bg-[#f5f9ff] px-4 text-gray-600">
          <Search size={20} className="shrink-0 text-[#9ab7d3]" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Tìm mã phiếu, mã đơn, chi nhánh hoặc tên sản phẩm trả"
            className="w-full bg-transparent text-[15px] text-gray-700 outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      {error ? (
        <div className="border border-[#d8e6f5] bg-white px-5 py-4 text-sm text-rose-600">
          {error}
        </div>
      ) : (
        <UserReturnRequestAccordionList
          requests={visibleRequests}
          emptyTitle={
            searchKeyword.trim()
              ? "Không tìm thấy phiếu trả hàng phù hợp"
              : "Chưa có yêu cầu trả hàng"
          }
          emptyDescription={
            searchKeyword.trim()
              ? "Thử tìm theo mã phiếu, mã đơn hoặc tên sản phẩm trả."
              : "Khi bạn gửi yêu cầu từ đơn đã giao, phiếu xử lý sẽ hiển thị tại đây."
          }
          emptyActionHref="/orders/list?status=COMPLETED"
          emptyActionLabel="Xem đơn đã giao"
        />
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải dữ liệu...
        </div>
      ) : null}
    </div>
  );
}
