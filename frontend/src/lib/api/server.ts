import { auth } from "@clerk/nextjs/server";
import { CustomServerResponse } from "../utils/types";

export const fetchWithAuth = async (
  route: string,
  params: URLSearchParams = new URLSearchParams(),
  init?: RequestInit
): Promise<CustomServerResponse<any>> => {
  const { getToken } = await auth();
  const token = await getToken();

  const url = `${process.env.NEXT_PUBLIC_API_URL}/${route}?${params.toString()}`;

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
    return { ok: false, message: data.message, data: null };
  }
  return { ok: true, message: data.message, data: data.data };
};