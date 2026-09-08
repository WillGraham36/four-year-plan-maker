"use client";

import { CustomServerResponse } from "@/lib/utils/types";

export function useFetchWithAuth() {
  const fetchWithAuth = async <T>(
    route: string,
    params: URLSearchParams = new URLSearchParams(),
    init: RequestInit = {}
  ): Promise<CustomServerResponse<T>> => {
    try {
      const res = await fetch(buildApiUrl(route, params), {
        ...init,
        credentials: "include",
        cache: "no-cache",
      });

      const data = await res.json();

      if (!res.ok) {
        return { ok: false, message: data.message, data: null };
      }

      return { ok: true, message: data.message, data: data.data };
    } catch (err) {
      return { ok: false, message: "An error occurred, please try again", data: null };
    }
  };

  return { fetchWithAuth };
}

function buildApiUrl(route: string, params: URLSearchParams) {
  const normalizedRoute = route.replace(/^\/+/, "");
  const query = params.toString();
  const url = `/api/${normalizedRoute}`;

  return query ? `${url}?${query}` : url;
}
