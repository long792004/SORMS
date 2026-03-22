import { API_BASE_URL } from "@/utils/constants";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function resolveMediaUrl(value?: string | null) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`;
  }

  return `${API_ORIGIN}/${value}`;
}

export function getRoomImageUrls(room: any): string[] {
  const candidates = [room?.imageUrls, room?.images];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const normalized = candidate
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => resolveMediaUrl(value.trim()));

      if (normalized.length > 0) {
        return normalized;
      }
    }
  }

  if (typeof room?.imageUrl === "string" && room.imageUrl.trim()) {
    const rawValue = room.imageUrl.trim();

    if (rawValue.startsWith("[")) {
      try {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .map((value) => resolveMediaUrl(value.trim()));
        }
      } catch {
      }
    }

    return [resolveMediaUrl(rawValue)];
  }

  return [];
}