"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { driverService } from "@/app/services/driver.service";
import { Driver } from "@/app/types/driver.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DriverNameSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  onDriverChange?: (driver: Driver | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  error?: boolean;
};

export function DriverNameSelect({
  value,
  onChange,
  onDriverChange,
  placeholder = "Chọn tài xế",
  disabled = false,
  className,
  triggerClassName,
  error = false,
}: DriverNameSelectProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchDrivers = async () => {
      setIsLoading(true);
      try {
        const response = await driverService.getAll(undefined, "ACTIVE", 0, 200);
        if (!mounted) return;
        setDrivers(response.content || []);
      } catch {
        if (!mounted) return;
        setDrivers([]);
        toast.error("Không thể tải danh sách tài xế");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void fetchDrivers();

    return () => {
      mounted = false;
    };
  }, []);

  const driverNames = useMemo(() => {
    const names = drivers
      .map((driver) => driver.fullName?.trim())
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(names));
  }, [drivers]);

  const selectedName = value?.trim() || undefined;
  const shouldIncludeSelected =
    selectedName && !driverNames.includes(selectedName);
  const handleValueChange = (nextValue: string) => {
    onChange(nextValue);
    const selectedDriver =
      drivers.find((driver) => driver.fullName?.trim() === nextValue) || null;
    onDriverChange?.(selectedDriver);
  };

  return (
    <Select
      value={selectedName}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger
        className={cn(
          "h-10 border-slate-200 bg-white text-[13px] shadow-none",
          error && "border-rose-500",
          triggerClassName,
          className,
        )}
      >
        <SelectValue placeholder={isLoading ? "Đang tải tài xế..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {shouldIncludeSelected && (
          <SelectItem value={selectedName}>{selectedName}</SelectItem>
        )}
        {driverNames.length > 0 ? (
          driverNames.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="__NO_ACTIVE_DRIVER__" disabled>
            Chưa có tài xế
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
