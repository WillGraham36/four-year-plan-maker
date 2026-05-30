"use client";

import { useAuth } from "@clerk/nextjs";
import { CustomServerResponse } from "@/lib/utils/types";

export function useFetchWithAuth() {
  const { getToken } = useAuth();

  const fetchWithAuth = async <T>(
    route: string,
    params: URLSearchParams = new URLSearchParams(),
    init: RequestInit = {}
  ): Promise<CustomServerResponse<T>> => {
    try {
      const token = await getToken();
      if (!token) {
        return { ok: false, message: "Not authenticated", data: null };
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/${route}?${params.toString()}`;
      const fetchWithToken = (bearerToken: string) => fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${bearerToken}`,
        },
        credentials: "include",
        cache: "no-cache",
      });

      let res = await fetchWithToken(token);

      if (res.status === 401) {
        const freshToken = await getToken();
        if (freshToken && freshToken !== token) {
          res = await fetchWithToken(freshToken);
        }
      }

      const isJsonResponse = res.headers.get("content-type")?.includes("application/json");
      const data = isJsonResponse ? await res.json() : null;

      if (!res.ok) {
        return {
          ok: false,
          message: data?.message || res.statusText || `Request failed with status ${res.status}`,
          data: null,
        };
      }

      return { ok: true, message: data?.message, data: data?.data ?? null };
    } catch (err) {
      return { ok: false, message: "An error occurred, please try again", data: null };
    }
  };

  return { fetchWithAuth };
}
