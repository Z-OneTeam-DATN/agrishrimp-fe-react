"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Search,
  ExternalLink,
} from "lucide-react";
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
import { EmployeeService } from "@/app/services/employee.service";

const GEOAPIFY_TOKEN = "56418528a46b4ca390f6f7937e0b4591";

// --- HELPERS TRÍCH XUẤT DỮ LIỆU ---
const getProvId = (item: any) =>
  item?.ProvinceID ?? item?.province_id ?? item?.id ?? "";
const getProvName = (item: any) =>
  item?.ProvinceName ?? item?.province_name ?? item?.name ?? "";
const getDistId = (item: any) =>
  item?.DistrictID ?? item?.district_id ?? item?.id ?? "";
const getDistName = (item: any) =>
  item?.DistrictName ?? item?.district_name ?? item?.name ?? "";
const getWardId = (item: any) =>
  item?.WardCode ??
  item?.ward_code ??
  item?.code ??
  item?.WardID ??
  item?.id ??
  "";
const getWardName = (item: any) =>
  item?.WardName ?? item?.ward_name ?? item?.name ?? "";

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const fetchWithAuth = async (url: string) => {
  let token = null;
  if (typeof window !== "undefined") {
    token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
  }
  return fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token.replace(/"/g, "")}` } : {}),
    },
  });
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
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingAddressSuggestions, setIsLoadingAddressSuggestions] =
    useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const addressSuggestionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const addressSuggestionRequestRef = useRef(0);
  const pendingEditLocationRef = useRef<{
    district: string;
    ward: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
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
    () => districts.find((d) => String(getDistId(d)) === watchedDistrict),
    [districts, watchedDistrict],
  );
  const currentWard = useMemo(
    () => wards.find((w) => String(getWardId(w)) === watchedWard),
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

    return matchedWard ? String(getWardId(matchedWard)) : candidates[0];
  };

  const resolveDistrictSelectValue = (
    districtList: any[],
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

    const matchedDistrict = districtList.find((district: any) => {
      const districtId = String(getDistId(district));
      return candidates.includes(districtId);
    });

    return matchedDistrict ? String(getDistId(matchedDistrict)) : candidates[0];
  };

  // --- 1. KHỞI TẠO DỮ LIỆU & LỌC ROLE ID (1,2,3) ---
  useEffect(() => {
    const initData = async () => {
      try {
        const [empRes, provResponse, branchRes] = await Promise.all([
          EmployeeService.getAll({ size: 500, status: "ACTIVE" }),
          fetchWithAuth("/api/ghn/province"),
          branchService.getAll(),
        ]);

        // Lọc chỉ lấy nhân viên có Role ID 1, 2, 3
        const rawStaffs = extractArray(empRes);
        const filtered = rawStaffs.filter((s: any) =>
          [1, 2, 3].includes(s.roleId || s.role?.id),
        );
        setStaffs(filtered);

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

        if (provResponse.ok) {
          const provinceRes = await provResponse.json();
          setProvinces(extractArray(provinceRes));
          setIsInitialLoaded(true);
          if (!isEditMode) {
            setIsFormInitialized(true);
          }
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
          let districtValue = String(data.districtId ?? "");
          let wardValue = String(data.wardCode ?? data.wardId ?? "");
          const managerIds = Array.isArray(data.managerIds)
            ? data.managerIds
            : [];

          setCurrentBranchManagerIds(
            new Set(
              managerIds
                .map((id: any) => Number(id))
                .filter((id: number) => !Number.isNaN(id) && id > 0),
            ),
          );

          // Fetch districts/wards trước để reset form không bị mất label
          if (data.provinceId) {
            const [distRes, wardRes] = await Promise.all([
              fetchWithAuth(`/api/ghn/district?province_id=${data.provinceId}`),
              data.districtId
                ? fetchWithAuth(`/api/ghn/ward?district_id=${data.districtId}`)
                : Promise.resolve(null),
            ]);
            const districtList = extractArray(await distRes.json());
            const wardList = wardRes ? extractArray(await wardRes.json()) : [];
            setDistricts(districtList);
            setWards(wardList);

            districtValue = resolveDistrictSelectValue(districtList, [
              data.districtId,
            ]);
            wardValue = resolveWardSelectValue(wardList, [
              data.wardCode,
              data.wardId,
            ]);
          }

          reset({
            id: data.branchCode,
            name: data.name,
            branchType: data.branchType,
            phone: data.phone,
            email: data.email || "",
            addressDetail: data.addressDetail,
            province: String(data.provinceId ?? ""),
            district: districtValue,
            ward: wardValue,
            status: (data.status || "active").toLowerCase(),
            managerId: data.managerIds?.[0] ? String(data.managerIds[0]) : "",
            lat: data.lat,
            lng: data.lng,
          });
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
  }, [isEditMode, branchId, isInitialLoaded, reset, setValue]);

  useEffect(() => {
    const pending = pendingEditLocationRef.current;
    if (!isEditMode || !pending?.district || districts.length === 0) return;

    const exists = districts.some(
      (district) => String(getDistId(district)) === pending.district,
    );
    if (exists) {
      setValue("district", pending.district, { shouldDirty: false });
    }
  }, [districts, isEditMode, setValue]);

  useEffect(() => {
    const pending = pendingEditLocationRef.current;
    if (!isEditMode || !pending?.ward || wards.length === 0) return;

    const exists = wards.some((ward) => String(getWardId(ward)) === pending.ward);
    if (exists) {
      setValue("ward", pending.ward, { shouldDirty: false });
      pendingEditLocationRef.current = null;
    }
  }, [wards, isEditMode, setValue]);

  // Logic lấy huyện/xã khi thay đổi select tay
  useEffect(() => {
    if (watchedProvince && isInitialLoaded && isFormInitialized && !isLoading) {
      fetchWithAuth(`/api/ghn/district?province_id=${watchedProvince}`)
        .then((r) => r.json())
        .then((data) => setDistricts(extractArray(data)));
    }
  }, [watchedProvince, isInitialLoaded, isFormInitialized, isLoading]);

  useEffect(() => {
    if (watchedDistrict && isInitialLoaded && isFormInitialized && !isLoading) {
      fetchWithAuth(`/api/ghn/ward?district_id=${watchedDistrict}`)
        .then((r) => r.json())
        .then((data) => setWards(extractArray(data)));
    }
  }, [watchedDistrict, isInitialLoaded, isFormInitialized, isLoading]);

  const getScopedAddressDetail = (label: string) => {
    const ignoredScopes = [
      currentWard ? normalizeText(getWardName(currentWard)) : "",
      currentDistrict ? normalizeText(getDistName(currentDistrict)) : "",
      currentProvince ? normalizeText(getProvName(currentProvince)) : "",
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

  const filterScopedSuggestions = (items: any[]) => {
    const wardScope = currentWard ? normalizeText(getWardName(currentWard)) : "";
    const districtScope = currentDistrict
      ? normalizeText(getDistName(currentDistrict))
      : "";
    const provinceScope = currentProvince
      ? normalizeText(getProvName(currentProvince))
      : "";

    const matchesScope = (expected: string, values: string[]) => {
      if (!expected) return true;
      return values.some((value) => {
        const normalizedValue = normalizeText(value || "");
        return (
          normalizedValue.includes(expected) ||
          expected.includes(normalizedValue)
        );
      });
    };

    return items
      .filter((item) => item?.label)
      .filter((item) => {
        const label = normalizeText(item.label);
        return (
          matchesScope(provinceScope, [item.province, item.label]) &&
          matchesScope(districtScope, [item.district, item.label]) &&
          matchesScope(wardScope, [item.ward, item.label])
        );
      })
      .filter(
        (item, index, array) =>
          array.findIndex((current) => current.label === item.label) === index,
      )
      .slice(0, 8);
  };

  const stripAdministrativePrefix = (value: string) => {
    return (value || "")
      .replace(/^(Tỉnh|Thành phố|TP\.?|Quận|Huyện|Thị xã|Thị trấn|Phường|Xã)\s+/i, "")
      .trim();
  };

  const fetchGeoapifyAddressSuggestions = async (input: string) => {
    if (!currentProvince || !currentDistrict || !currentWard) return [];

    const province = getProvName(currentProvince);
    const district = getDistName(currentDistrict);
    const ward = getWardName(currentWard);
    const cleanProvince = stripAdministrativePrefix(province);
    const cleanDistrict = stripAdministrativePrefix(district);
    const cleanWard = stripAdministrativePrefix(ward);

    const searchQueries = [
      [input, ward, district, province].filter(Boolean).join(", "),
      [input, cleanWard, cleanDistrict, cleanProvince]
        .filter(Boolean)
        .join(", "),
      [input, district, province].filter(Boolean).join(", "),
    ].filter(
      (query, index, array) =>
        query.trim().length > 0 && array.indexOf(query) === index,
    );

    const responses = await Promise.allSettled(
      searchQueries.map(async (query) => {
        const params = new URLSearchParams({
          text: query,
          filter: "countrycode:vn",
          lang: "vi",
          limit: "10",
          format: "json",
          apiKey: GEOAPIFY_TOKEN,
        });
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
        );
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.results) ? data.results : [];
      }),
    );

    const results = responses.flatMap((response) =>
      response.status === "fulfilled" ? response.value : [],
    );

    return filterScopedSuggestions(
      results.map((item: any) => ({
        label: item.formatted || item.address_line1 || item.name || "",
        province: item.state || item.region || "",
        district:
          item.county ||
          item.city ||
          item.city_district ||
          item.district ||
          "",
        ward:
          item.suburb ||
          item.village ||
          item.hamlet ||
          item.locality ||
          item.district ||
          "",
        lat:
          typeof item.lat === "number"
            ? item.lat
            : item.lat
              ? Number(item.lat)
              : undefined,
        lng:
          typeof item.lon === "number"
            ? item.lon
            : item.lon
              ? Number(item.lon)
              : undefined,
      })),
    );
  };

  // Logic gợi ý địa chỉ chi tiết realtime, luôn khóa trong tỉnh/quận/phường đã chọn
  useEffect(() => {
    if (addressSuggestionTimeoutRef.current) {
      clearTimeout(addressSuggestionTimeoutRef.current);
    }

    const input = addressDetailValue?.trim() || "";
    if (!input || input.length < 1 || !currentProvince || !currentDistrict || !currentWard) {
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

        const scopedParams = new URLSearchParams({
          input,
          province: getProvName(currentProvince),
          district: getDistName(currentDistrict),
          ward: getWardName(currentWard),
        });

        const scopedResponse = await fetchWithAuth(
          `/api/ghn/address-suggestions?${scopedParams.toString()}`,
        );
        if (!scopedResponse.ok) {
          throw new Error("Failed to fetch address suggestions");
        }

        const [scopedData, geoapifySuggestions] = await Promise.all([
          scopedResponse.json(),
          fetchGeoapifyAddressSuggestions(input),
        ]);
        let nextSuggestions = Array.isArray(scopedData)
          ? filterScopedSuggestions(scopedData)
          : [];
        nextSuggestions = [...nextSuggestions, ...geoapifySuggestions]
          .filter((item) => item?.label)
          .filter(
            (item, index, array) =>
              array.findIndex((current) => current.label === item.label) ===
              index,
          )
          .slice(0, 10);

        if (nextSuggestions.length === 0) {
          const fallbackInput = [
            input,
            getWardName(currentWard),
            getDistName(currentDistrict),
            getProvName(currentProvince),
          ]
            .filter(Boolean)
            .join(", ");
          const fallbackParams = new URLSearchParams({ input: fallbackInput });
          const fallbackResponse = await fetchWithAuth(
            `/api/ghn/address-suggestions?${fallbackParams.toString()}`,
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const fallbackSuggestions = Array.isArray(fallbackData)
              ? filterScopedSuggestions(fallbackData)
              : [];
            nextSuggestions = [...fallbackSuggestions, ...geoapifySuggestions]
              .filter((item) => item?.label)
              .filter(
                (item, index, array) =>
                  array.findIndex((current) => current.label === item.label) ===
                  index,
              )
              .slice(0, 10);
          }
        }

        if (requestId !== addressSuggestionRequestRef.current) {
          return;
        }

        setAddressSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);
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
    }, 350);

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

  const buildFullAddressQuery = () => {
    return `${addressDetailValue}, ${currentWard ? getWardName(currentWard) + ", " : ""}${currentDistrict ? getDistName(currentDistrict) + ", " : ""}${getProvName(currentProvince)}`;
  };

  const normalizeText = (text: string) => {
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

  const findMatchingItem = (
    items: any[],
    name: string,
    getName: (item: any) => string,
  ) => {
    const normalizedTarget = normalizeText(name);
    return items.find(
      (item) =>
        normalizeText(getName(item)).includes(normalizedTarget) ||
        normalizedTarget.includes(normalizeText(getName(item))),
    );
  };

  const reverseGeocodeAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
      );
      if (!response.ok) return null;
      const data = await response.json();
      const address = data.address || {};
      const addressParts = [
        address.house_number,
        address.road ||
          address.pedestrian ||
          address.footway ||
          address.cycleway ||
          address.path,
        address.neighbourhood ||
          address.suburb ||
          address.quarter ||
          address.hamlet ||
          address.village,
      ].filter(Boolean);
      const addressDetail = addressParts.join(", ");
      return {
        fullAddress: data.display_name || "",
        addressDetail,
        province: address.state || address.region || address.county || "",
        district:
          address.county ||
          address.city_district ||
          address.suburb ||
          address.town ||
          "",
        ward:
          address.suburb ||
          address.quarter ||
          address.village ||
          address.hamlet ||
          "",
      };
    } catch (error) {
      console.error("Error reverse geocoding", error);
      return null;
    }
  };

  const applyLocationFromMap = async (lat: number, lng: number) => {
    const location = await reverseGeocodeAddress(lat, lng);
    if (!location) {
      toast.error("Không thể xác định địa chỉ từ vị trí này.");
      return;
    }

    if (location.addressDetail) {
      setValue("addressDetail", location.addressDetail);
    }

    const provinceMatch = location.province
      ? findMatchingItem(provinces, location.province, getProvName)
      : undefined;
    if (provinceMatch) {
      setValue("province", String(getProvId(provinceMatch)));
      const districtRes = await fetchWithAuth(
        `/api/ghn/district?province_id=${getProvId(provinceMatch)}`,
      );
      const districtList = extractArray(await districtRes.json());
      setDistricts(districtList);

      const districtMatch = location.district
        ? findMatchingItem(districtList, location.district, getDistName)
        : undefined;
      if (districtMatch) {
        setValue("district", String(getDistId(districtMatch)));
        const wardRes = await fetchWithAuth(
          `/api/ghn/ward?district_id=${getDistId(districtMatch)}`,
        );
        const wardList = extractArray(await wardRes.json());
        setWards(wardList);

        const wardMatch = location.ward
          ? findMatchingItem(wardList, location.ward, getWardName)
          : undefined;
        if (wardMatch) {
          setValue("ward", String(getWardId(wardMatch)));
        }
      }
    }
  };

  // Helper: Strip Google Plus Code format from address
  const extractAddressWithoutPlusCode = (address: string): string => {
    if (address.includes("+") && address.includes(",")) {
      const parts = address.split(",");
      return parts.slice(1).join(",").trim();
    }
    return address;
  };

  const fetchCoordinatesFromAddress = async () => {
    // Không bắt buộc province nếu addressDetail đã đủ thông tin
    if (!addressDetailValue || addressDetailValue.trim().length < 3) {
      setValue("lat", null, { shouldDirty: true });
      setValue("lng", null, { shouldDirty: true });
      return null;
    }

    setIsGettingGPS(true);
    try {
      // Extract address without Plus Code (e.g., "PVC3+W6H, Hồ Đắc Kiện, Cần Thơ" → "Hồ Đắc Kiện, Cần Thơ")
      const cleanAddress = extractAddressWithoutPlusCode(addressDetailValue);

      // Ưu tiên 1: Cố gắng geocode trực tiếp từ cleaned address
      const directResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&countrycodes=vn&limit=1`,
      );
      const directData = await directResponse.json();

      if (
        directData &&
        directData.length > 0 &&
        directData[0].lat &&
        directData[0].lon
      ) {
        const lat = parseFloat(directData[0].lat);
        const lng = parseFloat(directData[0].lon);
        setValue("lat", lat, { shouldDirty: true });
        setValue("lng", lng, { shouldDirty: true });
        return { lat, lng };
      }

      // Ưu tiên 2: Nếu có province/district/ward, thử kết hợp full address
      if (watchedProvince) {
        const fullAddr = buildFullAddressQuery();
        const fullResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddr)}&limit=1`,
        );
        const fullData = await fullResponse.json();

        if (
          fullData &&
          fullData.length > 0 &&
          fullData[0].lat &&
          fullData[0].lon
        ) {
          const lat = parseFloat(fullData[0].lat);
          const lng = parseFloat(fullData[0].lon);
          setValue("lat", lat, { shouldDirty: true });
          setValue("lng", lng, { shouldDirty: true });
          return { lat, lng };
        }
      }

      // Ưu tiên 3: Try searching with just district + province as fallback
      if (currentDistrict && currentProvince) {
        const simpleAddr = `${getDistName(currentDistrict)}, ${getProvName(currentProvince)}`;
        const simpleResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simpleAddr)}&countrycodes=vn&limit=1`,
        );
        const simpleData = await simpleResponse.json();

        if (
          simpleData &&
          simpleData.length > 0 &&
          simpleData[0].lat &&
          simpleData[0].lon
        ) {
          const lat = parseFloat(simpleData[0].lat);
          const lng = parseFloat(simpleData[0].lon);
          setValue("lat", lat, { shouldDirty: true });
          setValue("lng", lng, { shouldDirty: true });
          return { lat, lng };
        }
      }

      setValue("lat", null, { shouldDirty: true });
      setValue("lng", null, { shouldDirty: true });
      return null;
    } catch (error) {
      console.error("Error fetching coordinates", error);
      setValue("lat", null, { shouldDirty: true });
      setValue("lng", null, { shouldDirty: true });
      return null;
    } finally {
      setIsGettingGPS(false);
    }
  };

  const handleFetchCoordsFromAddress = async () => {
    const coords = await fetchCoordinatesFromAddress();
    if (coords) {
      toast.success("✓ Đã lấy tọa độ từ địa chỉ!");
    } else {
      toast.error("Không tìm thấy tọa độ. Vui lòng kiểm tra lại địa chỉ.");
    }
  };

  const handleAddressBlur = async () => {
    if (addressDetailValue && addressDetailValue.trim().length > 2) {
      await fetchCoordinatesFromAddress();
    }
  };

  const onSubmit = async (data: AdminBranchForm) => {
    try {
      setIsLoading(true);

      let lat = data.lat;
      let lng = data.lng;
      const hasLatLng = typeof lat === "number" && typeof lng === "number";

      if (!hasLatLng && data.addressDetail) {
        const coords = await fetchCoordinatesFromAddress();
        if (!coords) {
          toast.error(
            "Không thể lấy tọa độ tự động. Vui lòng kiểm tra lại địa chỉ hoặc chọn gợi ý.",
          );
          return;
        }
        lat = coords.lat;
        lng = coords.lng;
      }

      const selectedWardObj = wards.find(
        (w: any) => String(getWardId(w)) === data.ward,
      );
      const payload = {
        branchCode: data.id,
        name: data.name,
        branchType: data.branchType,
        phone: data.phone,
        email: data.email,
        addressDetail: data.addressDetail,
        provinceId: Number(data.province),
        districtId: Number(data.district),
        wardId:
          selectedWardObj?.wardId ??
          selectedWardObj?.WardID ??
          Number(data.ward),
        wardCode:
          selectedWardObj?.code ??
          selectedWardObj?.WardCode ??
          selectedWardObj?.wardCode ??
          String(data.ward),
        provinceName: currentProvince ? getProvName(currentProvince) : "",
        districtName: currentDistrict ? getDistName(currentDistrict) : "",
        wardName: currentWard ? getWardName(currentWard) : "",
        status: data.status.toUpperCase(),
        managerIds: data.managerId ? [Number(data.managerId)] : [],
        lat,
        lng,
      };

      isEditMode
        ? await branchService.update(branchId!, payload)
        : await branchService.create(payload);
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
      districts.filter((d) =>
        getDistName(d).toLowerCase().includes(searchTerm.toLowerCase()),
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

  const availableStaffs = useMemo(() => {
    const selectedManagerId = Number(watchedManagerId);
    return staffs.filter((staff) => {
      const staffId = Number(staff?.id);
      if (Number.isNaN(staffId) || staffId <= 0) return false;
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
                      onValueChange={(val) => {
                        field.onChange(val);
                        setValue("district", "");
                        setValue("ward", "");
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
                      onValueChange={(val) => {
                        field.onChange(val);
                        setValue("ward", "");
                      }}
                      value={field.value}
                      disabled={!watchedProvince}
                    >
                      <SelectTrigger className="h-9 text-[12px]">
                        <SelectValue placeholder="Chọn quận / huyện" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000] p-0">
                        {renderSearchInput("Tìm huyện...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredDistricts.map((d) => (
                            <SelectItem
                              key={getDistId(d)}
                              value={String(getDistId(d))}
                            >
                              {getDistName(d)}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Phường / Xã *
                </Label>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedDistrict}
                    >
                      <SelectTrigger className="h-9 text-[12px]">
                        <SelectValue placeholder="Chọn phường / xã" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000] p-0">
                        {renderSearchInput("Tìm xã...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredWards.map((w) => (
                            <SelectItem
                              key={getWardId(w)}
                              value={String(getWardId(w))}
                            >
                              {getWardName(w)}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
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
                    onBlur={handleAddressBlur}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder={
                      currentProvince && currentDistrict && currentWard
                        ? "Ví dụ: 12 Nguyễn Văn Cừ, hẻm 5, khu dân cư..."
                        : "Chọn đủ Tỉnh / Quận / Phường trước để dùng gợi ý địa chỉ"
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
                {currentProvince && currentDistrict && currentWard && (
                  <p className="text-[10px] text-slate-400">
                    Gợi ý đang khóa theo {getWardName(currentWard)},{" "}
                    {getDistName(currentDistrict)},{" "}
                    {getProvName(currentProvince)}
                  </p>
                )}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-[1100] mt-1 max-h-[200px] overflow-y-auto border border-slate-200 bg-white shadow-xl">
                    {addressSuggestions.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="cursor-pointer border-b px-4 py-2 text-[12px] hover:bg-slate-50"
                        onClick={() => {
                          setValue(
                            "addressDetail",
                            getScopedAddressDetail(item.label),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          );
                          if (
                            typeof item.lat === "number" &&
                            typeof item.lng === "number"
                          ) {
                            setValue("lat", item.lat, { shouldDirty: true });
                            setValue("lng", item.lng, { shouldDirty: true });
                          }
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

              <div className="space-y-4 border-t border-dashed border-slate-200 pt-5 xl:col-span-12">
                <div className="hidden">
                  <input type="hidden" {...register("lat")} />
                  <input type="hidden" {...register("lng")} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {Number.isFinite(Number(watchedLat)) &&
                    Number.isFinite(Number(watchedLng)) && (
                    <a
                      href={`https://www.google.com/maps?q=${watchedLat},${watchedLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-blue-600 hover:bg-slate-50"
                    >
                      <ExternalLink size={12} />
                      Xem vị trí trên bản đồ
                    </a>
                  )}
                </div>
              </div>
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
