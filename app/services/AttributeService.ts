import { apiJava, buildJavaApiUrl } from "@/lib/axios";

const PREFIX = "/attributes";

type AttributePayload = Record<string, unknown> & {
  values?: unknown[];
};

const normalizeAttributeValue = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const dedupeStringValues = (values: unknown[] = []) => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const rawValue of values) {
    const normalizedValue = normalizeAttributeValue(rawValue);
    if (!normalizedValue) continue;

    const compareKey = normalizedValue.toLocaleLowerCase("vi");
    if (seen.has(compareKey)) continue;

    seen.add(compareKey);
    deduped.push(normalizedValue);
  }

  return deduped;
};

const dedupeValueDetails = (valueDetails: unknown[] = []) => {
  const seenIds = new Set<number>();
  const seenValues = new Set<string>();

  return valueDetails.reduce<PublicAttributeValueDetail[]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;

    const detail = item as PublicAttributeValueDetail;
    const normalizedValue = normalizeAttributeValue(detail.value);
    if (!normalizedValue) return acc;

    const numericValueId = Number(detail.valueId);
    const hasValueId = Number.isFinite(numericValueId) && numericValueId > 0;
    const compareKey = normalizedValue.toLocaleLowerCase("vi");

    if (hasValueId && seenIds.has(numericValueId)) return acc;
    if (seenValues.has(compareKey)) return acc;

    if (hasValueId) {
      seenIds.add(numericValueId);
    }
    seenValues.add(compareKey);

    acc.push({
      ...detail,
      valueId: hasValueId ? numericValueId : detail.valueId,
      value: normalizedValue,
    });
    return acc;
  }, []);
};

const normalizeAttribute = <
  T extends PublicAttributeDTO | Record<string, unknown>,
>(
  attribute: T,
): T => {
  if (!attribute || typeof attribute !== "object") return attribute;

  const valueDetails = dedupeValueDetails(
    Array.isArray(attribute.valueDetails) ? attribute.valueDetails : [],
  );

  const valuesSource =
    Array.isArray(attribute.values) && attribute.values.length > 0
      ? attribute.values
      : valueDetails.map((detail) => detail.value);

  return {
    ...attribute,
    values: dedupeStringValues(valuesSource),
    valueDetails,
  };
};

const normalizeAttributePayload = (data: AttributePayload) => ({
  ...data,
  values: dedupeStringValues(Array.isArray(data?.values) ? data.values : []),
});

export interface PublicAttributeValueDetail {
  attributeId?: number;
  attributeName?: string;
  attributeCode?: string;
  valueId?: number;
  value: string;
}

export interface PublicAttributeDTO {
  id: number;
  name: string;
  code?: string;
  status?: "ACTIVE" | "INACTIVE";
  values?: string[];
  valueDetails?: PublicAttributeValueDetail[];
}

export const getAttributes = async () => {
  const response = await apiJava.get(PREFIX);
  return Array.isArray(response.data)
    ? response.data.map((item: unknown) =>
        normalizeAttribute(item as PublicAttributeDTO | Record<string, unknown>),
      )
    : [];
};

export const getPublicAttributes = async (): Promise<PublicAttributeDTO[]> => {
  try {
    const publicRequestConfig = { isPublic: true } as Parameters<
      typeof apiJava.get
    >[1] & { isPublic: true };
    const response = await apiJava.get(
      buildJavaApiUrl("/public/attributes"),
      publicRequestConfig,
    );
    return Array.isArray(response.data)
      ? response.data.map((item: PublicAttributeDTO) => normalizeAttribute(item))
      : [];
  } catch (error) {
    console.error("Lỗi khi lấy thuộc tính public:", error);
    return [];
  }
};

export const getAttributeById = async (id: number) => {
  const response = await apiJava.get(`${PREFIX}/${id}`);
  return normalizeAttribute(response.data);
};

export const createAttribute = async (data: AttributePayload) => {
  const response = await apiJava.post(PREFIX, normalizeAttributePayload(data));
  return response.data;
};

export const updateAttribute = async (id: number, data: AttributePayload) => {
  const response = await apiJava.put(
    `${PREFIX}/${id}`,
    normalizeAttributePayload(data),
  );
  return response.data;
};

export const deleteAttribute = async (id: number) => {
  const response = await apiJava.delete(`${PREFIX}/${id}`);
  return response.data;
};
