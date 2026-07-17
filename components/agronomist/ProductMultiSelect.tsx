"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export interface ProductOption {
  id: number;
  label: string;
}

export default function ProductMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Tìm sản phẩm trong catalog...",
}: {
  options: ProductOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((option) => value.includes(option.id));

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((current) => current !== id) : [...value, id]);
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
            className="h-[38px] w-full justify-between rounded-md border-slate-200 bg-white px-3 text-[13px] font-normal shadow-none"
          >
            <span className={cn("truncate", selected.length === 0 && "text-slate-400")}>
              {selected.length > 0 ? `${selected.length} sản phẩm đã chọn` : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] rounded-md p-0">
          <Command shouldFilter>
            <CommandInput placeholder="Tìm theo tên sản phẩm..." className="h-9 text-[13px]" />
            <CommandList>
              <CommandEmpty className="px-3 py-4 text-center text-[12px] text-slate-400">
                Không tìm thấy sản phẩm trong catalog — liên hệ admin để thêm sản phẩm mới.
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const checked = value.includes(option.id);
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => toggle(option.id)}
                      className="text-[13px]"
                    >
                      <Check className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")} />
                      {option.label}
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
              className="gap-1 rounded-[4px] bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            >
              {option.label}
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
