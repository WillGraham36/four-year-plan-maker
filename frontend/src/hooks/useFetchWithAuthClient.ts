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
      const fetchWithToken = (bearerToken: string | null) => {
        const headers = new Headers(init.headers);
        if (bearerToken) {
          headers.set("Authorization", `Bearer ${bearerToken}`);
        }

        return fetch(buildApiUrl(route, params, Boolean(bearerToken)), {
          ...init,
          headers,
          credentials: "include",
          cache: "no-cache",
        });
      };

      let res = await fetchWithToken(token);

      if (res.status === 401 && token) {
        const freshToken = await getToken();
        if (freshToken && freshToken !== token) {
          res = await fetchWithToken(freshToken);
        }
      }

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

function buildApiUrl(route: string, params: URLSearchParams, useBackendUrl: boolean) {
  const normalizedRoute = route.replace(/^\/+/, "");
  const query = params.toString();
  const baseUrl = useBackendUrl
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
    : "/api/backend";
  const url = `${baseUrl.replace(/\/+$/, "")}/${normalizedRoute}`;

  return query ? `${url}?${query}` : url;
}
