export function getApiBaseUrl(): string {
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const serverApiUrl = process.env.API_BASE_URL || process.env.DOCKER_API_URL;

  if (process.env.NODE_ENV === "production") {
    if (!publicApiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    return publicApiUrl;
  }

  const isServer = typeof window === "undefined";

  // Server-side inside Docker network
  if (isServer && serverApiUrl) {
    return serverApiUrl;
  }

  // Browser or server-side without Docker
  return publicApiUrl || "http://localhost:8080/api";
}
