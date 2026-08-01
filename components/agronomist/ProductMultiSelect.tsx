"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, ImageOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { agronomistInputClassName } from "@/components/agronomist/agronomist-ui";

export interface ProductOption {
  id: number;
  label: string;
  imageUrl?: string | null;
}

export default function ProductMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Tìm sản phẩm trong catalog...",
  loading = false,
  emptyMessage = "Không tìm thấy sản phẩm trong catalog — liên hệ admin để thêm sản phẩm mới.",
}: {
  options: ProductOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  loading?: boolean;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((option) => value.includes(option.id));

  const toggle = (id: number) => {
    onChange(
      value.includes(id)
        ? value.filter((current) => current !== id)
        : [...value, id],
    );
  };

  const remove = (id: number) => {
    onChange(value.filter((current) => current !== id));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className={cn(
              agronomistInputClassName,
              "w-full justify-between px-3 font-normal",
            )}
          >
            <span
              className={cn(
                "truncate",
                selected.length === 0 && "text-slate-400",
              )}
            >
              {selected.length > 0
                ? `${selected.length} sản phẩm đã chọn`
                : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] rounded-md p-0"
        >
          <Command shouldFilter>
            <CommandInput
              placeholder="Tìm theo tên sản phẩm..."
              className="h-9 text-[13px]"
            />
            <CommandList>
              <CommandEmpty className="px-3 py-4 text-center text-[12px] text-slate-400">
                {loading ? "Đang tải sản phẩm..." : emptyMessage}
              </CommandEmpty>
              <CommandGroup>
                {!loading &&
                  options.map((option) => {
                    const checked = value.includes(option.id);
                    return (
                      <CommandItem
                        key={option.id}
                        value={option.label}
                        onSelect={() => toggle(option.id)}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            checked ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <ProductThumb
                          imageUrl={option.imageUrl}
                          label={option.label}
                          className="h-9 w-9"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {option.label}
                        </span>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="gap-1.5 rounded-[4px] bg-[#dfe4ff] px-2 py-1 text-[11px] font-medium text-[#252896] hover:bg-[#dfe4ff]"
            >
              <ProductThumb
                imageUrl={option.imageUrl}
                label={option.label}
                className="h-5 w-5"
              />
              <span className="max-w-[220px] truncate">{option.label}</span>
              <button
                type="button"
                onClick={() => remove(option.id)}
                className="ml-0.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductThumb({
  imageUrl,
  label,
  className,
}: {
  imageUrl?: string | null;
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-slate-300",
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={label}
          fill
          sizes="36px"
          className="object-cover"
        />
      ) : (
        <ImageOff className="h-4 w-4" />
      )}
    </span>
  );
}
