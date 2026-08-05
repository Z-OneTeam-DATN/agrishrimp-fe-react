"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
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
import { agronomistOutlineButtonClassName } from "@/components/agronomist/agronomist-ui";

export interface DiseaseOption {
  code: string;
  label: string;
}

export default function DiseaseMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn phác đồ...",
  loading = false,
  emptyMessage = "Không tìm thấy phác đồ đã duyệt.",
}: {
  options: DiseaseOption[];
  value: string[];
  onChange: (codes: string[]) => void;
  placeholder?: string;
  loading?: boolean;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value
    .map((code) => options.find((option) => option.code === code))
    .filter((option): option is DiseaseOption => Boolean(option));

  const toggle = (code: string) => {
    onChange(
      value.includes(code)
        ? value.filter((current) => current !== code)
        : [...value, code],
    );
  };

  const remove = (code: string) => {
    onChange(value.filter((current) => current !== code));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            className={cn(
              agronomistOutlineButtonClassName,
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
                ? `${selected.length} phác đồ đã chọn`
                : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] rounded-md p-0"
        >
          <Command shouldFilter>
            <CommandInput
              placeholder="Tìm theo tên bệnh hoặc mã..."
              className="h-9 text-[13px]"
            />
            <CommandList>
              <CommandEmpty className="px-3 py-4 text-center text-[12px] text-slate-400">
                {loading ? "Đang tải phác đồ..." : emptyMessage}
              </CommandEmpty>
              <CommandGroup>
                {!loading &&
                  options.map((option) => {
                    const checked = value.includes(option.code);
                    return (
                      <CommandItem
                        key={option.code}
                        value={`${option.code} ${option.label}`}
                        onSelect={() => toggle(option.code)}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            checked ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {option.label}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {option.code}
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
              key={option.code}
              variant="secondary"
              className="gap-1.5 rounded-[4px] bg-[#dfe4ff] px-2 py-1 text-[11px] font-medium text-[#252896] hover:bg-[#dfe4ff]"
            >
              <span className="max-w-[220px] truncate">{option.label}</span>
              <button
                type="button"
                onClick={() => remove(option.code)}
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
