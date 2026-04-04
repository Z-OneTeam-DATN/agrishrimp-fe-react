"use client";

import React, { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [searchInput, setSearchInput] = useState("");
  const [searchedLat, setSearchedLat] = useState<number | undefined>();
  const [searchedLng, setSearchedLng] = useState<number | undefined>();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&countrycodes=vn&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSearchedLat(lat);
        setSearchedLng(lng);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Chọn vị trí trên bản đồ</h2>
            <p className="text-xs text-slate-500 mt-1">Nhập địa chỉ để tìm hoặc click trên bản đồ</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 p-4 border-b bg-slate-50">
          <Input
            type="text"
            placeholder="Tìm kiếm địa chỉ, tỉnh, huyện... (VD: Hồ Đắc Kiện, Cần Thơ)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-9 text-sm"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchInput.trim()}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSearching ? (
              <span className="animate-spin mr-1">⟳</span>
            ) : (
              <Search size={16} className="mr-1" />
            )}
            Tìm
          </Button>
        </div>

        {/* Map */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-slate-100"><p className="text-slate-500">Đang tải bản đồ...</p></div>}>
            <MapComponent
              initialLat={initialLat}
              initialLng={initialLng}
              searchedLat={searchedLat}
              searchedLng={searchedLng}
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
