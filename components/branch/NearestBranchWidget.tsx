"use client"

import { MapPin, RefreshCw } from "lucide-react"
import { BranchCard } from "./BranchCard"
import { useUserLocation } from "@/hooks/useUserLocation"
import { useNearestBranches } from "@/hooks/useNearestBranches"

interface NearestBranchWidgetProps {
  className?: string
  maxItems?: number
}

function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="flex gap-2">
        <div className="h-7 bg-gray-200 rounded-lg flex-1" />
        <div className="h-7 bg-gray-200 rounded-lg flex-1" />
      </div>
    </div>
  )
}

export function NearestBranchWidget({
  className = "",
  maxItems = 3,
}: NearestBranchWidgetProps) {
  const { location, isLocating, error: locationError, refetch } = useUserLocation()
  const {
    data: branches,
    isLoading,
    isError,
  } = useNearestBranches(location)

  const isAnyLoading = isLocating || isLoading

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <MapPin size={14} className="text-blue-600" />
          Cửa hàng gần bạn
        </h2>
        <button
          type="button"
          onClick={refetch}
          disabled={isAnyLoading}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw size={11} className={isAnyLoading ? "animate-spin" : ""} />
          Cập nhật
        </button>
      </div>

      {/* Loading */}
      {isAnyLoading && (
        <div className="space-y-3">
          {Array.from({ length: maxItems }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Location error */}
      {!isAnyLoading && locationError && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-center space-y-3">
          <p className="text-sm text-amber-800">Không thể xác định vị trí của bạn</p>
          <button
            type="button"
            onClick={refetch}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Thử lại với GPS
          </button>
        </div>
      )}

      {/* Branch error */}
      {!isAnyLoading && !locationError && isError && (
        <div className="border border-red-100 bg-red-50 rounded-xl p-4 text-center text-sm text-red-700">
          Không thể tải danh sách chi nhánh. Vui lòng thử lại.
        </div>
      )}

      {/* Empty */}
      {!isAnyLoading && !locationError && !isError && branches && branches.length === 0 && (
        <div className="border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
          Không có chi nhánh nào trong khu vực của bạn
        </div>
      )}

      {/* Branch list */}
      {!isAnyLoading && !locationError && !isError && branches && branches.length > 0 && (
        <div className="space-y-3">
          {branches.slice(0, maxItems).map((branch, idx) => (
            <BranchCard key={branch.id} branch={branch} isNearest={idx === 0} />
          ))}
        </div>
      )}
    </div>
  )
}

