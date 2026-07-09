"use client"

import { MapPin, Clock, Phone, Navigation } from "lucide-react"
import type { NearestBranch } from "@/app/types/branch.types"

interface BranchCardProps {
  branch: NearestBranch
  isNearest?: boolean
}

export function BranchCard({ branch, isNearest = false }: BranchCardProps) {
  const openMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(branch.addressText)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
      {/* Name + badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{branch.name}</h3>
          {isNearest && (
            <span className="shrink-0 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
              Gần nhất
            </span>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-2">
        <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
        <span className="line-clamp-2">{branch.addressText}</span>
      </div>

      {/* Distance + Duration */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock size={11} className="text-blue-500" />
          {branch.durationMinutes} phút
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={11} className="text-blue-500" />
          {branch.distanceKm.toFixed(1)} km
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href={`tel:${branch.phone}`}
          className="flex items-center gap-1.5 flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors justify-center"
        >
          <Phone size={12} /> {branch.phone}
        </a>
        <button
          type="button"
          onClick={openMaps}
          className="flex items-center gap-1.5 flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white font-medium transition-colors justify-center"
        >
          <Navigation size={12} /> Chỉ đường
        </button>
      </div>
    </div>
  )
}

