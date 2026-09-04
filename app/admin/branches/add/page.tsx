"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AdminBranchSchema, AdminBranchForm } from "@/app/types/admin.schema";
import { branchService } from "@/app/services/branchService";
import { locationService } from "@/app/services/address.service";
import { EmployeeService } from "@/app/services/employee.service";
import { normalizeRoleSlug } from "@/lib/roles";

const AddressMapPicker = dynamic(
  () => import("@/components/admin/AddressMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] items-center justify-center border border-slate-200 bg-slate-50 text-[12px] text-slate-400">
        Đang tải bản đồ...
      </div>
    ),
  },
);

// --- HELPERS TRÍCH XUẤT DỮ LIỆU ---
type ProvinceOption = {
  id: number;
  name: string;
};

type DistrictOption = {
  id: number;
  name: string;
};

type WardOption = {
  wardId?: number;
  code: string;
  name: string;
};

const sortByVietnameseName = <T extends { name: string }>(items: T[]) =>
  [...items].sort((left, right) => left.name.localeCompare(right.name, "vi"));

const getProvId = (item: any) =>
  item?.ProvinceID ?? item?.province_id ?? item?.code ?? item?.id ?? "";
const getProvName = (item: any) =>
  item?.ProvinceName ?? item?.province_name ?? item?.full_name ?? item?.name ?? "";
const getDistrictId = (item: any) =>
  item?.DistrictID ?? item?.district_id ?? item?.code ?? item?.id ?? "";
const getDistrictName = (item: any) =>
  item?.DistrictName ?? item?.district_name ?? item?.full_name ?? item?.name ?? "";
const getWardId = (item: any) =>
  item?.WardCode ??
  item?.ward_code ??
  item?.code ??
  item?.WardID ??
  item?.id ??
  "";
const getWardCode = (item: any) =>
  item?.code ?? item?.WardCode ?? item?.ward_code ?? item?.wardCode ?? "";
const getWardName = (item: any) =>
  item?.WardName ?? item?.ward_name ?? item?.full_name ?? item?.name ?? "";

const toFiniteCoordinate = (value: unknown) => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValidCoordinatePair = (latValue: unknown, lngValue: unknown) => {
  const lat = toFiniteCoordinate(latValue);
  const lng = toFiniteCoordinate(lngValue);
  return (
    lat !== null &&
    lng !== null &&
    !(Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001)
  );
};

const normalizeAddressText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(huyen|h\.uyen|h\. |quan|q\.|tp|tp\.|thanh pho|thanh pho|thanh pho\.)\b/gi,
      "",
    )
    .replace(/\b(phuong|phuong\.|xa|xa\.|thi tran|thi xa|thi xa\.)\b/gi, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const getConfirmedAddressDetail = (data: any) => {
  const confirmedAddress =
    data?.mapDisplayName || data?.fullAddress || data?.addressDetail || "";
  if (!confirmedAddress) return "";

  const ignored = [
    data?.wardName,
    data?.districtName,
    data?.provinceName,
    "Vietnam",
    "Viet Nam",
  ]
    .filter(Boolean)
    .map((value) => normalizeAddressText(String(value)));

  const parts = confirmedAddress
    .split(",")
    .map((part: string) => part.trim())
    .filter(Boolean)
    .filter((part: string) => {
      const normalizedPart = normalizeAddressText(part);
      return !ignored.some(
        (scope) =>
          normalizedPart === scope ||
          normalizedPart.includes(scope) ||
          scope.includes(normalizedPart),
      );
    });

  return parts.length > 0
    ? parts.slice(0, 3).join(", ")
    : confirmedAddress.split(",")[0]?.trim() || confirmedAddress;
};

const resolveLocationOption = (
  list: any[],
  ids: Array<string | number | null | undefined>,
  names: Array<string | null | undefined>,
  getId: (item: any) => string | number,
  getName: (item: any) => string,
) => {
  const idCandidates = ids
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
    .map((value) => String(value));
  const nameCandidates = names
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => normalizeAddressText(value));

  return list.find((item) => {
    const itemId = String(getId(item));
    const itemName = normalizeAddressText(getName(item));
    return (
      idCandidates.includes(itemId) ||
      nameCandidates.some(
        (name) => itemName === name || itemName.includes(name) || name.includes(itemName),
      )
    );
  });
};

const isBranchManagerCandidate = (staff: any) => {
  const roleSlug = normalizeRoleSlug(staff?.role);
  return Boolean(roleSlug) && roleSlug !== "CUSTOMER" && roleSlug !== "AGRONOMIST";
};

export default function AddBranchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchId = searchParams.get("id");
  const isEditMode = Boolean(branchId);

  const [isLoading, setIsLoading] = useState(false);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [assignedManagerIds, setAssignedManagerIds] = useState<Set<number>>(
    new Set(),
  );
  const [currentBranchManagerIds, setCurrentBranchManagerIds] = useState<
    Set<number>
  >(new Set());
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationHydrationWarning, setLocationHydrationWarning] = useState<string | null>(null);

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingAddressSuggestions, setIsLoadingAddressSuggestions] =
    useState(false);
  const [mapDisplayName, setMapDisplayName] = useState("");
  const suggestionRef = useRef<HTMLDivElement>(null);
  const addressSuggestionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const addressSuggestionRequestRef = useRef(0);
  const pendingEditLocationRef = useRef<{
    district: string;
    ward: string;
  } | null>(null);
  const loadedProvinceRef = useRef("");
  const loadedDistrictRef = useRef("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    clearErrors,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdminBranchForm>({
    resolver: zodResolver(AdminBranchSchema),
    defaultValues: {
      id: "",
      name: "",
      managerId: "",
      phone: "",
      email: "",
      province: "",
      district: "",
      ward: "",
      addressDetail: "",
      status: "active",
      branchType: "STORE",
    },
  });

  const watchedProvince = watch("province");
  const watchedDistrict = watch("district");
  const watchedWard = watch("ward");
  const watchedManagerId = watch("managerId");
  const addressDetailValue = watch("addressDetail");
  const watchedLat = watch("lat");
  const watchedLng = watch("lng");

  const currentProvince = useMemo(
    () => provinces.find((p) => String(getProvId(p)) === watchedProvince),
    [provinces, watchedProvince],
  );
  const currentDistrict = useMemo(
    () => districts.find((d) => String(getDistrictId(d)) === watchedDistrict),
    [districts, watchedDistrict],
  );
  const currentWard = useMemo(
    () =>
      wards.find(
        (w) =>
          String(getWardCode(w)) === watchedWard ||
          String(getWardId(w)) === watchedWard,
      ),
    [wards, watchedWard],
  );

  const resolveWardSelectValue = (
    wardList: any[],
    values: Array<string | number | null | undefined>,
  ) => {
    const candidates = values
      .filter(
        (value) =>
          value !== null && value !== undefined && String(value).trim() !== "",
      )
      .map((value) => String(value));

    if (candidates.length === 0) {
      return "";
    }

    const matchedWard = wardList.find((ward: any) => {
      const wardCode = String(
        ward?.WardCode ?? ward?.ward_code ?? ward?.code ?? "",
      );
      const wardId = String(ward?.WardID ?? ward?.wardId ?? ward?.id ?? "");
      return candidates.includes(wardCode) || candidates.includes(wardId);
    });

    return matchedWard ? String(getWardCode(matchedWard)) : candidates[0];
  };

  // --- 1. KHỞI TẠO DỮ LIỆU ---
  useEffect(() => {
    const initData = async () => {
      try {
        const [empRes, provResponse, branchRes] = await Promise.all([
          EmployeeService.getAll({
            size: 500,
            status: "ACTIVE",
          }),
          locationService.getProvinces(),
          branchService.getAll(),
        ]);

        const rawStaffs = extractArray(empRes);
        setStaffs(rawStaffs);

        const branches = extractArray(branchRes);
        const managerIdSet = new Set<number>();
        branches.forEach((branch: any) => {
          const ids = Array.isArray(branch?.managerIds)
            ? branch.managerIds
            : [];
          ids.forEach((id: any) => {
            const parsed = Number(id);
            if (!Number.isNaN(parsed) && parsed > 0) {
              managerIdSet.add(parsed);
            }
          });
        });
        setAssignedManagerIds(managerIdSet);

        setProvinces(sortByVietnameseName(extractArray(provResponse)));
        setIsInitialLoaded(true);
        if (!isEditMode) {
          setIsFormInitialized(true);
        }
      } catch (error) {
        console.error(error);
        toast.error("Lỗi tải danh sách khởi tạo.");
      }
    };
    initData();
  }, []);

  // --- 2. HIỆN LẠI THÔNG TIN KHI SỬA (FIXED) ---
  useEffect(() => {
    if (isEditMode && branchId && isInitialLoaded) {
      const fetchDetail = async () => {
        try {
          setIsLoading(true);
          const data = await branchService.getById(branchId);
          let districtValue = "";
          let wardValue = String(data.wardCode ?? data.wardId ?? "");
          const managerIds = Array.isArray(data.managerIds)
            ? data.managerIds
            : [];
          const confirmedAddressDetail = getConfirmedAddressDetail(data);

          setCurrentBranchManagerIds(
            new Set(
              managerIds
                .map((id: any) => Number(id))
                .filter((id: number) => !Number.isNaN(id) && id > 0),
            ),
          );

          const matchedProvince = resolveLocationOption(
            provinces,
            [data.provinceId, data.provinceCode],
            [data.provinceName],
            getProvId,
            getProvName,
          );
          const provinceValue = matchedProvince ? String(getProvId(matchedProvince)) : "";

          if (provinceValue) {
            const scopedDistrictList = sortByVietnameseName(
              (await locationService.getDistricts(Number(provinceValue))) ?? [],
            );
            const matchedDistrict = resolveLocationOption(
              scopedDistrictList,
              [data.districtId, data.districtCode],
              [data.districtName],
              getDistrictId,
              getDistrictName,
            );

            districtValue = matchedDistrict
              ? String(getDistrictId(matchedDistrict))
              : "";
            setDistricts(scopedDistrictList);
            loadedProvinceRef.current = provinceValue;
            loadedDistrictRef.current = "";

            if (districtValue) {
              const scopedWardList = sortByVietnameseName(
                (await locationService.getWards(Number(districtValue))) ?? [],
              );
              wardValue = resolveWardSelectValue(scopedWardList, [
                data.wardCode,
                data.wardId,
              ]);
              setWards(scopedWardList);
              loadedDistrictRef.current = districtValue;
            } else {
              wardValue = "";
              setWards([]);
            }
          } else {
            setDistricts([]);
            setWards([]);
            loadedProvinceRef.current = "";
            loadedDistrictRef.current = "";
          }

          setLocationHydrationWarning(
            provinceValue && districtValue && wardValue
              ? null
              : "Chi nhánh này đang dùng metadata địa chỉ cũ hoặc thiếu chuẩn GHN. Vui lòng chọn lại Tỉnh/Thành, Quận/Huyện và Phường/Xã trước khi lưu.",
          );

          reset({
            id: data.branchCode,
            name: data.name,
            branchType: data.branchType,
            phone: data.phone,
            email: data.email || "",
            addressDetail: confirmedAddressDetail,
            province: provinceValue,
            district: districtValue,
            ward: wardValue,
            status: (data.status || "active").toLowerCase(),
            managerId: data.managerIds?.[0] ? String(data.managerIds[0]) : "",
            lat: data.lat,
            lng: data.lng,
          });
          setMapDisplayName(data.mapDisplayName || data.fullAddress || "");
          pendingEditLocationRef.current = {
            district: districtValue,
            ward: wardValue,
          };
          setValue("district", districtValue, { shouldDirty: false });
          setValue("ward", wardValue, { shouldDirty: false });
          setIsFormInitialized(true);
        } catch (error) {
          toast.error("Không thể tải thông tin chi nhánh!");
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetail();
    } else if (!isEditMode && isInitialLoaded) {
      setValue("id", "CN-" + Math.floor(1000 + Math.random() * 9000));
    }
  }, [isEditMode, branchId, isInitialLoaded, provinces, reset, setValue]);

  useEffect(() => {
    const pending = pendingEditLocationRef.current;
    if (!isEditMode || !pending) return;

    const districtReady =
      !pending.district ||
      districts.some(
        (district) => String(getDistrictId(district)) === pending.district,
      );
    const wardReady =
      !pending.ward ||
      wards.some((ward) => String(getWardCode(ward)) === pending.ward);

    if (districtReady && pending.district) {
      setValue("district", pending.district, { shouldDirty: false });
    }

    if (wardReady && pending.ward) {
      setValue("ward", pending.ward, { shouldDirty: false });
    }

    if (districtReady && wardReady) {
      pendingEditLocationRef.current = null;
    }
  }, [districts, wards, isEditMode, setValue]);

  // Logic lấy huyện/xã khi thay đổi select tay
  useEffect(() => {
    if (!watchedProvince) {
      setDistricts([]);
      setWards([]);
      loadedProvinceRef.current = "";
      loadedDistrictRef.current = "";
      return;
    }
    if (!isInitialLoaded || !isFormInitialized || isLoading) {
      return;
    }
    if (loadedProvinceRef.current === watchedProvince) {
      return;
    }

    locationService.getDistricts(Number(watchedProvince))
      .then((districtList) => {
        setDistricts(sortByVietnameseName(districtList ?? []));
        setWards([]);
        loadedProvinceRef.current = watchedProvince;
        loadedDistrictRef.current = "";
        setLocationHydrationWarning(null);
        setValue("district", "", { shouldDirty: true, shouldValidate: true });
        setValue("ward", "", { shouldDirty: true, shouldValidate: true });
      })
      .catch(() => {
        setDistricts([]);
        setWards([]);
        loadedProvinceRef.current = "";
        loadedDistrictRef.current = "";
        setValue("district", "", { shouldDirty: true, shouldValidate: true });
        setValue("ward", "", { shouldDirty: true, shouldValidate: true });
      });
  }, [watchedProvince, isInitialLoaded, isFormInitialized, isLoading, setValue]);

  useEffect(() => {
    if (!watchedDistrict) {
      setWards([]);
      loadedDistrictRef.current = "";
      return;
    }
    if (!isInitialLoaded || !isFormInitialized || isLoading) {
      return;
    }
    if (loadedDistrictRef.current === watchedDistrict) {
      return;
    }

    locationService.getWards(Number(watchedDistrict))
      .then((wardList) => {
        setWards(sortByVietnameseName(wardList ?? []));
        loadedDistrictRef.current = watchedDistrict;
        setLocationHydrationWarning(null);
        setValue("ward", "", { shouldDirty: true, shouldValidate: true });
      })
      .catch(() => {
        setWards([]);
        loadedDistrictRef.current = "";
        setValue("ward", "", { shouldDirty: true, shouldValidate: true });
      });
  }, [watchedDistrict, isInitialLoaded, isFormInitialized, isLoading, setValue]);

  const getScopedAddressDetail = (label: string) => {
    const ignoredScopes = [
      currentWard ? normalizeText(getWardName(currentWard)) : "",
      currentDistrict ? normalizeText(getDistrictName(currentDistrict)) : "",
      currentProvince ? normalizeText(getProvName(currentProvince)) : "",
      normalizeText("Vietnam"),
    ].filter(Boolean);

    const detailParts = label
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => {
        const normalizedPart = normalizeText(part);
        return !ignoredScopes.some(
          (scope) =>
            normalizedPart === scope ||
            normalizedPart.includes(scope) ||
            scope.includes(normalizedPart),
        );
      });

    if (detailParts.length === 0) {
      return label.split(",")[0]?.trim() || label;
    }

    return detailParts.slice(0, 3).join(", ");
  };

  const buildFullAddress = (detail: string) =>
    [
      detail,
      currentWard ? getWardName(currentWard) : "",
      currentDistrict ? getDistrictName(currentDistrict) : "",
      currentProvince ? getProvName(currentProvince) : "",
      "Vietnam",
    ]
      .filter(Boolean)
      .join(", ");

  const syncSelectedMapLocation = (item: any, replaceAddressDetail = true) => {
    const typedDetail = addressDetailValue?.trim();
    const fallbackDetail = getScopedAddressDetail(
      item.sourceDisplayName || item.label || "",
    );
    const nextDetail = fallbackDetail || typedDetail;

    if (replaceAddressDetail && fallbackDetail) {
      setValue("addressDetail", fallbackDetail, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (typeof item.lat === "number" && typeof item.lng === "number") {
      setValue("lat", item.lat, { shouldDirty: true, shouldValidate: true });
      setValue("lng", item.lng, { shouldDirty: true, shouldValidate: true });
      setMapDisplayName(
        item.mapDisplayName || item.sourceDisplayName || buildFullAddress(nextDetail),
      );
    }
  };

  const resolveTypedAddressLocation = async (input?: string) => {
    const detail = (input ?? addressDetailValue ?? "").trim();
    if (!detail || !currentProvince) return null;

    const suggestions = await fetchScopedAddressSuggestions(detail);
    const bestSuggestion = suggestions[0];
    if (!bestSuggestion) return null;

    // Province/ward are authoritative address fields. Geocoding
    // only resolves map coordinates and must never overwrite those selections.
    syncSelectedMapLocation(bestSuggestion, false);
    setAddressSuggestions(suggestions);
    setShowSuggestions(false);
    return {
      lat: bestSuggestion.lat as number,
      lng: bestSuggestion.lng as number,
    };
  };

  const resetSelectedMapLocation = () => {
    setValue("lat", null, { shouldDirty: true });
    setValue("lng", null, { shouldDirty: true });
    setMapDisplayName("");
  };

  const fetchScopedAddressSuggestions = async (input: string) => {
    if (!currentProvince) return [];

    const provinceName = getProvName(currentProvince);
    const districtName = currentDistrict ? getDistrictName(currentDistrict) : "";
    const wardName = currentWard ? getWardName(currentWard) : "";
    const params = new URLSearchParams({ input });
    params.set("province", provinceName);
    if (districtName) params.set("district", districtName);
    if (wardName) params.set("ward", wardName);

    const response = await fetch(`/api/ghn/address-suggestions?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return [];

    const results = await response.json();
    if (!Array.isArray(results)) return [];

    return results
      .map((item: any) => {
        return {
          label: item.label || input,
          name: item.label || input,
          sourceDisplayName: item.label || "",
          province: item.province || provinceName,
          district: item.district || "",
          ward: item.ward || wardName,
          lat: item.lat ? Number(item.lat) : undefined,
          lng: item.lng ? Number(item.lng) : undefined,
          mapDisplayName: item.label || buildFullAddress(input),
          source: item.source || "trackasia",
          locationType: item.locationType || "",
          placeId: item.placeId || "",
        };
      })
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .filter(
        (item, index, array) =>
          array.findIndex(
            (current) =>
              current.label === item.label ||
              (`${current.lat},${current.lng}` === `${item.lat},${item.lng}`),
          ) === index,
      )
      .slice(0, 5);
  };

  useEffect(() => {
    if (addressSuggestionTimeoutRef.current) {
      clearTimeout(addressSuggestionTimeoutRef.current);
    }

    const input = addressDetailValue?.trim() || "";
    if (!input || input.length < 3 || !currentProvince) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingAddressSuggestions(false);
      return;
    }

    addressSuggestionTimeoutRef.current = setTimeout(async () => {
      const requestId = addressSuggestionRequestRef.current + 1;
      addressSuggestionRequestRef.current = requestId;

      try {
        setIsLoadingAddressSuggestions(true);

        const nextSuggestions = await fetchScopedAddressSuggestions(input);

        if (requestId !== addressSuggestionRequestRef.current) {
          return;
        }

        setAddressSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);

        const canAutoLocate =
          Boolean(currentProvince) &&
          Boolean(currentDistrict) &&
          Boolean(currentWard) &&
          input.length >= 5;
        const bestSuggestion = nextSuggestions[0];
        if (canAutoLocate && bestSuggestion) {
          syncSelectedMapLocation(bestSuggestion, false);
        }
      } catch (e) {
        if (requestId !== addressSuggestionRequestRef.current) {
          return;
        }
        console.error("Error fetching scoped address suggestions", e);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingAddressSuggestions(false);
      }
    }, 900);

    return () => {
      if (addressSuggestionTimeoutRef.current) {
        clearTimeout(addressSuggestionTimeoutRef.current);
      }
    };
  }, [addressDetailValue, currentProvince, currentDistrict, currentWard]);

  useEffect(() => {
    setAddressSuggestions([]);
    setShowSuggestions(false);
  }, [watchedProvince, watchedDistrict, watchedWard]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      )
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeText = normalizeAddressText;
  const onSubmit = async (data: AdminBranchForm) => {
    try {
      setIsLoading(true);
      let resolvedLat = toFiniteCoordinate(data.lat);
      let resolvedLng = toFiniteCoordinate(data.lng);

      if (!hasValidCoordinatePair(resolvedLat, resolvedLng)) {
        resolvedLat = null;
        resolvedLng = null;
      }

      if (
        (resolvedLat === null || resolvedLng === null) &&
        data.addressDetail?.trim()
      ) {
        const resolvedLocation = await resolveTypedAddressLocation(data.addressDetail);
        if (resolvedLocation) {
          resolvedLat = resolvedLocation.lat;
          resolvedLng = resolvedLocation.lng;
          data.lat = resolvedLocation.lat;
          data.lng = resolvedLocation.lng;
        }
      }

      if (resolvedLat === null || resolvedLng === null) {
        toast.error("Vui lòng chọn vị trí trên bản đồ");
        setIsLoading(false);
        return;
      }

      const selectedDistrictObj = districts.find(
        (district) => String(getDistrictId(district)) === data.district,
      );
      const selectedWardObj = wards.find(
        (w: any) => String(getWardCode(w)) === data.ward,
      );
      const resolvedWardCode = selectedWardObj
        ? String(getWardCode(selectedWardObj))
        : "";
      if (!selectedDistrictObj) {
        toast.error("Vui long chon Quan/Huyen theo chuan GHN.");
        setIsLoading(false);
        return;
      }
      if (!selectedWardObj || !resolvedWardCode) {
        toast.error("Vui lòng chọn Phường/Xã theo địa chỉ sau sáp nhập.");
        setIsLoading(false);
        return;
      }

      const fullAddress = buildFullAddress(data.addressDetail);
      const payload = {
        branchCode: data.id,
        name: data.name,
        branchType: data.branchType,
        type: data.branchType,
        phone: data.phone,
        email: data.email,
        addressDetail: data.addressDetail,
        detailAddress: data.addressDetail,
        fullAddress,
        provinceId: Number(data.province),
        provinceCode: Number(data.province),
        districtId: Number(data.district),
        districtCode: Number(data.district),
        wardId:
          selectedWardObj?.wardId ??
          Number(resolvedWardCode),
        wardCode:
          (
            selectedWardObj?.code ??
            resolvedWardCode
          ) || null,
        provinceName: currentProvince ? getProvName(currentProvince) : "",
        districtName: getDistrictName(selectedDistrictObj),
        wardName: getWardName(selectedWardObj),
        status: data.status.toUpperCase(),
        managerId: data.managerId ? Number(data.managerId) : null,
        managerIds: data.managerId ? [Number(data.managerId)] : [],
        lat: resolvedLat,
        lng: resolvedLng,
        latitude: resolvedLat,
        longitude: resolvedLng,
        mapDisplayName,
      };

      if (isEditMode) {
        await branchService.update(branchId!, payload);
      } else {
        await branchService.create(payload);
      }
      toast.success("Thành công!");
      router.push("/admin/branches");
    } catch (error: any) {
      toast.error("Lỗi lưu dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchInput = (placeholder: string) => (
    <div className="sticky top-0 z-10 bg-white p-2 border-b">
      <div className="relative">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          size={14}
        />
        <Input
          placeholder={placeholder}
          className="h-8 pl-8 text-[12px] focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  const filteredProvinces = useMemo(
    () =>
      provinces.filter((p) =>
        getProvName(p).toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [provinces, searchTerm],
  );
  const filteredDistricts = useMemo(
    () =>
      districts.filter((district) =>
        getDistrictName(district)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [districts, searchTerm],
  );
  const filteredWards = useMemo(
    () =>
      wards.filter((w) =>
        getWardName(w).toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [wards, searchTerm],
  );

  const missingShippingConfigFields = useMemo(() => {
    if (!isFormInitialized) return [];

    const missing: string[] = [];
    if (!watchedProvince) missing.push("Tinh/Thanh");
    if (!watchedDistrict) {
      missing.push("Quan/Huyen");
    }
    if (!watchedWard) {
      missing.push("Phuong/Xa");
    }
    if (
      !hasValidCoordinatePair(watchedLat, watchedLng)
    ) {
      missing.push("tọa độ bản đồ");
    }
    return missing;
  }, [
    isFormInitialized,
    watchedProvince,
    watchedDistrict,
    watchedWard,
    watchedLat,
    watchedLng,
  ]);

  const availableStaffs = useMemo(() => {
    const selectedManagerId = Number(watchedManagerId);
    return staffs.filter((staff) => {
      const staffId = Number(staff?.id);
      if (Number.isNaN(staffId) || staffId <= 0) return false;
      if (!isBranchManagerCandidate(staff)) return false;
      if (selectedManagerId && staffId === selectedManagerId) return true;

      if (isEditMode && currentBranchManagerIds.has(staffId)) {
        return true;
      }

      // Không cho chọn người của chi nhánh khác
      if (staff?.branch?.id) {
        if (isEditMode && branchId) {
          if (Number(staff.branch.id) !== Number(branchId)) {
            return false;
          }
        } else {
          // Trong mode tạo mới, nếu đã thuộc chi nhánh nào đó thì không được chọn
          return false;
        }
      }

      return !assignedManagerIds.has(staffId);
    });
  }, [
    assignedManagerIds,
    currentBranchManagerIds,
    staffs,
    watchedManagerId,
    isEditMode,
    branchId,
  ]);

  const filteredStaffs = useMemo(
    () =>
      availableStaffs.filter((s) =>
        (s?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [availableStaffs, searchTerm],
  );

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3 pb-[100px] text-slate-800"
      >
        <div className="mt-2 mb-8 space-y-4">
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            {isEditMode ? "Cập nhật chi nhánh" : "Thêm chi nhánh mới"}
          </h1>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-[11px] font-bold text-slate-800">
                1. Thông tin cơ bản
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Tên chi nhánh *
                </Label>
                <Input
                  {...register("name")}
                  className={`h-9 text-[13px] ${errors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  placeholder="Nhập tên chi nhánh..."
                />
                {errors.name && (
                  <span className="text-[11px] text-rose-500">
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Loại hình *
                </Label>
                <Controller
                  name="branchType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-[12px] font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WAREHOUSE">
                          Kho trung tâm / Trụ sở
                        </SelectItem>
                        <SelectItem value="STORE">Cửa hàng bán lẻ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Trạng thái
                </Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-[12px] font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Đang hoạt động</SelectItem>
                        <SelectItem value="inactive">
                          Ngừng hoạt động
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-[11px] font-bold text-slate-800">
                2. Địa chỉ & vị trí
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Tỉnh / Thành phố *
                </Label>
                <Controller
                  name="province"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onOpenChange={(open) => {
                        if (open) setSearchTerm("");
                      }}
                      onValueChange={(val) => {
                        field.onChange(val);
                        loadedProvinceRef.current = "";
                        loadedDistrictRef.current = "";
                        setSearchTerm("");
                        setDistricts([]);
                        setWards([]);
                        setLocationHydrationWarning(null);
                        setValue("district", "");
                        setValue("ward", "");
                        resetSelectedMapLocation();
                      }}
                      value={field.value}
                    >
                      <SelectTrigger
                        className={`h-9 text-[12px] ${errors.province ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                      >
                        <SelectValue placeholder="Chọn tỉnh / thành phố" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000] p-0">
                        {renderSearchInput("Tìm tỉnh...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredProvinces.map((p) => (
                            <SelectItem
                              key={getProvId(p)}
                              value={String(getProvId(p))}
                            >
                              {getProvName(p)}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.province && (
                  <span className="text-[11px] text-rose-500">
                    {errors.province.message}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Quận / Huyện *
                </Label>
                <Controller
                  name="district"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onOpenChange={(open) => {
                        if (open) setSearchTerm("");
                      }}
                      onValueChange={(val) => {
                        field.onChange(val);
                        loadedDistrictRef.current = "";
                        setSearchTerm("");
                        setWards([]);
                        setLocationHydrationWarning(null);
                        setValue("ward", "", {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                        clearErrors("district");
                        resetSelectedMapLocation();
                      }}
                      value={field.value}
                      disabled={!watchedProvince}
                    >
                      <SelectTrigger
                        className={`h-9 text-[12px] ${errors.district ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                      >
                        <SelectValue placeholder="Chọn quận / huyện" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000] p-0">
                        {renderSearchInput("Tìm quận/huyện...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredDistricts.map((district) => (
                            <SelectItem
                              key={getDistrictId(district)}
                              value={String(getDistrictId(district))}
                            >
                              {getDistrictName(district)}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.district && (
                  <span className="text-[11px] text-rose-500">
                    {errors.district.message}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Phường / Xã
                </Label>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onOpenChange={(open) => {
                        if (open) setSearchTerm("");
                      }}
                      onValueChange={(val) => {
                        setValue("ward", val, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                        clearErrors("ward");
                        setSearchTerm("");
                        resetSelectedMapLocation();
                      }}
                      value={field.value}
                      disabled={!watchedDistrict}
                    >
                      <SelectTrigger
                        className={`h-9 text-[12px] ${errors.ward ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                      >
                        <SelectValue placeholder="Chọn phường / xã" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000] p-0">
                        {renderSearchInput("Tìm xã...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredWards.map((w) => (
                            <SelectItem
                              key={`${getWardCode(w)}-${getWardId(w)}`}
                              value={String(getWardCode(w))}
                            >
                              {getWardName(w)}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.ward && (
                  <span className="text-[11px] text-rose-500">
                    {errors.ward.message}
                  </span>
                )}
              </div>

              <div
                className="relative space-y-1.5 xl:col-span-12"
                ref={suggestionRef}
              >
                <Label className="text-[10px] font-medium text-slate-400">
                  Địa chỉ chi tiết *
                </Label>
                <div className="relative">
                  <Input
                    {...register("addressDetail")}
                    autoComplete="off"
                    onChange={(event) => {
                      setValue("addressDetail", event.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      resetSelectedMapLocation();
                    }}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      window.setTimeout(() => {
                        const hasCoordinates = hasValidCoordinatePair(
                          watch("lat"),
                          watch("lng"),
                        );
                        if (!hasCoordinates) {
                          void resolveTypedAddressLocation();
                        }
                      }, 150);
                    }}
                    placeholder={
                      currentProvince
                        ? "Ví dụ: 12 Nguyễn Văn Cừ, hẻm 5, khu dân cư..."
                        : "Chọn Tỉnh/Thành trước để dùng gợi ý địa chỉ"
                    }
                    className={`h-9 pr-9 text-[13px] ${errors.addressDetail ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  />
                  {isLoadingAddressSuggestions && (
                    <Loader2
                      className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                      size={14}
                    />
                  )}
                </div>
                {currentProvince && (
                  <p className="text-[10px] text-slate-400">
                    Gợi ý đang khóa theo{" "}
                    {currentWard ? `${getWardName(currentWard)}, ` : ""}
                    {currentDistrict ? `${getDistrictName(currentDistrict)}, ` : ""}
                    {getProvName(currentProvince)}
                  </p>
                )}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-[1100] mt-1 max-h-[200px] overflow-y-auto border border-slate-200 bg-white shadow-xl">
                    {addressSuggestions.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="cursor-pointer border-b px-4 py-2 text-[12px] hover:bg-slate-50"
                        onClick={async () => {
                          syncSelectedMapLocation(item);
                          setShowSuggestions(false);
                          setAddressSuggestions([]);
                        }}
                      >
                        <p className="font-medium text-slate-700">
                          {getScopedAddressDetail(item.label)}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {errors.addressDetail && (
                  <span className="text-[11px] text-rose-500">
                    {errors.addressDetail.message}
                  </span>
                )}
              </div>

              {locationHydrationWarning && (
                <div className="xl:col-span-12 border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-700">
                  {locationHydrationWarning}
                </div>
              )}

              {missingShippingConfigFields.length > 0 && (
                <div className="xl:col-span-12 border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
                  Chi nhánh chưa đủ dữ liệu vị trí bắt buộc. Cần bổ sung:{" "}
                  <span className="font-semibold">
                    {missingShippingConfigFields.join(", ")}
                  </span>
                  .
                </div>
              )}

              <AddressMapPicker
                latitude={watchedLat}
                longitude={watchedLng}
                displayName={mapDisplayName}
                onPositionChange={(lat, lng) => {
                  setValue("lat", lat, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("lng", lng, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setMapDisplayName(buildFullAddress(addressDetailValue || ""));
                }}
              />

              <input type="hidden" {...register("lat")} />
              <input type="hidden" {...register("lng")} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-[11px] font-bold text-slate-800">
                3. Quản lý & liên hệ
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Người quản lý chi nhánh
                </Label>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val === "__none__" ? "" : val);
                        setSearchTerm("");
                      }}
                      value={field.value || "__none__"}
                    >
                      <SelectTrigger
                        className={`h-9 text-[13px] ${errors.managerId ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                      >
                        <SelectValue placeholder="Tìm nhân sự phụ trách" />
                      </SelectTrigger>
                      <SelectContent className="z-[1050] p-0">
                        {renderSearchInput("Nhập tên quản lý...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          <SelectItem value="__none__">
                            Chưa gán người quản lý
                          </SelectItem>
                          {filteredStaffs.length > 0 ? (
                            filteredStaffs.map((staff) => (
                              <SelectItem
                                key={staff.id}
                                value={String(staff.id)}
                              >
                                {staff.fullName}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-[12px] text-slate-400">
                              Chưa có nhân viên phù hợp để chọn.
                            </div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
                <span className="text-[10px] text-slate-400">
                  Có thể để trống khi khởi tạo và gán sau.
                </span>
              </div>

              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Số điện thoại liên hệ *
                </Label>
                <Input
                  {...register("phone")}
                  className={`h-9 text-[13px] ${errors.phone ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  placeholder="Nhập số điện thoại liên hệ..."
                />
                {errors.phone && (
                  <span className="text-[11px] text-rose-500">
                    {errors.phone.message}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Email liên hệ *
                </Label>
                <Input
                  {...register("email")}
                  type="email"
                  className={`h-9 text-[13px] ${errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  placeholder="Nhập email liên hệ..."
                />
                {errors.email && (
                  <span className="text-[11px] text-rose-500">
                    {errors.email.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-[999] flex justify-end gap-3 border-t bg-white p-3 lg:left-[260px]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="text-[11px] font-medium text-slate-400"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-9 px-10 text-[11px] font-medium bg-emerald-600 text-white shadow-xl hover:bg-emerald-700"
          >
            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : null}
            {isEditMode ? "Lưu thay đổi" : "Lưu chi nhánh"}
          </Button>
        </div>
      </form>

    </>
  );
}
