import { auth } from "@clerk/nextjs/server";

interface FetchWithAuthProps {
  route: string;
  options?: RequestInit;
}
export const fetchWithAuth = async ({
  route,
  options = {}
}: FetchWithAuthProps) => {
  const { getToken } = await auth();
  const token = await getToken();

  const url = new URL(route, process.env.NEXT_PUBLIC_API_URL);
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};