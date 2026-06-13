import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { CustomServerResponse } from "../utils/types";
import { getApiBaseUrl } from "./getApiBaseUrl";

const GUEST_COOKIE_NAME = process.env.NEXT_PUBLIC_GUEST_COOKIE_NAME || "terpplanner_guest";

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
    const cookieStore = await cookies();
    const guestCookie = cookieStore.get(GUEST_COOKIE_NAME);

    const query = params.toString();
    const url = `${getApiBaseUrl()}/${route}${query ? `?${query}` : ""}`;
    const headers = new Headers(init.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (guestCookie?.value) {
      headers.set("Cookie", `${GUEST_COOKIE_NAME}=${guestCookie.value}`);
    }

    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...init,
      headers,
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
