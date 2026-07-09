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
import { EmployeeService } from "@/app/services/employee.service";

const PROVINCE_API_BASE = "https://provinces.open-api.vn/api/v2";
const NO_DISTRICT_VALUE = "__province_direct__";

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
const getProvId = (item: any) =>
  item?.ProvinceID ?? item?.province_id ?? item?.code ?? item?.id ?? "";
const getProvName = (item: any) =>
  item?.ProvinceName ?? item?.province_name ?? item?.full_name ?? item?.name ?? "";
const getDistId = (item: any) =>
  item?.DistrictID ?? item?.district_id ?? item?.code ?? item?.id ?? "";
const getDistName = (item: any) =>
  item?.DistrictName ?? item?.district_name ?? item?.full_name ?? item?.name ?? "";
const getWardId = (item: any) =>
  item?.WardCode ??
  item?.ward_code ??
  item?.code ??
  item?.WardID ??
  item?.id ??
  "";
const getWardName = (item: any) =>
  item?.WardName ?? item?.ward_name ?? item?.full_name ?? item?.name ?? "";

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const fetchProvinceOpenApi = async (url: string) => {
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch Province Open API");
  }
  return response.json();
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

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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
  const hasDistrictLevel = districts.length > 0;
  const districtNameForAddress = currentDistrict
    ? getDistName(currentDistrict)
    : "";

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
          fetchProvinceOpenApi(`${PROVINCE_API_BASE}/`),
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

        setProvinces(extractArray(provResponse));
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
            const provinceDetail = await fetchProvinceOpenApi(
              `${PROVINCE_API_BASE}/p/${data.provinceId}?depth=2`,
            );
            const districtList = extractArray(provinceDetail?.districts);
            let wardList: any[] = extractArray(provinceDetail?.wards);
            if (districtList.length > 0 && data.districtId) {
              const districtDetail = await fetchProvinceOpenApi(
                `${PROVINCE_API_BASE}/d/${data.districtId}?depth=2`,
              );
              wardList = extractArray(districtDetail?.wards);
            }
            setDistricts(districtList);
            setWards(wardList);

            districtValue =
              districtList.length > 0
                ? resolveDistrictSelectValue(districtList, [data.districtId])
                : NO_DISTRICT_VALUE;
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
      fetchProvinceOpenApi(`${PROVINCE_API_BASE}/p/${watchedProvince}?depth=2`)
        .then((data) => {
          const districtList = extractArray(data?.districts);
          const directWardList = extractArray(data?.wards);
          setDistricts(districtList);
          if (districtList.length === 0) {
            setValue("district", NO_DISTRICT_VALUE, { shouldDirty: true });
            setWards(directWardList);
          } else {
            setWards([]);
          }
        })
        .catch(() => {
          setDistricts([]);
          setWards([]);
        });
    }
  }, [watchedProvince, isInitialLoaded, isFormInitialized, isLoading, setValue]);

  useEffect(() => {
    if (
      watchedDistrict &&
      watchedDistrict !== NO_DISTRICT_VALUE &&
      isInitialLoaded &&
      isFormInitialized &&
      !isLoading
    ) {
      fetchProvinceOpenApi(`${PROVINCE_API_BASE}/d/${watchedDistrict}?depth=2`)
        .then((data) => setWards(extractArray(data?.wards)))
        .catch(() => setWards([]));
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

  const buildFullAddress = (detail: string) =>
    [
      detail,
      currentWard ? getWardName(currentWard) : "",
      districtNameForAddress,
      currentProvince ? getProvName(currentProvince) : "",
      "Vietnam",
    ]
      .filter(Boolean)
      .join(", ");

  const resetSelectedMapLocation = () => {
    setValue("lat", null, { shouldDirty: true });
    setValue("lng", null, { shouldDirty: true });
    setMapDisplayName("");
  };

  const fetchNominatimAddressSuggestions = async (input: string) => {
    if (!currentProvince || !currentWard) return [];

    const fullAddress = buildFullAddress(input);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=vn&limit=5&q=${encodeURIComponent(
        fullAddress,
      )}`,
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item: any) => ({
        label: item.display_name || "",
        name: item.name || item.display_name || "",
        province:
          item.address?.city ||
          item.address?.state ||
          item.address?.province ||
          getProvName(currentProvince),
        district:
          item.address?.city_district ||
          item.address?.county ||
          item.address?.district ||
          getDistName(currentDistrict),
        ward:
          item.address?.suburb ||
          item.address?.quarter ||
          item.address?.village ||
          item.address?.hamlet ||
          item.address?.city_district ||
          getWardName(currentWard),
        lat: item.lat ? Number(item.lat) : undefined,
        lng: item.lon ? Number(item.lon) : undefined,
        mapDisplayName: item.display_name || "",
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  };

  useEffect(() => {
    if (addressSuggestionTimeoutRef.current) {
      clearTimeout(addressSuggestionTimeoutRef.current);
    }

    const input = addressDetailValue?.trim() || "";
    if (!input || input.length < 3 || !currentProvince || !currentWard) {
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

        const nextSuggestions = await fetchNominatimAddressSuggestions(input);

        if (requestId !== addressSuggestionRequestRef.current) {
          return;
        }

        setAddressSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);
        if (nextSuggestions.length === 0) {
          toast.error("Không tìm thấy vị trí, vui lòng nhập cụ thể hơn");
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

  const onSubmit = async (data: AdminBranchForm) => {
    try {
      setIsLoading(true);

      if (
        typeof data.lat !== "number" ||
        typeof data.lng !== "number" ||
        !Number.isFinite(data.lat) ||
        !Number.isFinite(data.lng)
      ) {
        toast.error("Vui lòng chọn vị trí trên bản đồ");
        setIsLoading(false);
        return;
      }

      const selectedWardObj = wards.find(
        (w: any) => String(getWardId(w)) === data.ward,
      );
      const hasSelectedDistrict =
        data.district && data.district !== NO_DISTRICT_VALUE;
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
        districtId: hasSelectedDistrict ? Number(data.district) : null,
        districtCode: hasSelectedDistrict ? Number(data.district) : null,
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
        managerId: data.managerId ? Number(data.managerId) : null,
        managerIds: data.managerId ? [Number(data.managerId)] : [],
        lat: data.lat,
        lng: data.lng,
        latitude: data.lat,
        longitude: data.lng,
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
                      onOpenChange={(open) => {
                        if (open) setSearchTerm("");
                      }}
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSearchTerm("");
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
                        setSearchTerm("");
                        if (val !== NO_DISTRICT_VALUE) {
                          setValue("ward", "");
                        }
                        resetSelectedMapLocation();
                      }}
                      value={field.value}
                      disabled={!watchedProvince}
                    >
                      <SelectTrigger className="h-9 text-[12px]">
                        <SelectValue placeholder="Chọn quận / huyện" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000] p-0">
                        {hasDistrictLevel && renderSearchInput("Tim huyen...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {!hasDistrictLevel && watchedProvince ? (
                            <SelectItem value={NO_DISTRICT_VALUE}>
                              Khong con cap quan / huyen
                            </SelectItem>
                          ) : (
                            filteredDistricts.map((d) => (
                              <SelectItem
                                key={getDistId(d)}
                                value={String(getDistId(d))}
                              >
                                {getDistName(d)}
                              </SelectItem>
                            ))
                          )}
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
                      onOpenChange={(open) => {
                        if (open) setSearchTerm("");
                      }}
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSearchTerm("");
                        resetSelectedMapLocation();
                      }}
                      value={field.value}
                      disabled={!watchedProvince || (hasDistrictLevel && !watchedDistrict)}
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
                    placeholder={
                      currentProvince && currentWard
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
                {currentProvince && currentWard && (
                  <p className="text-[10px] text-slate-400">
                    Gợi ý đang khóa theo {getWardName(currentWard)},{" "}
                    {districtNameForAddress ? `${districtNameForAddress}, ` : ""}
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
                            setMapDisplayName(item.mapDisplayName || item.label);
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

              <AddressMapPicker
                latitude={watchedLat}
                longitude={watchedLng}
                displayName={mapDisplayName}
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

