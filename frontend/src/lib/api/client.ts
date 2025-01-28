export const makeBaseRequest = async (
  route: string,
  params: URLSearchParams = new URLSearchParams(),
  init: RequestInit = {}
) => {
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_URL + route + "?" + params.toString(),
    {
      credentials: "include",
      cache: "no-cache",
      ...init,
    }
  );
  return res;
};