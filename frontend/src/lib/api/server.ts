import { auth } from "@clerk/nextjs/server";
import { CustomServerResponse } from "../utils/types";
import { getApiBaseUrl } from "./getApiBaseUrl";

export const fetchWithAuth = async (
  route: string,
  options: {
    params?: URLSearchParams;
    init?: RequestInit;
  } = {},
): Promise<CustomServerResponse<any>> => {
  const { params = new URLSearchParams(), init = {} } = options;
  try {
    const { getToken } = await auth();
    const token = await getToken();

    const url = `${getApiBaseUrl()}/${route}?${params.toString()}`;

    const res = await fetch(url, {
      credentials: "include",
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("API Error:", data);
      return { ok: false, message: data.message, data: null };
    }

    return { ok: true, message: data.message, data: data.data };
  } catch (error) {
    return {
      ok: false,
      message: "An error has occured, please try again",
      data: null,
    };
  }
};
