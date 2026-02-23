"use client";

import React, { useRef, useEffect } from "react";
import {
  Code,
  Type,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Outdent,
  Indent,
  Quote,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  label?: string;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

export function RichTextEditor({
  label,
  placeholder,
  className,
  minHeight = "150px",
  value,
  onChange,
  onBlur,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Set initial HTML on mount only — avoids React fighting with contentEditable
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <p className="text-[11px] font-bold text-slate-500 uppercase">
          {label}
        </p>
      )}
      <div className="border border-[#ccc] rounded-[2px] bg-white overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#f8f9fa] border-b border-[#eee]">
          <div className="flex items-center gap-1 px-2 border-r border-[#ddd]">
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <Code size={14} />
            </button>
            <span className="text-[11px] font-medium text-slate-400 ml-1">
              Mã HTML
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 border-r border-[#ddd]">
            <span className="text-[12px] font-medium text-slate-600">
              Định dạng
            </span>
            <ChevronDown size={12} className="text-slate-400" />
          </div>

          <div className="flex items-center gap-1 px-1 border-r border-[#ddd]">
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <ImageIcon size={14} />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <TableIcon size={14} />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <AlignLeft size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 px-1 border-r border-[#ddd]">
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-800 font-bold"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600 italic"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600 underline"
            >
              <Underline size={14} />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600 line-through"
            >
              <Strikethrough size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 px-1 border-r border-[#ddd]">
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <ListOrdered size={14} />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <List size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 px-1 border-r border-[#ddd]">
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <Outdent size={14} />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <Indent size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 px-1">
            <button
              type="button"
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
            >
              <Quote size={14} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          ref={editorRef}
          className="p-3 focus:outline-none text-[13px] text-slate-700 bg-white"
          style={{ minHeight }}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange?.(e.currentTarget.innerHTML)}
          onBlur={onBlur}
          data-placeholder={placeholder}
        />

        {/* Footer info (like the resize handle in image) */}
        <div className="bg-[#f1f1f1] h-[18px] flex justify-end items-center px-1">
          <div className="w-2 h-2 border-r border-b border-slate-300 rotate-45 transform -translate-y-1 -translate-x-1"></div>
        </div>
      </div>
    </div>
  );
}
