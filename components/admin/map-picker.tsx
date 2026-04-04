"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MapComponent = dynamic(() => import("./map-component"), {
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-100"><p className="text-slate-500">Đang tải bản đồ...</p></div>,
  ssr: false,
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  onClose: () => void;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng, onClose }: MapPickerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Chọn vị trí trên bản đồ</h2>
            <p className="text-xs text-slate-500 mt-1">Click trên bản đồ để chọn tọa độ</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-slate-100"><p className="text-slate-500">Đang tải bản đồ...</p></div>}>
            <MapComponent
              initialLat={initialLat}
              initialLng={initialLng}
              onLocationSelect={onLocationSelect}
            />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="h-8 text-sm"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
