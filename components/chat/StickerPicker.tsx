"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Smile, Star, Cat, Flame } from "lucide-react";
import { ChatService } from "@/app/services/chat.service";

interface StickerItem {
  id: string;
  url: string;
  label: string;
  tags: string[];
}

interface StickerPack {
  id: string;
  name: string;
  icon: React.ReactNode;
  stickers: StickerItem[];
}

const NOTO_PACK: StickerItem[] = [
  { id: "noto_haha", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif", label: "Haha", tags: ["happy", "fun", "laugh", "smile"] },
  { id: "noto_love", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif", label: "Yêu", tags: ["love", "heart", "kiss"] },
  { id: "noto_like", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif", label: "Thích", tags: ["happy", "active", "like"] },
  { id: "noto_cry", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.gif", label: "Khóc", tags: ["sad", "cry", "pain"] },
  { id: "noto_think", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif", label: "Suy nghĩ", tags: ["confused", "think", "what"] },
  { id: "noto_clap", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif", label: "Vỗ tay", tags: ["party", "celebrate", "congrats"] },
  { id: "noto_fire", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif", label: "Lửa", tags: ["active", "celebrate", "fire"] },
  { id: "noto_wow", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/512.gif", label: "Wow", tags: ["confused", "think", "what"] },
  { id: "noto_party", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif", label: "Tiệc", tags: ["party", "celebrate", "congrats"] },
  { id: "noto_angry", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.gif", label: "Giận dữ", tags: ["angry", "hate", "mad"] },
  { id: "noto_sweat", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f605/512.gif", label: "Đổ mồ hôi", tags: ["confused", "work", "sad"] },
  { id: "noto_sleepy", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62a/512.gif", label: "Buồn ngủ", tags: ["sleepy", "tired", "bed"] },
];

const DINO_PACK: StickerItem[] = [
  { id: "dino_happy", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3hxdWZ6cTNuOW5udWZndXp4OGc0czdud3I4ZmpkcHRoc2p1cWc3NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/jI2mzYZtwqF1KKQA2d/giphy.gif", label: "Khủng long vui vẻ", tags: ["happy", "fun", "active"] },
  { id: "dino_love", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnU4aDB2ZHBmdThidmdrNXdjaWZibWphMTBoazYyODNmdWdrOTZ6bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/JmDsg11lU4WaUrZkmk/giphy.gif", label: "Khủng long đáng yêu", tags: ["love", "heart"] },
  { id: "dino_eat", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTV2cTBvMHloMDhmdTZ6YW95M3Vsd2tvdDVqZngybWh5ZHJ2eXVvcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wwddp29U3sw8A/giphy.gif", label: "Khủng long đang ăn", tags: ["eating", "food", "happy"] },
  { id: "dino_sleep", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWVjcTZndzdrZ2szdnE1enZhdGtxamg2Z3FodjV6bTZvMGgwaG9idSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0CLUG2n7wPf6s33G/giphy.gif", label: "Khủng long buồn ngủ", tags: ["sleepy", "tired", "bed"] },
  { id: "dino_run", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHgzcWhzcm1odHoxcm9iaWRoZjhsbzhsbjBvczdxcmlmdXpxYnVyNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKuylrX8kTdOBEI/giphy.gif", label: "Khủng long chạy bộ", tags: ["active", "run"] },
  { id: "dino_cry", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTJmaG5ubHZsNmF2MGdtam4xaHNhdXRmdWJ6czJ2eHhhc2szZWlyMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/7SF5scGB2AFrCJJasI/giphy.gif", label: "Khủng long buồn", tags: ["sad", "cry"] },
];

const CAT_PACK: StickerItem[] = [
  { id: "cat_happy", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3JpNGtxZWsybmk0ZGlhdDFvNXdkaHBkZGRrZHptamg2am1vZW5rdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/mlvseq9yvZhba/giphy.gif", label: "Mèo nhảy múa", tags: ["happy", "active", "fun"] },
  { id: "cat_love", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHpsYWthOXlpcHFtOHZ4NXF1dm11ejNlMmdvOHU3ejNlc3E4MGZ2dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/111ebonMs9xYoo/giphy.gif", label: "Mèo thả tim", tags: ["love", "heart"] },
  { id: "cat_think", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnQxOGoxdWU0bWdydWswdm90ejZ6azUzdHRzNDV6MTNnMXJ6NXdvaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/26gR2fIIciCo8ue3u/giphy.gif", label: "Mèo bối rối", tags: ["confused", "think"] },
  { id: "cat_sleep", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGdyNjV1bnl4NmpsdzU4M3Vncmh2YWpvdDF3dTAxczBnaTlpZWZscSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/12PA1eI8FBqEUM/giphy.gif", label: "Mèo ngủ ngon", tags: ["sleepy", "tired", "bed"] },
  { id: "cat_cry", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmxrNjJxdHNzdW50dHBmbmxjNHBsbTBkMnhoZnJjcWhkMnFjcHZsZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/X83YJN3uf21TEc0RxK/giphy.gif", label: "Mèo mếu máo", tags: ["sad", "cry"] },
  { id: "cat_angry", url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3lzdzgwcTkwZzBsczR4dmFqMHppZThqenUweXo2Y2Y2dmVnd2g1YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/AC1m4EBK7YURy/giphy.gif", label: "Mèo nổi giận", tags: ["angry", "hate", "mad"] },
];

const STICKER_PACKS: StickerPack[] = [
  { id: "search", name: "Tìm kiếm", icon: <Search className="w-4 h-4" />, stickers: [] },
  { id: "noto", name: "Noto Emoji", icon: <Smile className="w-4 h-4 text-amber-500" />, stickers: NOTO_PACK },
  { id: "dino", name: "Dino", icon: <Flame className="w-4 h-4 text-emerald-500" />, stickers: DINO_PACK },
  { id: "cat", name: "Cute Cat", icon: <Cat className="w-4 h-4 text-pink-500" />, stickers: CAT_PACK },
];

const CATEGORIES = [
  { name: "Vui vẻ", tag: "happy", color: "bg-amber-400 hover:bg-amber-500 text-white" },
  { name: "Đang Yêu", tag: "love", color: "bg-pink-500 hover:bg-pink-600 text-white" },
  { name: "Buồn", tag: "sad", color: "bg-gray-400 hover:bg-gray-500 text-white" },
  { name: "Đang Ăn", tag: "eating", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { name: "Đang Chúc Mừng", tag: "party", color: "bg-purple-500 hover:bg-purple-600 text-white" },
  { name: "Đang Hoạt Động", tag: "active", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { name: "Đang Làm Việc", tag: "work", color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  { name: "Buồn Ngủ", tag: "sleepy", color: "bg-indigo-500 hover:bg-indigo-600 text-white" },
  { name: "Giận Dữ", tag: "angry", color: "bg-red-500 hover:bg-red-600 text-white" },
  { name: "Bối Rối", tag: "confused", color: "bg-yellow-600 hover:bg-yellow-700 text-white" },
];

interface StickerPickerProps {
  onSelectSticker: (url: string) => void;
  onClose: () => void;
  className?: string;
}

export default function StickerPicker({ onSelectSticker, onClose, className = "" }: StickerPickerProps) {
  const [activeTab, setActiveTab] = useState<string>("search");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dynamicPacks, setDynamicPacks] = useState<StickerPack[]>([]);

  useEffect(() => {
    let active = true;
    ChatService.getStickerPacks()
      .then(data => {
        if (!active) return;
        const mappedPacks = data.map((pack: any) => ({
          id: String(pack.id),
          name: pack.name,
          icon: pack.iconUrl ? (
            <img src={pack.iconUrl} className="w-5 h-5 object-contain rounded-md" alt={pack.name} />
          ) : (
            <Smile className="w-4 h-4 text-amber-500" />
          ),
          stickers: (pack.stickers || []).map((s: any) => ({
            id: String(s.id),
            url: s.url,
            label: s.label || "",
            tags: s.label ? [s.label.toLowerCase()] : []
          }))
        }));
        setDynamicPacks(mappedPacks);
      })
      .catch(err => {
        console.error("Failed to load stickers from API, using static pack fallback", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayPacks = useMemo(() => {
    const packs = dynamicPacks.length > 0 
      ? dynamicPacks 
      : STICKER_PACKS.filter(p => p.id !== "search");

    return [
      { id: "search", name: "Tìm kiếm", icon: <Search className="w-4 h-4" />, stickers: [] },
      ...packs
    ];
  }, [dynamicPacks]);

  const allStickers = useMemo(() => {
    return displayPacks.flatMap(p => p.stickers);
  }, [displayPacks]);

  const filteredStickers = useMemo(() => {
    let list = allStickers;
    if (activeTab !== "search") {
      const pack = displayPacks.find(p => p.id === activeTab);
      list = pack ? pack.stickers : [];
    }

    if (selectedTag) {
      list = list.filter(sticker => sticker.tags.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(sticker => 
        sticker.label.toLowerCase().includes(q) || 
        sticker.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeTab, searchQuery, selectedTag, allStickers, displayPacks]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedTag(null);
    setSearchQuery("");
  };

  const handleCategoryClick = (tag: string) => {
    setSelectedTag(tag);
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] w-80 h-[380px] z-50 overflow-hidden animate-fadeIn ${className}`}>
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-gray-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-1">
          {displayPacks.map(pack => (
            <button
              key={pack.id}
              onClick={() => handleTabChange(pack.id)}
              className={`p-2 rounded-xl transition-all ${
                activeTab === pack.id
                  ? "bg-slate-100 dark:bg-slate-800 scale-105"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
              title={pack.name}
            >
              {pack.icon}
            </button>
          ))}
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
        {activeTab === "search" && !selectedTag && !searchQuery ? (
          /* Categories Grid when Search is Empty */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="relative mb-3 shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhãn dán..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Nhãn dán nổi bật</h4>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCategoryClick(cat.tag)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm flex items-center justify-center gap-1.5 ${cat.color}`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Sticker List Grid with Back Button if filtering */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              {activeTab === "search" && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhãn dán..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
              {(selectedTag || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedTag(null);
                    setSearchQuery("");
                  }}
                  className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors shrink-0"
                >
                  Quay lại
                </button>
              )}
            </div>

            {/* Sticker Grid */}
            <div className="flex-1 overflow-y-auto pr-0.5">
              {filteredStickers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="text-xs">Không tìm thấy nhãn dán nào</span>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {filteredStickers.map(sticker => (
                    <button
                      key={sticker.id}
                      onClick={() => onSelectSticker(sticker.url)}
                      className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-95 flex items-center justify-center group"
                      title={sticker.label}
                    >
                      <img
                        src={sticker.url}
                        alt={sticker.label}
                        className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
